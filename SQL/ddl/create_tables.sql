
-- Applicant Table 
CREATE TABLE Applicant (
    applicant_id INT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(15) UNIQUE,
    highest_qualification VARCHAR(50),
    total_experience INT CHECK (total_experience >= 0),
    resume_link VARCHAR(255),
    applicant_status VARCHAR(20) 
        CHECK (applicant_status IN ('Active','Blocked','Hired'))
);

-- Job taBle
CREATE TABLE Job (
    job_id INT PRIMARY KEY,
    job_title VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    required_experience INT CHECK (required_experience >= 0),
    job_status VARCHAR(20) CHECK (job_status IN ('Open','Closed')),
    posted_date DATE NOT NULL
);

-- Recruiter Table
CREATE TABLE Recruiter (
    recruiter_id INT PRIMARY KEY,
    recruiter_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    role VARCHAR(30) CHECK (role IN ('Recruiter','HR','Admin'))
);

-- Recruitment Stage table 
CREATE TABLE Recruitment_Stage (
    stage_id INT PRIMARY KEY,
    stage_name VARCHAR(50) UNIQUE,
    stage_order INT CHECK (stage_order > 0)
);

-- APPLICATION Table
CREATE TABLE Application (
    application_id INT PRIMARY KEY,
    application_date DATE NOT NULL,
    application_status VARCHAR(20)
        CHECK (application_status IN ('Applied','Shortlisted','Rejected','Selected')),
    current_stage VARCHAR(30),
    applicant_id INT,
    job_id INT,
    FOREIGN KEY (applicant_id) REFERENCES Applicant(applicant_id),
    FOREIGN KEY (job_id) REFERENCES Job(job_id)
);

-- ELIGIBILITY_CRITERIA Table
CREATE TABLE Eligibility_Criteria (
    criteria_id INT PRIMARY KEY,
    min_experience INT CHECK (min_experience >= 0),
    required_skills VARCHAR(255),
    qualification VARCHAR(50),
    job_id INT,
    FOREIGN KEY (job_id) REFERENCES Job(job_id)
);

-- STAGE_HISTORY Table
CREATE TABLE Stage_History (
    history_id INT PRIMARY KEY,
    moved_on DATE NOT NULL,
    remarks VARCHAR(255),
    application_id INT,
    stage_id INT,
    FOREIGN KEY (application_id) REFERENCES Application(application_id),
    FOREIGN KEY (stage_id) REFERENCES Recruitment_Stage(stage_id)
);

-- INTERVIEW Table
CREATE TABLE Interview (
    interview_id INT PRIMARY KEY,
    interview_date DATE NOT NULL,
    interview_type VARCHAR(30)
        CHECK (interview_type IN ('Technical','HR')),
    feedback VARCHAR(255),
    result VARCHAR(20)
        CHECK (result IN ('Pass','Fail')),
    application_id INT,
    recruiter_id INT,
    FOREIGN KEY (application_id) REFERENCES Application(application_id),
    FOREIGN KEY (recruiter_id) REFERENCES Recruiter(recruiter_id)
);

-- OFFER Table
CREATE TABLE Offer (
    offer_id INT PRIMARY KEY,
    offer_date DATE NOT NULL,
    salary_package DECIMAL(10,2) CHECK (salary_package > 0),
    offer_status VARCHAR(20)
        CHECK (offer_status IN ('Pending','Accepted','Rejected')),
    application_id INT UNIQUE,
    FOREIGN KEY (application_id) REFERENCES Application(application_id)
);


