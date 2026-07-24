require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const serverless = require('serverless-http');

const { connectDB } = require('./config/db');
const authRoutes = require('./routes/auth');
const goalRoutes = require('./routes/goal');
const checkInRoutes = require('./routes/CheckIn');
const podRoutes = require('./routes/pod');

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'https://habit-app-fe-ten.vercel.app/login'],
}));
app.use(bodyParser.json());

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRoutes);
app.use('/goals', goalRoutes);
app.use('/check-ins', checkInRoutes);
app.use('/pods', podRoutes);


if (process.env.VERCEL) {
  module.exports = serverless(app);
} else {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
}