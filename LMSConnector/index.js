const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'LMSConnector Service is running' });
});

// Import generator routes
const dataRoutes = require('./routes/dataRoutes');
const lmsRoutes = require('./routes/lmsRoutes');

app.use('/api/data', dataRoutes);
app.use('/api/lms', lmsRoutes);

app.listen(PORT, () => {
    console.log(`LMSConnector listening on port ${PORT}`);
});
