
-- APPLICANT TRACKING SYSTEM (ATS)
-- CORE OPERATIONAL QUERIES (Part A)


-- 1. Retrieve all applicants along with the jobs they applied for
-- Purpose: Shows mapping between Applicant and Job using Application

SELECT 
    a.applicant_id,
    a.full_name,
    j.job_id,
    j.job_title
FROM Applicant a
JOIN Application ap ON a.applicant_id = ap.applicant_id
JOIN Job j ON ap.job_id = j.job_id;


-- 2. Display all applications with applicant details and status
SELECT 
    ap.application_id,
    a.full_name,
    ap.application_status,
    ap.current_stage
FROM Application ap
JOIN Applicant a ON ap.applicant_id = a.applicant_id;


-- 3. Retrieve interview details along with recruiter information
SELECT 
    i.interview_id,
    i.interview_date,
    i.interview_type,
    i.result,
    r.recruiter_name
FROM Interview i
JOIN Recruiter r ON i.recruiter_id = r.recruiter_id;


-- 4. Get list of selected applicants with job details
SELECT 
    a.full_name,
    j.job_title,
    ap.application_status
FROM Applicant a
JOIN Application ap ON a.applicant_id = ap.applicant_id
JOIN Job j ON ap.job_id = j.job_id
WHERE ap.application_status = 'Selected';


-- 5. Retrieve offer details for applicants
SELECT 
    o.offer_id,
    a.full_name,
    o.salary_package,
    o.offer_status
FROM Offer o
JOIN Application ap ON o.application_id = ap.application_id
JOIN Applicant a ON ap.applicant_id = a.applicant_id;


-- 6. Track complete stage history of applications
SELECT 
    ap.application_id,
    rs.stage_name,
    sh.moved_on,
    sh.remarks
FROM Stage_History sh
JOIN Recruitment_Stage rs ON sh.stage_id = rs.stage_id
JOIN Application ap ON sh.application_id = ap.application_id;


-- 7. Retrieve all active job applications
SELECT 
    a.full_name,
    j.job_title,
    ap.application_status
FROM Application ap
JOIN Applicant a ON ap.applicant_id = a.applicant_id
JOIN Job j ON ap.job_id = j.job_id
WHERE j.job_status = 'Open';


-- 8. Find applicants who have cleared interviews
SELECT 
    a.full_name,
    i.interview_type,
    i.result
FROM Interview i
JOIN Application ap ON i.application_id = ap.application_id
JOIN Applicant a ON ap.applicant_id = a.applicant_id
WHERE i.result = 'Pass';


-- 9. Get jobs along with their eligibility criteria
SELECT 
    j.job_title,
    e.min_experience,
    e.required_skills,
    e.qualification
FROM Job j
JOIN Eligibility_Criteria e ON j.job_id = e.job_id;


-- 10. Retrieve applications along with recruiter handling interviews
SELECT 
    a.full_name,
    j.job_title,
    r.recruiter_name
FROM Applicant a
JOIN Application ap ON a.applicant_id = ap.applicant_id
JOIN Job j ON ap.job_id = j.job_id
JOIN Interview i ON ap.application_id = i.application_id
JOIN Recruiter r ON i.recruiter_id = r.recruiter_id;


-- REPORTS / ANALYTICS QUERIES (Part B)


-- 1. Count total applicants per job
-- Purpose: Shows job popularity

SELECT 
    j.job_title,
    COUNT(ap.application_id) AS total_applicants
FROM Job j
LEFT JOIN Application ap ON j.job_id = ap.job_id
GROUP BY j.job_title;


-- 2. Count applications by status
-- Purpose: Shows pipeline distribution

SELECT 
    application_status,
    COUNT(*) AS total
FROM Application
GROUP BY application_status;


-- 3. Average salary offered
-- Purpose: Salary insights

SELECT 
    AVG(salary_package) AS avg_salary
FROM Offer;


-- 4. Count interviews conducted by each recruiter
-- Purpose: Recruiter workload

SELECT 
    r.recruiter_name,
    COUNT(i.interview_id) AS total_interviews
FROM Recruiter r
LEFT JOIN Interview i ON r.recruiter_id = i.recruiter_id
GROUP BY r.recruiter_name;


-- 5. Number of applications per stage
-- Purpose: Stage-wise analytics

SELECT 
    rs.stage_name,
    COUNT(sh.history_id) AS total_entries
FROM Recruitment_Stage rs
LEFT JOIN Stage_History sh ON rs.stage_id = sh.stage_id
GROUP BY rs.stage_name;


-- 6. Number of selected applicants per job
-- Purpose: Hiring success per job

SELECT 
    j.job_title,
    COUNT(ap.application_id) AS selected_count
FROM Job j
JOIN Application ap ON j.job_id = ap.job_id
WHERE ap.application_status = 'Selected'
GROUP BY j.job_title;


-- 7. Highest salary offered
-- Purpose: Identify top offer

SELECT 
    MAX(salary_package) AS highest_salary
FROM Offer;


-- 8. Applicants who reached final stage but not selected
-- Purpose: Drop-off analysis

SELECT 
    a.full_name,
    ap.current_stage
FROM Application ap
JOIN Applicant a ON ap.applicant_id = a.applicant_id
WHERE ap.current_stage = 'Final Interview'
AND ap.application_status != 'Selected';


-- 9. Jobs with no applications
-- Purpose: Identify inactive jobs

SELECT 
    j.job_title
FROM Job j
LEFT JOIN Application ap ON j.job_id = ap.job_id
WHERE ap.application_id IS NULL;


-- 10. Conversion rate (Selected vs Total Applications)
-- Purpose: Hiring efficiency

SELECT 
    (COUNT(CASE WHEN application_status = 'Selected' THEN 1 END) * 100.0 / COUNT(*)) AS selection_percentage
FROM Application;