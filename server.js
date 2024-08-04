const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://pratyushsharma1404:pratyush@triviaquiz.l9hpazt.mongodb.net/triviaquiz?retryWrites=true&w=majority";

// Connect to MongoDB
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
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
  console.log('Signup request received with email:', email);

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists');
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = new User({ email, password });
    await user.save();
    console.log('User created successfully');
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('User creation failed:', error);
    res.status(500).json({ error: 'User creation failed' });
  }
});

app.post('/api/login', async (req, res) => {
  

  try {
    const { email, password } = req.body;
    console.log('Login request received');
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const user = await User.findOne({ email, password }).select("-password");
    if (user) {
      console.log('Login successful');
      return res.status(200).json(user);
    } else {
      console.log('No user found');
      return res.status(401).json({ error: "Invalid credentials" });
    }
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
  const { email, password, score } = req.body;
  console.log('Submit score request received');

  try {
    const user = await User.findOne({ email, password });
    if (user) {
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
    } else {
      console.log('No user found');
      res.status(401).json({ error: "Invalid credentials" });
    }
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
