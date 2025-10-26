// backend/controllers/callbackController.js

exports.handleCallback = (req, res) => {
  try {
    console.log('📩 Headers:', req.headers);
    console.log('📩 Raw callback body:', req.body);
    
    const json = req.body;
    console.log('📩 Raw callback body:', json);

    if (!json?.Body?.stkCallback) {
      console.error('❌ Missing stkCallback in request body', json);
      return res.status(400).json({ message: 'Invalid callback body' });
    }

    const callback = json.Body.stkCallback;
    console.log('✅ stkCallback received:', callback);

    res.status(200).json({ message: 'Callback received successfully' });
  } catch (error) {
    console.error('❌ Error handling callback:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};


