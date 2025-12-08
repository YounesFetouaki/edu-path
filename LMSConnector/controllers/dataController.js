const fakerService = require('../services/fakerService');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

exports.generate = async (req, res) => {
    try {
        const result = await fakerService.generateData();
        res.json({ success: true, ...result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Generation failed' });
    }
};

exports.initSchema = async (req, res) => {
    try {
        const sql = fs.readFileSync(path.join(__dirname, '../schema.sql')).toString();
        await db.query(sql);
        res.json({ success: true, message: 'Schema initialized' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Schema init failed' });
    }
};
