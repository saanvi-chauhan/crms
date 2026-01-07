-- Create a fresh database
CREATE DATABASE crms;
USE crms;
CREATE TABLE Roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);
USE crms;
CREATE TABLE Police_Staff (
    staff_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    pol_rank VARCHAR(50) NOT NULL,
    badge_number VARCHAR(20) UNIQUE NOT NULL,
    contact VARCHAR(15),
    department VARCHAR(50),
    join_date DATE,
    is_active BOOLEAN DEFAULT TRUE
);
USE crms;
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    staff_id INT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    FOREIGN KEY (role_id) REFERENCES Roles(role_id) ON DELETE RESTRICT,
    FOREIGN KEY (staff_id) REFERENCES Police_Staff(staff_id) ON DELETE CASCADE
);
USE crms;
CREATE TABLE Crime_Category (
    crime_type_id INT AUTO_INCREMENT PRIMARY KEY,
    ipc_section VARCHAR(20),
    crime_name VARCHAR(100) NOT NULL,
    description TEXT,
    severity_level INT CHECK (severity_level BETWEEN 1 AND 5)
);
USE crms;
CREATE TABLE Criminals (
    criminal_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    alias VARCHAR(100),
    dob DATE,
    gender VARCHAR(10),
    address TEXT,
    height_cm INT,
    weight_kg INT,
    identifying_marks TEXT,
    photo_path VARCHAR(255),
    case_list JSON,
    total_cases INT DEFAULT 0,
    pending_cases INT DEFAULT 0,
    is_wanted BOOLEAN DEFAULT FALSE
);
USE crms;
CREATE TABLE Cases (
    case_id INT AUTO_INCREMENT PRIMARY KEY,
    FIR_number VARCHAR(50) UNIQUE NOT NULL,
    crime_type_id INT NOT NULL,
    primary_accused_id INT NULL,
    city VARCHAR(50),
    district VARCHAR(50),
    police_station_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    description TEXT,
    date_reported DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'Open',
    FOREIGN KEY (crime_type_id) REFERENCES Crime_Category(crime_type_id),
    FOREIGN KEY (primary_accused_id) REFERENCES Criminals(criminal_id)
);
USE crms;
CREATE TABLE FIR (
    FIR_number VARCHAR(50) PRIMARY KEY,
    complainant_name VARCHAR(100) NOT NULL,
    complainant_contact VARCHAR(15),
    complainant_address TEXT,
    place_of_offence TEXT,
    police_station VARCHAR(100),
    date_filed DATETIME DEFAULT CURRENT_TIMESTAMP,
    case_id INT UNIQUE NOT NULL,
    FOREIGN KEY (case_id) REFERENCES Cases(case_id) ON DELETE CASCADE
);
USE crms;
CREATE TABLE Investigations (
    investigation_id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT NOT NULL,
    assigned_to INT NOT NULL,
    progress_notes TEXT,
    evidence_list TEXT,
    final_report TEXT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES Cases(case_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES Police_Staff(staff_id)
);
USE crms;
CREATE TABLE Audit_Log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);
INSERT INTO Roles (role_id, role_name) VALUES
(1, 'Admin'),
(2, 'Superintendent'),
(3, 'CID'),
(4, 'NCO');

DELETE FROM Roles WHERE role_name = 'TestRole';

INSERT INTO Police_Staff (staff_id, name, pol_rank, badge_number, contact, department, join_date, is_active) VALUES
(10001, 'Rajesh Kumar',      'Inspector',       'BLR001', '9876543210', 'CID',            '2015-06-15', TRUE),
(10002, 'Priya Sharma',      'Sub-Inspector',   'BLR002', '8765432109', 'Crime Branch',   '2018-03-20', TRUE),
(10003, 'Amit Singh',        'Constable',       'BLR003', '7654321098', 'Patrol',         '2020-01-10', TRUE),
(10004, 'Vikram Rao',        'Superintendent',  'BLR004', '6543210987', 'Administration', '2010-11-05', TRUE),
(10005, 'Neha Patel',        'ASI',             'BLR005', '5432109876', 'Women Cell',     '2017-09-12', TRUE);

-- Password hash example: use bcrypt or any hash — here using placeholder (in real app, hash properly)
INSERT INTO Users (username, password_hash, role_id, staff_id, created_at, last_login) VALUES
('admin_vikram', '$2y$10$examplehashadmin', 1, 10004, NOW(), NULL),   -- Admin account for Vikram
('cid_rajesh',   '$2y$10$examplehashcid',    3, 10001, NOW(), '2025-12-30 10:30:00'),  -- Rajesh logged in recently
('nco_priya',    '$2y$10$examplehashnco',    4, 10002, NOW(), NULL),   -- Priya not logged in yet
('nco_amit',     '$2y$10$examplehashamit',   4, 10003, NOW(), '2025-12-29 15:45:00');  -- Amit logged in yesterday

-- Clear all existing crime categories
-- Step 1: Delete all records from child tables that reference Crime_Category
-- (This also clears related tables due to ON DELETE CASCADE)
-- This deletes all rows but satisfies safe mode
-- Step 1: Delete all cases first (to break foreign key block)
-- 1. Turn off safe update mode (just for this session)
SET SQL_SAFE_UPDATES = 0;

-- 2. Now delete everything from child tables
DELETE FROM Investigations;   -- Clears investigations first (child of Cases)
DELETE FROM FIR;              -- Clears FIRs (child of Cases)
DELETE FROM Cases;            -- Now Cases can be deleted

-- 3. Delete from Crime_Category
DELETE FROM Crime_Category;

-- 4. Reset AUTO_INCREMENT counters
ALTER TABLE Cases AUTO_INCREMENT = 1;
ALTER TABLE Crime_Category AUTO_INCREMENT = 1;

-- 5. Turn safe mode back on (good practice)
SET SQL_SAFE_UPDATES = 1;

-- 6. Insert fresh crime categories with fixed IDs
INSERT INTO Crime_Category (crime_type_id, ipc_section, crime_name, description, severity_level) VALUES
(1, '302', 'Murder', 'Intentional killing of a person', 5),
(2, '379', 'Theft', 'Stealing movable property without consent', 3),
(3, '420', 'Cheating', 'Dishonest inducement to deliver property', 4),
(4, '354', 'Assault on Woman', 'Assault or criminal force to woman with intent to outrage her modesty', 4),
(5, '336', 'Rash Driving', 'Driving vehicle rashly or negligently endangering human life', 2),
(6, '498A', 'Cruelty by Husband or Relatives', 'Cruelty by husband or his relatives towards married woman', 4),
(7, '376', 'Rape', 'Sexual intercourse against her will', 5);

INSERT INTO Criminals (
    criminal_id, name, alias, dob, gender, address, 
    height_cm, weight_kg, identifying_marks, photo_path, 
    case_list, total_cases, pending_cases, is_wanted
) VALUES
(20001, 'Ramu Gowda', 'Chain Kaalia', '1990-05-15', 'Male', 
 'Majestic Area, Bangalore', 170, 68, 
 'Scar on left cheek, tiger tattoo on right arm', 'photos/kaalia.jpg', 
 '[]', 0, 0, TRUE),

(20002, 'Shankar Naik', 'Knife Babu', '1985-11-20', 'Male', 
 'KR Market, Bangalore', 165, 75, 
 'Long scar on forehead, missing front tooth', 'photos/babu.jpg', 
 '[]', 0, 0, FALSE),

(20003, 'Lakshmi Devi', 'Pickpocket Lakshmi', '1995-08-10', 'Female', 
 'Chickpet, Bangalore', 158, 55, 
 'Mole on chin, henna tattoo on hands', 'photos/lakshmi.jpg', 
 '[]', 0, 0, FALSE),

(20004, 'Vinod Shetty', 'Cyber Vinod', '1992-03-22', 'Male', 
 'Indiranagar, Bangalore', 175, 80, 
 'No visible marks, wears glasses', 'photos/vinod.jpg', 
 '[]', 0, 0, TRUE),

(20005, 'Raju Patil', 'Bike Raju', '1988-07-30', 'Male', 
 'Jayanagar, Bangalore', 172, 70, 
 'Burn mark on left hand', 'photos/raju.jpg', 
 '[]', 0, 0, FALSE);
 
 INSERT INTO Cases (
    case_id, FIR_number, crime_type_id, primary_accused_id, 
    city, district, police_station_code, latitude, longitude, 
    description, date_reported, status
) VALUES
(30001, 'KAR/2025/BLR/001', 2, 20001, 'Bangalore', 'Bangalore Urban', 'Majestic PS', 12.9784, 77.5722, 'Chain snatching near Majestic bus stand', '2025-12-15', 'Under Investigation'),
(30002, 'KAR/2025/BLR/002', 1, 20002, 'Bangalore', 'Bangalore Urban', 'KR Market PS', 12.9698, 77.5838, 'Stabbing incident inside market', '2025-12-20', 'Chargesheeted'),
(30003, 'KAR/2025/BLR/003', 2, 20003, 'Bangalore', 'Bangalore Urban', 'Chickpet PS', 12.9683, 77.5765, 'Mobile theft in crowded market', '2025-12-28', 'Open'),
(30004, 'KAR/2025/BLR/004', 3, 20004, 'Bangalore', 'Bangalore Urban', 'Indiranagar PS', 12.9698, 77.6395, 'Online fraud complaint', '2025-12-25', 'Under Investigation'),
(30005, 'KAR/2025/BLR/005', 5, NULL, 'Bangalore', 'Bangalore Urban', 'Jayanagar PS', 12.9304, 77.5803, 'Rash driving accident', '2025-12-29', 'Open');

INSERT INTO FIR (
    FIR_number, complainant_name, complainant_contact, complainant_address,
    place_of_offence, police_station, date_filed, case_id
) VALUES
('KAR/2025/BLR/001', 'Anil Kumar', '9123456780', 'MG Road, Bangalore', 
 'Near Majestic Bus Stand', 'Majestic PS', '2025-12-15 14:30:00', 30001),
('KAR/2025/BLR/002', 'Ramesh Shetty', '9234567891', 'KR Market, Bangalore', 
 'Inside KR Market', 'KR Market PS', '2025-12-20 09:15:00', 30002),
('KAR/2025/BLR/003', 'Sunita Rao', '9345678901', 'Chickpet, Bangalore', 
 'Chickpet Main Road', 'Chickpet PS', '2025-12-28 11:00:00', 30003),
('KAR/2025/BLR/004', 'Deepak Jain', '9456789012', 'Indiranagar, Bangalore', 
 '100 Feet Road', 'Indiranagar PS', '2025-12-25 16:45:00', 30004),
('KAR/2025/BLR/005', 'Meena Gupta', '9567890123', 'Jayanagar, Bangalore', 
 'Jayanagar 4th Block', 'Jayanagar PS', '2025-12-29 08:20:00', 30005);
 
 INSERT INTO Investigations (
    investigation_id, case_id, assigned_to, progress_notes, evidence_list, final_report, last_updated
) VALUES
(40001, 30001, 10001, 'Suspect identified via CCTV. Chain recovered from pawn shop.', 'CCTV footage, recovered gold chain, pawn shop receipt', NULL, '2025-12-18 15:30:00'),
(40002, 30002, 10001, 'Accused arrested at residence. Weapon recovered.', 'Knife with blood stains, witness statements, arrest memo', 'Chargesheet filed on 2025-12-28', '2025-12-28 10:00:00'),
(40003, 30003, 10002, 'Complainant statement recorded. Searching for suspect in Chickpet area.', 'Complainant statement, market CCTV requested', NULL, '2025-12-29 11:45:00'),
(40004, 30004, 10001, 'Cyber cell tracing bank transactions. IP address identified.', 'Bank statements, IP logs from ISP', NULL, '2025-12-27 14:20:00'),
(40005, 30005, 10003, 'Hit-and-run case. Vehicle details noted from witnesses.', 'Witness statements, partial number plate', NULL, '2025-12-30 09:15:00');

INSERT INTO Audit_Log (
    log_id, user_id, action, table_name, record_id, timestamp
) VALUES
(50001, 10001, 'Created Case', 'Cases', 30001, '2025-12-15 14:45:00'),
(50002, 10003, 'Updated Investigation', 'Investigations', 40001, '2025-12-18 16:00:00'),
(50003, 10004, 'Filed FIR', 'FIR', 30003, '2025-12-28 11:30:00'),
(50004, 10001, 'Updated Criminal Profile', 'Criminals', 20001, '2025-12-20 10:15:00'),
(50005, 10002, 'Viewed Report', 'Cases', NULL, '2025-12-30 09:00:00'),
(50006, 10003, 'Assigned Investigation', 'Investigations', 40004, '2025-12-27 15:00:00'),
(50007, 10004, 'Logged In', 'Users', NULL, '2025-12-29 08:30:00');

DELETE FROM Audit_Log;
TRUNCATE TABLE Audit_Log;
