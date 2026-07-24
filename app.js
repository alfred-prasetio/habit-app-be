require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const { connectDB } = require('./config/db');
const authRoutes = require('./routes/auth');
const goalRoutes = require('./routes/goal');
const checkInRoutes = require('./routes/CheckIn');
const podRoutes = require('./routes/pod');

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'https://habit-app-fe.vercel.app'],
}));
app.use(bodyParser.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRoutes);
app.use('/goals', goalRoutes);
app.use('/check-ins', checkInRoutes);
app.use('/pods', podRoutes);

const port = process.env.PORT || 3000;

// Connect to the DB once, before accepting traffic - not per-request like the serverless version.
connectDB().then(() => {
  app.listen(port, () => console.log(`Server running on port ${port}`));
});