// filepath: /Users/dad/entrerexitprofit_1/routes/userRoutes.js
const express = require('express');
const router = express.Router();

// Example route
router.get('/', (req, res) => {
    res.send('User routes are working!');
});

module.exports = router;