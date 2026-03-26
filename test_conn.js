const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, 'backend/.env') });

const mongoUri = process.env.MONGODB_URI;

console.log('Testing connection to:', mongoUri ? mongoUri.split('@')[1] : 'UNDEFINED');

if (!mongoUri) {
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => {
    console.log('Successfully connected to MongoDB!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Connection failed:', err.message);
    process.exit(1);
  });
