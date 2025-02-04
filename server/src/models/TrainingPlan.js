import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const trainingMaterialSchema = new Schema({
    title: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['DOCUMENT', 'VIDEO', 'PATHWAY_LINK'], 
        required: true 
    },
    url: { type: String, required: true },
    category: { type: String, required: true }
});

const trainingModuleSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    department: { 
        type: String, 
        enum: ['FOH', 'BOH'], 
        required: true 
    },
    estimatedDuration: { type: String, required: true },
    dayNumber: { type: Number, required: true },
    materials: [trainingMaterialSchema],
    requiredForNewHire: { type: Boolean, default: false }
});

const trainingPlanSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    type: { 
        type: String, 
        enum: ['NEW_HIRE', 'REGULAR'], 
        required: true 
    },
    department: { 
        type: String, 
        enum: ['FOH', 'BOH'], 
        required: true 
    },
    numberOfDays: { type: Number, required: true },
    modules: [trainingModuleSchema],
    includesCoreValues: { type: Boolean, default: false },
    includesBrandStandards: { type: Boolean, default: false },
    isTemplate: { type: Boolean, default: false },
    createdBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    store: {
        type: Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    }
}, {
    timestamps: true
});

export default mongoose.model('TrainingPlan', trainingPlanSchema); 