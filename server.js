const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb+srv://pratyushsharma1404:pratyush@triviaquiz.l9hpazt.mongodb.net/?appName=triviaquiz', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use((req, res, next) => {
  console.log(`Received ${req.method} request to ${req.path}`);
  next();
});

// Routes
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

app.post('/api/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error creating user' });
  }
});

app.post('/api/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, 'HEHEHEHEHE', { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Error signing in' });
  }
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    console.log('No token provided'); // Add this line
    return res.sendStatus(401);
  }

  jwt.verify(token, 'HEHEHEHEHE', (err, user) => {
    if (err) {
      console.log('Token verification failed:', err); // Add this line
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

// Make sure this route is defined before the server starts
app.post('/api/score', authenticateToken, async (req, res) => {
  console.log('Received score update request'); // Add this line
  try {
    const userId = req.user.userId;
    const { score } = req.body;
    console.log('User ID:', userId, 'Score:', score); // Add this line
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.scores.push({ score, date: new Date() });
    await user.save();
    res.json({ message: 'Score saved successfully' });
  } catch (error) {
    console.error('Error saving score:', error);
    res.status(500).json({ error: 'Error saving score' });
  }
});

app.get('/api/profile/:userId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const recentScores = user.scores.slice(-10).reverse();
    res.json({ email: user.email, recentScores });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching profile' });
  }
});

app.get('/api/leaderboard', authenticateToken, async (req, res) => {
  try {
    const users = await User.find();
    const leaderboard = users.map(user => {
      const totalScore = user.scores.reduce((sum, score) => sum + score.score, 0);
      const averageScore = user.scores.length > 0 ? totalScore / user.scores.length : 0;
      return { email: user.email, averageScore };
    }).sort((a, b) => b.averageScore - a.averageScore);
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching leaderboard' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
