// server/src/models/Template.js
import mongoose from 'mongoose';

const criterionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    gradingScale: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GradingScale'
    },
    required: {
        type: Boolean,
        default: true
    }
});

const sectionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    criteria: [criterionSchema],
    order: {
        type: Number,
        required: true
    }
});

const templateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    sections: [sectionSchema],
    tags: [{
        type: String,
        enum: ['FOH', 'BOH', 'Leadership', 'General'],
        default: ['General']
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

templateSchema.index({ store: 1, isActive: 1 });
templateSchema.index({ store: 1, updatedAt: -1 });

// Check if the model is already registered to prevent OverwriteModelError
const Template = mongoose.models.Template || mongoose.model('Template', templateSchema);

export default Template;