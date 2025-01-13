import { User, Store } from '../models/index.js';
import Evaluation from '../models/Evaluation.js';
import Template from '../models/Templates.js';
import Notification from '../models/Notification.js';

// Create new evaluation
export const createEvaluation = async (req, res) => {
    try {
        const {
            employeeIds,
            templateId,
            scheduledDate,
            overallComments,
            developmentPlan,
            sectionResults
        } = req.body;

        console.log('Create evaluation request:', {
            body: req.body,
            user: req.user,
            storeId: req.user.store._id
        });

        // Verify template belongs to store
        const template = await Template.findOne({
            _id: templateId,
            store: req.user.store._id,
            isActive: true
        });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // Verify all employees belong to same store
        const employees = await User.find({
            _id: { $in: employeeIds },
            store: req.user.store._id
        });

        console.log('Employees lookup:', {
            query: {
                _id: { $in: employeeIds },
                store: req.user.store._id
            },
            result: employees
        });

        if (employees.length !== employeeIds.length) {
            return res.status(404).json({ message: 'One or more employees not found' });
        }

        // Create an evaluation for each employee
        const evaluations = await Promise.all(employees.map(async (employee) => {
            const evaluation = new Evaluation({
                employee: employee._id,
                evaluator: req.user._id,
                store: req.user.store._id,
                template: templateId,
                scheduledDate,
                status: 'pending_self_evaluation',
                overallComments,
                developmentPlan,
                sectionResults
            });

            await evaluation.save();

            // Create notification for the employee
            await Notification.create({
                user: employee._id,
                store: req.user.store._id,
                type: 'evaluation',
                title: 'New Evaluation Assigned',
                message: `You have a new evaluation scheduled for ${new Date(scheduledDate).toLocaleDateString()}. Please complete your self-evaluation.`,
                relatedId: evaluation._id,
                relatedModel: 'Evaluation'
            });

            // Get all managers in the store (except the creator)
            const managers = await User.find({
                store: req.user.store._id,
                role: { $in: ['admin', 'evaluator'] },
                _id: { $ne: req.user._id }
            });

            // Create notifications for all managers
            await Promise.all(managers.map(manager => 
                Notification.create({
                    user: manager._id,
                    store: req.user.store._id,
                    type: 'evaluation',
                    title: 'New Evaluation Created',
                    message: `${req.user.name} scheduled an evaluation for ${employee.name} on ${new Date(scheduledDate).toLocaleDateString()}.`,
                    relatedId: evaluation._id,
                    relatedModel: 'Evaluation'
                })
            ));

            return evaluation;
        }));

        console.log('Created evaluations:', evaluations);

        res.status(201).json({ evaluations });

    } catch (error) {
        console.error('Create evaluation error:', error);
        res.status(500).json({ message: 'Error creating evaluation' });
    }
};

// Get all evaluations for store
export const getEvaluations = async (req, res) => {
    try {
        console.log('Getting evaluations for store:', {
            storeId: req.user.store._id,
            user: req.user
        });
        
        // If user is admin, get all evaluations for the store
        const query = req.user.role === 'admin' 
            ? { store: req.user.store._id }
            : { 
                store: req.user.store._id,
                $or: [
                    { employee: req.user._id },
                    { evaluator: req.user._id }
                ]
            };

        console.log('Query:', query);
        
        const evaluations = await Evaluation.find(query)
            .populate('employee', 'name position')
            .populate('evaluator', 'name')
            .populate('template', 'name')
            .sort('-createdAt');

        console.log('Found evaluations:', evaluations);
        res.json({ evaluations });

    } catch (error) {
        console.error('Get evaluations error:', error);
        res.status(500).json({ message: 'Error getting evaluations' });
    }
};

// Get specific evaluation
export const getEvaluation = async (req, res) => {
    try {
        console.log('Get evaluation request:', {
            evaluationId: req.params.evaluationId,
            userId: req.user._id,
            userRole: req.user.role,
            storeId: req.user.store._id
        });

        const evaluation = await Evaluation.findOne({
            _id: req.params.evaluationId,
            store: req.user.store._id
        })
        .populate('employee', 'name position')
        .populate('evaluator', 'name')
        .populate({
            path: 'template',
            select: 'name description sections',
            populate: {
                path: 'sections',
                select: 'title description criteria order',
                populate: {
                    path: 'criteria',
                    select: 'name description ratingScale required'
                }
            }
        });

        console.log('Raw evaluation:', JSON.stringify(evaluation, null, 2));

        if (!evaluation) {
            console.log('Evaluation not found');
            return res.status(404).json({ message: 'Evaluation not found' });
        }

        // Update legacy 'pending' status to new workflow status
        if (evaluation.status === 'pending') {
            evaluation.status = 'pending_self_evaluation';
            await evaluation.save();
        }

        // Transform template data to match client expectations
        const transformedEvaluation = {
            ...evaluation.toObject(),
            template: {
                ...evaluation.template,
                sections: evaluation.template.sections.map(section => ({
                    title: section.title,
                    description: section.description,
                    order: section.order,
                    questions: section.criteria.map(criterion => ({
                        id: criterion._id.toString(),
                        text: criterion.name,
                        description: criterion.description,
                        type: criterion.ratingScale === 'yes-no' ? 'boolean' : 'rating',
                        required: criterion.required
                    }))
                }))
            }
        };

        console.log('Transformed evaluation:', JSON.stringify(transformedEvaluation, null, 2));

        // Check if user has access
        const isAdmin = req.user.role === 'admin';
        const isEmployee = evaluation.employee._id.toString() === req.user._id.toString();
        const isEvaluator = evaluation.evaluator._id.toString() === req.user._id.toString();

        if (!isAdmin && !isEmployee && !isEvaluator) {
            console.log('Access denied:', {
                isAdmin,
                isEmployee,
                isEvaluator,
                userId: req.user._id,
                employeeId: evaluation.employee._id,
                evaluatorId: evaluation.evaluator._id
            });
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json({ evaluation: transformedEvaluation });
    } catch (error) {
        console.error('Get evaluation error:', error);
        res.status(500).json({ message: 'Error retrieving evaluation' });
    }
};

// Update evaluation
export const updateEvaluation = async (req, res) => {
    try {
        const {
            overallComments,
            developmentPlan,
            sectionResults,
            scheduledDate
        } = req.body;

        const evaluation = await Evaluation.findOne({
            _id: req.params.evaluationId,
            store: req.user.storeId,
            status: 'draft'
        });

        if (!evaluation) {
            return res.status(404).json({ message: 'Draft evaluation not found' });
        }

        // Update fields
        evaluation.overallComments = overallComments;
        evaluation.developmentPlan = developmentPlan;
        evaluation.sectionResults = sectionResults;
        evaluation.scheduledDate = scheduledDate;

        await evaluation.save();

        res.json({ evaluation });

    } catch (error) {
        console.error('Update evaluation error:', error);
        res.status(500).json({ message: 'Error updating evaluation' });
    }
};

// Delete evaluation
export const deleteEvaluation = async (req, res) => {
    try {
        const evaluation = await Evaluation.findOneAndDelete({
            _id: req.params.evaluationId,
            store: req.user.store._id
        });

        if (!evaluation) {
            return res.status(404).json({ message: 'Evaluation not found' });
        }

        res.json({ message: 'Evaluation deleted successfully' });

    } catch (error) {
        console.error('Delete evaluation error:', error);
        res.status(500).json({ message: 'Error deleting evaluation' });
    }
};

// Get employee's evaluations
export const getEmployeeEvaluations = async (req, res) => {
    try {
        // Check if user has access to employee's evaluations
        if (
            req.user.role === 'evaluator' && 
            req.params.employeeId !== req.user.userId
        ) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const evaluations = await Evaluation.find({
            employee: req.params.employeeId,
            store: req.user.storeId
        })
        .populate('evaluator', 'name email')
        .populate('template', 'name')
        .sort('-createdAt');

        res.json({ evaluations });

    } catch (error) {
        console.error('Get employee evaluations error:', error);
        res.status(500).json({ message: 'Error getting employee evaluations' });
    }
};

// Submit evaluation
export const submitEvaluation = async (req, res) => {
    try {
        const evaluation = await Evaluation.findOne({
            _id: req.params.evaluationId,
            store: req.user.storeId,
            status: 'draft'
        });

        if (!evaluation) {
            return res.status(404).json({ message: 'Draft evaluation not found' });
        }

        evaluation.status = 'submitted';
        evaluation.submittedAt = new Date();
        evaluation.completedDate = new Date();

        await evaluation.save();

        // Here you could add notification logic for the employee

        res.json({ evaluation });

    } catch (error) {
        console.error('Submit evaluation error:', error);
        res.status(500).json({ message: 'Error submitting evaluation' });
    }
};

// Submit self-evaluation
export const submitSelfEvaluation = async (req, res) => {
    try {
        const { selfEvaluation } = req.body;

        const evaluation = await Evaluation.findOne({
            _id: req.params.evaluationId,
            employee: req.user._id,
            store: req.user.store._id,
            status: 'pending_self_evaluation'
        }).populate('evaluator', 'name _id');

        if (!evaluation) {
            return res.status(404).json({ message: 'Evaluation not found or not in self-evaluation state' });
        }

        evaluation.selfEvaluation = selfEvaluation;
        evaluation.status = 'pending_manager_review';
        await evaluation.save();

        // Create notification for the evaluator
        await Notification.create({
            user: evaluation.evaluator._id,
            store: req.user.store._id,
            type: 'evaluation',
            title: 'Self-Evaluation Submitted',
            message: `${req.user.name} has submitted their self-evaluation. Please review and schedule a review session.`,
            relatedId: evaluation._id,
            relatedModel: 'Evaluation'
        });

        res.json({ evaluation });
    } catch (error) {
        console.error('Submit self-evaluation error:', error);
        res.status(500).json({ message: 'Error submitting self-evaluation' });
    }
};

// Schedule review session
export const scheduleReviewSession = async (req, res) => {
    try {
        const { reviewSessionDate } = req.body;

        const evaluation = await Evaluation.findOne({
            _id: req.params.evaluationId,
            evaluator: req.user._id,
            store: req.user.store._id,
            status: 'pending_manager_review'
        }).populate('employee', 'name _id');

        if (!evaluation) {
            return res.status(404).json({ message: 'Evaluation not found or not ready for review' });
        }

        evaluation.reviewSessionDate = reviewSessionDate;
        evaluation.status = 'in_review_session';
        await evaluation.save();

        // Create notification for the employee
        await Notification.create({
            user: evaluation.employee._id,
            store: req.user.store._id,
            type: 'evaluation',
            title: 'Review Session Scheduled',
            message: `Your evaluation review session has been scheduled for ${new Date(reviewSessionDate).toLocaleDateString()}.`,
            relatedId: evaluation._id,
            relatedModel: 'Evaluation'
        });

        res.json({ evaluation });
    } catch (error) {
        console.error('Schedule review session error:', error);
        res.status(500).json({ message: 'Error scheduling review session' });
    }
};

// Complete manager evaluation
export const completeManagerEvaluation = async (req, res) => {
    try {
        const { managerEvaluation, overallComments, developmentPlan } = req.body;

        const evaluation = await Evaluation.findOne({
            _id: req.params.evaluationId,
            evaluator: req.user._id,
            store: req.user.store._id,
            status: 'in_review_session'
        }).populate('employee', 'name _id');

        if (!evaluation) {
            return res.status(404).json({ message: 'Evaluation not found or not in review session' });
        }

        evaluation.managerEvaluation = managerEvaluation;
        evaluation.overallComments = overallComments;
        evaluation.developmentPlan = developmentPlan;
        evaluation.status = 'completed';
        evaluation.completedDate = new Date();
        await evaluation.save();

        // Create notification for the employee
        await Notification.create({
            user: evaluation.employee._id,
            store: req.user.store._id,
            type: 'evaluation',
            title: 'Evaluation Completed',
            message: `Your evaluation has been completed. Please review and acknowledge the results.`,
            relatedId: evaluation._id,
            relatedModel: 'Evaluation'
        });

        res.json({ evaluation });
    } catch (error) {
        console.error('Complete manager evaluation error:', error);
        res.status(500).json({ message: 'Error completing evaluation' });
    }
};

// Acknowledge evaluation
export const acknowledgeEvaluation = async (req, res) => {
    try {
        const evaluation = await Evaluation.findOne({
            _id: req.params.evaluationId,
            employee: req.user._id,
            store: req.user.store._id,
            status: 'completed'
        });

        if (!evaluation) {
            return res.status(404).json({ message: 'Completed evaluation not found' });
        }

        evaluation.acknowledgement = {
            acknowledged: true,
            date: new Date()
        };
        await evaluation.save();

        res.json({ evaluation });
    } catch (error) {
        console.error('Acknowledge evaluation error:', error);
        res.status(500).json({ message: 'Error acknowledging evaluation' });
    }
};