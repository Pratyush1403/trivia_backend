const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb+srv://pratyushsharma1404:pratyush@triviaquiz.l9hpazt.mongodb.net/?appName=triviaquiz", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindandModify: true
}).then(() => {
    console.log('connection successful');
}).catch((err) => console.log('no connection'));

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
  console.log('Signup request received');
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = new User({ email, password: hashedPassword });
    await user.save();
    console.log('User created successfully');
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('User creation failed:', error);
    res.status(400).json({ error: 'User creation failed' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login request received');
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ error: 'User not found' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Invalid credentials');
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, 'YOUR_SECRET_KEY', { expiresIn: '1h' });
    console.log('User logged in successfully');
    res.json({ token });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/questions', async (req, res) => {
  console.log('Fetching trivia questions');
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://opentdb.com/api.php?amount=10&type=multiple');
    const data = await response.json();
    console.log('Trivia questions fetched successfully');
    res.json(data.results);
  } catch (error) {
    console.error('Error fetching trivia questions:', error);
    res.status(500).json({ error: 'Failed to fetch trivia questions' });
  }
});

app.post('/api/submit-score', async (req, res) => {
  const { token, score } = req.body;
  console.log('Submit score request received');
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
    console.log('Score submitted successfully');
    res.json({ message: 'Score submitted successfully' });
  } catch (error) {
    console.error('Score submission failed:', error);
    res.status(500).json({ error: 'Score submission failed' });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  console.log('Fetching leaderboard');
  try {
    const users = await User.find().sort({ totalScore: -1 }).limit(10);
    console.log('Leaderboard fetched successfully');
    res.json(users);
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = app;
