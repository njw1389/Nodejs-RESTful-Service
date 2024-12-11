const DataLayer = require("./companydata");
let dl;
try {
    dl = new DataLayer("njw1389");
} catch (err) {
    console.error('Failed to initialize DataLayer:', err);
    process.exit(1);
}

module.exports = dl;