// server/src/routes/templates.js
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { 
    getTemplates, 
    getTemplate, 
    createTemplate, 
    updateTemplate, 
    deleteTemplate,
    duplicateTemplate 
} from '../controllers/templates.js';

const router = Router();

router.use(auth);

router.get('/', getTemplates);
router.get('/:id', getTemplate);
router.post('/', createTemplate);
router.post('/:id/duplicate', duplicateTemplate);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

export default router;
