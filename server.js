const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://pratyushsharma1404:<password>@triviaquiz.l9hpazt.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  scores: [{ score: Number, date: Date }],
  perfectScores: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
});

const User = mongoose.model('User', userSchema);

app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(400).json({ error: 'User creation failed' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, 'YOUR_SECRET_KEY', { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/questions', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://opentdb.com/api.php?amount=10&type=multiple');
    const data = await response.json();
    res.json(data.results);
  } catch (error) {
    console.error('Error fetching trivia questions:', error);
    res.status(500).json({ error: 'Failed to fetch trivia questions' });
  }
});

// Submit score
app.post('/api/submit-score', async (req, res) => {
  const { token, score } = req.body;
  try {
    const decoded = jwt.verify(token, 'YOUR_SECRET_KEY');
    const user = await User.findById(decoded.userId);
    user.scores.push({ score, date: new Date() });
    user.totalScore += score;
    if (score === 10) {
      user.perfectScores += 1;
    }
    if (user.scores.length > 10) {
      user.scores.shift();
    }
    await user.save();
    res.json({ message: 'Score submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Score submission failed' });
  }
});

// Leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const users = await User.find().sort({ totalScore: -1 }).limit(10);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = app;
