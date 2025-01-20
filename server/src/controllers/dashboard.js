import { Settings, Store, User, Evaluation, Template, Disciplinary, Notification } from '../models/index.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
    try {
        const { store, role, isAdmin } = req.user;

        // Get notifications for the user
        const notifications = await Notification.find({
            user: req.user._id,
            read: false
        }).lean();

        // Create a map of evaluation IDs to notification IDs
        const notificationMap = notifications.reduce((acc, notification) => {
            if (notification.evaluationId) {
                acc[notification.evaluationId.toString()] = notification._id;
            }
            return acc;
        }, {});

        // Get counts
        console.log('Getting pending evaluations for user:', req.user._id);
        console.log('User role:', req.user.role);
        console.log('User store:', store);
        
        // Build query based on user role
        let evaluationQuery = { 
            store,
            status: { $ne: 'completed' },  // Count all non-completed evaluations
            deleted: { $ne: true }  // Ensure we're not counting deleted evaluations
        };

        // If not admin/manager, only show own evaluations
        if (!isAdmin && !['manager', 'evaluator'].includes(role)) {
            evaluationQuery.$or = [
                { employee: req.user._id },
                { evaluator: req.user._id }
            ];
        }
        
        // Debug query to see all matching evaluations
        const matchingEvaluations = await Evaluation.find(evaluationQuery)
            .populate('employee', 'name')
            .populate('evaluator', 'name');
        
        console.log('Matching evaluations:', matchingEvaluations.map(e => ({
            id: e._id,
            employee: e.employee?.name,
            evaluator: e.evaluator?.name,
            status: e.status
        })));

        const pendingEvaluations = await Evaluation.countDocuments(evaluationQuery);

        console.log('Pending evaluations count:', pendingEvaluations);
        
        // Get the start of the current quarter
        const now = new Date();
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
        
        const completedEvaluations = await Evaluation.countDocuments({ 
            store, 
            status: 'completed',
            completedDate: { $gte: startOfQuarter }
        });

        // Get completed evaluations in last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const completedReviewsLast30Days = await Evaluation.countDocuments({
            store,
            status: 'completed',
            completedDate: { $gte: thirtyDaysAgo }
        });

        // Get disciplinary stats
        console.log('Querying disciplinary incidents for store:', store);
        
        // Build query based on user role
        let disciplinaryQuery = { store };
        
        // If user is not an admin/manager/evaluator, only show their own incidents
        if (!isAdmin && !['manager', 'evaluator'].includes(role)) {
            disciplinaryQuery.employee = req.user._id;
        }

        const openDisciplinaryIncidents = await Disciplinary.countDocuments({
            ...disciplinaryQuery,
            status: { $ne: 'Resolved' }
        });

        // Count resolved incidents this month
        const resolvedDisciplinaryThisMonth = await Disciplinary.countDocuments({
            ...disciplinaryQuery,
            status: 'Resolved',
            date: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) }
        });

        // Get recent disciplinary incidents
        const recentDisciplinaryIncidents = await Disciplinary.find(disciplinaryQuery)
            .populate('employee', 'name')
            .populate('supervisor', 'name')
            .sort('-date')
            .limit(5);

        console.log('Open disciplinary incidents count:', openDisciplinaryIncidents);

        const totalEmployees = await User.countDocuments({ 
            store,
            status: 'active'  // Only count active employees
        });
        
        // Use our existing Template model
        const activeTemplates = await Template.countDocuments({ 
            store, 
            isActive: true  // Note: our model uses isActive, not active
        });

        // Get upcoming evaluations for next 7 days
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        // Build query for upcoming evaluations based on role
        let evaluationQueryUpcoming = {
            store,
            scheduledDate: { $gte: now, $lte: sevenDaysFromNow },
            status: { $ne: 'completed' }
        };

        // If not admin/manager/evaluator, only show own evaluations
        if (!isAdmin && !['manager', 'evaluator'].includes(role)) {
            evaluationQueryUpcoming.employee = req.user._id;
        }

        // Get upcoming evaluations with notifications
        const upcomingEvaluations = await Evaluation.find(evaluationQueryUpcoming)
            .populate('employee', 'name')
            .populate('evaluator', 'name')
            .populate('template', 'name')
            .lean();

        // Create notifications for evaluations that don't have one
        const notificationsToCreate = [];
        const evaluationsWithNotifications = await Promise.all(upcomingEvaluations.map(async (evaluation) => {
            // Check if notification exists
            let notification = await Notification.findOne({
                evaluationId: evaluation._id,
                user: req.user._id,
                read: false
            });

            // If no notification exists, create one
            if (!notification) {
                notification = new Notification({
                    user: req.user._id,
                    store: req.user.store._id,
                    type: 'evaluation',
                    priority: 'high',
                    title: 'Upcoming Evaluation',
                    message: `You have an evaluation scheduled for ${new Date(evaluation.scheduledDate).toLocaleDateString()}`,
                    evaluationId: evaluation._id
                });
                notificationsToCreate.push(notification);
            }

            return {
                ...evaluation,
                notificationId: notification._id
            };
        }));

        // Save all new notifications in bulk
        if (notificationsToCreate.length > 0) {
            await Notification.insertMany(notificationsToCreate);
        }

        // Get recent activity
        const recentActivity = await Evaluation.find({
            store,
            updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
        .populate('employee', 'name')
        .populate('evaluator', 'name')
        .sort({ updatedAt: -1 })
        .limit(10);

        res.json({
            pendingEvaluations,
            completedEvaluations,
            completedReviewsLast30Days,
            totalEmployees,
            activeTemplates,
            openDisciplinaryIncidents,
            resolvedDisciplinaryThisMonth,
            upcomingEvaluations: evaluationsWithNotifications,
            recentActivity: recentActivity.map(activity => ({
                id: activity._id,
                type: activity.status,
                description: `${activity.evaluator?.name || 'Unknown'} ${activity.status} evaluation for ${activity.employee?.name || 'Unknown Employee'}`,
                date: activity.updatedAt
            })),
            disciplinary: {
                active: openDisciplinaryIncidents,
                recent: recentDisciplinaryIncidents.map(incident => ({
                    id: incident._id,
                    name: incident.employee?.name || 'Unknown Employee',
                    type: incident.type,
                    severity: incident.severity,
                    date: incident.date
                }))
            }
        });

    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({ 
            message: 'Error getting dashboard stats',
            error: error.message 
        });
    }
};

// Get recent activity
export const getRecentActivity = async (req, res) => {
    try {
        const storeId = req.user.storeId;
        const activity = await getActivityLogs(storeId);
        res.json({ activity });
    } catch (error) {
        console.error('Recent activity error:', error);
        res.status(500).json({ message: 'Error fetching recent activity' });
    }
};

// Helper function to get activity logs
const getActivityLogs = async (storeId) => {
    // Get recent evaluations
    const recentEvaluations = await Evaluation.find({
        store: storeId,
        updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    })
    .populate('employee', 'name')
    .populate('evaluator', 'name')
    .sort('-updatedAt')
    .limit(10);

    // Get recent template changes
    const recentTemplates = await Template.find({
        store: storeId,
        updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
    .populate('createdBy', 'name')
    .sort('-updatedAt')
    .limit(5);

    // Combine and format activity
    const activity = [
        ...recentEvaluations.map(evaluation => ({
            id: evaluation._id.toString(),
            type: 'Evaluation',
            description: `${evaluation.evaluator.name} ${evaluation.status === 'draft' ? 'started' : evaluation.status} evaluation for ${evaluation.employee.name}`,
            date: evaluation.updatedAt
        })),
        ...recentTemplates.map(template => ({
            id: template._id.toString(),
            type: 'Template',
            description: `${template.createdBy.name} ${template.createdAt === template.updatedAt ? 'created' : 'updated'} template "${template.name}"`,
            date: template.updatedAt
        }))
    ];

    // Sort by date
    return activity.sort((a, b) => b.date - a.date).slice(0, 10);
};

// Get team member dashboard data
export const getTeamMemberDashboard = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate({
                path: 'evaluations',
                match: { deleted: { $ne: true } },
                select: 'scheduledDate completedDate template status evaluator createdAt acknowledged deleted store',
                populate: [
                    { path: 'template', select: 'name' },
                    { path: 'evaluator', select: 'name position' },
                    { path: 'store', select: 'name storeNumber' }
                ]
            })
            .populate('store', 'name storeNumber location')
            .populate('evaluator', 'name')
            .populate('manager', 'name')
            .select('name position departments positionType status evaluations development recognition');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Add more detailed debug logging
        console.log('User evaluations raw:', user.evaluations);
        console.log('Finding next evaluation for user:', user._id);
        
        // Find next evaluation
        const nextEvaluation = await Evaluation.findOne({
            employee: user._id,
            deleted: { $ne: true },
            status: { $ne: 'completed' },
            scheduledDate: { $exists: true }
        })
        .sort({ scheduledDate: 1 })
        .select('scheduledDate status template evaluator')
        .populate('template', 'name')
        .populate('evaluator', 'name')
        .lean();

        console.log('Next evaluation found:', nextEvaluation);

        // Add debug logging
        console.log('All evaluations:', user.evaluations?.map(e => ({
            id: e._id,
            status: e.status,
            deleted: e.deleted,
            scheduledDate: e.scheduledDate
        })));

        console.log('Finding last completed evaluation for user:', user._id);
        // Find last completed evaluation with a separate query
        const lastCompletedEvaluation = await Evaluation.findOne({
            employee: user._id,
            deleted: { $ne: true },
            status: 'completed',
            completedDate: { $exists: true }
        })
        .sort({ completedDate: -1 })
        .select('completedDate')
        .lean();
        
        console.log('Last completed evaluation found:', lastCompletedEvaluation);

        // Get completed evaluations count (excluding deleted)
        const completedEvaluations = user.evaluations?.filter(e => e.status === 'completed' && !e.deleted) || [];
        const completedCount = completedEvaluations.length;

        // Calculate current performance from completed evaluations
        let currentPerformance = null;
        if (completedCount > 0) {
            currentPerformance = Math.round(
                completedEvaluations
                    .slice(0, 3)
                    .reduce((sum, evaluation) => sum + (evaluation.score || 0), 0) / 
                Math.min(completedCount, 3)
            );
        }

        // Get active development goals
        const activeGoals = user.development
            ? user.development
                .filter(goal => goal.status !== 'completed')
                .map(goal => ({
                    id: goal._id.toString(),
                    name: goal.goal,
                    progress: goal.progress || 0,
                    targetDate: goal.targetDate
                }))
            : [];

        // Get recent achievements/recognition
        const recentAchievements = user.recognition
            ? user.recognition
                .sort((a, b) => b.date - a.date)
                .slice(0, 3)
                .map(achievement => ({
                    id: achievement._id.toString(),
                    title: achievement.title,
                    date: achievement.date
                }))
            : [];

        const dashboardData = {
            name: user.name,
            position: user.position || 'Team Member',
            departments: user.departments || ['General'],
            store: {
                name: user.store?.name,
                number: user.store?.storeNumber,
                location: user.store?.location
            },
            currentPerformance,
            nextEvaluation: nextEvaluation ? {
                date: nextEvaluation.scheduledDate || nextEvaluation.createdAt,
                templateName: nextEvaluation.template?.name || 'General Evaluation',
                status: nextEvaluation.status,
                evaluator: nextEvaluation.evaluator?.name,
                id: nextEvaluation._id,
                acknowledged: nextEvaluation.acknowledged || false,
                lastEvaluationDate: lastCompletedEvaluation?.completedDate || null
            } : {
                date: null,
                templateName: 'Not Scheduled',
                status: 'not_scheduled',
                evaluator: null,
                id: null,
                acknowledged: false,
                lastEvaluationDate: lastCompletedEvaluation?.completedDate || null
            },
            evaluator: user.evaluator?.name,
            manager: user.manager?.name,
            activeGoals: activeGoals.length,
            goals: activeGoals,
            achievements: recentAchievements,
            recentEvaluations: completedEvaluations
                .slice(0, 3)
                .map(evaluation => ({
                    date: evaluation.date,
                    score: evaluation.score,
                    template: evaluation.template?.name,
                    evaluator: evaluation.evaluator?.name
                }))
        };

        res.json(dashboardData);
    } catch (error) {
        console.error('Error getting team member dashboard:', error);
        res.status(500).json({ 
            message: 'Error getting team member dashboard',
            error: error.message 
        });
    }
};