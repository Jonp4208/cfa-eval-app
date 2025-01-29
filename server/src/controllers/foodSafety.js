import { sendEmail } from '../utils/email.js';

const sendChecklistCompletionEmail = async (completion, checklist, store) => {
  if (!store?.storeEmail) {
    console.warn('Store email not configured, skipping completion email');
    return;
  }

  const statusColors = {
    pass: '#4CAF50',
    warning: '#FF9800',
    fail: '#F44336'
  };

  await sendEmail({
    to: store.storeEmail,
    subject: `Food Safety Checklist Completed - ${checklist.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #E4002B; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0;">Food Safety Checklist Report</h1>
        </div>
        
        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #333; margin-top: 0;">Checklist Details</h2>
          <p><strong>Checklist:</strong> ${checklist.name}</p>
          <p><strong>Completed By:</strong> ${completion.completedBy}</p>
          <p><strong>Date:</strong> ${new Date(completion.completedAt).toLocaleDateString()}</p>
          <p><strong>Score:</strong> ${completion.score}%</p>
          <p>
            <strong>Status:</strong> 
            <span style="color: ${statusColors[completion.overallStatus] || '#666'}">
              ${completion.overallStatus.toUpperCase()}
            </span>
          </p>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="color: #333;">Items</h2>
          ${completion.items.map(item => `
            <div style="background-color: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>${checklist.items.find(i => i._id === item.item)?.name || 'Unknown Item'}</strong>
                <span style="color: ${statusColors[item.status] || '#666'}">
                  ${item.status.toUpperCase()}
                </span>
              </div>
              <p style="margin: 10px 0 0 0;"><strong>Value:</strong> ${item.value}</p>
              ${item.notes ? `<p style="margin: 5px 0 0 0;"><strong>Notes:</strong> ${item.notes}</p>` : ''}
            </div>
          `).join('')}
        </div>

        ${completion.notes ? `
          <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="color: #333; margin-top: 0;">Overall Notes</h2>
            <p style="margin: 0;">${completion.notes}</p>
          </div>
        ` : ''}

        <p style="margin-top: 30px;">
          Best regards,<br>LD Growth Team
        </p>
      </div>
    `
  });
};

export const completeChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, notes } = req.body;

    const checklist = await FoodSafetyChecklist.findById(id);
    if (!checklist) {
      return res.status(404).json({ message: 'Checklist not found' });
    }

    // Calculate scores and determine status
    let totalScore = 0;
    let totalWeight = 0;
    const itemCompletions = [];

    for (const item of items) {
      const checklistItem = checklist.items.find(i => i._id.toString() === item.item);
      if (!checklistItem) continue;

      const weight = checklistItem.validation?.weight || 1;
      totalWeight += weight;

      const status = calculateItemStatus(item.value, checklistItem.validation);
      if (status === 'fail' && checklistItem.isCritical) {
        totalScore = 0;
        break;
      }

      const score = status === 'pass' ? 100 : status === 'warning' ? 50 : 0;
      totalScore += score * weight;

      itemCompletions.push({
        ...item,
        status
      });
    }

    const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
    const overallStatus = finalScore >= checklist.passingScore ? 'pass' :
      finalScore >= checklist.passingScore * 0.8 ? 'warning' : 'fail';

    // Create completion record
    const completion = await FoodSafetyChecklistCompletion.create({
      checklist: id,
      completedBy: req.user.name,
      items: itemCompletions,
      score: finalScore,
      overallStatus,
      notes,
      store: req.user.store
    });

    // Send email notification
    await sendChecklistCompletionEmail(completion, checklist, req.user.store);

    res.json(completion);
  } catch (error) {
    console.error('Complete checklist error:', error);
    res.status(500).json({ message: 'Error completing checklist' });
  }
}; 