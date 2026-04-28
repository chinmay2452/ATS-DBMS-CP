-- =========================
-- APPLICANT
-- =========================
INSERT INTO applicant VALUES
(1,'Karan Rajput','karan@gmail.com','9876543210','B.Tech',1,'link1','Active'),
(2,'Rohit Sharma','rohit@gmail.com','9876543211','B.Tech',2,'link2','Active'),
(3,'Ananya Singh','ananya@gmail.com','9876543212','MCA',0,'link3','Active'),
(4,'Amit Verma','amit@gmail.com','9876543213','B.Sc',3,'link4','Active'),
(5,'Neha Jain','neha@gmail.com','9876543214','MBA',2,'link5','Blocked'),
(6,'Rahul Kapoor','rahul2@gmail.com','9876543215','B.Tech',1,'link6','Active'),
(7,'Sneha Patil','sneha@gmail.com','9876543216','M.Tech',4,'link7','Active'),
(8,'Arjun Nair','arjun@gmail.com','9876543217','B.Tech',2,'link8','Active'),
(9,'Priya Shah','priya@gmail.com','9876543218','BCA',1,'link9','Active'),
(10,'Vikas Rao','vikas@gmail.com','9876543219','B.Tech',3,'link10','Active');

-- =========================
-- JOB
-- =========================
INSERT INTO job VALUES
(101,'Software Engineer','IT',1,'Open','2026-04-01'),
(102,'Data Analyst','IT',2,'Open','2026-04-02'),
(103,'HR Executive','HR',1,'Open','2026-04-03'),
(104,'Backend Developer','IT',2,'Open','2026-04-04'),
(105,'Project Manager','Management',4,'Closed','2025-12-01');

-- =========================
-- RECRUITER
-- =========================
INSERT INTO recruiter VALUES
(201,'Rahul Mehta','rahul@company.com','Recruiter'),
(202,'Sneha Iyer','sneha@company.com','HR');

-- =========================
-- RECRUITMENT STAGE
-- =========================
INSERT INTO recruitment_stage VALUES
(1,'Applied',1),
(2,'Shortlisted',2),
(3,'Interview',3),
(4,'Selected',4),
(5,'Rejected',5);

-- =========================
-- APPLICATION
-- =========================
INSERT INTO application 
(application_id, application_date, application_status, current_stage_id, applicant_id, job_id)
VALUES
(1001,'2026-04-10','Active',1,1,101),
(1002,'2026-04-10','Active',2,2,101),
(1003,'2026-04-11','Rejected',5,3,102),
(1004,'2026-04-12','Hired',4,4,103),
(1005,'2026-04-12','Active',1,6,104),
(1006,'2026-04-13','Active',2,7,101),
(1007,'2026-04-13','Rejected',5,8,102),
(1008,'2026-04-14','Hired',4,9,104),
(1009,'2026-04-15','Active',1,10,103),
(1010,'2026-04-15','Active',2,1,102);

-- =========================
-- ELIGIBILITY CRITERIA
-- =========================
INSERT INTO eligibility_criteria VALUES
(301,1,'Java, SQL','B.Tech',101),
(302,2,'Python, Excel','B.Tech',102),
(303,1,'Communication','Any Graduate',103),
(304,2,'NodeJS, SQL','B.Tech',104);

-- =========================
-- STAGE HISTORY
-- =========================
INSERT INTO stage_history VALUES
(401,'2026-04-10','Applied',1001,1),
(402,'2026-04-11','Shortlisted',1002,2),
(403,'2026-04-12','Interview',1002,3),
(404,'2026-04-12','Selected',1004,4),
(405,'2026-04-13','Applied',1005,1),
(406,'2026-04-14','Shortlisted',1006,2);

-- =========================
-- INTERVIEW
-- =========================
INSERT INTO interview VALUES
(501,'2026-04-12','Technical','Good','Pass',1002,201),
(502,'2026-04-13','HR','Average','Pass',1004,202),
(503,'2026-04-14','Technical','Poor','Fail',1003,201),
(504,'2026-04-15','Technical','Good','Pass',1006,201);

-- =========================
-- OFFER
-- =========================
INSERT INTO offer VALUES
(601,'2026-04-14',800000,'Accepted',1004),
(602,'2026-04-15',750000,'Pending',1008);