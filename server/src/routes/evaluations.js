import express from 'express';
import {
    createEvaluation,
    getEvaluations,
    getEvaluation,
    updateEvaluation,
    deleteEvaluation,
    getEmployeeEvaluations,
    submitSelfEvaluation,
    scheduleReviewSession,
    completeManagerEvaluation,
    acknowledgeEvaluation,
    markNotificationViewed,
    saveDraft,
    sendCompletedEvaluationEmail,
    sendUnacknowledgedNotification,
    startReview
} from '../controllers/evaluations.js';
import { auth } from '../middleware/auth.js';
import { isManager } from '../middleware/roles.js';

const router = express.Router();

// Evaluation routes
router.post('/', auth, isManager, createEvaluation);
router.get('/', auth, getEvaluations);
router.get('/:evaluationId', auth, getEvaluation);
router.put('/:evaluationId', auth, isManager, updateEvaluation);
router.delete('/:evaluationId', auth, isManager, deleteEvaluation);

// Employee specific routes
router.get('/employee/:employeeId', auth, getEmployeeEvaluations);

// Evaluation workflow routes
router.post('/:evaluationId/self-evaluation', auth, submitSelfEvaluation);
router.post('/:evaluationId/schedule-review', auth, isManager, scheduleReviewSession);
router.post('/:evaluationId/start-review', auth, isManager, startReview);
router.post('/:evaluationId/save-draft', auth, isManager, saveDraft);
router.post('/:evaluationId/complete', auth, isManager, completeManagerEvaluation);
router.post('/:evaluationId/acknowledge', auth, acknowledgeEvaluation);

// Mark notification as viewed
router.post('/:evaluationId/mark-viewed', auth, markNotificationViewed);

// Send completed evaluation email
router.post('/:evaluationId/send-email', auth, sendCompletedEvaluationEmail);

// Add this with the other routes
router.post('/:evaluationId/notify-unacknowledged', auth, sendUnacknowledgedNotification);

export default router;