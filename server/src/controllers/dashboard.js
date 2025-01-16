import { User, Evaluation, Template, Disciplinary } from '../models/index.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
    try {
        const { store } = req.user;

        // Get counts
        const pendingEvaluations = await Evaluation.countDocuments({ 
            store, 
            status: { 
                $in: ['pending_self_evaluation', 'pending_manager_review', 'in_review_session'] 
            }
        });
        
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
        const openDisciplinaryIncidents = await Disciplinary.countDocuments({
            $or: [
                { store },
                { store: { $exists: false }, createdBy: req.user._id }
            ],
            status: { $in: ['Open', 'In Progress'] }
        });
        console.log('Open disciplinary incidents:', openDisciplinaryIncidents);

        const resolvedDisciplinaryThisMonth = await Disciplinary.countDocuments({
            $or: [
                { store },
                { store: { $exists: false }, createdBy: req.user._id }
            ],
            status: 'Resolved',
            date: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) }
        });
        console.log('Resolved disciplinary incidents this month:', resolvedDisciplinaryThisMonth);
        
        const totalEmployees = await User.countDocuments({ 
            store,
            status: 'active'  // Only count active employees
        });
        
        // Use our existing Template model
        const activeTemplates = await Template.countDocuments({ 
            store, 
            isActive: true  // Note: our model uses isActive, not active
        });

        // Get upcoming evaluations
        const upcomingEvaluations = await Evaluation.find({
            store,
            $or: [
                { employee: req.user._id },  // User is the employee
                { evaluator: req.user._id }  // User is the evaluator
            ],
            notificationViewed: {
                $not: {
                    $elemMatch: {
                        user: req.user._id
                    }
                }
            },
            status: { 
                $in: ['pending_self_evaluation', 'pending_manager_review', 'in_review_session'] 
            },
            scheduledDate: { $gte: new Date() }
        })
        .populate('employee', 'name')
        .populate('template', 'name')
        .sort({ scheduledDate: 1 })
        .limit(5);

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
            upcomingEvaluations: upcomingEvaluations.map(evaluation => ({
                _id: evaluation._id,
                employeeName: evaluation.employee?.name || 'Unknown Employee',
                templateName: evaluation.template?.name || 'No Template',
                scheduledDate: evaluation.scheduledDate
            })),
            recentActivity: recentActivity.map(activity => ({
                id: activity._id,
                type: activity.status,
                description: `${activity.evaluator?.name || 'Unknown'} ${activity.status} evaluation for ${activity.employee?.name || 'Unknown Employee'}`,
                date: activity.updatedAt
            }))
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ 
            message: 'Error fetching dashboard statistics',
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
        console.log('Team member dashboard - req.user:', {
            userId: req.user.userId,
            _id: req.user._id,
            role: req.user.role
        });

        const user = await User.findById(req.user._id)
            .populate('store', 'name')
            .select('-password');

        console.log('Team member dashboard - found user:', user ? {
            _id: user._id,
            name: user.name,
            role: user.role
        } : 'No user found');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get recent evaluations (last 3)
        const recentEvaluations = user.evaluations
            ? user.evaluations
                .sort((a, b) => b.date - a.date)
                .slice(0, 3)
                .map(evaluation => ({
                    id: evaluation._id,
                    type: evaluation.type,
                    date: evaluation.date,
                    score: evaluation.score
                }))
            : [];

        // Get active goals
        const activeGoals = user.development
            ? user.development
                .filter(goal => goal.status !== 'completed')
                .map(goal => ({
                    id: goal._id,
                    name: goal.goal,
                    progress: goal.progress
                }))
            : [];

        // Get recent achievements (last 3)
        const recentAchievements = user.recognition
            ? user.recognition
                .sort((a, b) => b.date - a.date)
                .slice(0, 3)
                .map(achievement => ({
                    id: achievement._id,
                    title: achievement.title,
                    date: achievement.date
                }))
            : [];

        // Calculate current performance (average of last 3 evaluations)
        const currentPerformance = user.evaluations && user.evaluations.length > 0
            ? Math.round(
                user.evaluations
                    .sort((a, b) => b.date - a.date)
                    .slice(0, 3)
                    .reduce((sum, evaluation) => sum + evaluation.score, 0) / 
                Math.min(user.evaluations.length, 3)
            )
            : 0;

        // Get next scheduled evaluation
        const nextEvaluation = "Coming soon"; // You'll need to implement this based on your scheduling logic

        // Get training data
        const training = []; // You'll need to implement this based on your training model

        const dashboardData = {
            name: user.name,
            position: user.position,
            department: user.department,
            currentPerformance,
            nextEvaluation,
            activeGoals: activeGoals.length,
            recentEvaluations,
            goals: activeGoals,
            achievements: recentAchievements,
            training
        };

        console.log('Team member dashboard - sending data:', dashboardData);
        res.json(dashboardData);
    } catch (error) {
        console.error('Error getting team member dashboard:', error);
        res.status(500).json({ 
            message: 'Error getting team member dashboard',
            error: error.message 
        });
    }
};