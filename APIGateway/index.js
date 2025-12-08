require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = 8000;

// Routes
// AuthService
app.use('/auth', createProxyMiddleware({ target: 'http://localhost:3005', changeOrigin: true }));

// LMSConnector
app.use('/lms', createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: {
        '^/lms': '/api/lms', // rewrite path
    },
}));

// StudentCoach Backend (Python)
app.use('/student', createProxyMiddleware({ target: 'http://localhost:5000', changeOrigin: true }));

// Profile Service (Python)
app.use('/profiler', createProxyMiddleware({ target: 'http://localhost:5001', changeOrigin: true }));

// Path Predictor (Python)
app.use('/predictor', createProxyMiddleware({ target: 'http://localhost:5002', changeOrigin: true }));

// RecoBuilder (Python)
app.use('/reco', createProxyMiddleware({ target: 'http://localhost:5003', changeOrigin: true }));

app.get('/', (req, res) => {
    res.send('EduPath-MS API Gateway Running');
});

app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
