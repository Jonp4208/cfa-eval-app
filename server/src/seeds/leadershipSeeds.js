import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import { Competency, Resource, DevelopmentPlan } from '../models/leadership.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Connect to MongoDB
console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');
    seedLeadershipData()
      .then(() => {
        console.log('Seeding completed successfully');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Error during seeding:', error);
        process.exit(1);
      });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

const seedLeadershipData = async () => {
  try {
    console.log('Starting leadership data seeding...');
    
    // Clear existing data
    console.log('Clearing existing data...');
    await Competency.deleteMany({});
    await Resource.deleteMany({});
    await DevelopmentPlan.deleteMany({});
    console.log('Existing data cleared successfully');

    // Create competencies
    console.log('Creating competencies...');
    const teamMemberCompetencies = [
      {
        name: 'Character-First Leadership',
        description: 'Develop foundational leadership character and values',
        level: 'Team Member',
        category: 'Character',
        source: 'Miller',
        requiredFor: ['Team Member', 'Trainer', 'Leader', 'Director'],
        milestones: [
          {
            title: 'Self-Awareness',
            description: 'Understand your leadership style and values',
            criteria: [
              'Complete leadership style assessment',
              'Identify core values',
              'Create personal leadership mission statement'
            ],
            verificationRequired: true
          },
          {
            title: 'Integrity in Action',
            description: 'Demonstrate consistent ethical behavior',
            criteria: [
              'Practice transparent decision-making',
              'Honor commitments',
              'Lead by example'
            ],
            verificationRequired: true
          }
        ]
      },
      {
        name: 'Service-Oriented Mindset',
        description: 'Develop a servant leadership approach',
        level: 'Team Member',
        category: 'Character',
        source: 'Both',
        requiredFor: ['Team Member', 'Trainer'],
        milestones: [
          {
            title: 'Understanding Servant Leadership',
            description: 'Learn the principles of servant leadership',
            criteria: [
              'Study servant leadership principles',
              'Identify opportunities to serve team members',
              'Practice active listening'
            ]
          },
          {
            title: 'Second Mile Service',
            description: 'Go above and beyond in serving others',
            criteria: [
              'Anticipate team needs',
              'Take initiative in helping others',
              'Seek feedback on service impact'
            ],
            verificationRequired: true
          }
        ]
      },
      {
        name: 'Basic Operations Knowledge',
        description: 'Master fundamental operational procedures and standards',
        level: 'Team Member',
        category: 'Knowledge',
        source: 'CFA',
        requiredFor: ['Team Member'],
        milestones: [
          {
            title: 'Standard Operating Procedures',
            description: 'Understand and follow core procedures',
            criteria: [
              'Complete SOP training',
              'Pass operations assessment',
              'Demonstrate consistent execution'
            ],
            verificationRequired: true
          }
        ]
      }
    ];

    const trainerCompetencies = [
      {
        name: 'Training Excellence',
        description: 'Develop effective training and coaching abilities',
        level: 'Trainer',
        category: 'Skills',
        source: 'Both',
        requiredFor: ['Trainer'],
        milestones: [
          {
            title: 'Training Fundamentals',
            description: 'Master core training principles',
            criteria: [
              'Complete trainer certification',
              'Develop training materials',
              'Demonstrate effective instruction'
            ],
            verificationRequired: true
          },
          {
            title: 'Performance Coaching',
            description: 'Guide others to improve performance',
            criteria: [
              'Conduct coaching sessions',
              'Provide constructive feedback',
              'Track trainee progress'
            ],
            verificationRequired: true
          }
        ]
      },
      {
        name: 'Team Development',
        description: 'Build and develop high-performing teams',
        level: 'Trainer',
        category: 'Skills',
        source: 'Miller',
        requiredFor: ['Trainer', 'Leader'],
        milestones: [
          {
            title: 'Team Building',
            description: 'Create strong team dynamics',
            criteria: [
              'Foster team collaboration',
              'Build trust within team',
              'Develop team goals'
            ]
          }
        ]
      }
    ];

    const leaderCompetencies = [
      {
        name: 'Strategic Leadership',
        description: 'Develop and execute organizational strategy',
        level: 'Leader',
        category: 'Skills',
        source: 'Miller',
        requiredFor: ['Leader', 'Director'],
        milestones: [
          {
            title: 'Vision Casting',
            description: 'Create and communicate compelling vision',
            criteria: [
              'Develop strategic vision',
              'Align team with goals',
              'Inspire others'
            ],
            verificationRequired: true
          },
          {
            title: 'Operational Excellence',
            description: 'Drive operational efficiency',
            criteria: [
              'Optimize processes',
              'Manage resources effectively',
              'Achieve business results'
            ],
            verificationRequired: true
          }
        ]
      },
      {
        name: 'People Development',
        description: 'Develop and grow team members',
        level: 'Leader',
        category: 'Skills',
        source: 'Both',
        requiredFor: ['Leader', 'Director'],
        milestones: [
          {
            title: 'Talent Development',
            description: 'Grow and develop team members',
            criteria: [
              'Create development plans',
              'Provide growth opportunities',
              'Monitor progress'
            ]
          }
        ]
      }
    ];

    const directorCompetencies = [
      {
        name: 'Culture Building',
        description: 'Create and maintain positive organizational culture',
        level: 'Director',
        category: 'Results',
        source: 'Miller',
        requiredFor: ['Director'],
        milestones: [
          {
            title: 'Culture Definition',
            description: 'Define and articulate desired culture',
            criteria: [
              'Identify core cultural elements',
              'Develop culture statements',
              'Create reinforcement plan'
            ]
          },
          {
            title: 'Culture Implementation',
            description: 'Drive cultural change and adoption',
            criteria: [
              'Model cultural behaviors',
              'Implement initiatives',
              'Measure impact'
            ],
            verificationRequired: true
          }
        ]
      },
      {
        name: 'Strategic Business Leadership',
        description: 'Lead business growth and innovation',
        level: 'Director',
        category: 'Results',
        source: 'Both',
        requiredFor: ['Director'],
        milestones: [
          {
            title: 'Business Strategy',
            description: 'Develop and execute business strategy',
            criteria: [
              'Create business plans',
              'Drive innovation',
              'Achieve growth targets'
            ],
            verificationRequired: true
          }
        ]
      }
    ];

    const competencies = [
      ...teamMemberCompetencies,
      ...trainerCompetencies,
      ...leaderCompetencies,
      ...directorCompetencies
    ];

    const savedCompetencies = await Competency.insertMany(competencies);
    console.log(`Created ${savedCompetencies.length} competencies successfully`);

    // Create resources
    console.log('Creating resources...');
    const resources = [
      {
        title: 'The Heart of Leadership',
        description: 'Becoming a Leader People Want to Follow - A foundational book that explores the character-based aspects of leadership, focusing on five essential leadership character traits.',
        type: 'Book',
        source: 'Miller',
        competencyIds: [savedCompetencies[0]._id],
        requiredFor: ['Team Member', 'Trainer'],
        estimatedTimeMinutes: 240,
        content: `
          Key Focus Areas:
          - Understanding true leadership
          - Developing leadership character
          - Thinking others first
          - Building leadership habits
          - Creating a personal leadership philosophy
        `
      },
      {
        title: 'Leaders Made Here',
        description: 'Building a Leadership Culture - A comprehensive guide to creating and sustaining a leadership culture within organizations.',
        type: 'Book',
        source: 'Miller',
        competencyIds: [savedCompetencies[8]._id],
        requiredFor: ['Leader', 'Director'],
        estimatedTimeMinutes: 180,
        content: `
          Key Focus Areas:
          - Seeing the future
          - Engaging others
          - Focusing on results
          - Embodying values
          - Building leadership culture
        `
      },
      {
        title: 'Chess Not Checkers',
        description: 'Elevate Your Leadership Game',
        type: 'Book',
        source: 'Miller',
        competencyIds: [savedCompetencies[6]._id],
        requiredFor: ['Leader', 'Director'],
        estimatedTimeMinutes: 210
      },
      {
        title: 'The Secret of Teams',
        description: 'What Great Teams Know and Do',
        type: 'Book',
        source: 'Miller',
        competencyIds: [savedCompetencies[4]._id],
        requiredFor: ['Trainer', 'Leader'],
        estimatedTimeMinutes: 180
      },
      {
        title: 'Win the Heart',
        description: 'How to Create a Culture of Full Engagement',
        type: 'Book',
        source: 'Miller',
        competencyIds: [savedCompetencies[8]._id],
        requiredFor: ['Director'],
        estimatedTimeMinutes: 200
      }
    ];

    await Resource.insertMany(resources);
    console.log(`Created ${resources.length} resources successfully`);

    // Create template plans
    console.log('Creating template plans...');
    const templatePlans = [
      {
        name: 'Learning to Lead',
        description: 'A comprehensive 6-month leadership development program based on Mark Miller\'s books, designed to develop foundational leadership skills through structured reading, reflection, and practical application.',
        currentLevel: 'Team Member',
        targetLevel: 'Trainer',
        roleType: 'Operations',
        duration: 6,
        isTemplate: true,
        status: 'active',
        competencies: [
          {
            competencyId: savedCompetencies.find(sc => sc.name === 'Character-First Leadership')._id,
            required: true,
            order: 1
          },
          {
            competencyId: savedCompetencies.find(sc => sc.name === 'Service-Oriented Mindset')._id,
            required: true,
            order: 2
          }
        ],
        customizations: {
          notes: `
Program Structure:

LEVEL 1: FOUNDATIONS (Months 1-2)
- The Heart of Leadership book study
- Daily reading and reflection logs
- Weekly character assessments
- Leadership mindset development
- Monthly check-ins with mentor

LEVEL 2: SERVE MODEL (Months 3-4)
- Leaders Made Here book study
- See the Future exercises
- Engage and Develop Others activities
- Reinvent Continuously challenges
- Value Results and Relationships
- Embody Values practices
- Monthly leadership discussions

LEVEL 3: LEADERSHIP MASTERY (Months 5-6)
- Practical application projects
- Leadership shadowing
- Team development activities
- Final assessment and presentation

Required Materials:
1. The Heart of Leadership by Mark Miller
2. Leaders Made Here by Mark Miller

Tracking and Accountability:
- Daily reading logs with observations
- Weekly reflection submissions
- Monthly mentor check-ins
- Quarterly progress reviews
- Leadership behavior assessments

Success Metrics:
- Book completion and comprehension
- Application of concepts in daily work
- Leadership behavior demonstrations
- Team member feedback
- Mentor evaluations

Completion Requirements:
- Finish both books with documented reflections
- Complete all monthly check-ins
- Pass quarterly assessments
- Demonstrate leadership behaviors
- Final presentation of learning journey
          `
        }
      },
      {
        name: 'Team Member Foundation Track',
        description: 'A structured 6-month program designed to build essential leadership foundations for team members, focusing on character development, operational excellence, and service leadership.',
        currentLevel: 'Team Member',
        targetLevel: 'Trainer',
        roleType: 'Operations',
        duration: 6,
        isTemplate: true,
        status: 'active',
        competencies: teamMemberCompetencies.map((c, index) => ({
          competencyId: savedCompetencies.find(sc => sc.name === c.name)._id,
          required: true,
          order: index + 1
        })),
        customizations: {
          notes: `
Program Structure:

LEVEL 1: CHARACTER FOUNDATIONS (Months 1-2)
- Complete Character First Leadership Assessment
- Study core leadership values and principles
- Begin daily leadership journal
- Shadow experienced team members
- Weekly reflection on leadership observations
- Monthly character development workshops

LEVEL 2: OPERATIONAL MASTERY (Months 2-4)
- Master standard operating procedures
- Cross-train in all positions
- Develop problem-solving skills
- Lead pre-shift meetings
- Create and implement process improvements
- Monthly operational excellence reviews

LEVEL 3: SERVICE LEADERSHIP (Months 4-6)
- Lead by example in guest service
- Mentor new team members
- Develop conflict resolution skills
- Create service improvement initiatives
- Final leadership project presentation

Required Materials:
1. Team Member Leadership Handbook
2. Daily Leadership Journal
3. Standard Operating Procedures Manual
4. Service Excellence Guide

Tracking and Accountability:
- Weekly leadership journal entries
- Monthly competency assessments
- Operational excellence metrics
- Guest service feedback
- Team member feedback surveys
- Leadership behavior observations

Success Metrics:
- Completion of all competency assessments
- Demonstrated mastery of operations
- Positive team member feedback
- Improved guest service metrics
- Leadership project implementation
- Mentor evaluations

Completion Requirements:
- Pass all competency assessments
- Complete leadership journal
- Implement service improvement project
- Receive positive mentor evaluation
- Successfully lead team initiatives
- Final presentation to leadership team
          `
        }
      },
      {
        name: 'Trainer Development Track',
        description: 'A comprehensive 9-month program focused on developing effective trainers who can build and lead high-performing teams while maintaining operational excellence.',
        currentLevel: 'Trainer',
        targetLevel: 'Leader',
        roleType: 'Training',
        duration: 9,
        isTemplate: true,
        status: 'active',
        competencies: [
          ...teamMemberCompetencies
            .filter(c => c.requiredFor.includes('Trainer'))
            .map((c, index) => ({
              competencyId: savedCompetencies.find(sc => sc.name === c.name)._id,
              required: true,
              order: index + 1
            })),
          ...trainerCompetencies.map((c, index) => ({
            competencyId: savedCompetencies.find(sc => sc.name === c.name)._id,
            required: true,
            order: index + teamMemberCompetencies.length + 1
          }))
        ],
        customizations: {
          notes: `
Program Structure:

LEVEL 1: TRAINING FOUNDATIONS (Months 1-3)
- Complete Trainer Certification Program
- Study adult learning principles
- Develop training materials
- Practice presentation skills
- Shadow experienced trainers
- Monthly training workshops

LEVEL 2: COACHING EXCELLENCE (Months 3-6)
- Master coaching techniques
- Develop feedback skills
- Create development plans
- Lead training sessions
- Conduct performance evaluations
- Monthly coaching clinics

LEVEL 3: TEAM DEVELOPMENT (Months 6-9)
- Build high-performing teams
- Implement team building activities
- Lead team projects
- Develop training programs
- Create team development strategies
- Final certification project

Required Materials:
1. Trainer Development Manual
2. Coaching Excellence Guide
3. Team Building Toolkit
4. Training Resource Library

Tracking and Accountability:
- Weekly coaching logs
- Monthly trainee evaluations
- Training effectiveness metrics
- Team performance indicators
- Leadership assessments
- Development plan progress

Success Metrics:
- Trainer certification completion
- Positive trainee feedback
- Team performance improvements
- Training program effectiveness
- Leadership competency development
- Project implementation success

Completion Requirements:
- Complete trainer certification
- Develop training materials
- Successfully train team members
- Lead team development projects
- Pass leadership assessments
- Final certification presentation
          `
        }
      },
      {
        name: 'Leadership Excellence Track',
        description: 'An intensive 12-month leadership development program designed to transform effective trainers into strategic leaders capable of driving organizational success.',
        currentLevel: 'Leader',
        targetLevel: 'Director',
        roleType: 'Management',
        duration: 12,
        isTemplate: true,
        status: 'active',
        competencies: [
          ...leaderCompetencies.map((c, index) => ({
            competencyId: savedCompetencies.find(sc => sc.name === c.name)._id,
            required: true,
            order: index + 1
          }))
        ],
        customizations: {
          notes: `
Program Structure:

LEVEL 1: STRATEGIC LEADERSHIP (Months 1-4)
- Develop strategic thinking skills
- Create business plans
- Study financial management
- Lead organizational change
- Build strategic partnerships
- Monthly strategy sessions

LEVEL 2: OPERATIONAL LEADERSHIP (Months 4-8)
- Master resource management
- Optimize business processes
- Develop performance metrics
- Lead multiple teams
- Drive business results
- Quarterly business reviews

LEVEL 3: PEOPLE LEADERSHIP (Months 8-12)
- Build leadership culture
- Develop future leaders
- Create succession plans
- Lead organizational initiatives
- Drive innovation
- Final leadership project

Required Materials:
1. Strategic Leadership Manual
2. Business Operations Guide
3. People Development Toolkit
4. Leadership Case Studies

Tracking and Accountability:
- Monthly strategic plans
- Quarterly business reviews
- Team performance metrics
- Leadership assessments
- Development plan progress
- Project implementation tracking

Success Metrics:
- Business performance improvements
- Team development success
- Strategic initiative implementation
- Leadership competency mastery
- Organizational impact
- Innovation and growth metrics

Completion Requirements:
- Successfully lead business unit
- Develop future leaders
- Implement strategic initiatives
- Drive business results
- Pass leadership assessments
- Final project presentation
          `
        }
      },
      {
        name: 'Director Strategic Track',
        description: 'An advanced 12-month program focused on developing strategic business leaders capable of driving organizational growth, innovation, and cultural excellence.',
        currentLevel: 'Director',
        targetLevel: 'Director',
        roleType: 'Management',
        duration: 12,
        isTemplate: true,
        status: 'active',
        competencies: [
          ...directorCompetencies.map((c, index) => ({
            competencyId: savedCompetencies.find(sc => sc.name === c.name)._id,
            required: true,
            order: index + 1
          }))
        ],
        customizations: {
          notes: `
Program Structure:

LEVEL 1: STRATEGIC VISION (Months 1-4)
- Develop organizational vision
- Create long-term strategies
- Lead change management
- Build strategic partnerships
- Drive innovation initiatives
- Monthly executive reviews

LEVEL 2: CULTURAL LEADERSHIP (Months 4-8)
- Define organizational culture
- Implement cultural initiatives
- Build leadership pipeline
- Drive engagement strategies
- Lead organizational change
- Quarterly culture assessments

LEVEL 3: BUSINESS MASTERY (Months 8-12)
- Drive business growth
- Lead multiple business units
- Develop market strategies
- Create succession plans
- Build sustainable systems
- Final strategic project

Required Materials:
1. Executive Leadership Guide
2. Cultural Transformation Toolkit
3. Strategic Business Planning Manual
4. Organizational Development Resources

Tracking and Accountability:
- Monthly strategic reviews
- Quarterly business assessments
- Cultural metrics tracking
- Leadership pipeline development
- Organizational health indicators
- Strategic initiative progress

Success Metrics:
- Business growth and profitability
- Cultural transformation success
- Leadership development effectiveness
- Strategic initiative implementation
- Market position improvements
- Innovation and adaptation metrics

Completion Requirements:
- Drive organizational growth
- Transform company culture
- Develop future executives
- Implement strategic vision
- Lead change initiatives
- Final strategic presentation
          `
        }
      }
    ];

    try {
      console.log(`Attempting to insert ${templatePlans.length} template plans:`, templatePlans.map(p => p.name).join(', '));
      const insertedPlans = await DevelopmentPlan.insertMany(templatePlans);
      console.log(`Successfully inserted ${insertedPlans.length} plans:`, insertedPlans.map(p => p.name).join(', '));
    } catch (error) {
      console.error('Failed to create template plans. Error:', error.message);
      if (error.errors) {
        Object.keys(error.errors).forEach(key => {
          console.error(`Validation error for ${key}:`, error.errors[key].message);
        });
      }
      throw error;
    }

    console.log('Leadership development seed data created successfully');
  } catch (error) {
    console.error('Error seeding data:', error.message);
    process.exit(1);
  }
  process.exit(0);
};

export default seedLeadershipData; 