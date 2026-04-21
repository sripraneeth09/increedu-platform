const axios = require('axios');

const questions = [
    {
        text: "When faced with a complex problem, what is your natural instinct?",
            options: [
                { text: "Break it into logical steps and solve systematically", domain: "tech" },
                { text: "Look for opportunities or advantages in the situation", domain: "business" },
                { text: "Approach it with creative thinking and new ideas", domain: "creative" },
                { text: "Consider how it affects people's wellbeing", domain: "healthcare" },
                { text: "Think about how to explain or simplify it for others", domain: "education" }
            ]
        },
        {
            text: "What kind of achievement makes you feel truly proud?",
            options: [
                { text: "Building a working application or system", domain: "tech" },
                { text: "Growing something financially successful", domain: "business" },
                { text: "Creating something visually or emotionally impactful", domain: "creative" },
                { text: "Helping someone recover or feel better", domain: "healthcare" },
                { text: "Helping someone understand something new", domain: "education" }
            ]
        },
        {
            text: "Which activity would you choose without being forced?",
            options: [
                { text: "Experimenting with new technologies", domain: "tech" },
                { text: "Planning a business or side hustle", domain: "business" },
                { text: "Working on a creative project", domain: "creative" },
                { text: "Taking care of someone in need", domain: "healthcare" },
                { text: "Teaching or guiding someone", domain: "education" }
            ]
        },
        {
            text: "What kind of conversations interest you the most?",
            options: [
                { text: "Latest tech trends and innovations", domain: "tech" },
                { text: "Market trends and money-making ideas", domain: "business" },
                { text: "Art, design, and creativity", domain: "creative" },
                { text: "Health, fitness, and wellbeing", domain: "healthcare" },
                { text: "Learning methods and education systems", domain: "education" }
            ]
        },
        {
            text: "If you had unlimited resources, what would you build?",
            options: [
                { text: "A revolutionary tech product", domain: "tech" },
                { text: "A large-scale business empire", domain: "business" },
                { text: "A creative studio or brand", domain: "creative" },
                { text: "A hospital or health service system", domain: "healthcare" },
                { text: "A school or learning platform", domain: "education" }
            ]
        },
        {
            text: "What kind of work makes time pass quickly for you?",
            options: [
                { text: "Coding or solving technical problems", domain: "tech" },
                { text: "Negotiating or planning strategies", domain: "business" },
                { text: "Designing or creating something artistic", domain: "creative" },
                { text: "Helping someone physically or mentally", domain: "healthcare" },
                { text: "Explaining concepts or teaching", domain: "education" }
            ]
        },
        {
            text: "Which type of success do you value most?",
            options: [
                { text: "Creating innovative solutions", domain: "tech" },
                { text: "Achieving financial independence", domain: "business" },
                { text: "Being recognized for creativity", domain: "creative" },
                { text: "Improving lives through care", domain: "healthcare" },
                { text: "Educating and shaping minds", domain: "education" }
            ]
        },
        {
            text: "What would you naturally volunteer for?",
            options: [
                { text: "Building a website or tool", domain: "tech" },
                { text: "Managing or organizing an event", domain: "business" },
                { text: "Designing posters or media", domain: "creative" },
                { text: "Assisting in health camps", domain: "healthcare" },
                { text: "Tutoring or mentoring students", domain: "education" }
            ]
        },
        {
            text: "Which type of challenge excites you more?",
            options: [
                { text: "Debugging a difficult issue", domain: "tech" },
                { text: "Turning an idea into profit", domain: "business" },
                { text: "Creating something original", domain: "creative" },
                { text: "Handling emergency situations", domain: "healthcare" },
                { text: "Making complex topics simple", domain: "education" }
            ]
        },
        {
            text: "What kind of environment do you enjoy most?",
            options: [
                { text: "Structured and system-driven", domain: "tech" },
                { text: "Fast-paced and competitive", domain: "business" },
                { text: "Flexible and expressive", domain: "creative" },
                { text: "Supportive and people-focused", domain: "healthcare" },
                { text: "Interactive and knowledge-driven", domain: "education" }
            ]
        },
        {
            text: "What kind of responsibility do you prefer?",
            options: [
                { text: "Managing systems or code", domain: "tech" },
                { text: "Leading teams or projects", domain: "business" },
                { text: "Producing creative output", domain: "creative" },
                { text: "Taking care of individuals", domain: "healthcare" },
                { text: "Guiding learners", domain: "education" }
            ]
        },
        {
            text: "What do you enjoy improving the most?",
            options: [
                { text: "Efficiency of systems", domain: "tech" },
                { text: "Business performance", domain: "business" },
                { text: "Visual or creative quality", domain: "creative" },
                { text: "Health conditions", domain: "healthcare" },
                { text: "Learning outcomes", domain: "education" }
            ]
        },
        {
            text: "What type of role attracts you?",
            options: [
                { text: "Developer or engineer", domain: "tech" },
                { text: "Entrepreneur or manager", domain: "business" },
                { text: "Designer or creator", domain: "creative" },
                { text: "Doctor or caregiver", domain: "healthcare" },
                { text: "Teacher or mentor", domain: "education" }
            ]
        },
        {
            text: "What kind of results make you happiest?",
            options: [
                { text: "A system working perfectly", domain: "tech" },
                { text: "Business growth and profit", domain: "business" },
                { text: "Creative appreciation", domain: "creative" },
                { text: "Patient recovery", domain: "healthcare" },
                { text: "Student success", domain: "education" }
            ]
        },
        {
            text: "What do you naturally pay attention to?",
            options: [
                { text: "Details and logic", domain: "tech" },
                { text: "Opportunities and risks", domain: "business" },
                { text: "Aesthetics and design", domain: "creative" },
                { text: "People’s conditions", domain: "healthcare" },
                { text: "Understanding levels", domain: "education" }
            ]
        },
        {
            text: "What do you enjoy doing in a team?",
            options: [
                { text: "Handling technical tasks", domain: "tech" },
                { text: "Leading and organizing", domain: "business" },
                { text: "Creating visuals or content", domain: "creative" },
                { text: "Supporting team wellbeing", domain: "healthcare" },
                { text: "Explaining ideas", domain: "education" }
            ]
        },
        {
            text: "What kind of decisions do you like making?",
            options: [
                { text: "Technical decisions", domain: "tech" },
                { text: "Financial decisions", domain: "business" },
                { text: "Creative choices", domain: "creative" },
                { text: "Care-related decisions", domain: "healthcare" },
                { text: "Educational decisions", domain: "education" }
            ]
        },
        {
            text: "What kind of impact do you want to leave?",
            options: [
                { text: "Technological advancements", domain: "tech" },
                { text: "Economic success", domain: "business" },
                { text: "Creative inspiration", domain: "creative" },
                { text: "Health improvement", domain: "healthcare" },
                { text: "Educational growth", domain: "education" }
            ]
        },
        {
            text: "What do you enjoy experimenting with?",
            options: [
                { text: "New technologies", domain: "tech" },
                { text: "Business models", domain: "business" },
                { text: "Art styles", domain: "creative" },
                { text: "Health routines", domain: "healthcare" },
                { text: "Teaching techniques", domain: "education" }
            ]
        },
        {
            text: "What makes you feel fulfilled?",
            options: [
                { text: "Solving technical problems", domain: "tech" },
                { text: "Achieving business success", domain: "business" },
                { text: "Creating something beautiful", domain: "creative" },
                { text: "Helping someone heal", domain: "healthcare" },
                { text: "Helping someone learn", domain: "education" }
            ]
        },
        {
            text: "What type of thinking do you use most?",
            options: [
                { text: "Logical thinking", domain: "tech" },
                { text: "Strategic thinking", domain: "business" },
                { text: "Creative thinking", domain: "creative" },
                { text: "Empathetic thinking", domain: "healthcare" },
                { text: "Analytical teaching thinking", domain: "education" }
            ]
        },
        {
            text: "What do you prefer focusing on?",
            options: [
                { text: "Systems and tools", domain: "tech" },
                { text: "Growth and profits", domain: "business" },
                { text: "Design and ideas", domain: "creative" },
                { text: "Health and care", domain: "healthcare" },
                { text: "Knowledge and clarity", domain: "education" }
            ]
        },
        {
            text: "Which scenario excites you most?",
            options: [
                { text: "Building a new app", domain: "tech" },
                { text: "Launching a startup", domain: "business" },
                { text: "Creating a viral design", domain: "creative" },
                { text: "Saving someone's life", domain: "healthcare" },
                { text: "Teaching a class", domain: "education" }
            ]
        },
        {
            text: "What do you enjoy mastering?",
            options: [
                { text: "Programming skills", domain: "tech" },
                { text: "Business strategies", domain: "business" },
                { text: "Creative tools", domain: "creative" },
                { text: "Medical knowledge", domain: "healthcare" },
                { text: "Teaching skills", domain: "education" }
            ]
        },
        {
            text: "What kind of challenges do you enjoy daily?",
            options: [
                { text: "Technical challenges", domain: "tech" },
                { text: "Business challenges", domain: "business" },
                { text: "Creative challenges", domain: "creative" },
                { text: "Health challenges", domain: "healthcare" },
                { text: "Learning challenges", domain: "education" }
            ]
        }
];

async function seed() {
    try {
        console.log('Clearing existing database...');
        try {
            const deleteResponse = await axios.delete('http://localhost:5000/api/questions');
            console.log(deleteResponse.data.message);
        } catch (delErr) {
            console.warn('Could not clear database (it might be empty or endpoint not ready yet).', delErr.message);
        }

        console.log('Attempting to seed database...');
        const response = await axios.post('http://localhost:5000/api/add-question', questions);
        console.log('Seeded successfully!!!', response.data);
    } catch (err) {
        console.error('Seeding failed!');
        if (err.response) {
            console.error('Server responded with status:', err.response.status);
            console.error('Response data:', err.response.data);
        } else if (err.request) {
            console.error('No response received (Is the server running on port 5000?). Error:', err.message);
        } else {
            console.error('Axios error:', err.message);
        }
    }
}

seed();
