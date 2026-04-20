const express = require('express');
const router = express.Router();

const itemController = require('../controllers/ItemController');
const orderController = require('../controllers/OrderController');
const tableController = require('../controllers/TableController');
const dashboardController = require('../controllers/DashboardController');
const inventoryController = require('../controllers/InventoryController');
const reportController = require('../controllers/ReportController');
const kitchenController = require('../controllers/KitchenController');
const customerController = require('../controllers/CustomerController');
const settingsController = require('../controllers/SettingsController');
const userController = require('../controllers/UserController');
const sopController = require('../controllers/SOPController');

const authController = require('../controllers/AuthController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Auth
router.post('/auth/login', authController.login);

// Public Customer endpoints
router.post('/customers/register', customerController.registerCustomer);
router.post('/customers/order', customerController.customerPlaceOrder);
router.get('/items', itemController.getAllItems);
router.get('/categories', itemController.getCategories);
router.get('/tables', tableController.getAllTables);
router.get('/customers/order/:id', customerController.getOrderStatus);
router.put('/customers/order/:id', customerController.updateCustomerOrder);

// Apply token verification to ALL subsequent staff routes
router.use(verifyToken);

// Settings
router.get('/settings', checkRole('Owner/Admin', 'Manager'), settingsController.getSettings);
router.post('/settings', checkRole('Owner/Admin', 'Manager'), settingsController.updateSettings);

// Dashboard
router.get('/dashboard', checkRole('Owner/Admin', 'Manager', 'Cashier'), dashboardController.getDashboardStats);

// Reports
router.get('/reports/sales', checkRole('Owner/Admin', 'Manager', 'Inventory Manager'), reportController.getSalesReport);

// Inventory
router.get('/inventory', checkRole('Owner/Admin', 'Manager', 'Inventory Manager'), inventoryController.getAllInventory);
router.post('/inventory', checkRole('Owner/Admin', 'Manager', 'Inventory Manager'), inventoryController.addInventoryItem);
router.put('/inventory/:id', checkRole('Owner/Admin', 'Manager', 'Inventory Manager'), inventoryController.updateInventoryItem);
router.delete('/inventory/:id', checkRole('Owner/Admin', 'Manager', 'Inventory Manager'), inventoryController.deleteInventoryItem);

// Menu Items (Admins/Managers manage, everyone else views since Waiters/Cashiers need them for POS)
router.post('/items', checkRole('Owner/Admin', 'Manager'), itemController.addItem);
router.put('/items/:id', checkRole('Owner/Admin', 'Manager'), itemController.updateItem);
router.delete('/items/:id', checkRole('Owner/Admin', 'Manager'), itemController.deleteItem);
router.patch('/items/:id/availability', checkRole('Owner/Admin', 'Manager'), itemController.updateItemAvailability);
router.get('/items/:id/recipe', checkRole('Owner/Admin', 'Manager', 'Kitchen Staff'), itemController.getItemRecipe);
router.put('/items/:id/recipe', checkRole('Owner/Admin', 'Manager'), itemController.updateItemRecipe);

// Orders (Waiter can mutate, Kitchen views, Cashier views)
router.get('/orders', checkRole('Owner/Admin', 'Manager', 'Waiter/Server', 'Cashier', 'Kitchen Staff'), orderController.getAllOrders);
router.get('/orders/active/:tableId', checkRole('Owner/Admin', 'Manager', 'Waiter/Server', 'Cashier'), orderController.getActiveTableOrder);
router.get('/orders/:id', checkRole('Owner/Admin', 'Manager', 'Waiter/Server', 'Cashier', 'Kitchen Staff'), orderController.getOrderById);
router.post('/orders', checkRole('Owner/Admin', 'Manager', 'Waiter/Server', 'Cashier'), orderController.createOrder);
router.put('/orders/:id', checkRole('Owner/Admin', 'Manager', 'Waiter/Server', 'Cashier'), orderController.updateOrder);
router.patch('/orders/:id/status', checkRole('Owner/Admin', 'Manager', 'Waiter/Server'), orderController.updateOrderStatus);

// Tables Management
router.post('/tables', checkRole('Owner/Admin', 'Manager'), tableController.addTable);
router.post('/tables/reset', checkRole('Owner/Admin', 'Manager'), tableController.resetAllTables);
router.delete('/tables/:id', checkRole('Owner/Admin', 'Manager'), tableController.removeTable);
router.patch('/tables/:id/reserve', checkRole('Owner/Admin', 'Manager', 'Waiter/Server'), tableController.reserveTable);
router.patch('/tables/:id/status', checkRole('Owner/Admin', 'Manager', 'Waiter/Server', 'Cashier'), tableController.updateTableStatus);
router.patch('/tables/:id/bill', checkRole('Owner/Admin', 'Manager', 'Waiter/Server', 'Cashier'), tableController.printBill);
router.patch('/tables/:id/pay', checkRole('Owner/Admin', 'Manager', 'Cashier'), tableController.payBill);
router.patch('/tables/:id/clear', checkRole('Owner/Admin', 'Manager', 'Waiter/Server', 'Cashier'), tableController.clearTable);

// Kitchen / KOT
router.get('/kitchen/orders', checkRole('Owner/Admin', 'Manager', 'Kitchen Staff', 'Waiter/Server'), kitchenController.getKitchenOrders);
router.get('/kitchen/count', checkRole('Owner/Admin', 'Manager', 'Kitchen Staff', 'Waiter/Server'), kitchenController.getKitchenCount);
router.patch('/kitchen/:id/accept', checkRole('Owner/Admin', 'Manager', 'Kitchen Staff'), kitchenController.acceptOrder);
router.patch('/kitchen/:id/complete', checkRole('Owner/Admin', 'Manager', 'Kitchen Staff'), kitchenController.completeOrder);

// Customers Details
router.get('/customers', checkRole('Owner/Admin', 'Manager', 'Cashier', 'Waiter/Server'), customerController.getAllCustomers);

// Staff & Users Management
router.get('/users', checkRole('Owner/Admin', 'Manager'), userController.getAllStaff);
router.post('/users', checkRole('Owner/Admin', 'Manager'), userController.addStaff);
router.put('/users/:id', checkRole('Owner/Admin', 'Manager'), userController.updateStaff);

// SOP / Recipe Management
router.get('/sop', checkRole('Owner/Admin', 'Manager', 'Kitchen Staff'), sopController.getAllSOPs);
router.put('/sop/:menu_item_id', checkRole('Owner/Admin', 'Manager'), sopController.updateSOP);

module.exports = router;
