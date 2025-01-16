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
  storeAddress: {
    type: String,
    required: true
  },
  storePhone: {
    type: String
  },
  storeEmail: {
    type: String
  },
  visionStatement: {
    type: String,
    default: ''
  },
  missionStatement: {
    type: String,
    default: ''
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