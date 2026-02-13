-- ============================================
-- CRMS DATABASE - VIEW ALL DATA
-- Complete database dump for presentation
-- ============================================

USE crms;

-- ============================================
-- 1. ROLES TABLE
-- ============================================
SELECT '========== ROLES ==========' AS '';
SELECT 
    role_id,
    role_name
FROM Roles
ORDER BY role_id;

-- ============================================
-- 2. POLICE STAFF TABLE
-- ============================================
SELECT '========== POLICE STAFF ==========' AS '';
SELECT 
    staff_id,
    name,
    pol_rank,
    badge_number,
    contact,
    department,
    join_date,
    is_active
FROM Police_Staff
ORDER BY staff_id;

-- ============================================
-- 3. USERS TABLE
-- ============================================
SELECT '========== USERS ==========' AS '';
SELECT 
    u.user_id,
    u.username,
    u.password_hash AS password,
    r.role_name,
    ps.name AS staff_name,
    ps.badge_number,
    u.created_at,
    u.last_login
FROM Users u
JOIN Roles r ON u.role_id = r.role_id
JOIN Police_Staff ps ON u.staff_id = ps.staff_id
ORDER BY u.user_id;

-- ============================================
-- 4. CRIME CATEGORIES TABLE
-- ============================================
SELECT '========== CRIME CATEGORIES ==========' AS '';
SELECT 
    crime_type_id,
    ipc_section,
    crime_name,
    description,
    severity_level
FROM Crime_Category
ORDER BY crime_type_id;

-- ============================================
-- 5. CRIMINALS TABLE
-- ============================================
SELECT '========== CRIMINALS ==========' AS '';
SELECT 
    criminal_id,
    name,
    alias,
    dob AS date_of_birth,
    gender,
    address,
    height_cm,
    weight_kg,
    identifying_marks,
    total_cases,
    pending_cases,
    is_wanted
FROM Criminals
ORDER BY criminal_id;

-- ============================================
-- 6. CASES TABLE (with relationships)
-- ============================================
SELECT '========== CASES ==========' AS '';
SELECT 
    c.case_id,
    c.FIR_number,
    cc.crime_name,
    cc.ipc_section,
    cr.name AS primary_accused,
    c.city,
    c.district,
    c.police_station_code,
    c.latitude,
    c.longitude,
    c.description,
    c.date_reported,
    c.status
FROM Cases c
JOIN Crime_Category cc ON c.crime_type_id = cc.crime_type_id
LEFT JOIN Criminals cr ON c.primary_accused_id = cr.criminal_id
ORDER BY c.case_id;

-- ============================================
-- 7. FIR TABLE (with case details)
-- ============================================
SELECT '========== FIR RECORDS ==========' AS '';
SELECT 
    f.FIR_number,
    f.complainant_name,
    f.complainant_contact,
    f.complainant_address,
    f.place_of_offence,
    f.police_station,
    f.date_filed,
    c.status AS case_status,
    cc.crime_name
FROM FIR f
JOIN Cases c ON f.case_id = c.case_id
JOIN Crime_Category cc ON c.crime_type_id = cc.crime_type_id
ORDER BY f.date_filed DESC;

-- ============================================
-- 8. INVESTIGATIONS TABLE (with relationships)
-- ============================================
SELECT '========== INVESTIGATIONS ==========' AS '';
SELECT 
    i.investigation_id,
    c.FIR_number,
    cc.crime_name,
    ps.name AS assigned_officer,
    ps.badge_number,
    i.progress_notes,
    i.evidence_list,
    i.final_report,
    i.last_updated
FROM Investigations i
JOIN Cases c ON i.case_id = c.case_id
JOIN Crime_Category cc ON c.crime_type_id = cc.crime_type_id
JOIN Police_Staff ps ON i.assigned_to = ps.staff_id
ORDER BY i.investigation_id;

-- ============================================
-- 9. AUDIT LOG TABLE (Recent 50 entries)
-- ============================================
SELECT '========== AUDIT LOG (Recent 50) ==========' AS '';
SELECT 
    al.log_id,
    u.username,
    ps.name AS staff_name,
    r.role_name,
    al.action,
    al.table_name,
    al.record_id,
    al.timestamp
FROM Audit_Log al
JOIN Users u ON al.user_id = u.user_id
JOIN Police_Staff ps ON u.staff_id = ps.staff_id
JOIN Roles r ON u.role_id = r.role_id
ORDER BY al.timestamp DESC
LIMIT 50;

-- ============================================
-- SUMMARY STATISTICS
-- ============================================
SELECT '========== DATABASE SUMMARY ==========' AS '';

SELECT 'Total Roles' AS metric, COUNT(*) AS count FROM Roles
UNION ALL
SELECT 'Total Police Staff', COUNT(*) FROM Police_Staff
UNION ALL
SELECT 'Active Police Staff', COUNT(*) FROM Police_Staff WHERE is_active = 1
UNION ALL
SELECT 'Total Users', COUNT(*) FROM Users
UNION ALL
SELECT 'Total Crime Categories', COUNT(*) FROM Crime_Category
UNION ALL
SELECT 'Total Criminals', COUNT(*) FROM Criminals
UNION ALL
SELECT 'Wanted Criminals', COUNT(*) FROM Criminals WHERE is_wanted = 1
UNION ALL
SELECT 'Total Cases', COUNT(*) FROM Cases
UNION ALL
SELECT 'Open Cases', COUNT(*) FROM Cases WHERE status = 'Open'
UNION ALL
SELECT 'Under Investigation', COUNT(*) FROM Cases WHERE status = 'Under Investigation'
UNION ALL
SELECT 'Closed Cases', COUNT(*) FROM Cases WHERE status = 'Closed'
UNION ALL
SELECT 'Total FIRs', COUNT(*) FROM FIR
UNION ALL
SELECT 'Total Investigations', COUNT(*) FROM Investigations
UNION ALL
SELECT 'Total Audit Logs', COUNT(*) FROM Audit_Log;

-- ============================================
-- RELATIONSHIP INSIGHTS
-- ============================================
SELECT '========== RELATIONSHIP INSIGHTS ==========' AS '';

-- Cases per Crime Category
SELECT 
    'Cases by Crime Type' AS insight,
    cc.crime_name,
    COUNT(c.case_id) AS case_count
FROM Crime_Category cc
LEFT JOIN Cases c ON cc.crime_type_id = c.crime_type_id
GROUP BY cc.crime_type_id, cc.crime_name
ORDER BY case_count DESC;

-- Cases per Criminal
SELECT 
    'Cases per Criminal' AS insight,
    cr.name AS criminal_name,
    COUNT(c.case_id) AS case_count
FROM Criminals cr
LEFT JOIN Cases c ON cr.criminal_id = c.primary_accused_id
GROUP BY cr.criminal_id, cr.name
HAVING case_count > 0
ORDER BY case_count DESC;

-- Investigations per Officer
SELECT 
    'Investigations per Officer' AS insight,
    ps.name AS officer_name,
    ps.pol_rank,
    COUNT(i.investigation_id) AS investigation_count
FROM Police_Staff ps
LEFT JOIN Investigations i ON ps.staff_id = i.assigned_to
GROUP BY ps.staff_id, ps.name, ps.pol_rank
HAVING investigation_count > 0
ORDER BY investigation_count DESC;

-- Cases by Status
SELECT 
    'Cases by Status' AS insight,
    status,
    COUNT(*) AS count
FROM Cases
GROUP BY status
ORDER BY count DESC;

-- Cases by Location (Top 10 Cities)
SELECT 
    'Top Cities by Case Count' AS insight,
    city,
    COUNT(*) AS case_count
FROM Cases
WHERE city IS NOT NULL
GROUP BY city
ORDER BY case_count DESC
LIMIT 10;
