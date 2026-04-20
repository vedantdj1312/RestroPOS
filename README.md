# RestroPOS - Restaurant POS System

A complete full-stack Restaurant Point-of-Sale application built with React, Node.js, Express, and MySQL.

## Features
- **Menu Management**: Add, update, and organize categories and menu items.
- **Table Management**: Real-time view of occupied and available tables.
- **Order Management**: Take orders, associate with tables, and update order statuses (Pending, Preparing, Completed).
- **Billing & Checkout**: Seamlessly complete orders with total calculations.
- **Dashboard**: High-level overview of daily sales and active tables.

## Tech Stack
- **Frontend**: React (Vite) + Vanilla CSS
- **Backend**: Node.js, Express
- **Database**: MySQL

## Prerequisites
- Node.js (v16+)
- MySQL Server

## Getting Started

### 1. Database Setup
1. Open MySQL and execute the `backend/schema.sql` script to create the database and tables.
2. The default setup attempts to connect to a local MySQL instance (root / no password or root/root depending on `.env`). Update the `.env` file in the `backend/` folder accordingly.

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```
The server will start on `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The application will be available at `http://localhost:5173`.
        