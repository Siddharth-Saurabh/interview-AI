import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    userEmail: {
        type: String,
        default: 'guest@interviewai.dev'
    },
    role: {
        type: String,
        required: true
    },
    level: {
        type: String,
        enum: ['Junior', 'Mid-Level', 'Senior', 'Lead/Architect'],
        default: 'Mid-Level'
    },
    techStack: [String],
    interviewType: {
        type: String,
        enum: ['Technical', 'Behavioral', 'System Design', 'Live Coding', 'HR'],
        default: 'Technical'
    },
    mode: {
        type: String,
        enum: ['text', 'virtual', 'video'],
        default: 'video'
    },
    interviewerPersonality: {
        type: String,
        default: 'Professional'
    },
    durationMinutes: {
        type: Number,
        default: 30
    },
    questions: [
        {
            question: String,
            category: String,
            type: {
                type: String,
                enum: ['conceptual', 'coding', 'behavioral', 'system-design'],
                default: 'conceptual'
            },
            title: String,
            description: String,
            examples: [
                {
                    input: String,
                    output: String,
                    explanation: String
                }
            ],
            constraints: [String],
            starterCode: String,
            language: {
                type: String,
                default: 'javascript'
            },
            testCases: [
                {
                    input: String,
                    expectedOutput: String,
                    description: String
                }
            ],
            userAnswer: String,
            codeSolution: String,
            answerMode: {
                type: String,
                enum: ['text', 'voice', 'code'],
                default: 'text'
            },
            responseTime: {
                type: Number,
                default: 0
            },
            answerDuration: {
                type: Number,
                default: 0
            },
            fillerWordCount: {
                type: Number,
                default: 0
            },
            wordCount: {
                type: Number,
                default: 0
            },
            feedback: {
                score: Number, // 1 to 10
                strengths: [String],
                improvements: [String],
                idealAnswer: String,
                idealCodeSolution: String,
                timeComplexity: String,
                spaceComplexity: String,
                summary: String,
                followUpQuestion: String,
                technicalKnowledge: Number,
                communication: Number,
                problemSolving: Number,
                clarity: Number,
                confidence: Number,
                codeQuality: Number
            }
        }
    ],
    analytics: {
        technicalKnowledge: { type: Number, default: 0 },
        communication: { type: Number, default: 0 },
        problemSolving: { type: Number, default: 0 },
        clarity: { type: Number, default: 0 },
        confidence: { type: Number, default: 0 },
        codeQuality: { type: Number, default: 0 },
        totalTimeSeconds: { type: Number, default: 0 },
        fillerWordCount: { type: Number, default: 0 },
        avgResponseTime: { type: Number, default: 0 }
    },
    overallScore: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['in-progress', 'completed'],
        default: 'in-progress'
    }
}, {
    timestamps: true
});

const Interview = mongoose.model('Interview', interviewSchema);
export default Interview;
