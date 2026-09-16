// Opens and closes the single Mongoose connection shared by the whole server.
import mongoose from 'mongoose';

export async function connectDb(uri: string): Promise<void> {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
