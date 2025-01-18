import { spawn } from 'child_process';
import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';

export async function POST(req: NextRequest) {
  try {
    const { audio } = await req.json();

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio, 'base64');

    // Create a promise to handle the conversion
    const convertToWav = () =>
      new Promise<Buffer>((resolve, reject) => {
        // Create input stream from buffer
        const inputStream = new Readable();
        inputStream.push(audioBuffer);
        inputStream.push(null);

        // Create buffer to store output
        const chunks: Buffer[] = [];

        // Spawn FFmpeg process
        const ffmpeg = spawn('ffmpeg', [
          '-i',
          'pipe:0', // Input from pipe
          '-f',
          'wav', // Output format
          '-acodec',
          'pcm_s16le', // Audio codec
          '-ar',
          '16000', // Sample rate
          '-ac',
          '1', // Mono audio
          'pipe:1', // Output to pipe
        ]);

        // Pipe input
        inputStream.pipe(ffmpeg.stdin);

        // Collect output
        ffmpeg.stdout.on('data', (chunk) => chunks.push(Buffer.from(chunk)));

        // Handle completion
        ffmpeg.on('close', (code) => {
          if (code === 0) {
            resolve(Buffer.concat(chunks));
          } else {
            reject(new Error(`FFmpeg process exited with code ${code}`));
          }
        });

        // Handle errors
        ffmpeg.stderr.on('data', (data) => console.error(`FFmpeg stderr: ${data}`));
        ffmpeg.on('error', reject);
      });

    // Convert the audio
    const wavBuffer = await convertToWav();

    // Convert back to base64
    const wavBase64 = wavBuffer.toString('base64');

    return NextResponse.json({ wavBase64 });
  } catch (error) {
    console.error('Error converting audio:', error);
    return NextResponse.json({ error: 'Failed to convert audio' }, { status: 500 });
  }
}
