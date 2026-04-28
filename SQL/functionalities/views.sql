-- 1. View to display all currently open jobs

CREATE VIEW vw_active_jobs AS
SELECT 
    job_id,
    job_title,
    department,
    required_experience,
    posted_date
FROM Job
WHERE job_status = 'Open';


-- 2. View to display shortlisted candidates

CREATE VIEW vw_shortlisted_candidates AS
SELECT
    a.applicant_id,
    a.full_name,
    j.job_title,
    ap.application_status
FROM Applicant a
JOIN Applications ap ON a.applicant_id = ap.applicant_id
JOIN Job j ON ap.job_id = j.job_id
WHERE ap.application_status = 'Shortlisted';


-- 3. View to display interview schedule

CREATE VIEW vw_interview_schedule AS
SELECT
    i.interview_id,
    a.full_name,
    j.job_title,
    r.recruiter_name,
    i.interview_date,
    i.interview_type
FROM Interview i
JOIN Applications ap ON i.application_id = ap.application_id
JOIN Applicant a ON ap.applicant_id = a.applicant_id
JOIN Job j ON ap.job_id = j.job_id
JOIN Recruiter r ON i.recruiter_id = r.recruiter_id;


-- 4. View to display offer details

CREATE VIEW vw_offer_summary AS
SELECT
    o.offer_id,
    a.full_name,
    j.job_title,
    o.salary_package,
    o.offer_status,
    o.offer_date
FROM Offer_tbl o
JOIN Applications ap ON o.application_id = ap.application_id
JOIN Applicant a ON ap.applicant_id = a.applicant_id
JOIN Job j ON ap.job_id = j.job_id;


-- 5. View to display application tracking status

CREATE VIEW vw_application_status AS
SELECT
    ap.application_id,
    a.full_name,
    j.job_title,
    ap.application_status,
    ap.current_stage,
    ap.application_date
FROM Applications ap
JOIN Applicant a ON ap.applicant_id = a.applicant_id
JOIN Job j ON ap.job_id = j.job_id;