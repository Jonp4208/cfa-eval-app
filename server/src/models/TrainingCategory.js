import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const trainingCategorySchema = new Schema({
    name: { type: String, required: true },
    department: { 
        type: String, 
        enum: ['FOH', 'BOH'], 
        required: true 
    },
    description: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    store: {
        type: Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    }
}, {
    timestamps: true
});

export default mongoose.model('TrainingCategory', trainingCategorySchema); 