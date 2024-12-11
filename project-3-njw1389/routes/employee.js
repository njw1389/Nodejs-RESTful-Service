const express = require('express');
const router = express.Router();
const dl = require('../dataContext');
const { isWeekday } = require('../utils');

// GET - Get a single employee
router.get('/employee', async (req, res) => {
    try {
        const { company, emp_id } = req.query;

        if (!company || !emp_id) {
            return res.json({ error: "Both company name and employee ID are required" });
        }

        const employee = await dl.getEmployee(parseInt(emp_id, 10));
        if (!employee) {
            return res.json({ error: "Employee not found" });
        }

        res.json({
            emp_id: employee.emp_id,
            emp_name: employee.emp_name,
            emp_no: employee.emp_no,
            hire_date: employee.hire_date,
            job: employee.job,
            salary: employee.salary,
            dept_id: employee.dept_id,
            mng_id: employee.mng_id
        });
    } catch (err) {
        res.json({ error: err.message });
    }
});

// GET - Get all employees for a company
router.get('/employees', async (req, res) => {
    try {
        const { company } = req.query;

        if (!company) {
            return res.json({ error: "Company name is required" });
        }

        const employees = await dl.getAllEmployee(company);
        if (!employees || employees.length === 0) {
            return res.json({ error: "No employees found" });
        }

        res.json(employees);
    } catch (err) {
        res.json({ error: err.message });
    }
});

// POST - Create new employee
router.post('/employee', async (req, res) => {
    try {
        const { company, emp_name, emp_no, hire_date, job, salary, dept_id, mng_id } = req.body;

        // Validate required fields
        if (!company || !emp_name || !emp_no || !hire_date || !job || !salary || !dept_id) {
            return res.json({ 
                error: "All required fields must be provided" 
            });
        }

        // Validate company is RIT username
        if (!company.match(/^[a-z]{2,3}\d{4}$/)) {
            return res.json({ error: "Company must be a valid RIT username" });
        }

        // Check if department exists
        const department = await dl.getDepartment(company, parseInt(dept_id, 10));
        if (!department) {
            return res.json({ error: "Department does not exist in your company" });
        }

        // Validate hire date format and rules
        const hireDate = new Date(hire_date);
        if (isNaN(hireDate)) {
            return res.json({ error: "Invalid hire date format" });
        }

        // Check if hire date is not future date
        if (hireDate > new Date()) {
            return res.json({ error: "Hire date cannot be in the future" });
        }

        // Check if hire date is a weekday
        if (!isWeekday(hireDate)) {
            return res.json({ error: "Hire date must be a weekday" });
        }

        // If manager ID provided, verify manager exists
        if (mng_id && mng_id !== "0") {
            const manager = await dl.getEmployee(parseInt(mng_id, 10));
            if (!manager) {
                return res.json({ error: "Manager does not exist" });
            }
        }

        // Create new employee
        const newEmployee = new dl.Employee(
            emp_name,
            emp_no,
            hire_date,
            job,
            parseFloat(salary),
            parseInt(dept_id, 10),
            parseInt(mng_id || 0, 10)
        );

        const result = await dl.insertEmployee(newEmployee);
        
        res.json({ 
            success: {
                emp_id: result.emp_id,
                emp_name: result.emp_name,
                emp_no: result.emp_no,
                hire_date: result.hire_date,
                job: result.job,
                salary: result.salary,
                dept_id: result.dept_id,
                mng_id: result.mng_id
            }
        });
    } catch (err) {
        // Handle duplicate employee number error
        if (err.code === 'ER_DUP_ENTRY') {
            return res.json({ error: "Employee number must be unique" });
        }
        res.json({ error: err.message });
    }
});

// PUT - Update employee
router.put('/employee', async (req, res) => {
    try {
        const { company, emp_id, emp_name, emp_no, hire_date, job, salary, dept_id, mng_id } = req.body;

        // Validate required fields
        if (!company || !emp_id) {
            return res.json({ error: "Company and employee ID are required" });
        }

        // Check if employee exists
        const existingEmployee = await dl.getEmployee(parseInt(emp_id, 10));
        if (!existingEmployee) {
            return res.json({ error: "Employee not found" });
        }

        // Validate company is RIT username
        if (!company.match(/^[a-z]{2,3}\d{4}$/)) {
            return res.json({ error: "Company must be a valid RIT username" });
        }

        // If department ID provided, check if it exists
        if (dept_id) {
            const department = await dl.getDepartment(company, parseInt(dept_id, 10));
            if (!department) {
                return res.json({ error: "Department does not exist in your company" });
            }
        }

        // If hire date provided, validate format and rules
        if (hire_date) {
            const hireDate = new Date(hire_date);
            if (isNaN(hireDate)) {
                return res.json({ error: "Invalid hire date format" });
            }

            if (hireDate > new Date()) {
                return res.json({ error: "Hire date cannot be in the future" });
            }

            if (!isWeekday(hireDate)) {
                return res.json({ error: "Hire date must be a weekday" });
            }
        }

        // If manager ID provided, verify manager exists
        if (mng_id && mng_id !== "0") {
            const manager = await dl.getEmployee(parseInt(mng_id, 10));
            if (!manager) {
                return res.json({ error: "Manager does not exist" });
            }
        }

        // Create updated employee object
        const updatedEmployee = new dl.Employee(
            emp_name || existingEmployee.emp_name,
            emp_no || existingEmployee.emp_no,
            hire_date || existingEmployee.hire_date,
            job || existingEmployee.job,
            parseFloat(salary || existingEmployee.salary),
            parseInt(dept_id || existingEmployee.dept_id, 10),
            parseInt(mng_id || existingEmployee.mng_id, 10)
        );
        updatedEmployee.emp_id = parseInt(emp_id, 10);

        const result = await dl.updateEmployee(updatedEmployee);

        res.json({ 
            success: {
                emp_id: result.emp_id,
                emp_name: result.emp_name,
                emp_no: result.emp_no,
                hire_date: result.hire_date,
                job: result.job,
                salary: result.salary,
                dept_id: result.dept_id,
                mng_id: result.mng_id
            }
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.json({ error: "Employee number must be unique" });
        }
        res.json({ error: err.message });
    }
});

// DELETE - Delete employee
router.delete('/employee', async (req, res) => {
    try {
        const { company, emp_id } = req.query;

        if (!company || !emp_id) {
            return res.json({ 
                error: "Both company name and employee ID are required" 
            });
        }

        // First check if employee exists
        const employee = await dl.getEmployee(parseInt(emp_id, 10));
        if (!employee) {
            return res.json({ error: "Employee not found" });
        }

        await dl.deleteEmployee(parseInt(emp_id, 10));
        
        res.json({ 
            success: `Employee ${emp_id} deleted.`
        });
    } catch (err) {
        res.json({ error: err.message });
    }
});

module.exports = router;