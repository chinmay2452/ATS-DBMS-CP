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

        res.json({
            totalApplicants: totalApplicants.count,
            openJobs: openJobs.count,
            totalApplications: totalApplications.count,
            hired: hired.count
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── JOBS ────────────────────────────────────────────────────────────────────
// GET all jobs
app.get('/api/jobs', async (req, res) => {
    try {
        const rows = await query(
            'SELECT job_id AS id, job_title AS title, department, required_experience AS exp, job_status AS status, posted_date AS date FROM job ORDER BY posted_date DESC'
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST a new job
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
// GET all applicants
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

// POST a new applicant
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
// GET all applications (joined)
app.get('/api/applications', async (req, res) => {
    try {
        const rows = await query(`
            SELECT 
                ap.application_id AS id,
                a.full_name AS applicantName,
                j.job_title AS jobTitle,
                ap.application_date AS date,
                ap.application_status AS status
            FROM application ap
            JOIN applicant a ON ap.applicant_id = a.applicant_id
            JOIN job j ON ap.job_id = j.job_id
            ORDER BY ap.application_date DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update application status
app.put('/api/applications/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await query(
            'UPDATE application SET application_status = ? WHERE application_id = ?',
            [status, id]
        );
        res.json({ message: 'Application status updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST a new application
app.post('/api/applications', async (req, res) => {
    try {
        const { applicantId, jobId, date } = req.body;
        const result = await query(
            "INSERT INTO application (application_date, application_status, applicant_id, job_id) VALUES (?, 'Pending', ?, ?)",
            [date || new Date().toISOString().split('T')[0], applicantId, jobId]
        );
        res.json({ message: 'Application submitted', id: result.insertId });
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

// ─── START SERVER ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 ATS Backend running at http://localhost:${PORT}`);
});
