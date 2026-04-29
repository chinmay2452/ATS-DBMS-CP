-- 1. "Apply for job"
DELIMITER //
CREATE PROCEDURE ApplyForJob(
    IN p_application_id INT,
    IN p_applicant_id INT,
    IN p_job_id INT
)
BEGIN
    DECLARE v_status VARCHAR(20);
    -- Check applicant status
    SELECT applicant_status INTO v_status
    FROM applicant
    WHERE applicant_id = p_applicant_id;

    IF v_status = 'Blocked' OR v_status = 'Hired' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Applicant cannot apply (Blocked or already Hired)';
    ELSE
        INSERT INTO application(
            application_id,
            application_date,
            application_status,
            current_stage_id,
            applicant_id,
            job_id
        )
        VALUES(
            p_application_id,
            CURDATE(),
            'Active',
            1,
            p_applicant_id,
            p_job_id
        );
    END IF;
END;
//
DELIMITER ;

-- 2. "Schedule Interview"
DELIMITER //
CREATE PROCEDURE ScheduleInterview(
    IN p_interview_id INT,
    IN p_date DATE,
    IN p_type VARCHAR(30),
    IN p_application_id INT,
    IN p_recruiter_id INT
)
BEGIN
    INSERT INTO interview(
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

-- 3. "Generate Offer"
DELIMITER //
CREATE PROCEDURE GenerateOffer(
    IN p_offer_id INT,
    IN p_application_id INT,
    IN p_salary DECIMAL(10,2)
)
BEGIN
    INSERT INTO offer(
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
