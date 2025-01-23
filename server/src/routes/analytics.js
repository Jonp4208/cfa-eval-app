import express from 'express';
import { auth } from '../middleware/auth.js';
import { User, Evaluation, Goal, GradingScale } from '../models/index.js';

const router = express.Router();

// Get quick stats for analytics dashboard
router.get('/quick-stats', auth, async (req, res) => {
  try {
    // Get total team members for the store
    const teamMembers = await User.countDocuments({ store: req.user.store._id });
    console.log('Total team members:', teamMembers);

    // Calculate average performance from evaluations
    const recentEvaluations = await Evaluation.find({
      store: req.user.store._id,
      status: 'completed'
    })
    .populate('employee')
    .populate({
      path: 'template',
      populate: {
        path: 'sections.criteria.gradingScale',
        model: 'GradingScale'
      }
    });

    console.log('Found evaluations:', recentEvaluations.length);
    console.log('Sample evaluation:', recentEvaluations[0]);

    // Get default grading scale
    const defaultScale = await GradingScale.findOne({ 
      store: req.user.store._id,
      isDefault: true,
      isActive: true
    });

    let avgPerformance = 0;
    if (recentEvaluations.length > 0) {
      const evaluationScores = recentEvaluations.map(evaluation => {
        // Ensure we have the required data
        if (!evaluation.managerEvaluation || !evaluation.template) {
          console.log('Skipping evaluation - missing data:', evaluation._id);
          return { score: 0, totalPossible: 0 };
        }

        // Convert managerEvaluation Map to object if needed
        const scores = evaluation.managerEvaluation instanceof Map 
          ? Object.fromEntries(evaluation.managerEvaluation)
          : evaluation.managerEvaluation;

        console.log('Processing scores:', scores);

        let totalScore = 0;
        let totalPossible = 0;

        evaluation.template.sections.forEach((section, sectionIndex) => {
          section.criteria.forEach((criterion, criterionIndex) => {
            const key = `${sectionIndex}-${criterionIndex}`;
            const score = scores[key];
            const scale = criterion.gradingScale || defaultScale;
            
            if (score !== undefined && scale && scale.grades) {
              const numericScore = mapScoreToNumeric(score);
              totalScore += numericScore;
              
              // Calculate max possible score from the grading scale
              const maxPossible = Math.max(...scale.grades.map(g => g.value));
              totalPossible += maxPossible;

              console.log('Criterion calculation:', {
                key,
                score,
                numericScore,
                maxPossible
              });
            }
          });
        });

        console.log('Evaluation calculation:', {
          evaluationId: evaluation._id,
          totalScore,
          totalPossible,
          scores
        });

        return { score: totalScore, totalPossible };
      });

      // Filter out evaluations with no possible points to avoid division by zero
      const validScores = evaluationScores.filter(score => score.totalPossible > 0);
      
      if (validScores.length > 0) {
        const totalScore = validScores.reduce((sum, evalScore) => sum + evalScore.score, 0);
        const totalPossible = validScores.reduce((sum, evalScore) => sum + evalScore.totalPossible, 0);
        avgPerformance = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
        
        console.log('Final calculation:', {
          totalScore,
          totalPossible,
          numberOfEvaluations: validScores.length,
          avgPerformance
        });
      }
    }

    // Calculate development goals progress
    const activeGoals = await Goal.find({
      user: { $in: await User.find({ store: req.user.store._id }).select('_id') },
      status: { $in: ['in-progress', 'completed'] }
    });

    let developmentGoals = 0;
    if (activeGoals.length > 0) {
      const totalProgress = activeGoals.reduce((sum, goal) => sum + (goal.progress || 0), 0);
      developmentGoals = Math.round(totalProgress / activeGoals.length);
    }

    res.json({
      teamMembers,
      avgPerformance,
      developmentGoals
    });
  } catch (error) {
    console.error('Error fetching quick stats:', error);
    res.status(500).json({ message: 'Failed to fetch quick stats' });
  }
});

// Get department analytics
router.get('/department/:department', auth, async (req, res) => {
  try {
    const { department } = req.params;
    const { timeframe = 'month' } = req.query;

    // Validate department parameter
    if (!['foh', 'boh'].includes(department)) {
      return res.status(400).json({ message: 'Invalid department' });
    }

    // Map department to array of specific departments
    const departmentMap = {
      'foh': ['Front Counter', 'Drive Thru'],
      'boh': ['Kitchen']
    };

    // Calculate date range based on timeframe
    const startDate = new Date();
    switch (timeframe) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1); // Default to month
    }

    // Get evaluations for the department within timeframe
    const evaluations = await Evaluation.find({
      store: req.user.store._id,
      status: 'completed',
      completedDate: { $gte: startDate }
    })
    .populate({
      path: 'employee',
      match: { departments: { $in: departmentMap[department] } }
    })
    .populate('template');

    // Filter out evaluations where employee doesn't match department
    const departmentEvaluations = evaluations.filter(evaluation => evaluation.employee);

    // Initialize department data structure
    const departmentData = {
      categories: department === 'foh' ? {
        'Guest Service': 0,
        'Speed of Service': 0,
        'Order Accuracy': 0,
        'Cleanliness': 0,
        'Team Collaboration': 0
      } : {
        'Food Safety': 0,
        'Food Quality': 0,
        'Kitchen Efficiency': 0,
        'Cleanliness': 0,
        'Team Collaboration': 0
      },
      topPerformers: [],
      improvementAreas: []
    };

    // Process evaluations to calculate metrics
    if (departmentEvaluations.length > 0) {
      // Calculate category averages
      const categoryScores = {};
      departmentEvaluations.forEach(evaluation => {
        // Convert managerEvaluation Map to object and process scores
        const scores = evaluation.managerEvaluation instanceof Map 
          ? Object.fromEntries(evaluation.managerEvaluation)
          : evaluation.managerEvaluation;
        
        // Group scores by category from template
        evaluation.template.sections.forEach((section, sectionIndex) => {
          section.questions.forEach((question, questionIndex) => {
            const key = `${sectionIndex}-${questionIndex}`;
            const score = scores[key];
            if (typeof score === 'number') {
              if (!categoryScores[section.title]) {
                categoryScores[section.title] = [];
              }
              categoryScores[section.title].push(score);
            }
          });
        });
      });

      // Calculate averages for each category
      Object.keys(departmentData.categories).forEach(category => {
        if (categoryScores[category] && categoryScores[category].length > 0) {
          const avg = categoryScores[category].reduce((a, b) => a + b, 0) / categoryScores[category].length;
          departmentData.categories[category] = Number(avg.toFixed(2));
        }
      });

      // Calculate top performers
      const userScores = {};
      departmentEvaluations.forEach(evaluation => {
        const scores = evaluation.managerEvaluation instanceof Map 
          ? Object.fromEntries(evaluation.managerEvaluation)
          : evaluation.managerEvaluation;
        
        let totalScore = 0;
        let totalQuestions = 0;

        evaluation.template.sections.forEach((section, sectionIndex) => {
          section.questions.forEach((question, questionIndex) => {
            const key = `${sectionIndex}-${questionIndex}`;
            const score = scores[key];
            if (typeof score === 'number') {
              totalScore += score;
              totalQuestions++;
            }
          });
        });

        const avgScore = totalQuestions > 0 ? totalScore / totalQuestions : 0;

        if (!userScores[evaluation.employee._id]) {
          userScores[evaluation.employee._id] = {
            id: evaluation.employee._id,
            name: evaluation.employee.name,
            position: evaluation.employee.position,
            scores: []
          };
        }
        userScores[evaluation.employee._id].scores.push(avgScore);
      });

      departmentData.topPerformers = Object.values(userScores)
        .map(user => ({
          id: user.id,
          name: user.name,
          position: user.position,
          score: Number((user.scores.reduce((a, b) => a + b, 0) / user.scores.length).toFixed(2)),
          improvement: 0 // We'll calculate this in a moment
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      // Calculate improvement percentages by comparing with previous evaluations
      const previousStartDate = new Date(startDate);
      previousStartDate.setMonth(previousStartDate.getMonth() - 1);

      const previousEvaluations = await Evaluation.find({
        store: req.user.store._id,
        status: 'completed',
        completedDate: { $gte: previousStartDate, $lt: startDate }
      })
      .populate({
        path: 'employee',
        match: { departments: { $in: departmentMap[department] } }
      })
      .populate('template');

      const previousUserScores = {};
      previousEvaluations.filter(e => e.employee).forEach(evaluation => {
        const scores = evaluation.managerEvaluation instanceof Map 
          ? Object.fromEntries(evaluation.managerEvaluation)
          : evaluation.managerEvaluation;
        
        let totalScore = 0;
        let totalQuestions = 0;

        evaluation.template.sections.forEach((section, sectionIndex) => {
          section.questions.forEach((question, questionIndex) => {
            const key = `${sectionIndex}-${questionIndex}`;
            const score = scores[key];
            if (typeof score === 'number') {
              totalScore += score;
              totalQuestions++;
            }
          });
        });

        const avgScore = totalQuestions > 0 ? totalScore / totalQuestions : 0;

        if (!previousUserScores[evaluation.employee._id]) {
          previousUserScores[evaluation.employee._id] = [];
        }
        previousUserScores[evaluation.employee._id].push(avgScore);
      });

      // Update improvement percentages
      departmentData.topPerformers = departmentData.topPerformers.map(performer => {
        const previousScores = previousUserScores[performer.id];
        if (previousScores && previousScores.length > 0) {
          const previousAvg = previousScores.reduce((a, b) => a + b, 0) / previousScores.length;
          const improvement = ((performer.score - previousAvg) / previousAvg) * 100;
          return {
            ...performer,
            improvement: Number(improvement.toFixed(1))
          };
        }
        return performer;
      });

      // Calculate improvement areas
      const categoryTrends = Object.entries(departmentData.categories)
        .map(([category, score]) => ({
          category,
          score,
          trend: score < 3.5 ? 'down' : score < 4 ? 'stable' : 'up'
        }))
        .filter(area => area.score < 4)
        .sort((a, b) => a.score - b.score);

      departmentData.improvementAreas = categoryTrends.slice(0, 3);
    }

    res.json({ [department]: departmentData });
  } catch (error) {
    console.error('Error fetching department analytics:', error);
    res.status(500).json({ message: 'Failed to fetch department analytics' });
  }
});

// Get development metrics
router.get('/development', auth, async (req, res) => {
  try {
    const { employeeId, timeframe = 'quarter' } = req.query;

    // Calculate date range based on timeframe
    const startDate = new Date();
    switch (timeframe) {
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 3); // Default to quarter
    }

    // Build query for users
    const userQuery = { store: req.user.store._id };
    if (employeeId !== 'all') {
      if (employeeId === 'active') {
        userQuery.status = 'active';
      } else if (employeeId === 'new') {
        userQuery.startDate = { $gte: startDate };
      }
    }

    // Get evaluations for the time period
    const evaluations = await Evaluation.find({
      store: req.user.store._id,
      status: 'completed',
      completedDate: { $gte: startDate }
    }).populate('employee template');

    // Initialize response data structure
    const developmentData = {
      leadershipMetrics: [
        { trait: 'Communication', current: 0, previous: 0, focus: 'Improve team meetings' },
        { trait: 'Initiative', current: 0, previous: 0, focus: 'Take on new projects' },
        { trait: 'Teamwork', current: 0, previous: 0, focus: 'Collaborate more effectively' },
        { trait: 'Problem Solving', current: 0, previous: 0, focus: 'Handle challenges independently' },
        { trait: 'Reliability', current: 0, previous: 0, focus: 'Consistent performance' }
      ],
      softSkills: [
        {
          name: 'Guest Service',
          description: 'Ability to handle guest interactions effectively',
          level: 0,
          recentAchievement: 'Improved guest satisfaction scores',
          nextGoal: 'Achieve consistent 5-star ratings'
        },
        {
          name: 'Time Management',
          description: 'Efficient handling of tasks and responsibilities',
          level: 0,
          recentAchievement: 'Reduced order preparation time',
          nextGoal: 'Optimize multitasking efficiency'
        }
      ],
      crossTraining: [
        {
          role: 'Front Counter',
          level: 0,
          lastTrained: new Date().toISOString(),
          nextStep: 'Advanced customer service training'
        },
        {
          role: 'Drive-Thru',
          level: 0,
          lastTrained: new Date().toISOString(),
          nextStep: 'Speed of service optimization'
        }
      ],
      personalGoals: []
    };

    // Process evaluations to calculate metrics
    if (evaluations.length > 0) {
      // Calculate leadership metrics
      const leadershipScores = {};
      evaluations.forEach(evaluation => {
        const scores = evaluation.managerEvaluation instanceof Map 
          ? Object.fromEntries(evaluation.managerEvaluation)
          : evaluation.managerEvaluation;
        
        evaluation.template.sections.forEach((section, sectionIndex) => {
          section.questions.forEach((question, questionIndex) => {
            const key = `${sectionIndex}-${questionIndex}`;
            const score = scores[key];
            if (typeof score === 'number') {
              const metric = developmentData.leadershipMetrics.find(m => 
                section.title.toLowerCase().includes(m.trait.toLowerCase())
              );
              if (metric) {
                if (!leadershipScores[metric.trait]) {
                  leadershipScores[metric.trait] = [];
                }
                leadershipScores[metric.trait].push(score);
              }
            }
          });
        });
      });

      // Calculate averages for leadership metrics
      developmentData.leadershipMetrics = developmentData.leadershipMetrics.map(metric => ({
        ...metric,
        current: leadershipScores[metric.trait]?.length > 0
          ? Number((leadershipScores[metric.trait].reduce((a, b) => a + b, 0) / leadershipScores[metric.trait].length).toFixed(2))
          : 0,
        previous: Math.max(0, Math.min(5, Math.random() * 5)) // Placeholder - should be calculated from historical data
      }));

      // Calculate soft skills levels
      const softSkillScores = {};
      evaluations.forEach(evaluation => {
        const scores = evaluation.managerEvaluation instanceof Map 
          ? Object.fromEntries(evaluation.managerEvaluation)
          : evaluation.managerEvaluation;
        
        evaluation.template.sections.forEach((section, sectionIndex) => {
          section.questions.forEach((question, questionIndex) => {
            const key = `${sectionIndex}-${questionIndex}`;
            const score = scores[key];
            if (typeof score === 'number') {
              const skill = developmentData.softSkills.find(s => 
                section.title.toLowerCase().includes(s.name.toLowerCase())
              );
              if (skill) {
                if (!softSkillScores[skill.name]) {
                  softSkillScores[skill.name] = [];
                }
                softSkillScores[skill.name].push(score);
              }
            }
          });
        });
      });

      // Calculate averages for soft skills
      developmentData.softSkills = developmentData.softSkills.map(skill => ({
        ...skill,
        level: softSkillScores[skill.name]?.length > 0
          ? Math.round(softSkillScores[skill.name].reduce((a, b) => a + b, 0) / softSkillScores[skill.name].length)
          : Math.floor(Math.random() * 5) + 1 // Fallback to random if no scores
      }));

      // Calculate cross-training levels
      developmentData.crossTraining = developmentData.crossTraining.map(training => ({
        ...training,
        level: Math.floor(Math.random() * 5) + 1 // Placeholder - should be calculated from actual training records
      }));

      // Add some sample personal goals
      developmentData.personalGoals = [
        {
          id: '1',
          title: 'Customer Service Excellence',
          description: 'Improve guest satisfaction scores',
          status: 'In Progress',
          progress: 75,
          targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          milestones: [
            { id: '1-1', description: 'Complete advanced service training', completed: true },
            { id: '1-2', description: 'Achieve 90% satisfaction rate', completed: false }
          ]
        },
        {
          id: '2',
          title: 'Leadership Development',
          description: 'Prepare for team leader role',
          status: 'In Progress',
          progress: 40,
          targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          milestones: [
            { id: '2-1', description: 'Complete leadership training', completed: true },
            { id: '2-2', description: 'Lead 5 team meetings', completed: false }
          ]
        }
      ];
    }

    res.json(developmentData);
  } catch (error) {
    console.error('Error fetching development metrics:', error);
    res.status(500).json({ message: 'Failed to fetch development metrics' });
  }
});

// Performance Analytics Endpoint
router.get('/performance', auth, async (req, res) => {
  try {
    const { timeframe = 'month', department = 'all', shift = 'all' } = req.query;
    
    // Calculate date range based on timeframe
    const endDate = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // Map department to array of specific departments
    const departmentMap = {
      'foh': ['Front Counter', 'Drive Thru'],
      'boh': ['Kitchen'],
      'all': ['Front Counter', 'Drive Thru', 'Kitchen', 'Everything']
    };

    // Build base query
    const baseQuery = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'completed'
    };

    // Add department filter if specified
    if (department !== 'all') {
      baseQuery['employee.departments'] = { $in: departmentMap[department] };
    }

    // Add shift filter if specified
    if (shift !== 'all') {
      baseQuery.shift = shift;
    }

    // Fetch evaluations
    const evaluations = await Evaluation.find(baseQuery)
      .populate('employee')
      .populate('template')
      .lean();

    if (!evaluations.length) {
      return res.json({
        averages: {
          overall: 0,
          foh: 0,
          boh: 0,
          dayShift: 0,
          nightShift: 0
        },
        departmentComparison: [],
        shiftComparison: []
      });
    }

    // Calculate averages
    let scores = {
      overall: [],
      foh: [],
      boh: [],
      dayShift: [],
      nightShift: []
    };

    // Process evaluations for averages
    evaluations.forEach(evaluation => {
      const score = evaluation.finalScore || 0;
      scores.overall.push(score);
      
      // Check if employee has any FOH departments
      if (evaluation.employee?.departments?.some(d => departmentMap['foh'].includes(d))) {
        scores.foh.push(score);
      }
      // Check if employee has any BOH departments
      if (evaluation.employee?.departments?.some(d => departmentMap['boh'].includes(d))) {
        scores.boh.push(score);
      }

      if (evaluation.shift === 'day') {
        scores.dayShift.push(score);
      } else if (evaluation.shift === 'night') {
        scores.nightShift.push(score);
      }
    });

    // Calculate average for each category
    const calculateAverage = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const averages = {
      overall: calculateAverage(scores.overall),
      foh: calculateAverage(scores.foh),
      boh: calculateAverage(scores.boh),
      dayShift: calculateAverage(scores.dayShift),
      nightShift: calculateAverage(scores.nightShift)
    };

    // Calculate department comparison by criteria
    const departmentComparison = [];
    const criteriaScores = {};

    evaluations.forEach(evaluation => {
      const scores = evaluation.managerEvaluation instanceof Map 
        ? Object.fromEntries(evaluation.managerEvaluation)
        : evaluation.managerEvaluation;

      evaluation.template.sections.forEach((section, sectionIndex) => {
        section.questions.forEach((question, questionIndex) => {
          const key = `${sectionIndex}-${questionIndex}`;
          const score = scores[key];
          if (typeof score === 'number') {
            if (!criteriaScores[section.title]) {
              criteriaScores[section.title] = { foh: [], boh: [] };
            }
            
            // Check if employee has any FOH departments
            if (evaluation.employee?.departments?.some(d => departmentMap['foh'].includes(d))) {
              criteriaScores[section.title].foh.push(score);
            }
            // Check if employee has any BOH departments
            if (evaluation.employee?.departments?.some(d => departmentMap['boh'].includes(d))) {
              criteriaScores[section.title].boh.push(score);
            }
          }
        });
      });
    });

    Object.entries(criteriaScores).forEach(([criterion, scores]) => {
      departmentComparison.push({
        category: criterion,
        foh: calculateAverage(scores.foh),
        boh: calculateAverage(scores.boh)
      });
    });

    // Calculate shift comparison over time
    const shiftComparison = [];
    const dateScores = {};

    evaluations.forEach(evaluation => {
      const date = evaluation.createdAt.toISOString().split('T')[0];
      if (!dateScores[date]) {
        dateScores[date] = { day: [], night: [] };
      }

      if (evaluation.shift === 'day') {
        dateScores[date].day.push(evaluation.finalScore);
      } else if (evaluation.shift === 'night') {
        dateScores[date].night.push(evaluation.finalScore);
      }
    });

    Object.entries(dateScores)
      .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
      .forEach(([date, scores]) => {
        shiftComparison.push({
          date,
          dayShift: calculateAverage(scores.day),
          nightShift: calculateAverage(scores.night)
        });
      });

    res.json({
      averages,
      departmentComparison,
      shiftComparison
    });

  } catch (error) {
    console.error('Error fetching performance analytics:', error);
    res.status(500).json({ message: 'Failed to fetch performance analytics' });
  }
});

// Team Dynamics Analytics Endpoint
router.get('/team-dynamics', auth, async (req, res) => {
  try {
    const { shift = 'all', timeframe = 'month' } = req.query;
    
    // Calculate date range based on timeframe
    const endDate = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // Build base query
    const baseQuery = {
      store: req.user.store._id,
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'completed'
    };

    // Add shift filter if specified
    if (shift !== 'all') {
      baseQuery.shift = shift;
    }

    // Fetch evaluations
    const evaluations = await Evaluation.find(baseQuery)
      .populate('employee')
      .populate('template')
      .lean();

    if (!evaluations.length) {
      return res.json({
        cohesionMetrics: [],
        communicationMetrics: [],
        shiftTeams: [],
        mentorships: []
      });
    }

    // Calculate cohesion metrics
    const cohesionMetrics = [
      { attribute: 'Teamwork', score: 0, insight: 'Team collaboration effectiveness' },
      { attribute: 'Communication', score: 0, insight: 'Information flow and clarity' },
      { attribute: 'Support', score: 0, insight: 'Mutual assistance and backup' },
      { attribute: 'Efficiency', score: 0, insight: 'Task coordination and completion' },
      { attribute: 'Morale', score: 0, insight: 'Team spirit and motivation' }
    ];

    // Process evaluations for cohesion metrics
    evaluations.forEach(evaluation => {
      const scores = evaluation.managerEvaluation instanceof Map 
        ? Object.fromEntries(evaluation.managerEvaluation)
        : evaluation.managerEvaluation;
      
      evaluation.template.sections.forEach((section, sectionIndex) => {
        section.questions.forEach((question, questionIndex) => {
          const key = `${sectionIndex}-${questionIndex}`;
          const score = scores[key];
          if (typeof score === 'number') {
            const metric = cohesionMetrics.find(m => section.title.toLowerCase().includes(m.attribute.toLowerCase()));
            if (metric) {
              metric.score = metric.score === 0 ? score : (metric.score + score) / 2;
            }
          }
        });
      });
    });

    // Calculate communication metrics
    const communicationMetrics = [
      {
        type: 'Team Meetings',
        description: 'Effectiveness of team discussions',
        score: 0,
        feedback: 'Regular team meetings help align goals'
      },
      {
        type: 'Shift Handover',
        description: 'Information transfer between shifts',
        score: 0,
        feedback: 'Clear communication during shift changes'
      },
      {
        type: 'Guest Communication',
        description: 'Interaction with customers',
        score: 0,
        feedback: 'Professional and friendly guest service'
      }
    ];

    // Process evaluations for communication metrics
    evaluations.forEach(evaluation => {
      const scores = evaluation.managerEvaluation instanceof Map 
        ? Object.fromEntries(evaluation.managerEvaluation)
        : evaluation.managerEvaluation;
      
      evaluation.template.sections.forEach((section, sectionIndex) => {
        section.questions.forEach((question, questionIndex) => {
          const key = `${sectionIndex}-${questionIndex}`;
          const score = scores[key];
          if (typeof score === 'number') {
            const metric = communicationMetrics.find(m => section.title.toLowerCase().includes(m.type.toLowerCase()));
            if (metric) {
              metric.score = metric.score === 0 ? score : (metric.score + score) / 2;
            }
          }
        });
      });
    });

    // Calculate shift team metrics
    const shiftTeams = [];
    const shifts = ['Morning', 'Afternoon', 'Evening'];
    
    shifts.forEach(shiftName => {
      const shiftEvals = evaluations.filter(evaluation => 
        evaluation.shift?.toLowerCase() === shiftName.toLowerCase()
      );

      if (shiftEvals.length) {
        const teamMetrics = {
          id: shiftName.toLowerCase(),
          name: `${shiftName} Shift`,
          teamwork: 0,
          efficiency: 0,
          morale: 0,
          highlights: [],
          improvements: []
        };

        shiftEvals.forEach(evaluation => {
          const scores = evaluation.managerEvaluation instanceof Map 
            ? Object.fromEntries(evaluation.managerEvaluation)
            : evaluation.managerEvaluation;
          
          evaluation.template.sections.forEach((section, sectionIndex) => {
            section.questions.forEach((question, questionIndex) => {
              const key = `${sectionIndex}-${questionIndex}`;
              const score = scores[key];
              if (typeof score === 'number') {
                if (section.title.toLowerCase().includes('teamwork')) {
                  teamMetrics.teamwork += score;
                } else if (section.title.toLowerCase().includes('efficiency')) {
                  teamMetrics.efficiency += score;
                } else if (section.title.toLowerCase().includes('morale')) {
                  teamMetrics.morale += score;
                }
              }
            });
          });
        });

        // Calculate averages
        const evaluationCount = shiftEvals.length;
        teamMetrics.teamwork = Math.round((teamMetrics.teamwork / evaluationCount) * 20);
        teamMetrics.efficiency = Math.round((teamMetrics.efficiency / evaluationCount) * 20);
        teamMetrics.morale = Math.round((teamMetrics.morale / evaluationCount) * 20);

        // Add highlights and improvements based on scores
        if (teamMetrics.teamwork >= 80) {
          teamMetrics.highlights.push('Strong team collaboration');
        } else {
          teamMetrics.improvements.push('Focus on team building activities');
        }

        if (teamMetrics.efficiency >= 80) {
          teamMetrics.highlights.push('Excellent operational efficiency');
        } else {
          teamMetrics.improvements.push('Optimize workflow processes');
        }

        shiftTeams.push(teamMetrics);
      }
    });

    // Get active mentorship relationships
    const mentorships = await Goal.find({
      store: req.user.store._id,
      type: 'mentorship',
      status: { $in: ['active', 'completed'] }
    })
    .populate('assignedTo')
    .populate('assignedBy')
    .lean();

    const mentorshipData = mentorships.map(mentorship => ({
      id: mentorship._id.toString(),
      mentor: mentorship.assignedBy.name,
      mentee: mentorship.assignedTo.name,
      startDate: mentorship.startDate,
      status: mentorship.status === 'active' ? 'Active' : 'Completed',
      goalsCompleted: mentorship.completedMilestones?.length || 0,
      totalGoals: mentorship.milestones?.length || 0,
      achievements: mentorship.achievements || []
    }));

    res.json({
      cohesionMetrics,
      communicationMetrics,
      shiftTeams,
      mentorships: mentorshipData
    });

  } catch (error) {
    console.error('Error fetching team dynamics:', error);
    res.status(500).json({ message: 'Failed to fetch team dynamics data' });
  }
});

// Team Analytics Endpoint
router.get('/team', auth, async (req, res) => {
  try {
    const { timeframe = 'month', sortBy = 'score', position = 'all' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();
    switch (timeframe) {
      case 'week': startDate.setDate(startDate.getDate() - 7); break;
      case 'month': startDate.setMonth(startDate.getMonth() - 1); break;
      case 'quarter': startDate.setMonth(startDate.getMonth() - 3); break;
      case 'year': startDate.setFullYear(startDate.getFullYear() - 1); break;
    }

    // Build query
    const query = {
      store: req.user.store._id,
      status: 'completed',
      createdAt: { $gte: startDate, $lte: endDate }
    };

    // Fetch evaluations with populated employee data
    const evaluations = await Evaluation.find(query)
      .populate('employee')
      .lean();

    // Process evaluations into team member data
    const memberMap = new Map();
    evaluations.forEach(evaluation => {
      if (!evaluation.employee) return;
      
      const { _id, name, position } = evaluation.employee;
      if (position === 'all' || position.toLowerCase() === position.toLowerCase()) {
        if (!memberMap.has(_id)) {
          memberMap.set(_id, {
            id: _id,
            name,
            position,
            score: 0,
            improvement: 0,
            categories: {},
            recentEvaluations: []
          });
        }
        
        const member = memberMap.get(_id);
        const scores = Object.fromEntries(evaluation.managerEvaluation);
        
        // Update categories
        Object.entries(scores).forEach(([category, score]) => {
          if (!member.categories[category]) {
            member.categories[category] = score;
          } else {
            member.categories[category] = (member.categories[category] + score) / 2;
          }
        });

        // Add to recent evaluations
        member.recentEvaluations.push({
          id: evaluation._id.toString(),
          date: evaluation.createdAt,
          score: evaluation.finalScore
        });

        // Update overall score
        member.score = Object.values(member.categories).reduce((a, b) => a + b, 0) / 
                      Object.values(member.categories).length;
      }
    });

    // Convert to array and sort
    let members = Array.from(memberMap.values());
    
    switch (sortBy) {
      case 'score':
        members.sort((a, b) => b.score - a.score);
        break;
      case 'improvement':
        members.sort((a, b) => b.improvement - a.improvement);
        break;
      case 'name':
        members.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    res.json({ members });
  } catch (error) {
    console.error('Error fetching team analytics:', error);
    res.status(500).json({ message: 'Failed to fetch team analytics' });
  }
});

// Helper function to get rating value
const getRatingValue = (rating, gradingScale) => {
  if (!rating || !gradingScale) return 0;
  if (typeof rating === 'number') return rating;
  
  // If the rating is a numeric string, convert it to a number
  const numericValue = Number(rating);
  if (!isNaN(numericValue)) return numericValue;
  
  // If we have a grading scale, find the grade by label
  const grade = gradingScale.grades.find(g => 
    rating.includes(g.label) || rating.includes(`- ${g.label}`)
  );
  
  // Return the grade's value if found
  if (grade) {
    return grade.value;
  }
  
  return 0;
};

// Team Member Scores Endpoint
router.get('/team-scores', auth, async (req, res) => {
  try {
    // Get all completed evaluations
    const evaluations = await Evaluation.find({
      store: req.user.store._id,
      status: 'completed'
    })
    .populate('employee')
    .populate({
      path: 'template',
      populate: {
        path: 'sections.criteria.gradingScale',
        model: 'GradingScale'
      }
    })
    .sort({ completedDate: -1 });

    // Get default grading scale
    const defaultScale = await GradingScale.findOne({ 
      store: req.user.store._id,
      isDefault: true,
      isActive: true
    });

    // Group evaluations by employee and calculate scores
    const teamScores = {};

    evaluations.forEach(evaluation => {
      if (!evaluation.employee) return;

      const employeeId = evaluation.employee._id.toString();
      const scores = evaluation.managerEvaluation instanceof Map 
        ? Object.fromEntries(evaluation.managerEvaluation)
        : evaluation.managerEvaluation;

      if (!scores || !evaluation.template) return;

      let totalScore = 0;
      let totalPossible = 0;

      // Calculate total score by iterating through template sections and questions
      evaluation.template.sections.forEach((section, sectionIndex) => {
        section.criteria.forEach((criterion, questionIndex) => {
          const key = `${sectionIndex}-${questionIndex}`;
          const score = scores[key];
          const scale = criterion.gradingScale || defaultScale;
          
          if (score !== undefined && scale) {
            const numericScore = getRatingValue(score, scale);
            totalScore += numericScore;
            totalPossible += Math.max(...scale.grades.map(g => g.value)); // Use highest value from scale
          }
        });
      });

      if (!teamScores[employeeId]) {
        // Map departments array to primary department
        let primaryDepartment = 'N/A';
        if (evaluation.employee.departments && evaluation.employee.departments.length > 0) {
          // Map specific departments to FOH/BOH
          const fohDepartments = ['Front Counter', 'Drive Thru'];
          const bohDepartments = ['Kitchen'];
          
          // Check if user has departments from both FOH and BOH
          const hasFOH = evaluation.employee.departments.some(dept => fohDepartments.includes(dept));
          const hasBOH = evaluation.employee.departments.some(dept => bohDepartments.includes(dept));
          
          if (evaluation.employee.departments.includes('Everything')) {
            primaryDepartment = 'All Departments';
          } else if (hasFOH && hasBOH) {
            primaryDepartment = 'FOH/BOH';
          } else if (hasFOH) {
            primaryDepartment = 'FOH';
          } else if (hasBOH) {
            primaryDepartment = 'BOH';
          } else {
            // If no standard mappings found, join all departments
            primaryDepartment = evaluation.employee.departments.join(', ');
          }
        }

        teamScores[employeeId] = {
          id: employeeId,
          name: evaluation.employee.name,
          position: evaluation.employee.position,
          department: primaryDepartment,
          evaluations: []
        };
      }

      teamScores[employeeId].evaluations.push({
        score: totalScore,
        totalPossible: totalPossible,
        date: evaluation.completedDate
      });
    });

    // Calculate overall averages and format response
    const teamMembers = Object.values(teamScores).map(member => {
      const totalScore = member.evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0);
      const totalPossible = member.evaluations.reduce((sum, evaluation) => sum + evaluation.totalPossible, 0);
      const averagePercentage = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;

      const recentEval = member.evaluations[0];
      const recentScore = recentEval ? Number(((recentEval.score / recentEval.totalPossible) * 100).toFixed(2)) : 0;

      return {
        id: member.id,
        name: member.name,
        position: member.position,
        department: member.department,
        averageScore: Number(averagePercentage.toFixed(2)),
        numberOfEvaluations: member.evaluations.length,
        recentScore: recentScore,
        recentPoints: recentEval ? `${recentEval.score}/${recentEval.totalPossible}` : null,
        recentEvaluationDate: recentEval ? recentEval.date : null
      };
    });

    res.json({ teamMembers });
  } catch (error) {
    console.error('Error fetching team member scores:', error);
    res.status(500).json({ message: 'Failed to fetch team member scores' });
  }
});

// Performance Trends Endpoint
router.get('/performance-trends', auth, async (req, res) => {
  try {
    // Get evaluations from the last 4 weeks
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 28); // 4 weeks ago

    console.log('Fetching evaluations between:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    const evaluations = await Evaluation.find({
      store: req.user.store._id,
      status: 'completed',
      completedDate: { $gte: startDate, $lte: endDate }
    })
    .populate('employee')
    .populate({
      path: 'template',
      populate: {
        path: 'sections.criteria.gradingScale',
        model: 'GradingScale'
      }
    })
    .sort({ completedDate: -1 }); // Sort by most recent first

    console.log(`Found ${evaluations.length} evaluations`);

    // Get default grading scale
    const defaultScale = await GradingScale.findOne({ 
      store: req.user.store._id,
      isDefault: true,
      isActive: true
    });

    // Group evaluations by week
    const weeks = {};
    const fohDepartments = ['Front Counter', 'Drive Thru'];
    const bohDepartments = ['Kitchen'];

    evaluations.forEach(evaluation => {
      if (!evaluation.employee?.departments) {
        console.log('Skipping evaluation - no employee departments:', evaluation._id);
        return;
      }

      const evalDate = new Date(evaluation.completedDate);
      // Get week start date (Sunday)
      const weekStart = new Date(evalDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeks[weekKey]) {
        weeks[weekKey] = {
          FOH: { total: 0, count: 0, totalPossible: 0 },
          BOH: { total: 0, count: 0, totalPossible: 0 }
        };
      }

      // Calculate evaluation score
      let totalScore = 0;
      let totalPossible = 0;

      const managerEvaluation = evaluation.managerEvaluation instanceof Map 
        ? Object.fromEntries(evaluation.managerEvaluation)
        : evaluation.managerEvaluation;

      evaluation.template.sections.forEach((section, sectionIndex) => {
        section.criteria.forEach((criterion, questionIndex) => {
          const key = `${sectionIndex}-${questionIndex}`;
          const score = managerEvaluation[key];
          const scale = criterion.gradingScale || defaultScale;
          
          if (score !== undefined && scale) {
            const numericScore = getRatingValue(score, scale);
            totalScore += numericScore;
            totalPossible += Math.max(...scale.grades.map(g => g.value));
          }
        });
      });

      // Determine if employee is FOH or BOH based on departments
      const isFOH = evaluation.employee.departments.some(dept => fohDepartments.includes(dept));
      const isBOH = evaluation.employee.departments.some(dept => bohDepartments.includes(dept));

      if (isFOH) {
        weeks[weekKey].FOH.total += totalScore;
        weeks[weekKey].FOH.totalPossible += totalPossible;
        weeks[weekKey].FOH.count++;
      }
      if (isBOH) {
        weeks[weekKey].BOH.total += totalScore;
        weeks[weekKey].BOH.totalPossible += totalPossible;
        weeks[weekKey].BOH.count++;
      }
    });

    // Convert to array and sort by week
    const sortedWeeks = Object.entries(weeks)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, 4); // Get last 4 weeks

    // Format response
    const performanceTrends = sortedWeeks.map(([date, scores], index) => {
      const weekNumber = index + 1;
      return {
        name: `Week ${4 - index}`,
        FOH: scores.FOH.count > 0 
          ? Number(((scores.FOH.total / scores.FOH.totalPossible) * 100).toFixed(1))
          : null,
        BOH: scores.BOH.count > 0 
          ? Number(((scores.BOH.total / scores.BOH.totalPossible) * 100).toFixed(1))
          : null
      };
    }).reverse(); // Reverse so Week 1 is oldest

    console.log('Final performance trends:', performanceTrends);

    res.json({ performanceTrends });
  } catch (error) {
    console.error('Error fetching performance trends:', error);
    res.status(500).json({ message: 'Failed to fetch performance trends' });
  }
});

// Add score mapping function
const mapScoreToNumeric = (score) => {
  // Handle numeric scores
  if (!isNaN(score)) {
    return Number(score);
  }

  // Handle text-based scores
  const scoreMap = {
    '- Star': 4,
    '- Excellent': 5,
    '- Very Good': 4,
    '- Valued': 3,
    '- Performer': 2,
    '- Improvement Needed': 1,
    '- Improvment Needed': 1 // Handle misspelling
  };

  return scoreMap[score] || 0;
};

export default router; 