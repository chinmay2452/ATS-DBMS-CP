require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ─── DB Connection Pool ──────────────────────────────────────────────────────
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ATS_DB',
    waitForConnections: true,
    connectionLimit: 10,
});

// Test DB connection on startup
(async () => {
    try {
        const conn = await pool.getConnection();
        console.log('✅ Connected to MySQL database: ' + process.env.DB_NAME);
        conn.release();
    } catch (err) {
        console.error('❌ Failed to connect to MySQL:', err.message);
    }
})();

// ─── Helper ─────────────────────────────────────────────────────────────────
async function query(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return rows;
}

// ─── DASHBOARD STATS ────────────────────────────────────────────────────────
app.get('/api/dashboard-stats', async (req, res) => {
    try {
        const [totalApplicants] = await query('SELECT COUNT(*) AS count FROM applicant');
        const [openJobs] = await query("SELECT COUNT(*) AS count FROM job WHERE job_status = 'Open'");
        const [totalApplications] = await query('SELECT COUNT(*) AS count FROM application');
        const [hired] = await query("SELECT COUNT(*) AS count FROM application WHERE application_status = 'Hired'");
        const [interviews] = await query("SELECT COUNT(*) AS count FROM interview");
        const [offers] = await query("SELECT COUNT(*) AS count FROM offer");

        res.json({
            totalApplicants: totalApplicants.count,
            openJobs: openJobs.count,
            totalApplications: totalApplications.count,
            hired: hired.count,
            totalInterviews: interviews.count,
            totalOffers: offers.count
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── JOBS ────────────────────────────────────────────────────────────────────
app.get('/api/jobs', async (req, res) => {
    try {
        const rows = await query(`
            SELECT 
                j.job_id AS id, 
                j.job_title AS title, 
                j.department, 
                j.required_experience AS exp, 
                j.job_status AS status, 
                j.posted_date AS date,
                e.required_skills,
                e.qualification
            FROM job j
            LEFT JOIN eligibility_criteria e ON j.job_id = e.job_id
            ORDER BY j.posted_date DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/jobs', async (req, res) => {
    try {
        const { title, department, exp, status, date } = req.body;
        const result = await query(
            "INSERT INTO job (job_title, department, required_experience, job_status, posted_date) VALUES (?, ?, ?, ?, ?)",
            [title, department, exp, status || 'Open', date]
        );
        res.json({ message: 'Job created', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── APPLICANTS ──────────────────────────────────────────────────────────────
app.get('/api/applicants', async (req, res) => {
    try {
        const rows = await query(
            'SELECT applicant_id AS id, full_name AS name, email, phone, highest_qualification AS qual, total_experience AS exp, applicant_status AS status FROM applicant ORDER BY applicant_id'
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/applicants/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await query('UPDATE applicant SET applicant_status = ? WHERE applicant_id = ?', [status, id]);
        res.json({ message: 'Applicant status updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/applicants', async (req, res) => {
    try {
        const { name, email, phone, qual, exp, resume } = req.body;
        const result = await query(
            "INSERT INTO applicant (full_name, email, phone, highest_qualification, total_experience, resume_link, applicant_status) VALUES (?, ?, ?, ?, ?, ?, 'Active')",
            [name, email, phone, qual, exp || 0, resume || '']
        );
        res.json({ message: 'Applicant added', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── APPLICATIONS ─────────────────────────────────────────────────────────────
app.get('/api/applications', async (req, res) => {
    try {
        const rows = await query(`
            SELECT 
                ap.application_id AS id,
                a.full_name AS applicantName,
                j.job_title AS jobTitle,
                ap.application_date AS date,
                ap.application_status AS status,
                rs.stage_name AS currentStage
            FROM application ap
            JOIN applicant a ON ap.applicant_id = a.applicant_id
            JOIN job j ON ap.job_id = j.job_id
            LEFT JOIN recruitment_stage rs ON ap.current_stage_id = rs.stage_id
            ORDER BY ap.application_date DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/applications/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await query('UPDATE application SET application_status = ? WHERE application_id = ?', [status, id]);
        res.json({ message: 'Application status updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/applications/:id/stage', async (req, res) => {
    try {
        const { id } = req.params;
        const { stageId } = req.body;
        await query('UPDATE application SET current_stage_id = ? WHERE application_id = ?', [stageId, id]);
        res.json({ message: 'Application stage updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/applications', async (req, res) => {
    try {
        const { applicantId, jobId, date } = req.body;
        const result = await query(
            "INSERT INTO application (application_date, application_status, applicant_id, job_id, current_stage_id) VALUES (?, 'Pending', ?, ?, 1)",
            [date || new Date().toISOString().split('T')[0], applicantId, jobId]
        );
        res.json({ message: 'Application submitted', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── STAGES ──────────────────────────────────────────────────────────────────
app.get('/api/stages', async (req, res) => {
    try {
        const rows = await query('SELECT stage_id AS id, stage_name AS name FROM recruitment_stage ORDER BY stage_order');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── RECRUITERS ─────────────────────────────────────────────────────────────
app.get('/api/recruiters', async (req, res) => {
    try {
        const rows = await query('SELECT recruiter_id AS id, recruiter_name AS name, email, role FROM recruiter');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── INTERVIEWS ──────────────────────────────────────────────────────────────
app.get('/api/interviews', async (req, res) => {
    try {
        const rows = await query(`
            SELECT 
                i.interview_id AS id,
                a.full_name AS applicantName,
                i.interview_date AS date,
                i.interview_type AS type,
                i.result,
                r.recruiter_name AS recruiterName
            FROM interview i
            JOIN application ap ON i.application_id = ap.application_id
            JOIN applicant a ON ap.applicant_id = a.applicant_id
            LEFT JOIN recruiter r ON i.recruiter_id = r.recruiter_id
            ORDER BY i.interview_date DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/interviews', async (req, res) => {
    try {
        const { date, type, applicationId, recruiterId } = req.body;
        const result = await query(
            "INSERT INTO interview (interview_date, interview_type, application_id, recruiter_id) VALUES (?, ?, ?, ?)",
            [date, type, applicationId, recruiterId]
        );
        res.json({ message: 'Interview scheduled', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── OFFERS ──────────────────────────────────────────────────────────────────
app.get('/api/offers', async (req, res) => {
    try {
        const rows = await query(`
            SELECT 
                o.offer_id AS id,
                a.full_name AS applicantName,
                j.job_title AS jobTitle,
                o.offer_date AS date,
                o.salary_package AS salary,
                o.offer_status AS status
            FROM offer o
            JOIN application ap ON o.application_id = ap.application_id
            JOIN applicant a ON ap.applicant_id = a.applicant_id
            JOIN job j ON ap.job_id = j.job_id
            ORDER BY o.offer_date DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/offers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await query('UPDATE offer SET offer_status = ? WHERE offer_id = ?', [status, id]);
        res.json({ message: 'Offer status updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── REPORTS & ANALYTICS ────────────────────────────────────────────────────
app.get('/api/reports/analytics', async (req, res) => {
    try {
        const appsPerJob = await query(`
            SELECT j.job_title AS label, COUNT(ap.application_id) AS value
            FROM job j
            LEFT JOIN application ap ON j.job_id = ap.job_id
            GROUP BY j.job_id
        `);
        
        const statusDist = await query(`
            SELECT application_status AS label, COUNT(*) AS value
            FROM application
            GROUP BY application_status
        `);

        const recruiterInterviews = await query(`
            SELECT r.recruiter_name AS label, COUNT(i.interview_id) AS value
            FROM recruiter r
            LEFT JOIN interview i ON r.recruiter_id = i.recruiter_id
            GROUP BY r.recruiter_id
        `);

        const [avgSalary] = await query("SELECT AVG(salary_package) AS avg FROM offer");
        const [selectionRate] = await query(`
            SELECT (COUNT(CASE WHEN application_status = 'Hired' THEN 1 END) * 100.0 / COUNT(*)) AS rate
            FROM application
        `);

        res.json({
            appsPerJob,
            statusDist,
            recruiterInterviews,
            avgSalary: avgSalary.avg || 0,
            selectionRate: selectionRate.rate || 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ─── START SERVER ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 ATS Backend running at http://localhost:${PORT}`);
});
