-- APPLICANT
INSERT INTO Applicant VALUES
(1, 'Karan Rajput', 'karan@gmail.com', '9876543210', 'B.Tech', 1, 'link1', 'Active'),
(2, 'Rohit Sharma', 'rohit@gmail.com', '9876543211', 'B.Tech', 2, 'link2', 'Active'),
(3, 'Ananya Singh', 'ananya@gmail.com', '9876543212', 'MCA', 0, 'link3', 'Active'),
(4, 'Amit Verma', 'amit@gmail.com', '9876543213', 'B.Sc', 3, 'link4', 'Active');

-- JOB
INSERT INTO Job VALUES
(101, 'Software Engineer', 'IT', 1, 'Open', '2026-04-01'),
(102, 'Data Analyst', 'IT', 2, 'Open', '2026-04-02'),
(103, 'HR Executive', 'HR', 1, 'Open', '2026-04-03');

-- RECRUITER
INSERT INTO Recruiter VALUES
(201, 'Rahul Mehta', 'rahul@company.com', 'Recruiter'),
(202, 'Sneha Iyer', 'sneha@company.com', 'HR');

-- RECRUITMENT_STAGE
INSERT INTO Recruitment_Stage VALUES
(1, 'Applied', 1),
(2, 'Shortlisted', 2),
(3, 'Interview', 3),
(4, 'Selected', 4);

-- APPLICATION
INSERT INTO Application VALUES
(1001, '2026-04-10', 'Applied', 'Applied', 1, 101),
(1002, '2026-04-10', 'Shortlisted', 'Shortlisted', 2, 101),
(1003, '2026-04-11', 'Applied', 'Applied', 3, 102),
(1004, '2026-04-12', 'Selected', 'Selected', 4, 103);

-- ELIGIBILITY_CRITERIA
INSERT INTO Eligibility_Criteria VALUES
(301, 1, 'Java, SQL', 'B.Tech', 101),
(302, 2, 'Python, Excel', 'B.Tech', 102),
(303, 1, 'Communication', 'Any Graduate', 103);

-- STAGE_HISTORY
INSERT INTO Stage_History VALUES
(401, '2026-04-10', 'Applied', 1001, 1),
(402, '2026-04-11', 'Shortlisted', 1002, 2),
(403, '2026-04-12', 'Interview Done', 1002, 3);

-- INTERVIEW
INSERT INTO Interview VALUES
(501, '2026-04-12', 'Technical', 'Good', 'Pass', 1002, 201),
(502, '2026-04-13', 'HR', 'Average', 'Pass', 1004, 202);

-- OFFER
INSERT INTO Offer VALUES
(601, '2026-04-14', 800000, 'Accepted', 1004);


