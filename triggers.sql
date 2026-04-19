delimiter //

CREATE TRIGGER trg_check_applicant_status
BEFORE INSERT ON Application
FOR EACH ROW
BEGIN
    DECLARE status_val VARCHAR(20);

    SELECT applicant_status
    INTO status_val
    FROM Applicant
    WHERE applicant_id = NEW.applicant_id;

    IF status_val IN ('Blocked', 'Hired') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Blocked or Hired applicant cannot apply.';
    END IF;
END;
//

delimiter ;

delimiter //

CREATE TRIGGER trg_offer_accept_update_status
AFTER UPDATE ON Offer
FOR EACH ROW
BEGIN
    IF NEW.offer_status = 'Accepted' AND OLD.offer_status <> 'Accepted' THEN

        UPDATE Applicant
        SET applicant_status = 'Hired'
        WHERE applicant_id = (
            SELECT applicant_id
            FROM Application
            WHERE application_id = NEW.application_id
        );

    END IF;
END;
//
delimiter;

delimiter //
CREATE TRIGGER trg_prevent_multiple_offers
BEFORE UPDATE ON Offer
FOR EACH ROW
BEGIN
    DECLARE app_id INT;
    DECLARE cnt INT;

    IF NEW.offer_status = 'Accepted' THEN

        SELECT applicant_id
        INTO app_id
        FROM Application
        WHERE application_id = NEW.application_id;

        SELECT COUNT(*)
        INTO cnt
        FROM Offer o
        JOIN Application a ON o.application_id = a.application_id
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

delimiter //

CREATE TRIGGER trg_validate_interview_date
BEFORE INSERT ON Interview
FOR EACH ROW
BEGIN
    DECLARE app_date DATE;

    SELECT application_date
    INTO app_date
    FROM Application
    WHERE application_id = NEW.application_id;

    IF NEW.interview_date < app_date THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Interview date cannot be before application date.';
    END IF;
END;
//
delimiter ;

delimiter //

CREATE TRIGGER trg_log_stage_change
AFTER UPDATE ON Application
FOR EACH ROW
BEGIN
    DECLARE sid INT;

    IF OLD.current_stage <> NEW.current_stage THEN

        SELECT stage_id
        INTO sid
        FROM Recruitment_Stage
        WHERE stage_name = NEW.current_stage
        LIMIT 1;

        INSERT INTO Stage_History
        (history_id, moved_on, remarks, application_id, stage_id)
        VALUES (
            FLOOR(RAND()*100000),
            CURDATE(),
            CONCAT('Moved to ', NEW.current_stage),
            NEW.application_id,
            sid
        );

    END IF;
END;
//

delimiter ;

delimiter //

CREATE TRIGGER trg_auto_close_job
BEFORE UPDATE ON Job
FOR EACH ROW
BEGIN
    IF DATEDIFF(CURDATE(), OLD.posted_date) > 60 THEN
        SET NEW.job_status = 'Closed';
    END IF;
END;
//

delimiter ;