const express = require('express');
const router = express.Router();
const Message = require('../models/message'); // Assuming you have a message model

// Route to handle new forum messages
router.post('/forum/message', async (req, res) => {
  try {
    const { username, content } = req.body;
    const newMessage = new Message({ username, content });
    await newMessage.save();
    res.status(201).json({ message: 'Message posted successfully!' });
  } catch (error) {
    console.error('Error posting message:', error);
    res.status(500).json({ message: 'Error posting message.' });
  }
});

// Route to get all forum messages
router.get('/forum/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: -1 }); // Assuming you have a timestamp field
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages.' });
  }
});

module.exports = router;