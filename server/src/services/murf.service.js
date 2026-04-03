import axios from 'axios';

const MURF_BASE_URL = 'https://global.api.murf.ai/v1/speech/stream';
const MURF_VOICE_ID = 'en-US-natalie';
const MURF_LOCALE = 'en-US';

export const streamAudio = async (text, res) => {
  try {
    const payload = {
      text: `[pause 1s] ${text}`,
      voiceId: MURF_VOICE_ID,
      model: 'FALCON',
      multiNativeLocale: MURF_LOCALE,
    };

    const response = await axios.post(MURF_BASE_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.MURF_API_KEY,
      },
      responseType: 'stream',
    });

    response.data.pipe(res);

    response.data.on('error', (error) => {
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Audio generation failed' });
      }
      console.error('Murf Stream Error:', error);
    });
  } catch (error) {
    console.error('Murf Service Error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Text-to-speech service failed' });
    }
  }
};

export const generateAudio = async (text) => {
  try {
    const payload = {
      text: `[pause 1s] ${text}`,
      voiceId: MURF_VOICE_ID,
      model: 'FALCON',
      multiNativeLocale: MURF_LOCALE,
    };

    const response = await axios.post(MURF_BASE_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.MURF_API_KEY,
      },
      responseType: 'arraybuffer',
    });

    const audioBase64 = Buffer.from(response.data).toString('base64');
    return audioBase64;
  } catch (error) {
    console.error('Murf Audio Generation Error:', error.message);
    return null;
  }
};
