require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const goalRoutes = require('./routes/goal');
const checkInRoutes = require('./routes/CheckIn');
const podRoutes = require('./routes/pod');

const mongoURI = process.env.MONGODB_URI;
const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:5173',
}));
app.use(bodyParser.json());

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err));

app.use('/auth', authRoutes);
app.use('/goals', goalRoutes);
app.use('/check-ins', checkInRoutes);
app.use('/pods', podRoutes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});