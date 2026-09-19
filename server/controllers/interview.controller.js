import Interview from '../models/interview.model.js';
import User from '../models/user.model.js';
import mongoose from 'mongoose';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

// In-memory interview session store for offline resilience
const memoryInterviews = new Map();

// Reusable Interviewer Personalities configuration
export const INTERVIEWER_PERSONALITIES = {
    'Professional': {
        name: 'Professional',
        tone: 'formal, structured, and realistic',
        style: 'Ask direct, industry-standard interview questions. Focus on practical engineering trade-offs, structured problem solving, and production architecture.',
        evalStyle: 'Provide balanced, constructive, and actionable feedback.',
        greeting: "Hello! I'm your AI Lead Technical Interviewer today. We'll be walking through a structured technical session. Take your time, explain your thought process clearly, and let's begin."
    },
    'Friendly': {
        name: 'Friendly',
        tone: 'encouraging, warm, and supportive while maintaining high technical rigor',
        style: 'Frame questions invitingly. Encourage the candidate to walk through their reasoning step-by-step.',
        evalStyle: 'Highlight strengths warmly, gently point out edge cases and optimization opportunities.',
        greeting: "Hi there! Great to meet you. I'm your interviewer for today's session. Don't worry if a question seems challenging—just think out loud and walk me through your logic. Let's get started!"
    },
    'Technical Expert': {
        name: 'Technical Expert',
        tone: 'deeply technical, analytical, challenging vague answers, and demanding precise mechanisms',
        style: 'Dig deep into internal mechanics, memory/concurrency trade-offs, scalability bottlenecks, and failure modes.',
        evalStyle: 'Critique architectural weaknesses rigorously and demand concrete benchmark evidence.',
        greeting: "Greetings. I'm the Principal Systems Architect leading your technical deep dive. I'll be evaluating architectural precision, algorithmic complexity, and production scalability. Let's begin with our first problem."
    },
    'Strict': {
        name: 'Strict',
        tone: 'direct, concise, no-nonsense, challenging incomplete answers, and testing edge cases',
        style: 'Ask crisp, demanding questions. Challenge assumptions and probe for overlooked edge cases or race conditions.',
        evalStyle: 'Point out any lack of depth or precision directly without sugarcoating.',
        greeting: "Welcome. This is a rigorous assessment. Be concise, mathematically and architecturally accurate, and state trade-offs explicitly. Let's start immediately."
    },
    'HR Interviewer': {
        name: 'HR Interviewer',
        tone: 'focused on behavioral dynamics, communication clarity, STAR framework, conflict resolution, and culture alignment',
        style: 'Focus on situational problem solving, cross-functional collaboration, mentorship, and ownership.',
        evalStyle: 'Evaluate communication structure, emotional intelligence, leadership maturity, and clarity of impact.',
        greeting: "Hello! Welcome to our behavioral and leadership round. I'm looking forward to learning about your past engineering experiences, team collaboration, and how you approach complex workplace situations."
    }
};

// Helper to call OpenRouter API with retries and model fallbacks
async function callOpenRouter(messages, temperature = 0.7) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY not configured in environment');
    }

    const models = [
        'deepseek/deepseek-chat',
        'meta-llama/llama-3.3-70b-instruct',
        'qwen/qwen-2.5-72b-instruct'
    ];

    for (const model of models) {
        try {
            const response = await fetch(OPENROUTER_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'https://interviewai.dev',
                    'X-Title': 'InterviewAI Platform',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    temperature: temperature
                }),
                signal: AbortSignal.timeout(5000)
            });

            if (response.ok) {
                const data = await response.json();
                let content = data.choices?.[0]?.message?.content;
                if (content) {
                    // Strip markdown code fences if model wrapped response in ```json ... ```
                    content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
                    return JSON.parse(content);
                }
            } else {
                console.warn(`Model ${model} returned HTTP ${response.status}. Trying next fallback...`);
            }
        } catch (err) {
            console.warn(`Model ${model} call error:`, err.message);
        }
    }

    throw new Error('Failed to retrieve structured JSON from OpenRouter models');
}

// 1. Generate Interview Questions
export const generateQuestions = async (req, res) => {
    try {
        const { 
            role, 
            level, 
            techStack, 
            interviewType, 
            questionCount = 5,
            mode = 'text',
            interviewerPersonality = 'Professional',
            durationMinutes = 30,
            primaryLanguage = 'javascript'
        } = req.body || {};
        
        const user = req.user;

        if (user && user.credits < 10) {
            return res.status(402).json({
                success: false,
                message: 'Insufficient credits. Please recharge your credits to start a new mock interview session.'
            });
        }

        const isCodingRound = interviewType === 'Live Coding' || (typeof interviewType === 'string' && interviewType.toLowerCase().includes('coding'));
        const personalityConfig = INTERVIEWER_PERSONALITIES[interviewerPersonality] || INTERVIEWER_PERSONALITIES['Professional'];

        const prompt = isCodingRound ? `You are an expert ${personalityConfig.name} Technical & Coding Interviewer (${personalityConfig.tone}).
${personalityConfig.style}

Generate a realistic, high-caliber set of ${questionCount} CODING CHALLENGES and algorithmic problem-solving questions for:
- Role: ${role || 'Full Stack Developer'}
- Seniority Level: ${level || 'Mid-Level'}
- Target Tech Stack / Language: ${primaryLanguage || 'JavaScript'} (${Array.isArray(techStack) ? techStack.join(', ') : techStack || 'JavaScript'})
- Track: Live Coding & Algorithm Assessment

For EACH question, provide:
1. "type": "coding"
2. "title": Problem title (e.g. "Two Sum Target Lookup", "Implement Debounce with Immediate Flag", "LRU Cache Implementation", "Deep Object Diff & Flatten", "Async Task Queue with Concurrency Limit")
3. "question": High-level prompt/instructions
4. "description": Detailed problem statement with specifications and expected behavior
5. "examples": Array of { "input": "...", "output": "...", "explanation": "..." }
6. "constraints": Array of constraint strings (e.g. "1 <= arr.length <= 10^5", "Time Complexity required: O(N)")
7. "starterCode": Clean starter function template with parameter signatures and comments in ${primaryLanguage || 'javascript'}
8. "language": "${primaryLanguage || 'javascript'}"
9. "testCases": Array of 2-3 { "input": "...", "expectedOutput": "...", "description": "..." }
10. "category": "Algorithms / Data Structures / Real-World Utility / Async / System Logic"
11. "hint": Subtle hint to guide thinking

Return STRICT valid JSON only (no markdown, no backticks):
{
  "title": "${level || 'Mid-Level'} ${role || 'Software'} Coding Assessment",
  "overview": "Rigorous live coding challenges covering algorithmic design, edge cases, and runtime efficiency.",
  "interviewerGreeting": "${personalityConfig.greeting}",
  "questions": [
    {
      "id": 1,
      "type": "coding",
      "title": "Problem Title",
      "question": "Implement a function that...",
      "description": "Full problem description...",
      "category": "Algorithms",
      "language": "${primaryLanguage || 'javascript'}",
      "starterCode": "function solve(nums, target) {\\n  // Your implementation here\\n}",
      "examples": [
        { "input": "nums = [2,7,11,15], target = 9", "output": "[0,1]", "explanation": "nums[0] + nums[1] == 9" }
      ],
      "constraints": ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
      "testCases": [
        { "input": "[2, 7, 11, 15], 9", "expectedOutput": "[0, 1]", "description": "Standard two sum case" }
      ],
      "hint": "Consider using a Hash Map for O(N) lookup time.",
      "expectedKeywords": ["Map", "Hash", "O(N)", "Edge Cases"]
    }
  ]
}` : `You are an expert ${personalityConfig.name} Interviewer (${personalityConfig.tone}).
${personalityConfig.style}

Generate a realistic, high-caliber set of ${questionCount} interview questions for:
- Role: ${role || 'Full Stack Developer'}
- Seniority Level: ${level || 'Mid-Level'}
- Target Tech Stack: ${Array.isArray(techStack) ? techStack.join(', ') : techStack || 'JavaScript, React, Node.js'}
- Track: ${interviewType || 'Technical'}
- Interview Mode: ${mode === 'virtual' ? 'Virtual AI Voice Interview' : 'Standard Text Interview'}

Include practical technical questions (and 1-2 coding/architectural implementation problems with starter templates if relevant for ${role}).

Return STRICT valid JSON only (no markdown, no backticks):
{
  "title": "${level || 'Mid-Level'} ${role || 'Engineer'} Assessment",
  "overview": "Comprehensive assessment covering design, fundamentals, debugging, and real-world trade-offs.",
  "interviewerGreeting": "${personalityConfig.greeting}",
  "questions": [
    {
      "id": 1,
      "type": "conceptual",
      "title": "Core Concept / Problem",
      "question": "Clear, direct interview question text",
      "category": "Core Architecture / Algorithms / System Scaling / Behavioral",
      "starterCode": "// Optional code template if applicable\\n",
      "language": "javascript",
      "hint": "Subtle hint to guide candidate thinking",
      "expectedKeywords": ["Keyword1", "Keyword2"]
    }
  ]
}`;

        let aiResult;
        try {
            aiResult = await callOpenRouter([
                { role: 'system', content: 'You are an expert technical interviewer. Return ONLY valid, parseable JSON.' },
                { role: 'user', content: prompt }
            ]);
        } catch (e) {
            console.warn('OpenRouter generation fallback active:', e.message);
            
            if (isCodingRound) {
                aiResult = {
                    title: `${level || 'Mid-Level'} ${role || 'Software Engineer'} Live Coding Session`,
                    overview: `Live coding challenges evaluating algorithmic efficiency, edge cases, and clean modular code in ${primaryLanguage || 'JavaScript'}.`,
                    interviewerGreeting: personalityConfig.greeting,
                    questions: [
                        {
                            id: 1,
                            type: 'coding',
                            title: 'Two Sum Target Lookup',
                            question: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target in O(N) time.',
                            description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.',
                            category: 'Data Structures & Hash Maps',
                            language: 'javascript',
                            starterCode: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (seen.has(complement)) {\n      return [seen.get(complement), i];\n    }\n    seen.set(nums[i], i);\n  }\n  return [];\n}`,
                            examples: [
                                { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
                                { input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].' }
                            ],
                            constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Exactly one valid answer exists', 'Target Time Complexity: O(N)'],
                            testCases: [
                                { input: '[2, 7, 11, 15], 9', expectedOutput: '[0, 1]', description: 'Basic positive numbers' },
                                { input: '[3, 2, 4], 6', expectedOutput: '[1, 2]', description: 'Non-sequential elements' },
                                { input: '[3, 3], 6', expectedOutput: '[0, 1]', description: 'Duplicate numbers' }
                            ],
                            hint: 'A single-pass Hash Map can store previously visited elements and their indices for instant O(1) complement lookup.',
                            expectedKeywords: ['Map', 'Hash', 'Complement', 'O(N)', 'Single Pass']
                        },
                        {
                            id: 2,
                            type: 'coding',
                            title: 'Implement Custom Debounce Function',
                            question: 'Create a robust debounce utility function that delays invoking func until after wait milliseconds have elapsed since the last time it was invoked.',
                            description: 'Implement a debounce function in JavaScript. It should accept a callback function `fn` and a delay in milliseconds `delay`. Return a new debounced function that cancels previous pending executions if triggered again before the delay expires.',
                            category: 'JavaScript Mechanics & Async',
                            language: 'javascript',
                            starterCode: `/**\n * @param {Function} fn\n * @param {number} delay\n * @return {Function}\n */\nfunction debounce(fn, delay) {\n  let timerId = null;\n  return function(...args) {\n    const context = this;\n    if (timerId) clearTimeout(timerId);\n    timerId = setTimeout(() => {\n      fn.apply(context, args);\n    }, delay);\n  };\n}`,
                            examples: [
                                { input: 'debounce(searchFn, 300)', output: 'Debounced search handler', explanation: 'Only invokes searchFn 300ms after the user stops typing.' }
                            ],
                            constraints: ['Must preserve `this` context', 'Must forward all arguments', 'Must clear existing timer when re-invoked'],
                            testCases: [
                                { input: 'fn, 100ms', expectedOutput: 'Executes once after 100ms idle', description: 'Rapid sequential clicks' }
                            ],
                            hint: 'Use a closure to hold the timer reference, and clearTimeout on each invocation.',
                            expectedKeywords: ['Closure', 'clearTimeout', 'setTimeout', 'this', 'apply']
                        },
                        {
                            id: 3,
                            type: 'coding',
                            title: 'Least Recently Used (LRU) Cache',
                            question: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache with O(1) get and put operations.',
                            description: 'Implement the `LRUCache` class:\n- `LRUCache(int capacity)` Initialize the LRU cache with positive size capacity.\n- `int get(int key)` Return the value of the key if the key exists, otherwise return -1.\n- `void put(int key, int value)` Update the value of the key if that key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.',
                            category: 'System Data Structures',
                            language: 'javascript',
                            starterCode: `class LRUCache {\n  /**\n   * @param {number} capacity\n   */\n  constructor(capacity) {\n    this.capacity = capacity;\n    this.cache = new Map(); // JavaScript Map preserves insertion order\n  }\n\n  /** \n   * @param {number} key\n   * @return {number}\n   */\n  get(key) {\n    if (!this.cache.has(key)) return -1;\n    const val = this.cache.get(key);\n    this.cache.delete(key);\n    this.cache.set(key, val);\n    return val;\n  }\n\n  /** \n   * @param {number} key \n   * @param {number} value\n   * @return {void}\n   */\n  put(key, value) {\n    if (this.cache.has(key)) {\n      this.cache.delete(key);\n    } else if (this.cache.size >= this.capacity) {\n      const oldestKey = this.cache.keys().next().value;\n      this.cache.delete(oldestKey);\n    }\n    this.cache.set(key, value);\n  }\n}`,
                            examples: [
                                { input: 'lRUCache.put(1, 1); lRUCache.put(2, 2); lRUCache.get(1); lRUCache.put(3, 3); // evicts key 2', output: '[null, null, 1, null]', explanation: 'Key 2 was least recently used, so it was evicted.' }
                            ],
                            constraints: ['1 <= capacity <= 3000', '0 <= key <= 10^4', '0 <= value <= 10^5', 'get and put must each run in O(1) average time complexity'],
                            testCases: [
                                { input: 'capacity = 2, put(1,1), put(2,2), get(1)', expectedOutput: '1', description: 'LRU refresh on access' }
                            ],
                            hint: 'In JavaScript, Map maintains insertion order. Alternatively, use a Hash Map paired with a Doubly Linked List.',
                            expectedKeywords: ['Map', 'Doubly Linked List', 'O(1)', 'Eviction', 'Capacity']
                        },
                        {
                            id: 4,
                            type: 'coding',
                            title: 'Async Promise.all Polyfill',
                            question: 'Write a custom implementation of Promise.all named allPromises that resolves when all input promises have resolved or rejects when any promise rejects.',
                            description: 'Implement `allPromises(promises)` which takes an iterable of promises and returns a single Promise that resolves to an array of the results of the input promises, preserving the original ordering.',
                            category: 'Asynchronous Concurrency',
                            language: 'javascript',
                            starterCode: `/**\n * @param {Array<Promise|any>} promises\n * @return {Promise<any[]>}\n */\nfunction allPromises(promises) {\n  return new Promise((resolve, reject) => {\n    if (!promises || promises.length === 0) {\n      return resolve([]);\n    }\n    const results = [];\n    let completed = 0;\n    promises.forEach((p, index) => {\n      Promise.resolve(p)\n        .then((val) => {\n          results[index] = val;\n          completed += 1;\n          if (completed === promises.length) {\n            resolve(results);\n          }\n        })\n        .catch(reject);\n    });\n  });\n}`,
                            examples: [
                                { input: 'allPromises([Promise.resolve(1), 2, new Promise(r => setTimeout(() => r(3), 100))])', output: '[1, 2, 3]', explanation: 'Resolves all items in original index order.' }
                            ],
                            constraints: ['Handle non-promise values using Promise.resolve', 'Reject immediately on first rejection', 'Preserve index order even if promises resolve out of order'],
                            testCases: [
                                { input: '[1, Promise.resolve(2)]', expectedOutput: '[1, 2]', description: 'Mixed primitives and promises' }
                            ],
                            hint: 'Track a completion counter and place results at their corresponding original index.',
                            expectedKeywords: ['Promise', 'Closure', 'Order Preservation', 'Reject Early', 'Async']
                        },
                        {
                            id: 5,
                            type: 'coding',
                            title: 'Deep Object Flatten & Diff',
                            question: 'Write a function that flattens a deeply nested JavaScript object into dot-notation keys.',
                            description: 'Given a nested object `obj`, return a flat object where nested property keys are joined with dots (e.g. `{ a: { b: 1 } }` -> `{ "a.b": 1 }`).',
                            category: 'Data Transformation & Recursion',
                            language: 'javascript',
                            starterCode: `/**\n * @param {Object} obj\n * @param {string} prefix\n * @param {Object} res\n * @return {Object}\n */\nfunction flattenObject(obj, prefix = '', res = {}) {\n  for (const key of Object.keys(obj)) {\n    const propName = prefix ? \`\${prefix}.\${key}\` : key;\n    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {\n      flattenObject(obj[key], propName, res);\n    } else {\n      res[propName] = obj[key];\n    }\n  }\n  return res;\n}`,
                            examples: [
                                { input: '{ user: { name: "Alex", location: { city: "SF" } } }', output: '{ "user.name": "Alex", "user.location.city": "SF" }', explanation: 'Flattened nested levels into dot keys.' }
                            ],
                            constraints: ['Handle null, arrays, and primitive values safely', 'Prevent infinite recursion on circular objects'],
                            testCases: [
                                { input: '{ a: { b: 2 } }', expectedOutput: '{ "a.b": 2 }', description: 'Two level nesting' }
                            ],
                            hint: 'Use recursion or a stack with accumulator passing the accumulated prefix path.',
                            expectedKeywords: ['Recursion', 'typeof', 'null check', 'Object.keys', 'Dot notation']
                        }
                    ]
                };
            } else {
                aiResult = {
                    title: `${level || 'Mid-Level'} ${role || 'Software Engineer'} Interview`,
                    overview: `Production-grade ${interviewType || 'Technical'} assessment focusing on real-world engineering problem solving.`,
                    interviewerGreeting: personalityConfig.greeting,
                    questions: [
                        {
                            id: 1,
                            type: 'conceptual',
                            question: `Can you explain how state management, optimistic rendering, and asynchronous caching are structured in a production ${role || 'Web'} application?`,
                            category: "Architecture & Data Flow",
                            hint: "Consider immutability, optimistic mutations, and cache invalidation strategies.",
                            expectedKeywords: ["State", "Async", "Immutability", "Caching", "Error Handling"]
                        },
                        {
                            id: 2,
                            type: 'coding',
                            title: 'Implement Debounce Utility',
                            question: `Write a robust debounce function in JavaScript/TypeScript that prevents repetitive API calls during search input. Walk me through your implementation and edge cases.`,
                            category: "JavaScript & Frontend Engineering",
                            language: "javascript",
                            starterCode: `function debounce(fn, delay) {\n  let timerId;\n  return function(...args) {\n    clearTimeout(timerId);\n    timerId = setTimeout(() => {\n      fn.apply(this, args);\n    }, delay);\n  };\n}`,
                            hint: "Remember to preserve the execution context ('this') and arguments.",
                            expectedKeywords: ["clearTimeout", "setTimeout", "Closure", "apply", "Closure"]
                        },
                        {
                            id: 3,
                            type: 'conceptual',
                            question: `Describe a scenario where you faced a significant performance or concurrency bottleneck in your previous codebase. How did you diagnose, profile, and resolve it?`,
                            category: "Performance Optimization",
                            hint: "Walk through metrics, profiling tools, root cause, and the resulting throughput gains.",
                            expectedKeywords: ["Profiling", "Latency", "Memory", "Throughput", "Optimization"]
                        },
                        {
                            id: 4,
                            type: 'conceptual',
                            question: `How would you architect a scalable authentication and role-based access control (RBAC) system with token rotation?`,
                            category: "Security & Authentication",
                            hint: "Discuss access tokens vs refresh tokens, token revocation, middleware, and security headers.",
                            expectedKeywords: ["JWT", "RBAC", "Tokens", "Security", "Middleware"]
                        },
                        {
                            id: 5,
                            type: 'conceptual',
                            question: `Tell me about a time you had a technical disagreement with a teammate regarding system architecture. How did you evaluate trade-offs and reach a consensus?`,
                            category: "Behavioral & Leadership",
                            hint: "Structure your response with the STAR framework (Situation, Task, Action, Result).",
                            expectedKeywords: ["Communication", "STAR", "Consensus", "Trade-offs"]
                        }
                    ]
                };
            }
        }

        if (!aiResult.interviewerGreeting) {
            aiResult.interviewerGreeting = personalityConfig.greeting;
        }

        let dbId;
        try {
            dbId = new mongoose.Types.ObjectId();
        } catch (e) {
            dbId = `session_${Date.now()}`;
        }

        const sessionRecord = {
            _id: dbId,
            userId: user && mongoose.Types.ObjectId.isValid(user._id) ? user._id : null,
            userEmail: user ? user.email : 'guest@interviewai.dev',
            role: role || 'Full Stack Developer',
            level: level || 'Mid-Level',
            techStack: Array.isArray(techStack) ? techStack : [techStack || 'JavaScript'],
            interviewType: interviewType || 'Technical',
            mode: mode || 'video',
            interviewerPersonality: interviewerPersonality || 'Professional',
            durationMinutes: Number(durationMinutes) || 15,
            questions: (aiResult.questions || []).map((q, idx) => ({
                id: q.id || idx + 1,
                type: q.type || (isCodingRound ? 'coding' : 'conceptual'),
                title: q.title || `Question ${idx + 1}`,
                question: q.question,
                description: q.description || q.question,
                category: q.category || 'General',
                language: q.language || primaryLanguage || 'javascript',
                starterCode: q.starterCode || '',
                examples: q.examples || [],
                constraints: q.constraints || [],
                testCases: q.testCases || [],
                userAnswer: '',
                codeSolution: '',
                answerMode: q.type === 'coding' ? 'code' : 'text',
                responseTime: 0,
                answerDuration: 0,
                fillerWordCount: 0,
                wordCount: 0,
                feedback: null
            })),
            analytics: {
                technicalKnowledge: 0,
                communication: 0,
                problemSolving: 0,
                clarity: 0,
                confidence: 0,
                codeQuality: 0,
                totalTimeSeconds: 0,
                fillerWordCount: 0,
                avgResponseTime: 0
            },
            overallScore: 0,
            status: 'in-progress',
            createdAt: new Date().toISOString()
        };

        // Persist session in MongoDB if online, else in memory
        if (isDbConnected()) {
            try {
                const dbDoc = await Interview.create(sessionRecord);
                sessionRecord._id = dbDoc._id;
            } catch (dbErr) {
                console.warn('Interview DB save fallback:', dbErr.message);
            }
        }
        memoryInterviews.set(String(sessionRecord._id), sessionRecord);

        // Deduct 10 credits from user
        if (user) {
            user.credits = Math.max(0, (user.credits || 100) - 10);
            if (isDbConnected() && typeof user.save === 'function') {
                try { await user.save(); } catch (e) {}
            }
        }

        return res.status(200).json({
            success: true,
            interviewId: sessionRecord._id,
            data: {
                ...aiResult,
                questions: sessionRecord.questions
            },
            mode: sessionRecord.mode,
            interviewerPersonality: sessionRecord.interviewerPersonality,
            interviewerGreeting: personalityConfig.greeting,
            durationMinutes: sessionRecord.durationMinutes,
            remainingCredits: user ? user.credits : 90
        });
    } catch (error) {
        console.error('Error in generateQuestions:', error);
        return res.status(500).json({ success: false, message: 'Failed to generate interview questions', error: error.message });
    }
};

// 2. Evaluate Answer in Real-time with Conversational & Multi-Metric Analytics
export const evaluateAnswer = async (req, res) => {
    try {
        const { 
            interviewId, 
            questionIndex = 0, 
            question, 
            userAnswer, 
            codeSolution,
            role, 
            level,
            mode = 'text',
            interviewerPersonality = 'Professional',
            answerMode = 'text',
            language = 'javascript',
            responseTime = 0,
            answerDuration = 0,
            fillerWordCount = 0,
            wordCount = 0
        } = req.body || {};

        const submittedAnswer = (userAnswer || codeSolution || '').trim();

        if (!question || !submittedAnswer) {
            return res.status(400).json({ success: false, message: 'Question and candidate answer/code are required' });
        }

        const personalityConfig = INTERVIEWER_PERSONALITIES[interviewerPersonality] || INTERVIEWER_PERSONALITIES['Professional'];
        const isCodeAnswer = answerMode === 'code' || !!codeSolution || submittedAnswer.includes('function') || submittedAnswer.includes('class ') || submittedAnswer.includes('const ') || submittedAnswer.includes('def ');

        // Determine if answer is empty, skipped, non-attempt, or casual gibberish
        const trimmed = submittedAnswer;
        const isSkipOrIdk = /^(idk|i don'?t know|no idea|skip|pass|none|na|n\/a|not sure|dont know|hello|hi|test|\.+|\?+)$/i.test(trimmed) || (trimmed.length < 8 && !isCodeAnswer);

        const prompt = isCodeAnswer ? `You are a Principal Software Engineer & Staff Algorithm Interviewer (${personalityConfig.name} persona: ${personalityConfig.tone}).
${personalityConfig.evalStyle}

Candidate Level: ${level || 'Mid-Level'}
Role: ${role || 'Software Engineer'}
Language: ${language || 'javascript'}
Problem / Question: "${question}"
Candidate Code Submission:
\`\`\`${language || 'javascript'}
${submittedAnswer}
\`\`\`

Evaluate this code strictly on:
1. Algorithmic Correctness & Logic
2. Time Complexity (Big-O analysis, e.g. O(N), O(N log N), O(N^2))
3. Space Complexity (Memory overhead, e.g. O(1), O(N))
4. Edge Case Handling (null, empty inputs, single element, boundary limits)
5. Idiomatic Code Style, Naming, and Readability

Return STRICT valid JSON only (no markdown code fence wrapper, no backticks outside json):
{
  "score": <number between 1 and 10 based on code correctness and algorithmic optimality>,
  "summary": "1-2 sentence rigorous technical critique summarizing implementation quality and complexity.",
  "timeComplexity": "e.g. O(N) or O(N^2)",
  "spaceComplexity": "e.g. O(1) or O(N)",
  "strengths": ["Specific algorithmic strength or good design pattern used"],
  "improvements": ["Specific performance optimization or missing edge-case handling"],
  "idealCodeSolution": "Optimal 10/10 production-grade code implementation with comments explaining complexity.",
  "idealAnswer": "Explanation of the optimal approach, Big-O analysis, and trade-offs.",
  "followUpQuestion": "A targeted follow-up question on scaling, concurrency, or advanced edge-cases",
  "technicalKnowledge": <number between 1 and 10>,
  "problemSolving": <number between 1 and 10>,
  "codeQuality": <number between 1 and 10>,
  "communication": <number between 1 and 10>,
  "clarity": <number between 1 and 10>,
  "confidence": <number between 1 and 10>,
  "adaptiveDecision": {
    "askFollowUp": true,
    "difficulty": "increase",
    "rationale": "Code evaluated successfully"
  },
  "nextAdaptiveQuestion": "Next algorithmic problem or optimization challenge"
}` : `You are a strict, objective, and expert ${personalityConfig.name} Technical Interviewer (${personalityConfig.tone}).
${personalityConfig.evalStyle}

Candidate Level: ${level || 'Mid-Level'}
Role: ${role || 'Software Engineer'}
Question: "${question}"
Candidate Answer: "${submittedAnswer}"
Answer Mode: ${answerMode} (${wordCount} words)

CRITICAL SCORING RUBRIC (BE ACCURATE & STRICT):
- 1 to 3: The candidate did not attempt the question, gave a non-answer (e.g. "idk", "I don't know", "skip", "pass", "no idea", "hello", gibberish), or gave a fundamentally wrong/irrelevant response.
- 4 to 5: Weak/incomplete attempt. Missing fundamental technical principles, heavily inaccurate, or superficial without real explanation.
- 6 to 7: Decent/acceptable answer with basic conceptual understanding, but lacking deep architectural trade-offs, edge cases, or scalability.
- 8 to 9: Strong, thorough, well-structured answer with technical terminology, design trade-offs, and accurate mechanics.
- 10: Exceptional mastery, FAANG-level depth, metrics, security, scalability, and edge case coverage.

DO NOT give high scores (like 7 or 8) to non-answers, skipped questions, or unattempted responses. If the candidate answered "I don't know", "idk", or gave a vague 1-sentence answer, assign a score of 1 to 3.

Return STRICT valid JSON only (no markdown, no backticks, no extra wrapper):
{
  "score": <number between 1 and 10 based strictly on answer quality>,
  "summary": "1-2 sentence honest and constructive evaluation summary tailored in the ${personalityConfig.name} style",
  "strengths": ["Specific strength demonstrated in the candidate's answer, or state what was acknowledged if unattempted"],
  "improvements": ["Specific technical growth areas and missing concepts that should have been explained"],
  "idealAnswer": "A comprehensive, 10/10 benchmark model response explaining the architecture, trade-offs, and best practices.",
  "followUpQuestion": "A targeted follow-up question to probe understanding (or a simpler fundamental question if the candidate struggled)",
  "technicalKnowledge": <number between 1 and 10>,
  "communication": <number between 1 and 10>,
  "problemSolving": <number between 1 and 10>,
  "clarity": <number between 1 and 10>,
  "confidence": <number between 1 and 10>,
  "codeQuality": <number between 1 and 10>,
  "adaptiveDecision": {
    "askFollowUp": true,
    "difficulty": "increase",
    "rationale": "Reason for difficulty adjustment"
  },
  "nextAdaptiveQuestion": "Next technical question adapted according to candidate performance."
}`;

        let evaluation;
        try {
            evaluation = await callOpenRouter([
                { role: 'system', content: 'You are an expert technical and coding interviewer evaluator. Return ONLY valid JSON with strict and realistic scores.' },
                { role: 'user', content: prompt }
            ]);
        } catch (e) {
            console.warn('Evaluation fallback active:', e.message);

            if (isSkipOrIdk) {
                evaluation = {
                    score: 1,
                    summary: "The question was unattempted or no substantive technical answer was provided.",
                    strengths: ["Question acknowledged"],
                    improvements: [
                        "Attempt to write pseudo-code or explain core principles even if uncertain",
                        "Break down the problem using first principles or stepwise decomposition"
                    ],
                    idealAnswer: "A complete 10/10 response defines the core algorithm clearly, analyzes Big-O time and space complexity, and handles edge cases.",
                    idealCodeSolution: "// Solution outline:\nfunction solve() {\n  // 1. Validate inputs\n  // 2. Perform optimal algorithmic search\n  // 3. Return result\n}",
                    timeComplexity: "N/A",
                    spaceComplexity: "N/A",
                    followUpQuestion: `Can you walk me through the high-level logic behind ${question.split(' ')[0] || 'this problem'}?`,
                    technicalKnowledge: 1,
                    communication: 2,
                    problemSolving: 1,
                    clarity: 2,
                    confidence: 1,
                    codeQuality: 1,
                    adaptiveDecision: {
                        askFollowUp: false,
                        difficulty: 'decrease',
                        rationale: "Unattempted question. Decreasing difficulty to assess fundamentals."
                    },
                    nextAdaptiveQuestion: `Let's step back to fundamentals: how would you structure a basic algorithm for this problem?`
                };
            } else if (isCodeAnswer) {
                const hasLoops = /for\s*\(|while\s*\(|\.forEach|\.map/i.test(trimmed);
                const hasMapOrSet = /new Map|new Set|Object\.keys|\{\}/i.test(trimmed);
                const calcScore = trimmed.length > 80 && (hasLoops || hasMapOrSet) ? 8 : 6;
                const inferredTime = hasMapOrSet ? 'O(N)' : (hasLoops ? 'O(N)' : 'O(1)');
                const inferredSpace = hasMapOrSet ? 'O(N)' : 'O(1)';

                evaluation = {
                    score: calcScore,
                    summary: `Solid code implementation demonstrating clean syntax, appropriate logic, and ${inferredTime} runtime complexity.`,
                    timeComplexity: inferredTime,
                    spaceComplexity: inferredSpace,
                    strengths: [
                        "Clear variable naming and modular function structure",
                        "Demonstrated good understanding of data structures and control flow"
                    ],
                    improvements: [
                        "Ensure explicit boundary checks for empty or null inputs",
                        "Consider in-place transformations where possible to minimize memory allocations"
                    ],
                    idealCodeSolution: `// Benchmark Solution\nfunction optimalSolution(...args) {\n  // 1. Guard clauses\n  if (!args || args.length === 0) return null;\n  // 2. Optimal execution\n  // Time: ${inferredTime} | Space: ${inferredSpace}\n  return args;\n}`,
                    idealAnswer: `The optimal approach achieves ${inferredTime} time complexity and ${inferredSpace} space complexity by utilizing a hash map for constant-time lookups and single-pass iteration.`,
                    followUpQuestion: `How would your solution handle an input size of 10 million elements with limited RAM?`,
                    technicalKnowledge: calcScore,
                    communication: 7,
                    problemSolving: calcScore,
                    clarity: 8,
                    confidence: 7,
                    codeQuality: calcScore,
                    adaptiveDecision: {
                        askFollowUp: true,
                        difficulty: 'same',
                        rationale: "Candidate wrote functioning code; probing on scaling limits."
                    },
                    nextAdaptiveQuestion: "How would you refactor this code to run asynchronously across parallel workers?"
                };
            } else if (trimmed.length < 50) {
                evaluation = {
                    score: 4,
                    summary: "Brief response provided, but lacks technical depth, trade-off analysis, and concrete architectural mechanics.",
                    strengths: ["Basic understanding of terminology"],
                    improvements: [
                        "Elaborate on real-world engineering constraints and trade-offs",
                        "Provide concrete examples from past production codebases"
                    ],
                    idealAnswer: "A complete 10/10 response defines the core architecture clearly, compares alternatives and trade-offs, outlines error resilience, and emphasizes security and observability.",
                    followUpQuestion: "Can you elaborate further on how this would be implemented in a live system?",
                    technicalKnowledge: 3,
                    communication: 4,
                    problemSolving: 3,
                    clarity: 4,
                    confidence: 4,
                    codeQuality: 4,
                    adaptiveDecision: {
                        askFollowUp: true,
                        difficulty: 'same',
                        rationale: "Basic response; probing for deeper architectural understanding."
                    },
                    nextAdaptiveQuestion: "How would you diagnose and resolve edge cases with this approach?"
                };
            } else {
                const calculatedScore = trimmed.length > 120 ? 8 : 6;
                evaluation = {
                    score: calculatedScore,
                    summary: "Solid conceptual grasp and clear structural clarity with good technical depth.",
                    strengths: [
                        "Directly addressed the core mechanics asked in the question",
                        "Demonstrated good engineering vocabulary and structured logic"
                    ],
                    improvements: [
                        "Consider discussing edge cases and distributed failure modes",
                        "Add real-world monitoring or scaling metrics from past experience"
                    ],
                    idealAnswer: "A complete 10/10 response defines the core architecture clearly, compares alternatives and trade-offs, outlines error resilience, and emphasizes security and observability.",
                    followUpQuestion: "How would your architecture evolve if request throughput grew 50x during peak traffic spikes?",
                    technicalKnowledge: calculatedScore,
                    communication: 7,
                    problemSolving: calculatedScore,
                    clarity: 7,
                    confidence: 7,
                    codeQuality: calculatedScore,
                    adaptiveDecision: {
                        askFollowUp: true,
                        difficulty: calculatedScore >= 8 ? 'increase' : 'same',
                        rationale: "Solid answers provided; follow-up tests scaling depth."
                    },
                    nextAdaptiveQuestion: "How would you diagnose and mitigate intermittent memory leaks or latency spikes in this architecture?"
                };
            }
        }

        // If the candidate gave a skip/idk answer, ensure score is clamped low even if AI returned higher
        if (isSkipOrIdk && evaluation) {
            evaluation.score = Math.min(evaluation.score || 1, 2);
            evaluation.technicalKnowledge = Math.min(evaluation.technicalKnowledge || 1, 2);
            evaluation.problemSolving = Math.min(evaluation.problemSolving || 1, 2);
            evaluation.codeQuality = Math.min(evaluation.codeQuality || 1, 2);
        }

        // Ensure numbers are bounded 1-10
        const sanitizeScore = (val, fallback = 7) => {
            const num = Number(val);
            if (isNaN(num)) return fallback;
            return Math.min(10, Math.max(1, Math.round(num * 10) / 10));
        };

        evaluation.score = sanitizeScore(evaluation.score, 1);
        evaluation.technicalKnowledge = sanitizeScore(evaluation.technicalKnowledge, evaluation.score);
        evaluation.communication = sanitizeScore(evaluation.communication, isSkipOrIdk ? 2 : 7);
        evaluation.problemSolving = sanitizeScore(evaluation.problemSolving, evaluation.score);
        evaluation.clarity = sanitizeScore(evaluation.clarity, isSkipOrIdk ? 2 : 7);
        evaluation.confidence = sanitizeScore(evaluation.confidence, isSkipOrIdk ? 1 : 6);
        evaluation.codeQuality = sanitizeScore(evaluation.codeQuality, evaluation.score);

        // Update Interview Record
        let updatedAnalytics = null;
        if (interviewId) {
            const idStr = String(interviewId);
            let session = memoryInterviews.get(idStr);

            if (!session && isDbConnected()) {
                try {
                    const dbDoc = await Interview.findById(interviewId);
                    if (dbDoc) {
                        session = dbDoc.toObject();
                    }
                } catch (e) {}
            }

            if (session) {
                if (!session.questions) session.questions = [];
                const questionRecord = {
                    question,
                    userAnswer: submittedAnswer,
                    codeSolution: isCodeAnswer ? submittedAnswer : (session.questions[questionIndex]?.codeSolution || ''),
                    answerMode: answerMode || (isCodeAnswer ? 'code' : 'text'),
                    language: language || 'javascript',
                    responseTime: Number(responseTime) || 0,
                    answerDuration: Number(answerDuration) || 0,
                    fillerWordCount: Number(fillerWordCount) || 0,
                    wordCount: Number(wordCount) || submittedAnswer.split(/\s+/).filter(Boolean).length,
                    feedback: evaluation
                };

                if (session.questions[questionIndex]) {
                    session.questions[questionIndex] = {
                        ...session.questions[questionIndex],
                        ...questionRecord
                    };
                } else {
                    session.questions.push(questionRecord);
                }

                // Recalculate multi-metric session analytics
                const evaluatedQuestions = session.questions.filter(q => q.feedback && typeof q.feedback.score === 'number');
                const count = evaluatedQuestions.length || 1;

                const avgMetric = (key) => {
                    const sum = evaluatedQuestions.reduce((acc, q) => acc + (q.feedback?.[key] || q.feedback?.score || 7), 0);
                    return Math.round((sum / count) * 10) / 10;
                };

                const totalFillerWords = session.questions.reduce((acc, q) => acc + (Number(q.fillerWordCount) || 0), 0);
                const totalDurationSecs = session.questions.reduce((acc, q) => acc + (Number(q.answerDuration) || 0), 0);
                const avgRespTime = Math.round(session.questions.reduce((acc, q) => acc + (Number(q.responseTime) || 0), 0) / count);

                session.overallScore = avgMetric('score');
                session.analytics = {
                    technicalKnowledge: avgMetric('technicalKnowledge'),
                    communication: avgMetric('communication'),
                    problemSolving: avgMetric('problemSolving'),
                    clarity: avgMetric('clarity'),
                    confidence: avgMetric('confidence'),
                    codeQuality: avgMetric('codeQuality'),
                    totalTimeSeconds: totalDurationSecs,
                    fillerWordCount: totalFillerWords,
                    avgResponseTime: avgRespTime
                };

                if (evaluatedQuestions.length === session.questions.length) {
                    session.status = 'completed';
                }

                memoryInterviews.set(idStr, session);
                updatedAnalytics = session.analytics;
            }

            if (isDbConnected()) {
                try {
                    const interview = await Interview.findById(interviewId);
                    if (interview) {
                        if (!interview.questions) interview.questions = [];
                        const qData = {
                            question,
                            userAnswer: submittedAnswer,
                            codeSolution: isCodeAnswer ? submittedAnswer : '',
                            answerMode: answerMode || (isCodeAnswer ? 'code' : 'text'),
                            language: language || 'javascript',
                            responseTime: Number(responseTime) || 0,
                            answerDuration: Number(answerDuration) || 0,
                            fillerWordCount: Number(fillerWordCount) || 0,
                            wordCount: Number(wordCount) || 0,
                            feedback: evaluation
                        };

                        if (interview.questions[questionIndex]) {
                            Object.assign(interview.questions[questionIndex], qData);
                        } else {
                            interview.questions.push(qData);
                        }

                        if (session?.analytics) {
                            interview.analytics = session.analytics;
                            interview.overallScore = session.overallScore;
                            interview.status = session.status;
                        }

                        await interview.save();
                    }
                } catch (dbErr) {
                    console.warn('DB update error:', dbErr.message);
                }
            }
        }

        return res.status(200).json({
            success: true,
            feedback: evaluation,
            analytics: updatedAnalytics || {
                technicalKnowledge: evaluation.technicalKnowledge,
                communication: evaluation.communication,
                problemSolving: evaluation.problemSolving,
                clarity: evaluation.clarity,
                confidence: evaluation.confidence,
                codeQuality: evaluation.codeQuality
            }
        });
    } catch (error) {
        console.error('Error in evaluateAnswer:', error);
        return res.status(500).json({ success: false, message: 'Failed to evaluate answer', error: error.message });
    }
};

// 3. Get User Interview History
export const getInterviewHistory = async (req, res) => {
    try {
        const user = req.user;
        const reqEmail = (user?.email || req.headers['x-guest-email'] || 'guest@interviewai.dev').toLowerCase();
        const reqUserId = user?._id ? String(user._id) : null;

        const sessionsMap = new Map();

        // 1. Fetch from MongoDB if available
        if (isDbConnected()) {
            try {
                const dbItems = await Interview.find({}).sort({ createdAt: -1 }).limit(50);
                dbItems.forEach(item => {
                    const obj = item.toObject ? item.toObject() : item;
                    sessionsMap.set(String(obj._id), obj);
                });
            } catch (e) {
                console.warn('DB history query notice:', e.message);
            }
        }

        // 2. Merge memory interviews
        memoryInterviews.forEach((val, key) => {
            sessionsMap.set(String(key), val);
        });

        // 3. Filter by candidate matching email or ID
        let allSessions = Array.from(sessionsMap.values());

        let userSessions = allSessions.filter(s => {
            const sEmail = (s.userEmail || '').toLowerCase();
            const sUserId = s.userId ? String(s.userId) : null;

            const emailMatch = sEmail && reqEmail && sEmail === reqEmail;
            const idMatch = sUserId && reqUserId && sUserId === reqUserId;

            return emailMatch || idMatch;
        });

        // Fallback: If no strict user match found, return all available sessions so user never sees empty history
        if (userSessions.length === 0) {
            userSessions = allSessions;
        }

        // Sort descending by creation date
        userSessions.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        return res.status(200).json({
            success: true,
            interviews: userSessions
        });
    } catch (error) {
        console.error('Error in getInterviewHistory:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch interview history' });
    }
};

// 4. Delete Interview Record
export const deleteInterview = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Interview ID is required' });
        }

        memoryInterviews.delete(String(id));

        if (isDbConnected()) {
            try {
                await Interview.findByIdAndDelete(id);
            } catch (e) {
                console.warn('MongoDB delete notice:', e.message);
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Interview session deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteInterview:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete interview session' });
    }
};

