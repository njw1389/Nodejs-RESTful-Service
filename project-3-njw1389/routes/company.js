const express = require('express');
const router = express.Router();
const dl = require('../dataContext');

// Delete company and all related records
router.delete('/company', async (req, res) => {
    try {
        const company = req.query.company;
        if (!company) {
            return res.json({ "error": "Company name is required" });
        }

        await dl.deleteCompany(company);

        res.json({ "success": `${company}'s information deleted.` });
    } catch (err) {
        res.json({ "error": err.message });
    }
});

module.exports = router;