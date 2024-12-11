const express = require('express');
const router = express.Router();
const dl = require('../dataContext');
const { isWeekday, isValidTimeRange } = require('../utils');

// GET - Get a single timecard
router.get('/timecard', async (req, res) => {
    try {
        const { company, timecard_id } = req.query;

        if (!company || !timecard_id) {
            return res.json({ error: "Both company and timecard ID are required" });
        }

        const timecard = await dl.getTimecard(parseInt(timecard_id, 10));
        if (!timecard) {
            return res.json({ error: "Timecard not found" });
        }

        res.json({
            timecard: {
                timecard_id: timecard.timecard_id,
                start_time: timecard.start_time,
                end_time: timecard.end_time,
                emp_id: timecard.emp_id
            }
        });
    } catch (err) {
        res.json({ error: err.message });
    }
});

// GET - Get all timecards for an employee
router.get('/timecards', async (req, res) => {
    try {
        const { company, emp_id } = req.query;

        if (!company || !emp_id) {
            return res.json({ error: "Both company and employee ID are required" });
        }

        const timecards = await dl.getAllTimecard(parseInt(emp_id, 10));
        if (!timecards || timecards.length === 0) {
            return res.json({ error: "No timecards found" });
        }

        res.json(timecards);
    } catch (err) {
        res.json({ error: err.message });
    }
});

// POST - Create new timecard
router.post('/timecard', async (req, res) => {
    try {
        const { company, emp_id, start_time, end_time } = req.body;

        // Validate required fields
        if (!company || !emp_id || !start_time || !end_time) {
            return res.json({ error: "All fields are required" });
        }

        // Validate company is RIT ID
        if (!company.match(/^[a-z]{2,3}\d{4}$/)) {
            return res.json({ error: "Company must be a valid RIT username" });
        }

        // Validate employee exists
        const employee = await dl.getEmployee(parseInt(emp_id, 10));
        if (!employee) {
            return res.json({ error: "Employee does not exist" });
        }

        // Parse dates
        const startDate = new Date(start_time);
        const endDate = new Date(end_time);

        // Validate date formats
        if (isNaN(startDate) || isNaN(endDate)) {
            return res.json({ error: "Invalid date format" });
        }

        // Validate start time is weekday
        if (!isWeekday(startDate)) {
            return res.json({ error: "Start time must be on a weekday" });
        }

        // Validate end time is weekday
        if (!isWeekday(endDate)) {
            return res.json({ error: "End time must be on a weekday" });
        }

        // Validate time range (8:00-18:00)
        if (!isValidTimeRange(startDate) || !isValidTimeRange(endDate)) {
            return res.json({ error: "Time must be between 08:00:00 and 18:00:00" });
        }

        // Validate minimum duration
        const hourDiff = (endDate - startDate) / (1000 * 60 * 60);
        if (hourDiff < 1) {
            return res.json({ error: "End time must be at least 1 hour after start time" });
        }

        // Validate same day
        if (startDate.toDateString() !== endDate.toDateString()) {
            return res.json({ error: "Start time and end time must be on the same day" });
        }

        // Check for existing timecard on same day
        const existingTimecards = await dl.getAllTimecard(parseInt(emp_id, 10));
        const hasExistingTimecard = existingTimecards.some(tc => {
            const existingDate = new Date(tc.start_time).toDateString();
            return existingDate === startDate.toDateString();
        });

        if (hasExistingTimecard) {
            return res.json({ error: "Employee already has a timecard for this date" });
        }

        // Create new timecard
        const newTimecard = new dl.Timecard(start_time, end_time, parseInt(emp_id, 10));
        const result = await dl.insertTimecard(newTimecard);

        res.json({
            success: {
                timecard_id: result.timecard_id,
                start_time: result.start_time,
                end_time: result.end_time,
                emp_id: result.emp_id
            }
        });
    } catch (err) {
        res.json({ error: err.message });
    }
});

// PUT - Update timecard
router.put('/timecard', async (req, res) => {
    try {
        const { company, timecard_id, start_time, end_time, emp_id } = req.body;

        // Validate required fields
        if (!company || !timecard_id) {
            return res.json({ error: "Company and timecard ID are required" });
        }

        // Validate timecard exists
        const existingTimecard = await dl.getTimecard(parseInt(timecard_id, 10));
        if (!existingTimecard) {
            return res.json({ error: "Timecard not found" });
        }

        // All the same validations as POST
        const startDate = new Date(start_time || existingTimecard.start_time);
        const endDate = new Date(end_time || existingTimecard.end_time);

        if (!isWeekday(startDate) || !isWeekday(endDate)) {
            return res.json({ error: "Times must be on weekdays" });
        }

        if (!isValidTimeRange(startDate) || !isValidTimeRange(endDate)) {
            return res.json({ error: "Times must be between 08:00:00 and 18:00:00" });
        }

        const hourDiff = (endDate - startDate) / (1000 * 60 * 60);
        if (hourDiff < 1) {
            return res.json({ error: "End time must be at least 1 hour after start time" });
        }

        if (startDate.toDateString() !== endDate.toDateString()) {
            return res.json({ error: "Start time and end time must be on the same day" });
        }

        // Update timecard
        const updatedTimecard = new dl.Timecard(
            start_time || existingTimecard.start_time,
            end_time || existingTimecard.end_time,
            parseInt(emp_id || existingTimecard.emp_id, 10)
        );
        updatedTimecard.timecard_id = parseInt(timecard_id, 10);

        const result = await dl.updateTimecard(updatedTimecard);

        res.json({
            success: {
                timecard_id: result.timecard_id,
                start_time: result.start_time,
                end_time: result.end_time,
                emp_id: result.emp_id
            }
        });
    } catch (err) {
        res.json({ error: err.message });
    }
});

// DELETE - Delete timecard
router.delete('/timecard', async (req, res) => {
    try {
        const { company, timecard_id } = req.query;

        if (!company || !timecard_id) {
            return res.json({ error: "Both company and timecard ID are required" });
        }

        // Verify timecard exists
        const timecard = await dl.getTimecard(parseInt(timecard_id, 10));
        if (!timecard) {
            return res.json({ error: "Timecard not found" });
        }

        await dl.deleteTimecard(parseInt(timecard_id, 10));

        res.json({
            success: `Timecard ${timecard_id} deleted.`
        });
    } catch (err) {
        res.json({ error: err.message });
    }
});

module.exports = router;