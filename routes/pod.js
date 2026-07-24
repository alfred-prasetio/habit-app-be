const express = require('express');
const crypto = require('crypto');
const Pod = require('../models/pod');
const Goal = require('../models/goal');
const { requireAuth } = require('../middleware/auth');
const redis = require('../config/redis');

const router = express.Router();
router.use(requireAuth);

const CACHE_TTL_SECONDS = 15;

router.get('/', async (req, res) => {
  try {
    const pods = await Pod.find({ memberIds: req.userId }).select('name inviteCode memberIds');
    res.json(pods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const inviteCode = crypto.randomBytes(4).toString('hex');
    const pod = await Pod.create({ name, inviteCode, memberIds: [req.userId] });
    res.status(201).json(pod);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/join', async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const pod = await Pod.findOne({ inviteCode });
    if (!pod) return res.status(404).json({ error: 'Invalid invite code' });

    if (!pod.memberIds.includes(req.userId)) {
      pod.memberIds.push(req.userId);
      await pod.save();
    }
    res.json(pod);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const cacheKey = `pod:${req.params.id}`;

    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const { pod, goals } = JSON.parse(cached);
        const isMember = pod.memberIds.some((m) => m._id === req.userId);
        if (!isMember) return res.status(403).json({ error: 'Not a member of this pod' });
        return res.json({ pod, goals, fromCache: true });
      }
    }

    const pod = await Pod.findById(req.params.id).populate('memberIds', 'email');
    if (!pod) return res.status(404).json({ error: 'Pod not found' });

    const isMember = pod.memberIds.some((m) => m._id.toString() === req.userId);
    if (!isMember) return res.status(403).json({ error: 'Not a member of this pod' });

    const memberIds = pod.memberIds.map((m) => m._id);
    const goals = await Goal.find({ userId: { $in: memberIds } });

    if (redis) {
      await redis.set(cacheKey, JSON.stringify({ pod, goals }), 'EX', CACHE_TTL_SECONDS);
    }

    res.json({ pod, goals, fromCache: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;