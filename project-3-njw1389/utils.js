// Helper functions
function isWeekday(date) {
    // Get UTC day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const day = date.getUTCDay();
    // Return true if day is Monday through Friday (1-5)
    return day >= 1 && day <= 5;
}

const isValidTimeRange = (date) => {
    const hours = date.getHours();
    return hours >= 8 && hours <= 18;
};

module.exports = {
    isWeekday,
    isValidTimeRange
};