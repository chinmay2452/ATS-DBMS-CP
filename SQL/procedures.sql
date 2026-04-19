
--1. Apply for job
DELIMITER //

CREATE PROCEDURE ApplyForJob(
    IN p_application_id INT,
    IN p_applicant_id INT,
    IN p_job_id INT
)
BEGIN
    INSERT INTO Application(
        application_id,
        application_date,
        application_status,
        current_stage,
        applicant_id,
        job_id
    )
    VALUES(
        p_application_id,
        CURDATE(),
        'Applied',
        'Applied',
        p_applicant_id,
        p_job_id
    );
END;
//
DELIMITER ;

--2. Schedule Interview
DELIMITER //

CREATE PROCEDURE ScheduleInterview(
    IN p_interview_id INT,
    IN p_date DATE,
    IN p_type VARCHAR(30),
    IN p_application_id INT,
    IN p_recruiter_id INT
)
BEGIN
    INSERT INTO Interview(
        interview_id,
        interview_date,
        interview_type,
        feedback,
        result,
        application_id,
        recruiter_id
    )
    VALUES(
        p_interview_id,
        p_date,
        p_type,
        NULL,
        NULL,
        p_application_id,
        p_recruiter_id
    );
END;
//

DELIMITER ;


--3. Generate offer
DELIMITER //

CREATE PROCEDURE GenerateOffer(
    IN p_offer_id INT,
    IN p_application_id INT,
    IN p_salary DECIMAL(10,2)
)
BEGIN
    INSERT INTO Offer(
        offer_id,
        offer_date,
        salary_package,
        offer_status,
        application_id
    )
    VALUES(
        p_offer_id,
        CURDATE(),
        p_salary,
        'Pending',
        p_application_id
    );
END;
//

DELIMITER ;