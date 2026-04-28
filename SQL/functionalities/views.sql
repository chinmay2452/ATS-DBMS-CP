-- 1. View to display all currently open jobs

CREATE VIEW vw_active_jobs AS
SELECT 
    job_id,
    job_title,
    department,
    required_experience,
    posted_date
FROM job
WHERE job_status = 'Open';


-- 2. View to display shortlisted candidates

CREATE VIEW vw_shortlisted_candidates AS
SELECT
    a.applicant_id,
    a.full_name,
    j.job_title,
    ap.application_status
FROM applicant a
JOIN application ap ON a.applicant_id = a.applicant_id
JOIN job j ON ap.job_id = j.job_id
WHERE ap.application_status = 'Under Review';


-- 3. View to display interview schedule

CREATE VIEW vw_interview_schedule AS
SELECT
    i.interview_id,
    a.full_name,
    j.job_title,
    r.recruiter_name,
    i.interview_date,
    i.interview_type
FROM interview i
JOIN application ap ON i.application_id = ap.application_id
JOIN applicant a ON ap.applicant_id = a.applicant_id
JOIN job j ON ap.job_id = j.job_id
JOIN recruiter r ON i.recruiter_id = r.recruiter_id;


-- 4. View to display offer details

CREATE VIEW vw_offer_summary AS
SELECT
    o.offer_id,
    a.full_name,
    j.job_title,
    o.salary_package,
    o.offer_status,
    o.offer_date
FROM offer o
JOIN application ap ON o.application_id = ap.application_id
JOIN applicant a ON ap.applicant_id = a.applicant_id
JOIN job j ON ap.job_id = j.job_id;


-- 5. View to display application tracking status

CREATE VIEW vw_application_status AS
SELECT
    ap.application_id,
    a.full_name,
    j.job_title,
    ap.application_status,
    rs.stage_name AS current_stage,
    ap.application_date
FROM application ap
JOIN applicant a ON ap.applicant_id = a.applicant_id
JOIN job j ON ap.job_id = j.job_id
LEFT JOIN recruitment_stage rs ON ap.current_stage_id = rs.stage_id;