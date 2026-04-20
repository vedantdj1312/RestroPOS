const db = require('../config/db');

// Get all settings
exports.getSettings = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT setting_key, setting_value FROM settings');
    
    // Convert array of pairs to a single object
    const settings = {};
    for (const row of rows) {
      settings[row.setting_key] = row.setting_value;
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

// Update multiple settings at once
exports.updateSettings = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const settings = req.body; // Expect an object: { key1: val1, key2: val2 }

    for (const [key, value] of Object.entries(settings)) {
      await connection.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, value, value]
      );
    }

    await connection.commit();
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  } finally {
    connection.release();
  }
};
