require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { Pool } = require('pg');

// GLOBAL ERROR HANDLERS
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
    console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
});

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3005;
const SECRET_KEY = process.env.JWT_SECRET || 'secret_key_123';

// DB Config
const pool = new Pool({
    user: process.env.POSTGRES_USER || 'admin',
    host: process.env.DB_HOST || 'postgres',
    database: process.env.POSTGRES_DB || 'edupath_db',
    password: process.env.POSTGRES_PASSWORD || 'adminpassword',
    port: process.env.DB_PORT || 5432,
});

pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    console.log('Connected to Database');
    release();
});

app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    // Support login by email OR username
    // Note: In real app, hash password. Here comparison is plaintext for "password" users but hash for others?
    // Seed script used 'password' (plaintext string) for password_hash column or mock bcrypt?
    // Seed script: `password = 'password'` and inserted directly.
    // So for now, we assume plaintext storage for MVP/test data. 
    // If future production, use bcrypt.compare(password, user.password_hash)

    try {
        const query = 'SELECT * FROM users WHERE (email = $1 OR username = $1) AND password_hash = $2';
        const values = [email, password];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Use user.id, role, etc.
        const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, email: user.email, role: user.role, username: user.username } });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/auth/verify', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).send('Access Denied');

    try {
        const verified = jwt.verify(token, SECRET_KEY);
        res.json(verified);
    } catch (err) {
        res.status(400).send('Invalid Token');
    }
});

// Initialize Consul
let consul;
try {
    consul = require('consul')({
        host: 'consul',
        port: 8500,
    });
} catch (e) {
    console.error('FAILED TO INITIALIZE CONSUL CLIENT:', e);
}

app.listen(PORT, () => {
    console.log(`AuthService running on port ${PORT}`);

    if (consul) {
        const serviceId = `auth-service-${PORT}`;
        const consulService = {
            name: 'auth-service',
            address: 'auth-service',
            port: PORT,
            id: serviceId,
            check: {
                http: `http://auth-service:${PORT}/auth/verify`,
                interval: '10s',
                timeout: '5s',
            }
        };

        setTimeout(() => {
            try {
                consul.agent.service.register(consulService, err => {
                    if (err) {
                        console.error('Consul registration failed:', err);
                        return;
                    }
                    console.log('Registered with Consul');
                });
            } catch (e) {
                console.error('Failed to register with Consul (sync error):', e);
            }
        }, 5000);
    }
});
