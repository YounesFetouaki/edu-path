require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = 8000;

// Routes
// AuthService
app.use('/auth', createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || 'http://localhost:3005',
    changeOrigin: true
}));

// LMSConnector
app.use('/lms', createProxyMiddleware({
    target: process.env.LMS_SERVICE_URL || 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: {
        '^/lms': '/api/lms', // rewrite path
    },
}));

// StudentCoach Backend (Python)
app.use('/student', createProxyMiddleware({
    target: process.env.STUDENT_COACH_URL || 'http://localhost:5000',
    changeOrigin: true,
    pathRewrite: {
        '^/student': '', // rewrite path
    },
}));

// Profile Service (Python)
app.use('/profiler', createProxyMiddleware({
    target: process.env.PROFILER_URL || 'http://localhost:5001',
    changeOrigin: true,
    pathRewrite: {
        '^/profiler': '', // rewrite path
    },
}));

// Path Predictor (Python)
app.use('/predictor', createProxyMiddleware({
    target: process.env.PREDICTOR_URL || 'http://localhost:5002',
    changeOrigin: true
}));

// RecoBuilder (Python)
app.use('/reco', createProxyMiddleware({
    target: process.env.RECO_URL || 'http://localhost:5003',
    changeOrigin: true
}));

app.get('/', (req, res) => {
    res.send('EduPath-MS API Gateway Running');
});

app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
