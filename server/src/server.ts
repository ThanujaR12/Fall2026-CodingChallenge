// Entry point: connect to MongoDB, make sure the stand-in owner exists, then start listening.
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDb } from './db/connect.js';
import { ensureStandInUser } from './services/userService.js';

async function start() {
  try {
    await connectDb(env.MONGODB_URI);
  } catch (err) {
    console.error('Could not connect to MongoDB. Check MONGODB_URI and Atlas Network Access.');
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  await ensureStandInUser();

  createApp().listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });
}

void start();
