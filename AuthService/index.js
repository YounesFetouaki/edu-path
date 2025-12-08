require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3005;
const SECRET_KEY = process.env.JWT_SECRET || 'secret_key_123';

// Mock DB for MVP
const users = [
    { id: 1, email: 'admin@edupath.com', password: 'admin', role: 'ADMIN' },
    { id: 2, email: 'teacher@edupath.com', password: 'password', role: 'TEACHER' },
    { id: 3, email: 'student@edupath.com', password: 'password', role: 'STUDENT' }
];

app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password); // Plaintext for MVP demo

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
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

app.listen(PORT, () => console.log(`AuthService running on port ${PORT}`));
