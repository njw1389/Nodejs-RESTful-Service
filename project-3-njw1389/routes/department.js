const express = require('express');
const router = express.Router();
const dl = require('../dataContext');

// Route: GET /department - Fetch a single department by ID
router.get('/department', async (req, res) => {
    const { company, dept_id } = req.query;

    if (!company || !dept_id) {
        return res.json({ error: "Both company name and department ID are required." });
    }

    try {
        const department = await dl.getDepartment(company, parseInt(dept_id, 10));
        if (!department) {
            return res.json({ error: "Department not found." });
        }
        res.json(department);
    } catch (err) {
        res.json({ error: err.message });
    }
});

// Route: GET /departments - Fetch all departments for a company
router.get('/departments', async (req, res) => {
    const { company } = req.query;

    if (!company) {
        return res.json({ error: "Company name is required." });
    }

    try {
        const departments = await dl.getAllDepartment(company);
        if (!departments || departments.length === 0) {
            return res.json({ error: "No departments found." });
        }
        res.json(departments);
    } catch (err) {
        res.json({ error: err.message });
    }
});

// POST - Create new department
router.post('/department', async (req, res) => {
    try {
        const { company, dept_name, dept_no, location } = req.body;
        
        // Validate required fields
        if (!company || !dept_name || !dept_no || !location) {
            return res.json({ 
                error: "All fields (company, dept_name, dept_no, location) are required." 
            });
        }

        const newDepartment = new dl.Department(company, dept_name, dept_no, location);
        const result = await dl.insertDepartment(newDepartment);
        
        // Make sure we have a valid result
        if (!result) {
            return res.json({ error: "Failed to create department" });
        }

        res.json({ 
            success: {
                company: result.company,
                dept_id: result.dept_id,
                dept_name: result.dept_name,
                dept_no: result.dept_no,
                location: result.location
            }
        });
    } catch (err) {
        // Handle duplicate entry errors specifically
        if (err.code === 'ER_DUP_ENTRY') {
            return res.json({ error: "Department number must be unique" });
        }
        res.json({ error: err.message });
    }
});

// PUT - Update department
router.put('/department', async (req, res) => {
    try {
        const { company, dept_id, dept_name, dept_no, location } = req.body;

        // Validate required fields
        if (!company) {
            return res.json({ error: "Company name is required" });
        }
        
        if (!dept_id) {
            return res.json({ error: "Department ID is required" });
        }

        const updatedDepartment = new dl.Department(company, dept_name, dept_no, location);
        updatedDepartment.dept_id = parseInt(dept_id, 10);
        
        const result = await dl.updateDepartment(updatedDepartment);
        
        if (!result) {
            return res.json({ error: "Department not found" });
        }

        res.json({ 
            success: {
                company: result.company,
                dept_id: result.dept_id,
                dept_name: result.dept_name,
                dept_no: result.dept_no,
                location: result.location
            }
        });
    } catch (err) {
        res.json({ error: err.message });
    }
});

// DELETE - Delete department
router.delete('/department', async (req, res) => {
    try {
        const { company, dept_id } = req.query;

        if (!company || !dept_id) {
            return res.json({ 
                error: "Both company name and department ID are required" 
            });
        }

        const result = await dl.deleteDepartment(company, parseInt(dept_id, 10));
        
        if (result === 0) {
            return res.json({ error: "No matching department found to delete" });
        }

        res.json({ 
            success: `Department ${dept_id} from ${company} deleted.`
        });
    } catch (err) {
        res.json({ error: err.message });
    }
});

module.exports = router;