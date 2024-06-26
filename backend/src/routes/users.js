// routes/users.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

const jwtSecret = 'your_jwt_secret_key';

// Register
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const user = new User({ name, email, password, role });
    await user.save();
    res.status(201).send({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).send({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send('User not found');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).send('Invalid credentials');

    const token = jwt.sign({ userId: user._id, role: user.role }, jwtSecret);
    res.send({ token });
  } catch (error) {
    res.status(500).send('Login failed');
  }
});

// Protected Route
router.get('/dashboard', async (req, res) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).send('Access denied');

  try {
    const verified = jwt.verify(token, jwtSecret);
    const user = await User.findById(verified.userId).select('-password');
    res.send(user);
  } catch (error) {
    res.status(400).send('Invalid token');
  }
});

// Middleware to verify if user is admin
const verifyAdmin = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).send('Access denied');

  try {
    const verified = jwt.verify(token, jwtSecret);
    if (verified.role !== 'admin') return res.status(403).send('Access denied');
    next();
  } catch (error) {
    res.status(400).send('Invalid token');
  }
};

// Example of an admin route
router.get('/admin', verifyAdmin, (req, res) => {
  res.send('Admin content');
});

module.exports = router;
