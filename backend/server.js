// server.js
const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'crms',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware - Authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
};

// Middleware - Role-based Authorization
const authorize = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const [rows] = await pool.query(
        'SELECT r.role_name FROM Users u JOIN Roles r ON u.role_id = r.role_id WHERE u.user_id = ?',
        [req.user.userId]
      );

      if (rows.length === 0 || !allowedRoles.includes(rows[0].role_name)) {
        return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Authorization error' });
    }
  };
};

// Permission checker for specific actions
const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const [rows] = await pool.query(
        'SELECT r.role_name FROM Users u JOIN Roles r ON u.role_id = r.role_id WHERE u.user_id = ?',
        [req.user.userId]
      );

      if (rows.length === 0) {
        return res.status(403).json({ error: 'User not found' });
      }

      const roleName = rows[0].role_name;
      const rolePermissions = getRolePermissions(roleName);

      if (!rolePermissions.includes(permission) && !rolePermissions.includes('all')) {
        return res.status(403).json({
          error: `Access denied. ${roleName} role does not have permission: ${permission}`
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Permission check error' });
    }
  };
};

// Role permissions mapping
const getRolePermissions = (roleName) => {
  const permissions = {
    'Admin': ['all', 'manage_users', 'manage_roles', 'view_cases', 'create_case', 'edit_case',
      'delete_case', 'view_criminals', 'create_criminal', 'edit_criminal', 'delete_criminal',
      'view_investigations', 'create_investigation', 'edit_investigation', 'view_staff',
      'manage_staff', 'system_settings'],
    'Superintendent': ['view_audit_logs', 'view_cases', 'edit_case', 'assign_cases', 'view_criminals',
      'edit_criminal', 'view_investigations', 'assign_investigations', 'view_staff',
      'view_reports', 'generate_reports', 'approve_actions'],
    'CID': ['view_cases', 'edit_case', 'view_criminals', 'create_criminal', 'edit_criminal',
      'view_investigations', 'create_investigation', 'edit_investigation', 'view_evidence',
      'add_evidence', 'update_case_status', 'view_reports'],
    'NCO': ['view_cases', 'create_case', 'create_fir', 'view_criminals', 'create_criminal',
      'view_investigations', 'basic_data_entry']
  };

  return permissions[roleName] || [];
};

// Audit Logging
const logAudit = async (userId, action, tableName, recordId) => {
  try {
    await pool.query(
      'INSERT INTO Audit_Log (user_id, action, table_name, record_id, timestamp) VALUES (?, ?, ?, ?, NOW())',
      [userId, action, tableName, recordId]
    );
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const [users] = await pool.query(
      `SELECT u.user_id, u.username, u.password_hash, u.role_id, 
              r.role_name, ps.staff_id, ps.name as staff_name, 
              ps.badge_number, ps.department, ps.pol_rank
       FROM Users u
       JOIN Roles r ON u.role_id = r.role_id
       JOIN Police_Staff ps ON u.staff_id = ps.staff_id
       WHERE u.username = ? AND ps.is_active = 1`,
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Plain text password comparison (NOT SECURE - for development only)
    if (password !== user.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await pool.query('UPDATE Users SET last_login = NOW() WHERE user_id = ?', [user.user_id]);

    const token = jwt.sign(
      { userId: user.user_id, username: user.username, roleId: user.role_id },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    await logAudit(user.user_id, 'LOGIN', 'Users', user.user_id);

    res.json({
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        role_name: user.role_name,
        role_id: user.role_id,
        staff_id: user.staff_id,
        staff_name: user.staff_name,
        badge_number: user.badge_number,
        department: user.department,
        pol_rank: user.pol_rank
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============================================
// CASES ROUTES
// ============================================

app.get('/api/cases', authenticateToken, async (req, res) => {
  try {
    const { search, status } = req.query;

    let query = `
      SELECT c.*, cc.crime_name, cc.ipc_section, cc.severity_level,
             cr.name as primary_accused_name
      FROM Cases c
      LEFT JOIN Crime_Category cc ON c.crime_type_id = cc.crime_type_id
      LEFT JOIN Criminals cr ON c.primary_accused_id = cr.criminal_id
      WHERE 1=1
    `;

    const params = [];

    if (search) {
      query += ' AND (c.FIR_number LIKE ? OR c.city LIKE ? OR cc.crime_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    query += ' ORDER BY c.date_reported DESC';

    const [cases] = await pool.query(query, params);
    res.json(cases);
  } catch (error) {
    console.error('Get cases error:', error);
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

app.get('/api/cases/active', authenticateToken, async (req, res) => {
  try {
    const [cases] = await pool.query(
      `SELECT c.case_id, c.FIR_number, cc.crime_name, c.city, c.district, c.date_reported,
              CASE WHEN c.primary_accused_id IS NOT NULL THEN 'Has Primary Accused' ELSE 'No Primary Accused' END as accused_status
       FROM Cases c
       LEFT JOIN Crime_Category cc ON c.crime_type_id = cc.crime_type_id
       WHERE c.status IN ('Open', 'Under Investigation')
       ORDER BY c.date_reported DESC`
    );

    res.json(cases);
  } catch (error) {
    console.error('Get active cases error:', error);
    res.status(500).json({ error: 'Failed to fetch active cases' });
  }
});

app.get('/api/cases/:id', authenticateToken, async (req, res) => {
  try {
    const [cases] = await pool.query(
      `SELECT c.*, cc.crime_name, cc.ipc_section, cc.severity_level,
              cr.name as primary_accused_name
       FROM Cases c
       LEFT JOIN Crime_Category cc ON c.crime_type_id = cc.crime_type_id
       LEFT JOIN Criminals cr ON c.primary_accused_id = cr.criminal_id
       WHERE c.case_id = ?`,
      [req.params.id]
    );

    if (cases.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json(cases[0]);
  } catch (error) {
    console.error('Get case error:', error);
    res.status(500).json({ error: 'Failed to fetch case' });
  }
});

app.put('/api/cases/:id', authenticateToken, checkPermission('edit_case'), async (req, res) => {
  try {
    const { status, description } = req.body;
    const caseId = req.params.id;

    // Validate status
    const validStatuses = ['Open', 'Under Investigation', 'Closed', 'Chargesheeted'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Check if case exists
    const [existingCase] = await pool.query('SELECT case_id FROM Cases WHERE case_id = ?', [caseId]);
    if (existingCase.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Update case
    const updateFields = [];
    const updateValues = [];

    if (status) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateValues.push(caseId);

    const [result] = await pool.query(
      `UPDATE Cases SET ${updateFields.join(', ')} WHERE case_id = ?`,
      updateValues
    );

    await logAudit(req.user.userId, 'UPDATE', 'Cases', caseId);

    res.json({ message: 'Case updated successfully' });
  } catch (error) {
    console.error('Update case error:', error);
    res.status(500).json({ error: 'Failed to update case' });
  }
});

// ============================================
// CRIMINALS ROUTES
// ============================================

app.get('/api/criminals', authenticateToken, async (req, res) => {
  try {
    const [criminals] = await pool.query('SELECT * FROM Criminals ORDER BY criminal_id DESC');
    res.json(criminals);
  } catch (error) {
    console.error('Get criminals error:', error);
    res.status(500).json({ error: 'Failed to fetch criminals' });
  }
});

app.post('/api/criminals', authenticateToken, checkPermission('create_criminal'), async (req, res) => {
  try {
    const {
      name,
      alias,
      gender,
      date_of_birth,
      height,
      weight,
      eye_color,
      hair_color,
      distinguishing_marks,
      address,
      contact_number,
      is_wanted,
      wanted_reason,
      linked_case_id
    } = req.body;

    // Basic validation
    if (!name || !gender) {
      return res.status(400).json({ error: 'Name and gender are required' });
    }

    // If linking to a case, verify the case exists and has no primary accused
    if (linked_case_id) {
      const [caseCheck] = await pool.query(
        'SELECT case_id, primary_accused_id FROM Cases WHERE case_id = ?',
        [linked_case_id]
      );

      if (caseCheck.length === 0) {
        return res.status(400).json({ error: 'Linked case not found' });
      }

      if (caseCheck[0].primary_accused_id) {
        return res.status(400).json({ error: 'Case already has a primary accused' });
      }
    }

    // Note: Criminals table schema: name, alias, dob, gender, address, height_cm, weight_kg, identifying_marks, photo_path, case_list, total_cases, pending_cases, is_wanted
    // No: eye_color, hair_color, contact_number, wanted_reason, date_of_birth (it's dob)
    const [result] = await pool.query(
      `INSERT INTO Criminals (name, alias, gender, dob, height_cm, weight_kg, identifying_marks, address, is_wanted, total_cases)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        name,
        alias || null,
        gender,
        date_of_birth || null,
        height ? parseInt(height) : null,
        weight ? parseInt(weight) : null,
        distinguishing_marks || null,
        address || null,
        is_wanted ? 1 : 0
      ]
    );

    const criminalId = result.insertId;

    // If linking to a case, update the case with the new criminal as primary accused
    if (linked_case_id) {
      await pool.query(
        'UPDATE Cases SET primary_accused_id = ? WHERE case_id = ?',
        [criminalId, linked_case_id]
      );

      // Update criminal's total_cases
      await pool.query(
        'UPDATE Criminals SET total_cases = total_cases + 1 WHERE criminal_id = ?',
        [criminalId]
      );

      await logAudit(req.user.userId, 'LINK', 'Cases', linked_case_id);
    }

    await logAudit(req.user.userId, 'CREATE', 'Criminals', criminalId);

    res.status(201).json({
      message: 'Criminal record created successfully',
      criminal_id: criminalId
    });
  } catch (error) {
    console.error('Create criminal error:', error);
    res.status(500).json({ error: 'Failed to create criminal record' });
  }
});

app.put('/api/criminals/:id', authenticateToken, checkPermission('edit_criminal'), async (req, res) => {
  try {
    const { is_wanted, wanted_reason } = req.body;
    const criminalId = parseInt(req.params.id);

    if (isNaN(criminalId)) {
      return res.status(400).json({ error: 'Invalid criminal ID' });
    }

    // Check if criminal exists
    const [existingCriminal] = await pool.query('SELECT criminal_id FROM Criminals WHERE criminal_id = ?', [criminalId]);
    if (existingCriminal.length === 0) {
      return res.status(404).json({ error: 'Criminal not found' });
    }

    // Update criminal wanted status
    // Note: wanted_reason column doesn't exist in schema, so we only update is_wanted
    await pool.query(
      'UPDATE Criminals SET is_wanted = ? WHERE criminal_id = ?',
      [Boolean(is_wanted) ? 1 : 0, criminalId]
    );

    await logAudit(req.user.userId, 'UPDATE', 'Criminals', criminalId);

    res.json({ message: 'Criminal wanted status updated successfully' });
  } catch (error) {
    console.error('Update criminal error:', error);
    res.status(500).json({ error: 'Failed to update criminal wanted status: ' + error.message });
  }
});

// ============================================
// INVESTIGATIONS ROUTES
// ============================================

app.get('/api/investigations', authenticateToken, async (req, res) => {
  try {
    const [investigations] = await pool.query(
      `SELECT i.*, c.FIR_number, cc.crime_name, ps.name as officer_name,
              CASE 
                WHEN i.progress_notes LIKE '[Status: Closed]%' THEN 'Closed'
                WHEN i.progress_notes LIKE '[Status: In Progress]%' THEN 'In Progress'
                WHEN i.progress_notes LIKE '[Status: Suspended]%' THEN 'Suspended'
                ELSE 'Open'
              END as status,
              i.progress_notes as investigation_notes
       FROM Investigations i
       JOIN Cases c ON i.case_id = c.case_id
       JOIN Crime_Category cc ON c.crime_type_id = cc.crime_type_id
       JOIN Police_Staff ps ON i.assigned_to = ps.staff_id
       ORDER BY i.last_updated DESC`
    );

    res.json(investigations);
  } catch (error) {
    console.error('Get investigations error:', error);
    res.status(500).json({ error: 'Failed to fetch investigations' });
  }
});

app.post('/api/investigations', authenticateToken, checkPermission('create_investigation'), async (req, res) => {
  try {
    const { case_id, assigned_to, investigation_notes, status } = req.body;

    // Basic validation
    if (!case_id || !assigned_to) {
      return res.status(400).json({ error: 'Case ID and assigned officer are required' });
    }

    const caseId = parseInt(case_id);
    const assignedTo = parseInt(assigned_to);

    if (isNaN(caseId) || isNaN(assignedTo)) {
      return res.status(400).json({ error: 'Invalid case ID or officer ID' });
    }

    // Check if case exists
    const [caseCheck] = await pool.query('SELECT case_id FROM Cases WHERE case_id = ?', [caseId]);
    if (caseCheck.length === 0) {
      return res.status(400).json({ error: 'Case not found' });
    }

    // Check if officer exists and is active
    const [officerCheck] = await pool.query('SELECT staff_id FROM Police_Staff WHERE staff_id = ? AND is_active = 1', [assignedTo]);
    if (officerCheck.length === 0) {
      return res.status(400).json({ error: 'Officer not found or inactive' });
    }

    // Check if investigation already exists for this case
    const [existingInvestigation] = await pool.query('SELECT investigation_id FROM Investigations WHERE case_id = ?', [caseId]);
    if (existingInvestigation.length > 0) {
      return res.status(400).json({ error: 'Investigation already exists for this case' });
    }

    // Note: Investigations table uses progress_notes (not investigation_notes) and has no status column
    // Store status in progress_notes as [Status: ...]
    const notesText = status ? `[Status: ${status}] ${investigation_notes || ''}`.trim() : (investigation_notes || null);

    const [result] = await pool.query(
      `INSERT INTO Investigations (case_id, assigned_to, progress_notes, last_updated)
       VALUES (?, ?, ?, NOW())`,
      [caseId, assignedTo, notesText]
    );

    await logAudit(req.user.userId, 'CREATE', 'Investigations', result.insertId);

    res.status(201).json({
      message: 'Investigation created successfully',
      investigation_id: result.insertId
    });
  } catch (error) {
    console.error('Create investigation error:', error);
    res.status(500).json({ error: 'Failed to create investigation: ' + error.message });
  }
});

app.put('/api/investigations/:id', authenticateToken, checkPermission('edit_investigation'), async (req, res) => {
  try {
    const { status, investigation_notes, assigned_to } = req.body;
    const investigationId = parseInt(req.params.id);

    if (isNaN(investigationId)) {
      return res.status(400).json({ error: 'Invalid investigation ID' });
    }

    // Check if investigation exists
    const [existingInvestigation] = await pool.query('SELECT investigation_id FROM Investigations WHERE investigation_id = ?', [investigationId]);
    if (existingInvestigation.length === 0) {
      return res.status(404).json({ error: 'Investigation not found' });
    }

    // Note: Investigations table doesn't have 'status' column in schema
    // It has: progress_notes (not investigation_notes), assigned_to, last_updated
    // We'll store status in progress_notes if provided, or update progress_notes

    // Check officer if being reassigned
    if (assigned_to) {
      const assignedToId = parseInt(assigned_to);
      if (isNaN(assignedToId)) {
        return res.status(400).json({ error: 'Invalid officer ID' });
      }
      const [officerCheck] = await pool.query('SELECT staff_id FROM Police_Staff WHERE staff_id = ? AND is_active = 1', [assignedToId]);
      if (officerCheck.length === 0) {
        return res.status(400).json({ error: 'Officer not found or inactive' });
      }
    }

    // Update investigation
    const updateFields = [];
    const updateValues = [];

    // Store status and notes in progress_notes (since status column doesn't exist)
    if (status || investigation_notes !== undefined) {
      let notesText = investigation_notes || '';
      if (status) {
        notesText = `[Status: ${status}] ${notesText}`.trim();
      }
      updateFields.push('progress_notes = ?');
      updateValues.push(notesText || null);
    }

    if (assigned_to) {
      updateFields.push('assigned_to = ?');
      updateValues.push(parseInt(assigned_to));
    }

    if (updateFields.length > 0) {
      updateFields.push('last_updated = NOW()');
      updateValues.push(investigationId);

      const [result] = await pool.query(
        `UPDATE Investigations SET ${updateFields.join(', ')} WHERE investigation_id = ?`,
        updateValues
      );
    }

    await logAudit(req.user.userId, 'UPDATE', 'Investigations', investigationId);

    res.json({ message: 'Investigation updated successfully' });
  } catch (error) {
    console.error('Update investigation error:', error);
    res.status(500).json({ error: 'Failed to update investigation: ' + error.message });
  }
});

// ============================================
// POLICE STAFF ROUTES
// ============================================

app.get('/api/staff', authenticateToken, async (req, res) => {
  try {
    const [staff] = await pool.query('SELECT * FROM Police_Staff ORDER BY join_date DESC');
    res.json(staff);
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

app.post('/api/staff', authenticateToken, authorize('Admin', 'Superintendent'), async (req, res) => {
  try {
    const { name, pol_rank, badge_number, contact, department, join_date } = req.body;

    if (!name || !pol_rank || !badge_number) {
      return res.status(400).json({ error: 'Name, rank, and badge number are required' });
    }

    // Check if badge number already exists
    const [existing] = await pool.query('SELECT staff_id FROM Police_Staff WHERE badge_number = ?', [badge_number]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Badge number already exists' });
    }

    const [result] = await pool.query(
      `INSERT INTO Police_Staff (name, pol_rank, badge_number, contact, department, join_date, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [name, pol_rank, badge_number, contact || null, department || null, join_date || null]
    );

    await logAudit(req.user.userId, 'CREATE', 'Police_Staff', result.insertId);

    res.status(201).json({
      message: 'Police staff created successfully',
      staff_id: result.insertId
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ error: 'Failed to create police staff: ' + error.message });
  }
});

// ============================================
// DASHBOARD STATS
// ============================================

app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const [totalCases] = await pool.query('SELECT COUNT(*) as count FROM Cases');
    const [openCases] = await pool.query('SELECT COUNT(*) as count FROM Cases WHERE status = "Open"');
    const [wantedCriminals] = await pool.query('SELECT COUNT(*) as count FROM Criminals WHERE is_wanted = 1');
    const [activeStaff] = await pool.query('SELECT COUNT(*) as count FROM Police_Staff WHERE is_active = 1');

    res.json({
      total_cases: totalCases[0].count,
      open_cases: openCases[0].count,
      wanted_criminals: wantedCriminals[0].count,
      active_staff: activeStaff[0].count
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ============================================
// CRIME CATEGORIES
// ============================================

app.get('/api/crime-categories', authenticateToken, async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM Crime_Category ORDER BY crime_name');
    res.json(categories);
  } catch (error) {
    console.error('Get crime categories error:', error);
    res.status(500).json({ error: 'Failed to fetch crime categories' });
  }
});

// ============================================
// REGISTER NEW FIR
// ============================================

app.post('/api/fir', authenticateToken, checkPermission('create_fir'), async (req, res) => {
  try {
    const {
      FIR_number,
      complainant_name,
      complainant_contact,
      complainant_address,
      place_of_offence,
      police_station,
      date_filed,
      // case fields
      crime_type_id,
      city,
      district,
      police_station_code,
      latitude,
      longitude,
      description,
      date_reported
    } = req.body;

    // Basic validation
    if (!FIR_number || !complainant_name || !crime_type_id || !date_reported) {
      return res.status(400).json({ error: 'Missing required FIR or case fields' });
    }

    // Check for existing FIR or Case with same FIR_number
    const [existingCases] = await pool.query('SELECT case_id FROM Cases WHERE FIR_number = ?', [FIR_number]);
    if (existingCases.length > 0) {
      return res.status(400).json({ error: 'FIR number already exists' });
    }

    // Insert case
    const [caseResult] = await pool.query(
      `INSERT INTO Cases (FIR_number, crime_type_id, primary_accused_id, city, district, police_station_code, latitude, longitude, description, date_reported, status)
       VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [FIR_number, crime_type_id, city || null, district || null, police_station_code || null, latitude || null, longitude || null, description || null, date_reported, 'Open']
    );

    const caseId = caseResult.insertId;

    // Insert FIR
    const [firResult] = await pool.query(
      `INSERT INTO FIR (FIR_number, complainant_name, complainant_contact, complainant_address, place_of_offence, police_station, date_filed, case_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [FIR_number, complainant_name, complainant_contact || null, complainant_address || null, place_of_offence || null, police_station || null, date_filed || new Date(), caseId]
    );

    await logAudit(req.user.userId, 'CREATE', 'FIR', caseId);

    res.status(201).json({ message: 'FIR registered successfully', case_id: caseId });
  } catch (error) {
    console.error('Create FIR error:', error);
    res.status(500).json({ error: 'Failed to register FIR' });
  }
});

// ============================================
// USER MANAGEMENT ROUTES (Admin Only)
// ============================================

// Get all users (Admin only)
app.get('/api/users', authenticateToken, checkPermission('manage_users'), async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.user_id, u.username, u.created_at, u.last_login,
              r.role_name, ps.name as staff_name, ps.badge_number, ps.is_active
       FROM Users u
       JOIN Roles r ON u.role_id = r.role_id
       JOIN Police_Staff ps ON u.staff_id = ps.staff_id
       ORDER BY u.created_at DESC`
    );

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create new user (Admin only)
app.post('/api/users', authenticateToken, checkPermission('manage_users'), async (req, res) => {
  try {
    const { username, password, role_id, staff_id } = req.body;

    // Check if username exists
    const [existing] = await pool.query('SELECT user_id FROM Users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Store password as plain text (NOT SECURE - for development only)
    const password_hash = password;

    const [result] = await pool.query(
      'INSERT INTO Users (username, password_hash, role_id, staff_id, created_at) VALUES (?, ?, ?, ?, NOW())',
      [username, password_hash, role_id, staff_id]
    );

    await logAudit(req.user.userId, 'CREATE', 'Users', result.insertId);

    res.status(201).json({
      message: 'User created successfully',
      user_id: result.insertId
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Edit user (Admin only)
app.put('/api/users/:id', authenticateToken, checkPermission('manage_users'), async (req, res) => {
  try {
    const { role_id, is_active } = req.body;

    await pool.query(
      'UPDATE Users u JOIN Police_Staff ps ON u.staff_id = ps.staff_id SET u.role_id = ?, ps.is_active = ? WHERE u.user_id = ?',
      [role_id, is_active, req.params.id]
    );

    await logAudit(req.user.userId, 'UPDATE', 'Users', req.params.id);

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete/Lock user (Admin only)
app.delete('/api/users/:id', authenticateToken, checkPermission('manage_users'), async (req, res) => {
  try {
    // Don't actually delete, just deactivate
    await pool.query(
      'UPDATE Police_Staff ps JOIN Users u ON ps.staff_id = u.staff_id SET ps.is_active = 0 WHERE u.user_id = ?',
      [req.params.id]
    );

    await logAudit(req.user.userId, 'DEACTIVATE', 'Users', req.params.id);

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

// Get all roles
app.get('/api/roles', authenticateToken, async (req, res) => {
  try {
    const [roles] = await pool.query('SELECT * FROM Roles ORDER BY role_name');
    res.json(roles);
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// ============================================
// AUDIT LOG ROUTES (Superintendent Only)
// ============================================

app.get('/api/audit-logs', authenticateToken, checkPermission('view_audit_logs'), async (req, res) => {
  try {
    const [logs] = await pool.query(
      `SELECT al.*, u.username, ps.name as staff_name, r.role_name
       FROM Audit_Log al
       JOIN Users u ON al.user_id = u.user_id
       JOIN Police_Staff ps ON u.staff_id = ps.staff_id
       JOIN Roles r ON u.role_id = r.role_id
       ORDER BY al.timestamp DESC
       LIMIT 500`
    );

    res.json(logs);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 CRMS Backend Server running on port ${PORT}`);
});

// Test database connection
pool.query('SELECT 1')
  .then(() => console.log('✅ Database connected successfully'))
  .catch(err => console.error('❌ Database connection failed:', err));