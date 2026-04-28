-- 1. applicant Table 
CREATE TABLE applicant (
    applicant_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(15) UNIQUE,
    highest_qualification VARCHAR(50),
    total_experience INT CHECK (total_experience >= 0),
    resume_link VARCHAR(255),
    applicant_status ENUM('Active', 'Blocked', 'Hired') NOT NULL DEFAULT 'Active'
);

-- 2. job Table
CREATE TABLE job (
    job_id INT AUTO_INCREMENT PRIMARY KEY,
    job_title VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    required_experience INT CHECK (required_experience >= 0),
    job_status ENUM('Open', 'Closed') NOT NULL DEFAULT 'Open',
    posted_date DATE NOT NULL
);

-- 3. recruiter Table
CREATE TABLE recruiter (
    recruiter_id INT AUTO_INCREMENT PRIMARY KEY,
    recruiter_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    role ENUM('Recruiter', 'HR', 'Admin') NOT NULL
);

-- 4. recruitment_stage Table 
CREATE TABLE recruitment_stage ( 
    stage_id INT AUTO_INCREMENT PRIMARY KEY,
    stage_name VARCHAR(50) UNIQUE NOT NULL,
    stage_order INT CHECK (stage_order > 0)
);

-- 5. application Table
CREATE TABLE application (
    application_id INT AUTO_INCREMENT PRIMARY KEY,
    application_date DATE NOT NULL,
    application_status ENUM('Pending', 'Under Review', 'Rejected', 'Hired') DEFAULT 'Pending',
    current_stage_id INT, -- Replaced VARCHAR with a proper Foreign Key
    applicant_id INT NOT NULL,
    job_id INT NOT NULL,
    FOREIGN KEY (applicant_id) REFERENCES applicant(applicant_id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES job(job_id) ON DELETE CASCADE,
    FOREIGN KEY (current_stage_id) REFERENCES recruitment_stage(stage_id) ON DELETE SET NULL
);

-- 6. eligibility_criteria Table
CREATE TABLE eligibility_criteria (
    criteria_id INT AUTO_INCREMENT PRIMARY KEY,
    min_experience INT CHECK (min_experience >= 0),
    required_skills VARCHAR(255),
    qualification VARCHAR(50),
    job_id INT NOT NULL,
    FOREIGN KEY (job_id) REFERENCES job(job_id) ON DELETE CASCADE
);

-- 7. stage_history Table
CREATE TABLE stage_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    moved_on DATE NOT NULL,
    remarks VARCHAR(255),
    application_id INT NOT NULL,
    stage_id INT NOT NULL,
    FOREIGN KEY (application_id) REFERENCES application(application_id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES recruitment_stage(stage_id) ON DELETE CASCADE
);

-- 8. interview Table
CREATE TABLE interview (
    interview_id INT AUTO_INCREMENT PRIMARY KEY,
    interview_date DATE NOT NULL,
    interview_type ENUM('Technical', 'HR') NOT NULL,
    feedback VARCHAR(255),
    result ENUM('Pass', 'Fail'),
    application_id INT NOT NULL,
    recruiter_id INT,
    FOREIGN KEY (application_id) REFERENCES application(application_id) ON DELETE CASCADE,
    FOREIGN KEY (recruiter_id) REFERENCES recruiter(recruiter_id) ON DELETE SET NULL
);

-- 9. offer Table
CREATE TABLE offer (
    offer_id INT AUTO_INCREMENT PRIMARY KEY,
    offer_date DATE NOT NULL,
    salary_package DECIMAL(10,2) CHECK (salary_package > 0),
    offer_status ENUM('Pending', 'Accepted', 'Rejected') NOT NULL DEFAULT 'Pending',
    application_id INT UNIQUE NOT NULL,
    FOREIGN KEY (application_id) REFERENCES application(application_id) ON DELETE CASCADE
);
