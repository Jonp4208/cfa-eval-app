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
    description: { type: String },
    department: { 
        type: String, 
        enum: ['FOH', 'BOH'], 
        required: true 
    },
    estimatedDuration: { type: String, required: true },
    dayNumber: { type: Number, required: true },
    materials: [trainingMaterialSchema],
    requiredForNewHire: { type: Boolean, default: false },
    competencyChecklist: [{ type: String }]
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

// Add pre-remove hook to handle cascade deletion
trainingPlanSchema.pre('remove', async function(next) {
    try {
        // Import TrainingProgress model here to avoid circular dependency
        const TrainingProgress = mongoose.model('TrainingProgress');
        
        // Delete all training progress records associated with this plan
        await TrainingProgress.deleteMany({ trainingPlan: this._id });
        
        next();
    } catch (error) {
        next(error);
    }
});

// Add middleware to handle findOneAndDelete
trainingPlanSchema.pre('findOneAndDelete', async function(next) {
    try {
        // Get the document that's about to be deleted
        const doc = await this.model.findOne(this.getQuery());
        if (doc) {
            const TrainingProgress = mongoose.model('TrainingProgress');
            await TrainingProgress.deleteMany({ trainingPlan: doc._id });
        }
        next();
    } catch (error) {
        next(error);
    }
});

export default mongoose.model('TrainingPlan', trainingPlanSchema);