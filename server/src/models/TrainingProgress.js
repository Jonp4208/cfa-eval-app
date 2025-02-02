import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const moduleProgressSchema = new Schema({
    moduleId: { 
        type: Schema.Types.ObjectId, 
        required: true 
    },
    completed: { type: Boolean, default: false },
    completionPercentage: { 
        type: Number, 
        min: 0, 
        max: 100, 
        default: 0 
    },
    completedBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
    },
    completedAt: Date,
    notes: String
});

const trainingProgressSchema = new Schema({
    trainee: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    trainingPlan: { 
        type: Schema.Types.ObjectId, 
        ref: 'TrainingPlan', 
        required: true 
    },
    startDate: { type: Date, required: true },
    assignedTrainer: { 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
    },
    status: { 
        type: String, 
        enum: ['IN_PROGRESS', 'COMPLETED', 'ON_HOLD'], 
        default: 'IN_PROGRESS' 
    },
    moduleProgress: [moduleProgressSchema],
    store: {
        type: Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    }
}, {
    timestamps: true
});

export default mongoose.model('TrainingProgress', trainingProgressSchema); 