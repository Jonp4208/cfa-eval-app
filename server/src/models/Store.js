import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema({
  storeNumber: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Store = mongoose.model('Store', storeSchema);
export default Store;