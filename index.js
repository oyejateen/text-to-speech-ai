const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/audio', express.static('audio'));


app.post('/tts', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required in the request body' });
  }

  const API_KEY = process.env.api;
  const VOICE_ID = process.env.voice;

  const options = {
    method: 'POST',
    url: `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    headers: {
      accept: 'audio/mpeg',
      'content-type': 'application/json',
      'xi-api-key': API_KEY,
    },
    data: {
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
      },
    },
    responseType: 'arraybuffer',
  };

  try {
    const audioDetails = await axios.request(options);

    const filename = `${uuidv4()}.mp3`;
    const directoryPath = '/tmp/audio';

    // Create the "audio" directory if it doesn't already exist
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath);
    }

    const filePath = path.join(directoryPath, filename);
    fs.writeFileSync(filePath, audioDetails.data);

    // Send the audio file URL to the client or do further processing here
    const fileUrl = `${process.env.url}/tmp/audio/${filename}`;
    console.log(fileUrl);
    res.json({ audioFile: fileUrl });

    // Clean up: Delete the audio file after a certain time
    setTimeout(() => {
      fs.unlinkSync(filePath);
    }, 10000);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
