-- ============================================================
-- APPLICANT TRACKING SYSTEM (ATS)
-- CORE OPERATIONAL QUERIES (Part A)
-- ============================================================


-- ------------------------------------------------------------
-- 1. Retrieve all applicants along with the jobs they applied for
-- Purpose: Shows mapping between Applicant and Job using Application
-- ------------------------------------------------------------
SELECT 
    a.applicant_id,
    a.full_name,
    j.job_id,
    j.job_title
FROM Applicant a
JOIN Application ap ON a.applicant_id = ap.applicant_id
JOIN Job j ON ap.job_id = j.job_id;



-- ------------------------------------------------------------
-- 2. Display all applications with applicant details and status
-- Purpose: Track status of each application
-- ------------------------------------------------------------
SELECT 
    ap.application_id,
    a.full_name,
    ap.application_status,
    ap.current_stage
FROM Application ap
JOIN Applicant a ON ap.applicant_id = a.applicant_id;



-- ------------------------------------------------------------
-- 3. Retrieve interview details along with recruiter information
-- Purpose: Shows which recruiter conducted which interview
-- ------------------------------------------------------------
SELECT 
    i.interview_id,
    i.interview_date,
    i.interview_type,
    i.result,
    r.recruiter_name
FROM Interview i
JOIN Recruiter r ON i.recruiter_id = r.recruiter_id;



-- ------------------------------------------------------------
-- 4. Get list of selected applicants with job details
-- Purpose: Identify candidates who got selected
-- ------------------------------------------------------------
SELECT 
    a.full_name,
    j.job_title,
    ap.application_status
FROM Applicant a
JOIN Application ap ON a.applicant_id = ap.applicant_id
JOIN Job j ON ap.job_id = j.job_id
WHERE ap.application_status = 'Selected';



-- ------------------------------------------------------------
-- 5. Retrieve offer details for applicants
-- Purpose: Shows salary and offer status
-- ------------------------------------------------------------
SELECT 
    o.offer_id,
    a.full_name,
    o.salary_package,
    o.offer_status
FROM Offer o
JOIN Application ap ON o.application_id = ap.application_id
JOIN Applicant a ON ap.applicant_id = a.applicant_id;



-- ------------------------------------------------------------
-- 6. Track complete stage history of applications
-- Purpose: Monitor progression of applications through stages
-- ------------------------------------------------------------
SELECT 
    ap.application_id,
    rs.stage_name,
    sh.moved_on,
    sh.remarks
FROM Stage_History sh
JOIN Recruitment_Stage rs ON sh.stage_id = rs.stage_id
JOIN Application ap ON sh.application_id = ap.application_id;



-- ------------------------------------------------------------
-- 7. Retrieve all active job applications
-- Purpose: Show applications only for jobs that are currently open
-- ------------------------------------------------------------
SELECT 
    a.full_name,
    j.job_title,
    ap.application_status
FROM Application ap
JOIN Applicant a ON ap.applicant_id = a.applicant_id
JOIN Job j ON ap.job_id = j.job_id
WHERE j.job_status = 'Open';



-- ------------------------------------------------------------
-- 8. Find applicants who have cleared interviews
-- Purpose: Identify candidates who passed interview rounds
-- ------------------------------------------------------------
SELECT 
    a.full_name,
    i.interview_type,
    i.result
FROM Interview i
JOIN Application ap ON i.application_id = ap.application_id
JOIN Applicant a ON ap.applicant_id = a.applicant_id
WHERE i.result = 'Pass';



-- ------------------------------------------------------------
-- 9. Get jobs along with their eligibility criteria
-- Purpose: Shows requirements for each job
-- ------------------------------------------------------------
SELECT 
    j.job_title,
    e.min_experience,
    e.required_skills,
    e.qualification
FROM Job j
JOIN Eligibility_Criteria e ON j.job_id = e.job_id;



-- ------------------------------------------------------------
-- 10. Retrieve applications along with recruiter handling interviews
-- Purpose: Shows recruiter involvement in applications
-- ------------------------------------------------------------
SELECT 
    a.full_name,
    j.job_title,
    r.recruiter_name
FROM Applicant a
JOIN Application ap ON a.applicant_id = ap.applicant_id
JOIN Job j ON ap.job_id = j.job_id
JOIN Interview i ON ap.application_id = i.application_id
JOIN Recruiter r ON i.recruiter_id = r.recruiter_id;