const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function migrateUsers() {
  try {
    console.log("Updating users table schema for new roles...");

    // Disable FK checks to allow dropping/truncating
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Drop existing users and attendance to cleanly reset
    await db.query('DROP TABLE IF EXISTS attendance');
    await db.query('DROP TABLE IF EXISTS users');

    await db.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        raw_password VARCHAR(255),
        role ENUM('Owner/Admin', 'Manager', 'Cashier', 'Waiter/Server', 'Kitchen Staff', 'Inventory Manager') NOT NULL,
        salary DECIMAL(10,2) DEFAULT 0.00,
        login_time TIME NULL,
        logout_time TIME NULL,
        status ENUM('Active', 'Terminated') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Recreate attendance table in case it's used elsewhere
    await db.query(`
      CREATE TABLE attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        date DATE NOT NULL,
        status ENUM('Present', 'Absent', 'Half Day', 'Leave') DEFAULT 'Present',
        check_in TIME,
        check_out TIME,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await db.query('SET FOREIGN_KEY_CHECKS = 1');

    const defaultUsers = [
      // Owner/Admin (2)
      { name: 'Vikram Singh (Owner)', email: 'vikram.owner@restpos.com', password: 'admin123', role: 'Owner/Admin', salary: 150000, login: '09:00:00', logout: '22:00:00' },
      { name: 'Anjali Sharma (Admin)', email: 'admin@restpos.com', password: 'admin123', role: 'Owner/Admin', salary: 80000, login: '09:00:00', logout: '18:00:00' },
      // Managers (3)
      { name: 'Rahul Desai (Gen. Manager)', email: 'manager@restpos.com', password: 'manager123', role: 'Manager', salary: 65000, login: '10:00:00', logout: '20:00:00' },
      { name: 'Priya Verma (Shift Manager)', email: 'priya.verma@restpos.com', password: 'shift123', role: 'Manager', salary: 55000, login: '14:00:00', logout: '23:00:00' },
      { name: 'Sanjay Gupta (Floor Manager)', email: 'sanjay.mgr@restpos.com', password: 'floor123', role: 'Manager', salary: 45000, login: '08:00:00', logout: '18:00:00' },
      // Cashiers (3)
      { name: 'Rohan Joshi', email: 'cashier@restpos.com', password: 'cash123', role: 'Cashier', salary: 28000, login: '09:00:00', logout: '17:00:00' },
      { name: 'Neha Khanna', email: 'neha.cash@restpos.com', password: 'cash123', role: 'Cashier', salary: 28000, login: '17:00:00', logout: '00:00:00' },
      { name: 'Arun Bhatia', email: 'arun.cash@restpos.com', password: 'cash123', role: 'Cashier', salary: 25000, login: '12:00:00', logout: '20:00:00' },
      // Waiter/Servers (6)
      { name: 'Vijay Kumar (Senior Waiter)', email: 'waiter@restpos.com', password: 'waiter123', role: 'Waiter/Server', salary: 22000, login: '09:00:00', logout: '18:00:00' },
      { name: 'Aman Patel', email: 'aman.waiter@restpos.com', password: 'waiter123', role: 'Waiter/Server', salary: 18000, login: '12:00:00', logout: '22:00:00' },
      { name: 'Ramesh Singh', email: 'ramesh.waiter@restpos.com', password: 'waiter123', role: 'Waiter/Server', salary: 18000, login: '18:00:00', logout: '01:00:00' },
      { name: 'Sunita Devi', email: 'sunita.waiter@restpos.com', password: 'waiter123', role: 'Waiter/Server', salary: 19000, login: '08:00:00', logout: '16:00:00' },
      { name: 'Deepak Rao', email: 'deepak.waiter@restpos.com', password: 'waiter123', role: 'Waiter/Server', salary: 18000, login: '11:00:00', logout: '20:00:00' },
      { name: 'Kishan Lal', email: 'kishan.waiter@restpos.com', password: 'waiter123', role: 'Waiter/Server', salary: 17500, login: '16:00:00', logout: '00:00:00' },
      // Kitchen Staff (4)
      { name: 'Chef Sanjeev (Head Chef)', email: 'kitchen@restpos.com', password: 'kitchen123', role: 'Kitchen Staff', salary: 95000, login: '10:00:00', logout: '22:00:00' },
      { name: 'Imran Khan (Sous Chef)', email: 'imran.sous@restpos.com', password: 'kitchen123', role: 'Kitchen Staff', salary: 60000, login: '14:00:00', logout: '23:00:00' },
      { name: 'Rajendra Prasad (Line Cook)', email: 'rajendra.cook@restpos.com', password: 'kitchen123', role: 'Kitchen Staff', salary: 30000, login: '09:00:00', logout: '18:00:00' },
      { name: 'Tarun M (Prep Cook)', email: 'tarun.prep@restpos.com', password: 'kitchen123', role: 'Kitchen Staff', salary: 22000, login: '07:00:00', logout: '16:00:00' },
      // Inventory (1)
      { name: 'Satish Nair (Inventory Keeper)', email: 'inventory@restpos.com', password: 'inv123', role: 'Inventory Manager', salary: 35000, login: '08:00:00', logout: '17:00:00' }
    ];

    for (const u of defaultUsers) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(u.password, salt);
      await db.query(`
        INSERT INTO users (name, email, password_hash, raw_password, role, salary, login_time, logout_time) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [u.name, u.email, hash, u.password, u.role, u.salary, u.login, u.logout]);
    }
    
    console.log("Users table updated and seeded with 19 total staff members successfully!");
  } catch (error) {
    console.error("Migration Failed:", error);
  } finally {
    process.exit(0);
  }
}

migrateUsers();
