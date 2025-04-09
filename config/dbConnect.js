import mongoose from 'mongoose';
import { MONGODB_URI } from './config.js';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('Could not connect to MongoDB', err));
