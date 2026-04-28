-- APPLICANT TRACKING SYSTEM (ATS)
-- CORE OPERATIONAL QUERIES (Part A)


-- 1. Retrieve all applicants along with the jobs they applied for
-- Purpose: Shows mapping between Applicant and Job using Application

SELECT 
    a.applicant_id,
    a.full_name,
    j.job_id,
    j.job_title
FROM applicant a
JOIN application ap ON a.applicant_id = ap.applicant_id
JOIN job j ON ap.job_id = j.job_id;


-- 2. Display all applications with applicant details and status
SELECT 
    ap.application_id,
    a.full_name,
    ap.application_status,
    rs.stage_name AS current_stage
FROM application ap
JOIN applicant a ON ap.applicant_id = a.applicant_id
LEFT JOIN recruitment_stage rs ON ap.current_stage_id = rs.stage_id;


-- 3. Retrieve interview details along with recruiter information
SELECT 
    i.interview_id,
    i.interview_date,
    i.interview_type,
    i.result,
    r.recruiter_name
FROM interview i
JOIN recruiter r ON i.recruiter_id = r.recruiter_id;


-- 4. Get list of selected applicants with job details
SELECT 
    a.full_name,
    j.job_title,
    ap.application_status
FROM applicant a
JOIN application ap ON a.applicant_id = a.applicant_id
JOIN job j ON ap.job_id = j.job_id
WHERE ap.application_status = 'Hired';


-- 5. Retrieve offer details for applicants
SELECT 
    o.offer_id,
    a.full_name,
    o.salary_package,
    o.offer_status
FROM offer o
JOIN application ap ON o.application_id = ap.application_id
JOIN applicant a ON ap.applicant_id = a.applicant_id;


-- 6. Track complete stage history of applications
SELECT 
    ap.application_id,
    rs.stage_name,
    sh.moved_on,
    sh.remarks
FROM stage_history sh
JOIN recruitment_stage rs ON sh.stage_id = rs.stage_id
JOIN application ap ON sh.application_id = ap.application_id;


-- 7. Retrieve all active job applications
SELECT 
    a.full_name,
    j.job_title,
    ap.application_status
FROM application ap
JOIN applicant a ON ap.applicant_id = a.applicant_id
JOIN job j ON ap.job_id = j.job_id
WHERE j.job_status = 'Open';


-- 8. Find applicants who have cleared interviews
SELECT 
    a.full_name,
    i.interview_type,
    i.result
FROM interview i
JOIN application ap ON i.application_id = ap.application_id
JOIN applicant a ON ap.applicant_id = a.applicant_id
WHERE i.result = 'Pass';


-- 9. Get jobs along with their eligibility criteria
SELECT 
    j.job_title,
    e.min_experience,
    e.required_skills,
    e.qualification
FROM job j
JOIN eligibility_criteria e ON j.job_id = e.job_id;


-- 10. Retrieve applications along with recruiter handling interviews
SELECT 
    a.full_name,
    j.job_title,
    r.recruiter_name
FROM applicant a
JOIN application ap ON a.applicant_id = ap.applicant_id
JOIN job j ON ap.job_id = j.job_id
JOIN interview i ON ap.application_id = i.application_id
JOIN recruiter r ON i.recruiter_id = r.recruiter_id;


-- REPORTS / ANALYTICS QUERIES (Part B)


-- 1. Count total applicants per job
-- Purpose: Shows job popularity

SELECT 
    j.job_title,
    COUNT(ap.application_id) AS total_applicants
FROM job j
LEFT JOIN application ap ON j.job_id = ap.job_id
GROUP BY j.job_title;


-- 2. Count applications by status
-- Purpose: Shows pipeline distribution

SELECT 
    application_status,
    COUNT(*) AS total
FROM application
GROUP BY application_status;


-- 3. Average salary offered
-- Purpose: Salary insights

SELECT 
    AVG(salary_package) AS avg_salary
FROM offer;


-- 4. Count interviews conducted by each recruiter
-- Purpose: Recruiter workload

SELECT 
    r.recruiter_name,
    COUNT(i.interview_id) AS total_interviews
FROM recruiter r
LEFT JOIN interview i ON r.recruiter_id = i.recruiter_id
GROUP BY r.recruiter_name;


-- 5. Number of applications per stage
-- Purpose: Stage-wise analytics

SELECT 
    rs.stage_name,
    COUNT(sh.history_id) AS total_entries
FROM recruitment_stage rs
LEFT JOIN stage_history sh ON rs.stage_id = sh.stage_id
GROUP BY rs.stage_name;


-- 6. Number of selected applicants per job
-- Purpose: Hiring success per job

SELECT 
    j.job_title,
    COUNT(ap.application_id) AS selected_count
FROM job j
JOIN application ap ON j.job_id = ap.job_id
WHERE ap.application_status = 'Hired'
GROUP BY j.job_title;


-- 7. Highest salary offered
-- Purpose: Identify top offer

SELECT 
    MAX(salary_package) AS highest_salary
FROM offer;


-- 8. Applicants who reached final stage but not selected
-- Purpose: Drop-off analysis

SELECT 
    a.full_name,
    rs.stage_name AS current_stage
FROM application ap
JOIN applicant a ON ap.applicant_id = a.applicant_id
JOIN recruitment_stage rs ON ap.current_stage_id = rs.stage_id
WHERE rs.stage_name = 'Final Interview'
AND ap.application_status != 'Hired';


-- 9. Jobs with no applications
-- Purpose: Identify inactive jobs

SELECT 
    j.job_title
FROM job j
LEFT JOIN application ap ON j.job_id = ap.job_id
WHERE ap.application_id IS NULL;


-- 10. Conversion rate (Selected vs Total Applications)
-- Purpose: Hiring efficiency

SELECT 
    (COUNT(CASE WHEN application_status = 'Hired' THEN 1 END) * 100.0 / COUNT(*)) AS selection_percentage
FROM application;