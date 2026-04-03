import { AssemblyAI } from 'assemblyai';
import fs from 'fs';
import path from 'path';
import os from 'os';

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
});

export const transcribeAudio = async (audioBuffer, originalName) => {
  const extension = path.extname(originalName) || '.webm';
  const tempFile = path.join(os.tmpdir(), `audio_${Date.now()}${extension}`);

  try {
    fs.writeFileSync(tempFile, audioBuffer);

    const transcript = await client.transcripts.transcribe({
      audio: tempFile,
    });

    if (transcript.status === 'error') {
      throw new Error(`Transcription failed: ${transcript.error}`);
    }

    return transcript.text || '';
  } catch (error) {
    console.error('AssemblyAI Transcription Error:', error.message);
    throw new Error('Speech-to-text service failed. Please try again.');
  } finally {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
};
