const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'admin',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'edupath_db',
    password: process.env.DB_PASSWORD || 'adminpassword',
    port: process.env.DB_PORT || 5433,
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};
