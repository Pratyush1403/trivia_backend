const express = require('express');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors());

// Dynamic import for node-fetch
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
