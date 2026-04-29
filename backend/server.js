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
            "INSERT INTO application (application_date, application_status, applicant_id, job_id, current_stage_id) VALUES (?, 'Active', ?, ?, 1)",
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


// ─── VIEWS ───────────────────────────────────────────────────────────────────
const viewDefinitions = [
    { id: 'active-jobs', name: 'vw_active_jobs', title: 'Active Jobs', description: 'All currently open job postings', sql: `SELECT job_id, job_title, department, required_experience, posted_date\nFROM job\nWHERE job_status = 'Open';` },
    { id: 'shortlisted', name: 'vw_shortlisted_candidates', title: 'Shortlisted Candidates', description: 'Candidates at the Shortlisted stage', sql: `SELECT a.applicant_id, a.full_name, j.job_title,\n       rs.stage_name AS current_stage\nFROM applicant a\nJOIN application ap ON a.applicant_id = ap.applicant_id\nJOIN job j ON ap.job_id = j.job_id\nJOIN recruitment_stage rs ON ap.current_stage_id = rs.stage_id\nWHERE rs.stage_name = 'Shortlisted';` },
    { id: 'interview-schedule', name: 'vw_interview_schedule', title: 'Interview Schedule', description: 'Full interview schedule with details', sql: `SELECT i.interview_id, a.full_name, j.job_title,\n       r.recruiter_name, i.interview_date, i.interview_type\nFROM interview i\nJOIN application ap ON i.application_id = ap.application_id\nJOIN applicant a ON ap.applicant_id = a.applicant_id\nJOIN job j ON ap.job_id = j.job_id\nJOIN recruiter r ON i.recruiter_id = r.recruiter_id;` },
    { id: 'offer-summary', name: 'vw_offer_summary', title: 'Offer Summary', description: 'All offer details with applicant and job info', sql: `SELECT o.offer_id, a.full_name, j.job_title,\n       o.salary_package, o.offer_status, o.offer_date\nFROM offer o\nJOIN application ap ON o.application_id = ap.application_id\nJOIN applicant a ON ap.applicant_id = a.applicant_id\nJOIN job j ON ap.job_id = j.job_id;` },
    { id: 'application-status', name: 'vw_application_status', title: 'Application Status', description: 'Full application tracking view', sql: `SELECT ap.application_id, a.full_name, j.job_title,\n       ap.application_status, rs.stage_name AS current_stage,\n       ap.application_date\nFROM application ap\nJOIN applicant a ON ap.applicant_id = a.applicant_id\nJOIN job j ON ap.job_id = j.job_id\nLEFT JOIN recruitment_stage rs ON ap.current_stage_id = rs.stage_id;` }
];

app.get('/api/views', (req, res) => {
    res.json(viewDefinitions.map(v => ({ id: v.id, name: v.name, title: v.title, description: v.description, sql: v.sql })));
});

app.get('/api/views/:id/run', async (req, res) => {
    const view = viewDefinitions.find(v => v.id === req.params.id);
    if (!view) return res.status(404).json({ error: 'View not found' });
    try {
        const rows = await query(`SELECT * FROM ${view.name}`);
        res.json({ sql: `SELECT * FROM ${view.name};`, rows, columns: rows.length > 0 ? Object.keys(rows[0]) : [] });
    } catch (err) {
        res.json({ sql: `SELECT * FROM ${view.name};`, error: err.message, rows: [], columns: [] });
    }
});

// ─── QUERIES ─────────────────────────────────────────────────────────────────
const predefinedQueries = [
    { id: 1, title: 'Retrieve all applicants along with the jobs they applied for', category: 'Operational', sql: `SELECT a.applicant_id, a.full_name, j.job_id, j.job_title\nFROM applicant a\nJOIN application ap ON a.applicant_id = ap.applicant_id\nJOIN job j ON ap.job_id = j.job_id;` },
    { id: 2, title: 'Display all applications with applicant details and current stage', category: 'Operational', sql: `SELECT ap.application_id, a.full_name,\n       ap.application_status, rs.stage_name AS current_stage\nFROM application ap\nJOIN applicant a ON ap.applicant_id = a.applicant_id\nLEFT JOIN recruitment_stage rs ON ap.current_stage_id = rs.stage_id;` },
    { id: 3, title: 'Retrieve interview details along with recruiter information', category: 'Operational', sql: `SELECT i.interview_id, i.interview_date, i.interview_type,\n       i.result, r.recruiter_name\nFROM interview i\nJOIN recruiter r ON i.recruiter_id = r.recruiter_id;` },
    { id: 4, title: 'Get list of hired applicants with job details', category: 'Operational', sql: `SELECT a.full_name, j.job_title, ap.application_status\nFROM applicant a\nJOIN application ap ON a.applicant_id = ap.applicant_id\nJOIN job j ON ap.job_id = j.job_id\nWHERE ap.application_status = 'Hired';` },
    { id: 5, title: 'Retrieve offer details for applicants', category: 'Operational', sql: `SELECT o.offer_id, a.full_name, o.salary_package, o.offer_status\nFROM offer o\nJOIN application ap ON o.application_id = ap.application_id\nJOIN applicant a ON ap.applicant_id = a.applicant_id;` },
    { id: 6, title: 'Track complete stage history of applications', category: 'Operational', sql: `SELECT ap.application_id, rs.stage_name, sh.moved_on, sh.remarks\nFROM stage_history sh\nJOIN recruitment_stage rs ON sh.stage_id = rs.stage_id\nJOIN application ap ON sh.application_id = ap.application_id;` },
    { id: 7, title: 'Retrieve all applications for active jobs', category: 'Operational', sql: `SELECT a.full_name, j.job_title, ap.application_status\nFROM application ap\nJOIN applicant a ON ap.applicant_id = a.applicant_id\nJOIN job j ON ap.job_id = j.job_id\nWHERE j.job_status = 'Open';` },
    { id: 8, title: 'Find applicants who have cleared interviews', category: 'Operational', sql: `SELECT a.full_name, i.interview_type, i.result\nFROM interview i\nJOIN application ap ON i.application_id = ap.application_id\nJOIN applicant a ON ap.applicant_id = a.applicant_id\nWHERE i.result = 'Pass';` },
    { id: 9, title: 'Get jobs along with their eligibility criteria', category: 'Operational', sql: `SELECT j.job_title, e.min_experience, e.required_skills, e.qualification\nFROM job j\nJOIN eligibility_criteria e ON j.job_id = e.job_id;` },
    { id: 10, title: 'Retrieve applications along with recruiter handling interviews', category: 'Operational', sql: `SELECT a.full_name, j.job_title, r.recruiter_name\nFROM applicant a\nJOIN application ap ON a.applicant_id = ap.applicant_id\nJOIN job j ON ap.job_id = j.job_id\nJOIN interview i ON ap.application_id = i.application_id\nJOIN recruiter r ON i.recruiter_id = r.recruiter_id;` },
    { id: 11, title: 'Count total applicants per job', category: 'Analytics', sql: `SELECT j.job_title,\n       COUNT(ap.application_id) AS total_applicants\nFROM job j\nLEFT JOIN application ap ON j.job_id = ap.job_id\nGROUP BY j.job_title;` },
    { id: 12, title: 'Count applications by status', category: 'Analytics', sql: `SELECT application_status, COUNT(*) AS total\nFROM application\nGROUP BY application_status;` },
    { id: 13, title: 'Calculate average salary offered', category: 'Analytics', sql: `SELECT AVG(salary_package) AS avg_salary\nFROM offer;` },
    { id: 14, title: 'Count interviews conducted by each recruiter', category: 'Analytics', sql: `SELECT r.recruiter_name,\n       COUNT(i.interview_id) AS total_interviews\nFROM recruiter r\nLEFT JOIN interview i ON r.recruiter_id = i.recruiter_id\nGROUP BY r.recruiter_name;` },
    { id: 15, title: 'Calculate number of applications per stage', category: 'Analytics', sql: `SELECT rs.stage_name,\n       COUNT(sh.history_id) AS total_entries\nFROM recruitment_stage rs\nLEFT JOIN stage_history sh ON rs.stage_id = sh.stage_id\nGROUP BY rs.stage_name;` },
    { id: 16, title: 'Count number of hired applicants per job', category: 'Analytics', sql: `SELECT j.job_title,\n       COUNT(ap.application_id) AS selected_count\nFROM job j\nJOIN application ap ON j.job_id = ap.job_id\nWHERE ap.application_status = 'Hired'\nGROUP BY j.job_title;` },
    { id: 17, title: 'Find highest salary offered', category: 'Analytics', sql: `SELECT MAX(salary_package) AS highest_salary\nFROM offer;` },
    { id: 18, title: 'Identify applicants at interview stage but not yet hired', category: 'Analytics', sql: `SELECT a.full_name, rs.stage_name AS current_stage\nFROM application ap\nJOIN applicant a ON ap.applicant_id = a.applicant_id\nJOIN recruitment_stage rs ON ap.current_stage_id = rs.stage_id\nWHERE rs.stage_name = 'Interview'\n  AND ap.application_status = 'Active';` },
    { id: 19, title: 'Identify jobs with no applications', category: 'Analytics', sql: `SELECT j.job_title\nFROM job j\nLEFT JOIN application ap ON j.job_id = ap.job_id\nWHERE ap.application_id IS NULL;` },
    { id: 20, title: 'Calculate conversion rate (Hired vs Total)', category: 'Analytics', sql: `SELECT\n  (COUNT(CASE WHEN application_status = 'Hired' THEN 1 END)\n   * 100.0 / COUNT(*)) AS selection_percentage\nFROM application;` }
];

app.get('/api/queries', (req, res) => {
    res.json(predefinedQueries.map(q => ({ id: q.id, title: q.title, category: q.category, sql: q.sql })));
});

app.get('/api/queries/:id/run', async (req, res) => {
    const q = predefinedQueries.find(q => q.id === parseInt(req.params.id));
    if (!q) return res.status(404).json({ error: 'Query not found' });
    try {
        const rows = await query(q.sql.replace(/;$/, ''));
        res.json({ sql: q.sql, rows, columns: rows.length > 0 ? Object.keys(rows[0]) : [] });
    } catch (err) {
        res.json({ sql: q.sql, error: err.message, rows: [], columns: [] });
    }
});

// ─── TRIGGER DEMOS ───────────────────────────────────────────────────────────
app.get('/api/triggers', (req, res) => {
    res.json([
        { id: 'blocked-apply', name: 'trg_check_applicant_status', title: 'Prevent Blocked/Hired Applicant from Applying', event: 'BEFORE INSERT ON application', description: 'Blocks any INSERT into application if the applicant is Blocked or Hired.', sql: `CREATE TRIGGER trg_check_applicant_status\nBEFORE INSERT ON application\nFOR EACH ROW\nBEGIN\n    DECLARE status_val VARCHAR(20);\n    SELECT applicant_status INTO status_val\n    FROM applicant WHERE applicant_id = NEW.applicant_id;\n    IF status_val IN ('Blocked','Hired') THEN\n        SIGNAL SQLSTATE '45000'\n        SET MESSAGE_TEXT = 'Blocked or Hired applicant cannot apply.';\n    END IF;\nEND;` },
        { id: 'offer-accept', name: 'trg_offer_accept_update_status', title: 'Auto-Update Status on Offer Acceptance', event: 'AFTER UPDATE ON offer', description: 'When an offer is accepted, automatically sets the applicant and application status to Hired.', sql: `CREATE TRIGGER trg_offer_accept_update_status\nAFTER UPDATE ON offer\nFOR EACH ROW\nBEGIN\n    IF NEW.offer_status = 'Accepted'\n       AND OLD.offer_status <> 'Accepted' THEN\n        UPDATE applicant SET applicant_status = 'Hired'\n        WHERE applicant_id = (\n            SELECT applicant_id FROM application\n            WHERE application_id = NEW.application_id);\n        UPDATE application SET application_status = 'Hired'\n        WHERE application_id = NEW.application_id;\n    END IF;\nEND;` },
        { id: 'prevent-multiple', name: 'trg_prevent_multiple_offers', title: 'Prevent Multiple Offer Acceptances', event: 'BEFORE UPDATE ON offer', description: 'Prevents an applicant from accepting more than one job offer.', sql: `CREATE TRIGGER trg_prevent_multiple_offers\nBEFORE UPDATE ON offer\nFOR EACH ROW\nBEGIN\n    DECLARE v_applicant_id INT;\n    DECLARE cnt INT;\n    IF NEW.offer_status = 'Accepted' THEN\n        SELECT applicant_id INTO v_applicant_id\n        FROM application WHERE application_id = NEW.application_id;\n        SELECT COUNT(*) INTO cnt FROM offer o\n        JOIN application a ON o.application_id = a.application_id\n        WHERE a.applicant_id = v_applicant_id\n          AND o.offer_status = 'Accepted'\n          AND o.offer_id <> NEW.offer_id;\n        IF cnt > 0 THEN\n            SIGNAL SQLSTATE '45000'\n            SET MESSAGE_TEXT = 'Applicant already accepted another offer.';\n        END IF;\n    END IF;\nEND;` },
        { id: 'validate-interview', name: 'trg_validate_interview_date', title: 'Validate Interview Date', event: 'BEFORE INSERT ON interview', description: 'Ensures interview date is not before the application date.', sql: `CREATE TRIGGER trg_validate_interview_date\nBEFORE INSERT ON interview\nFOR EACH ROW\nBEGIN\n    DECLARE app_date DATE;\n    SELECT application_date INTO app_date\n    FROM application WHERE application_id = NEW.application_id;\n    IF NEW.interview_date < app_date THEN\n        SIGNAL SQLSTATE '45000'\n        SET MESSAGE_TEXT = 'Interview date cannot be before application date.';\n    END IF;\nEND;` },
        { id: 'log-stage', name: 'trg_log_stage_change', title: 'Auto-Log Stage Changes', event: 'AFTER UPDATE ON application', description: 'Automatically inserts a record into stage_history when an application stage changes.', sql: `CREATE TRIGGER trg_log_stage_change\nAFTER UPDATE ON application\nFOR EACH ROW\nBEGIN\n    DECLARE sname VARCHAR(50);\n    IF OLD.current_stage_id <> NEW.current_stage_id THEN\n        SELECT stage_name INTO sname\n        FROM recruitment_stage\n        WHERE stage_id = NEW.current_stage_id;\n        INSERT INTO stage_history\n          (moved_on, remarks, application_id, stage_id)\n        VALUES (CURDATE(), CONCAT('Moved to ', sname),\n                NEW.application_id, NEW.current_stage_id);\n    END IF;\nEND;` },
        { id: 'auto-close', name: 'trg_auto_close_job', title: 'Auto-Close Old Jobs', event: 'BEFORE UPDATE ON job', description: 'Automatically sets job_status to Closed if the job is older than 60 days when updated.', sql: `CREATE TRIGGER trg_auto_close_job\nBEFORE UPDATE ON job\nFOR EACH ROW\nBEGIN\n    IF DATEDIFF(CURDATE(), OLD.posted_date) > 60 THEN\n        SET NEW.job_status = 'Closed';\n    END IF;\nEND;` }
    ]);
});

app.post('/api/triggers/:id/demo', async (req, res) => {
    const id = req.params.id;
    try {
        switch (id) {
            case 'blocked-apply': {
                // Applicant 5 (Neha Jain) is Blocked — try to insert an application
                const testSql = `INSERT INTO application (application_date, application_status, current_stage_id, applicant_id, job_id) VALUES (CURDATE(), 'Active', 1, 5, 101)`;
                try {
                    await query(testSql);
                    res.json({ success: true, sql: testSql, message: 'Application created (trigger did not fire — applicant may not be Blocked).' });
                } catch (err) {
                    res.json({ success: false, sql: testSql, message: err.message, expected: true });
                }
                break;
            }
            case 'offer-accept': {
                // Show the before state, update offer 602 to Accepted, show after state
                const beforeApp = await query(`SELECT a.full_name, a.applicant_status, ap.application_status FROM applicant a JOIN application ap ON a.applicant_id = ap.applicant_id WHERE ap.application_id = 1008`);
                const testSql = `UPDATE offer SET offer_status = 'Accepted' WHERE offer_id = 602`;
                await query(testSql);
                const afterApp = await query(`SELECT a.full_name, a.applicant_status, ap.application_status FROM applicant a JOIN application ap ON a.applicant_id = ap.applicant_id WHERE ap.application_id = 1008`);
                res.json({ success: true, sql: testSql, message: 'Offer accepted — trigger auto-updated applicant and application status to Hired.', before: beforeApp, after: afterApp });
                // Reset for future demos
                await query(`UPDATE offer SET offer_status = 'Pending' WHERE offer_id = 602`);
                await query(`UPDATE applicant SET applicant_status = 'Active' WHERE applicant_id = 9`);
                await query(`UPDATE application SET application_status = 'Hired' WHERE application_id = 1008`);
                break;
            }
            case 'prevent-multiple': {
                // First accept offer 601 (already accepted for applicant 4), try creating and accepting another
                const testSql = `-- Applicant 4 already has offer 601 (Accepted)\n-- Attempting to accept another offer for same applicant would fail`;
                // Check current state
                const current = await query(`SELECT o.offer_id, o.offer_status, a.full_name FROM offer o JOIN application ap ON o.application_id = ap.application_id JOIN applicant a ON ap.applicant_id = a.applicant_id`);
                res.json({ success: true, sql: testSql, message: 'This trigger prevents accepting a second offer for the same applicant. Offer 601 is already Accepted for Amit Verma.', rows: current, columns: current.length > 0 ? Object.keys(current[0]) : [] });
                break;
            }
            case 'validate-interview': {
                // Try scheduling interview before application date (app 1001 date: 2026-04-10)
                const testSql = `INSERT INTO interview (interview_date, interview_type, application_id, recruiter_id) VALUES ('2020-01-01', 'Technical', 1001, 201)`;
                try {
                    await query(testSql);
                    // Cleanup if it somehow succeeded
                    await query(`DELETE FROM interview WHERE interview_date = '2020-01-01' AND application_id = 1001`);
                    res.json({ success: true, sql: testSql, message: 'Interview created (unexpected — trigger may not be active).' });
                } catch (err) {
                    res.json({ success: false, sql: testSql, message: err.message, expected: true });
                }
                break;
            }
            case 'log-stage': {
                // Move application 1001 from stage 1 to stage 2, check stage_history
                const beforeHistory = await query(`SELECT COUNT(*) AS count FROM stage_history WHERE application_id = 1001`);
                const testSql = `UPDATE application SET current_stage_id = 2 WHERE application_id = 1001`;
                await query(testSql);
                const afterHistory = await query(`SELECT history_id, moved_on, remarks, stage_id FROM stage_history WHERE application_id = 1001 ORDER BY history_id DESC LIMIT 3`);
                res.json({ success: true, sql: testSql, message: `Stage changed — trigger auto-logged to stage_history. Before: ${beforeHistory[0].count} entries, After: ${afterHistory.length} recent entries shown.`, rows: afterHistory, columns: afterHistory.length > 0 ? Object.keys(afterHistory[0]) : [] });
                // Reset
                await query(`UPDATE application SET current_stage_id = 1 WHERE application_id = 1001`);
                break;
            }
            case 'auto-close': {
                // Job 105 posted 2025-12-01 (>60 days ago) — update it and see if it auto-closes
                const beforeJob = await query(`SELECT job_id, job_title, job_status, posted_date FROM job WHERE job_id = 105`);
                const testSql = `UPDATE job SET job_title = job_title WHERE job_id = 105`;
                await query(testSql);
                const afterJob = await query(`SELECT job_id, job_title, job_status, posted_date FROM job WHERE job_id = 105`);
                res.json({ success: true, sql: testSql, message: 'Updated job 105 (posted 2025-12-01, older than 60 days) — trigger auto-set status to Closed.', before: beforeJob, after: afterJob });
                break;
            }
            default:
                res.status(404).json({ error: 'Unknown trigger demo' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── PROCEDURE CALLS ─────────────────────────────────────────────────────────
app.get('/api/procedures', (req, res) => {
    res.json([
        { id: 'apply', name: 'ApplyForJob', title: 'Apply for Job', description: 'Creates a new application after checking applicant eligibility.', sql: `CREATE PROCEDURE ApplyForJob(\n    IN p_application_id INT,\n    IN p_applicant_id INT,\n    IN p_job_id INT\n)\nBEGIN\n    DECLARE v_status VARCHAR(20);\n    SELECT applicant_status INTO v_status\n    FROM applicant WHERE applicant_id = p_applicant_id;\n    IF v_status = 'Blocked' OR v_status = 'Hired' THEN\n        SIGNAL SQLSTATE '45000'\n        SET MESSAGE_TEXT = 'Applicant cannot apply';\n    ELSE\n        INSERT INTO application(...) VALUES(...);\n    END IF;\nEND;`, params: ['application_id', 'applicant_id', 'job_id'] },
        { id: 'schedule-interview', name: 'ScheduleInterview', title: 'Schedule Interview', description: 'Inserts a new interview record for a given application.', sql: `CREATE PROCEDURE ScheduleInterview(\n    IN p_interview_id INT,\n    IN p_date DATE,\n    IN p_type VARCHAR(30),\n    IN p_application_id INT,\n    IN p_recruiter_id INT\n)\nBEGIN\n    INSERT INTO interview(...) VALUES(...);\nEND;`, params: ['interview_id', 'date', 'type', 'application_id', 'recruiter_id'] },
        { id: 'generate-offer', name: 'GenerateOffer', title: 'Generate Offer', description: 'Creates a pending offer for a selected application.', sql: `CREATE PROCEDURE GenerateOffer(\n    IN p_offer_id INT,\n    IN p_application_id INT,\n    IN p_salary DECIMAL(10,2)\n)\nBEGIN\n    INSERT INTO offer(...) VALUES(...);\nEND;`, params: ['offer_id', 'application_id', 'salary'] }
    ]);
});

app.post('/api/procedures/:id/call', async (req, res) => {
    const id = req.params.id;
    try {
        switch (id) {
            case 'apply': {
                const { application_id, applicant_id, job_id } = req.body;
                const callSql = `CALL ApplyForJob(${application_id}, ${applicant_id}, ${job_id})`;
                try {
                    await pool.execute(`CALL ApplyForJob(?, ?, ?)`, [application_id, applicant_id, job_id]);
                    const rows = await query(`SELECT * FROM application WHERE application_id = ?`, [application_id]);
                    res.json({ success: true, sql: callSql, message: 'Procedure executed successfully.', rows, columns: rows.length > 0 ? Object.keys(rows[0]) : [] });
                } catch (err) {
                    res.json({ success: false, sql: callSql, message: err.message });
                }
                break;
            }
            case 'schedule-interview': {
                const { interview_id, date, type, application_id, recruiter_id } = req.body;
                const callSql = `CALL ScheduleInterview(${interview_id}, '${date}', '${type}', ${application_id}, ${recruiter_id})`;
                try {
                    await pool.execute(`CALL ScheduleInterview(?, ?, ?, ?, ?)`, [interview_id, date, type, application_id, recruiter_id]);
                    const rows = await query(`SELECT * FROM interview WHERE interview_id = ?`, [interview_id]);
                    res.json({ success: true, sql: callSql, message: 'Procedure executed successfully.', rows, columns: rows.length > 0 ? Object.keys(rows[0]) : [] });
                } catch (err) {
                    res.json({ success: false, sql: callSql, message: err.message });
                }
                break;
            }
            case 'generate-offer': {
                const { offer_id, application_id, salary } = req.body;
                const callSql = `CALL GenerateOffer(${offer_id}, ${application_id}, ${salary})`;
                try {
                    await pool.execute(`CALL GenerateOffer(?, ?, ?)`, [offer_id, application_id, salary]);
                    const rows = await query(`SELECT * FROM offer WHERE offer_id = ?`, [offer_id]);
                    res.json({ success: true, sql: callSql, message: 'Procedure executed successfully.', rows, columns: rows.length > 0 ? Object.keys(rows[0]) : [] });
                } catch (err) {
                    res.json({ success: false, sql: callSql, message: err.message });
                }
                break;
            }
            default:
                res.status(404).json({ error: 'Unknown procedure' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ─── START SERVER ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 ATS Backend running at http://localhost:${PORT}`);
});
