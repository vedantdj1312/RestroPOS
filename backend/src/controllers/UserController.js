const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Get all staff members
exports.getAllStaff = async (req, res) => {
  try {
    const [staff] = await db.query(`
      SELECT id, name, email, role, salary, 
             DATE_FORMAT(login_time, '%H:%i') as login_time, 
             DATE_FORMAT(logout_time, '%H:%i') as logout_time, 
             status, raw_password as password 
      FROM users 
      ORDER BY id ASC
    `);
    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff members' });
  }
};

// Add a new staff member
exports.addStaff = async (req, res) => {
  try {
    const { name, email, password, role, salary, login_time, logout_time } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    // Check if email exists
    const [exists] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length > 0) {
      return res.status(400).json({ error: 'Email already exists in the system' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      `INSERT INTO users (name, email, password_hash, raw_password, role, salary, login_time, logout_time) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, hash, password, role, salary || 0, login_time || null, logout_time || null]
    );

    res.status(201).json({ message: 'Staff member added successfully', id: result.insertId });
  } catch (error) {
    console.error('Error adding staff:', error);
    res.status(500).json({ error: 'Failed to add staff member' });
  }
};

// Update an existing staff member
exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, salary, login_time, logout_time, status } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required' });
    }

    let query = `UPDATE users SET name=?, email=?, role=?, salary=?, login_time=?, logout_time=?, status=?`;
    let params = [name, email, role, salary || 0, login_time || null, logout_time || null, status || 'Active'];

    // Update password if a new one is provided
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      query += `, password_hash=?, raw_password=?`;
      params.push(hash, password);
    }

    query += ` WHERE id=?`;
    params.push(id);

    await db.query(query, params);
    res.json({ message: 'Staff member updated successfully' });
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({ error: 'Failed to update staff member' });
  }
};
