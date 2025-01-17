import Template from '../models/Templates.js';
import { User } from '../models/index.js';
import GradingScale from '../models/GradingScale.js';

// Get templates
export const getTemplates = async (req, res) => {
    try {
        const { store, role } = req.user;
        
        if (!store || !store._id) {
            return res.status(400).json({ 
                message: 'No store assigned to user. Please contact your administrator.' 
            });
        }

        const { status = 'all' } = req.query;

        console.log('Get templates request:', { 
            userId: req.user._id, 
            storeId: store._id, 
            status 
        });

        // Build query
        const query = { store: store._id };
        if (status !== 'all') {
            query.isActive = status === 'active';
        }

        console.log('Template query:', query);

        const templates = await Template.find(query)
            .populate('createdBy', 'name')
            .sort('-updatedAt');

        res.json({
            templates: templates.map(template => ({
                id: template._id,
                name: template.name,
                description: template.description,
                isActive: template.isActive,
                createdBy: template.createdBy?.name || 'Unknown',
                createdAt: template.createdAt,
                updatedAt: template.updatedAt,
                sectionsCount: template.sections?.length || 0,
                criteriaCount: template.sections?.reduce((acc, section) => 
                    acc + (section.criteria?.length || 0), 0
                ) || 0
            }))
        });

    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({ 
            message: 'Error fetching templates',
            error: error.message,
            details: error.stack
        });
    }
};

// Get single template
export const getTemplate = async (req, res) => {
    try {
        const template = await Template.findOne({
            _id: req.params.id,
            store: req.user.store
        }).populate('createdBy', 'name');

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        res.json({ template });

    } catch (error) {
        console.error('Get template error:', error);
        res.status(500).json({ 
            message: 'Error fetching template',
            error: error.message 
        });
    }
};

// Create template
export const createTemplate = async (req, res) => {
    try {
        const { name, description, sections } = req.body;

        // Validate sections and criteria
        if (!sections || !Array.isArray(sections)) {
            return res.status(400).json({ message: 'Invalid sections data' });
        }

        // Get default grading scale
        const defaultScale = await GradingScale.findOne({ 
            store: req.user.store,
            isDefault: true,
            isActive: true
        });

        if (!defaultScale) {
            return res.status(400).json({ message: 'No default grading scale found' });
        }

        // Process sections and ensure grading scale references are valid
        const processedSections = sections.map(section => ({
            ...section,
            criteria: section.criteria.map(criterion => ({
                ...criterion,
                gradingScale: criterion.gradingScale || defaultScale._id
            }))
        }));

        const template = new Template({
            name,
            description,
            sections: processedSections,
            store: req.user.store,
            createdBy: req.user._id
        });

        await template.save();

        res.status(201).json({ 
            template: {
                id: template._id,
                name: template.name,
                description: template.description,
                isActive: template.isActive,
                sectionsCount: template.sections.length
            }
        });

    } catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({ 
            message: 'Error creating template',
            error: error.message 
        });
    }
};

// Update template
export const updateTemplate = async (req, res) => {
    try {
        const { name, description, sections } = req.body;

        // Validate sections and criteria
        if (!sections || !Array.isArray(sections)) {
            return res.status(400).json({ message: 'Invalid sections data' });
        }

        // Get default grading scale
        const defaultScale = await GradingScale.findOne({ 
            store: req.user.store,
            isDefault: true,
            isActive: true
        });

        if (!defaultScale) {
            return res.status(400).json({ message: 'No default grading scale found' });
        }

        // Process sections and ensure grading scale references are valid
        const processedSections = sections.map(section => ({
            ...section,
            criteria: section.criteria.map(criterion => ({
                ...criterion,
                gradingScale: criterion.gradingScale || defaultScale._id
            }))
        }));

        const template = await Template.findOneAndUpdate(
            {
                _id: req.params.id,
                store: req.user.store
            },
            { 
                $set: {
                    name,
                    description,
                    sections: processedSections
                }
            },
            { new: true, runValidators: true }
        );

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        res.json({ template });

    } catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({ 
            message: 'Error updating template',
            error: error.message 
        });
    }
};

// Delete template
export const deleteTemplate = async (req, res) => {
    try {
        const template = await Template.findOneAndDelete({
            _id: req.params.id,
            store: req.user.store
        });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        res.json({ message: 'Template deleted successfully' });

    } catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({ 
            message: 'Error deleting template',
            error: error.message 
        });
    }
};

// Duplicate template
export const duplicateTemplate = async (req, res) => {
    try {
        const sourceTemplate = await Template.findOne({
            _id: req.params.id,
            store: req.user.store
        });

        if (!sourceTemplate) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // Create a new template with the same data
        const duplicatedTemplate = new Template({
            name: `${sourceTemplate.name} (Copy)`,
            description: sourceTemplate.description,
            sections: sourceTemplate.sections,
            store: req.user.store,
            createdBy: req.user._id,
            isActive: true
        });

        await duplicatedTemplate.save();

        res.status(201).json({ 
            template: {
                id: duplicatedTemplate._id,
                name: duplicatedTemplate.name,
                description: duplicatedTemplate.description,
                isActive: duplicatedTemplate.isActive,
                sectionsCount: duplicatedTemplate.sections.length
            }
        });

    } catch (error) {
        console.error('Duplicate template error:', error);
        res.status(500).json({ 
            message: 'Error duplicating template',
            error: error.message 
        });
    }
};