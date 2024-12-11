const express = require("express");
const logger = require('morgan');
const dl = require('./dataContext');

const app = express();

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Base URL for all routes
const baseUrl = '/CompanyServices';

// Import routes
const companyRoutes = require('./routes/company');
const departmentRoutes = require('./routes/department');
const employeeRoutes = require('./routes/employee');
const timecardRoutes = require('./routes/timecard');

// Use routes
app.use(baseUrl, companyRoutes);
app.use(baseUrl, departmentRoutes);
app.use(baseUrl, employeeRoutes);
app.use(baseUrl, timecardRoutes);

const port = 8282;
app.listen(port, () => {
    console.log(`Express started on port ${port}`);
});

// Add global error handler
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('SIGTERM', () => {
    dl.close();
    process.exit(0);
});