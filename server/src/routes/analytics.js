import express from 'express';
import { auth } from '../middleware/auth.js';
import { User, Evaluation, Goal } from '../models/index.js';

const router = express.Router();

// Get quick stats for analytics dashboard
router.get('/quick-stats', auth, async (req, res) => {
  try {
    // Get total team members for the store
    const teamMembers = await User.countDocuments({ store: req.user.store._id });

    // Calculate average performance from evaluations
    const recentEvaluations = await Evaluation.find({
      store: req.user.store._id,
      status: 'completed',
      completedDate: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
    });

    let avgPerformance = 0;
    if (recentEvaluations.length > 0) {
      const totalScore = recentEvaluations.reduce((sum, evaluation) => {
        // Assuming each evaluation has a finalScore or calculate it from criteria
        return sum + (evaluation.finalScore || 0);
      }, 0);
      avgPerformance = Math.round((totalScore / recentEvaluations.length) * 100);
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
      match: { department: department.toUpperCase() }
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
        const scores = Object.fromEntries(evaluation.managerEvaluation);
        
        // Group scores by category from template
        evaluation.template.sections.forEach(section => {
          section.criteria.forEach(criterion => {
            const score = scores[criterion.name];
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
        const scores = Object.values(Object.fromEntries(evaluation.managerEvaluation));
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

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
          improvement: 5 // Placeholder - need historical data comparison
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

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
        const scores = Object.fromEntries(evaluation.managerEvaluation);
        developmentData.leadershipMetrics.forEach(metric => {
          if (!leadershipScores[metric.trait]) {
            leadershipScores[metric.trait] = [];
          }
          const score = scores[metric.trait];
          if (typeof score === 'number') {
            leadershipScores[metric.trait].push(score);
          }
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
      developmentData.softSkills = developmentData.softSkills.map(skill => ({
        ...skill,
        level: Math.floor(Math.random() * 5) + 1 // Placeholder - should be calculated from actual metrics
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

    // Build base query
    const baseQuery = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'completed'
    };

    // Add department filter if specified
    if (department !== 'all') {
      baseQuery['employee.department'] = department.toUpperCase();
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
      
      if (evaluation.employee?.department === 'FOH') {
        scores.foh.push(score);
      } else if (evaluation.employee?.department === 'BOH') {
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
      evaluation.managerEvaluation.forEach((score, criterion) => {
        if (!criteriaScores[criterion]) {
          criteriaScores[criterion] = { foh: [], boh: [] };
        }
        
        if (evaluation.employee?.department === 'FOH') {
          criteriaScores[criterion].foh.push(score);
        } else if (evaluation.employee?.department === 'BOH') {
          criteriaScores[criterion].boh.push(score);
        }
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
      const scores = Object.fromEntries(evaluation.managerEvaluation);
      
      cohesionMetrics.forEach(metric => {
        if (scores[metric.attribute]) {
          metric.score = (metric.score + scores[metric.attribute]) / 2;
        }
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
      const scores = Object.fromEntries(evaluation.managerEvaluation);
      
      communicationMetrics.forEach(metric => {
        if (scores[metric.type]) {
          metric.score = (metric.score + scores[metric.type]) / 2;
        }
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
          const scores = Object.fromEntries(evaluation.managerEvaluation);
          teamMetrics.teamwork += scores['Teamwork'] || 0;
          teamMetrics.efficiency += scores['Efficiency'] || 0;
          teamMetrics.morale += scores['Morale'] || 0;
        });

        // Calculate averages
        const evalCount = shiftEvals.length;
        teamMetrics.teamwork = Math.round((teamMetrics.teamwork / evalCount) * 20);
        teamMetrics.efficiency = Math.round((teamMetrics.efficiency / evalCount) * 20);
        teamMetrics.morale = Math.round((teamMetrics.morale / evalCount) * 20);

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

export default router; 