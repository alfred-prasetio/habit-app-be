const express = require('express');
const CheckIn = require('../models/CheckIn');
const Goal = require('../models/Goal');
const Pod = require('../models/Pod');
const { requireAuth } = require('../middleware/auth');
const redis = require('../config/redis');

const router = express.Router();
router.use(requireAuth);

function todayInTimezone(timezone) {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
}

function yesterdayOf(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

router.post('/:goalId/check-in', async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.goalId, userId: req.userId });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    const timezone = req.body.timezone || 'UTC';
    const today = todayInTimezone(timezone);

    await CheckIn.create({ goalId: goal._id, userId: req.userId, date: today });

    const wasYesterday = goal.lastCheckInDate === yesterdayOf(today);
    goal.currentStreak = wasYesterday ? goal.currentStreak + 1 : 1;
    goal.longestStreak = Math.max(goal.longestStreak, goal.currentStreak);
    goal.lastCheckInDate = today;
    await goal.save();

    if (redis) {
      const pods = await Pod.find({ memberIds: req.userId }).select('_id');
      await Promise.all(pods.map((p) => redis.del(`pod:${p._id}`)));
    }

    res.status(201).json({ goal });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Already checked in today' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.get('/:goalId/history', async (req, res) => {
  try {
    const checkIns = await CheckIn.find({ goalId: req.params.goalId, userId: req.userId })
      .sort({ date: 1 })
      .select('date -_id');
    res.json(checkIns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;