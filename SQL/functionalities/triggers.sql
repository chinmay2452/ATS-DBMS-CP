-- 1. Prevent Blocked or Hired applicants from applying for a new job
delimiter //

CREATE TRIGGER trg_check_applicant_status
BEFORE INSERT ON application
FOR EACH ROW
BEGIN
    DECLARE status_val VARCHAR(20);

    SELECT applicant_status
    INTO status_val
    FROM applicant
    WHERE applicant_id = NEW.applicant_id;

    IF status_val IN ('Blocked', 'Hired') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Blocked or Hired applicant cannot apply.';
    END IF;
END;
//

delimiter ;

-- 2. Automatically update applicant status to Hired when offer is accepted

delimiter //

CREATE TRIGGER trg_offer_accept_update_status
AFTER UPDATE ON offer
FOR EACH ROW
BEGIN
    IF NEW.offer_status = 'Accepted' AND OLD.offer_status <> 'Accepted' THEN

        UPDATE applicant
        SET applicant_status = 'Hired'
        WHERE applicant_id = (
            SELECT applicant_id
            FROM application
            WHERE application_id = NEW.application_id
        );

    END IF;
END;
//

delimiter ;


-- 3. Prevent applicant from accepting multiple job offers

delimiter //

CREATE TRIGGER trg_prevent_multiple_offers
BEFORE UPDATE ON offer
FOR EACH ROW
BEGIN
    DECLARE app_id INT;
    DECLARE cnt INT;

    IF NEW.offer_status = 'Accepted' THEN

        SELECT applicant_id
        INTO app_id
        FROM application
        WHERE application_id = NEW.application_id;

        SELECT COUNT(*)
        INTO cnt
        FROM offer o
        JOIN application a ON o.application_id = a.application_id
        WHERE a.applicant_id = app_id
        AND o.offer_status = 'Accepted'
        AND o.offer_id <> NEW.offer_id;

        IF cnt > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Applicant already accepted another offer.';
        END IF;

    END IF;
END;
//

delimiter ;


-- 4. Validate that interview date is not before application date

delimiter //

CREATE TRIGGER trg_validate_interview_date
BEFORE INSERT ON interview
FOR EACH ROW
BEGIN
    DECLARE app_date DATE;

    SELECT application_date
    INTO app_date
    FROM application
    WHERE application_id = NEW.application_id;

    IF NEW.interview_date < app_date THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Interview date cannot be before application date.';
    END IF;
END;
//

delimiter ;


-- 5. Automatically log stage changes in stage_history table

delimiter //

CREATE TRIGGER trg_log_stage_change
AFTER UPDATE ON application
FOR EACH ROW
BEGIN
    DECLARE sname VARCHAR(50);

    IF OLD.current_stage_id <> NEW.current_stage_id THEN

        SELECT stage_name
        INTO sname
        FROM recruitment_stage
        WHERE stage_id = NEW.current_stage_id
        LIMIT 1;

        INSERT INTO stage_history
        (moved_on, remarks, application_id, stage_id)
        VALUES (
            CURDATE(),
            CONCAT('Moved to ', sname),
            NEW.application_id,
            NEW.current_stage_id
        );

    END IF;
END;
//

delimiter ;


-- 6. Automatically close jobs older than 60 days during update

delimiter //

CREATE TRIGGER trg_auto_close_job
BEFORE UPDATE ON job
FOR EACH ROW
BEGIN
    IF DATEDIFF(CURDATE(), OLD.posted_date) > 60 THEN
        SET NEW.job_status = 'Closed';
    END IF;
END;
//

delimiter ;