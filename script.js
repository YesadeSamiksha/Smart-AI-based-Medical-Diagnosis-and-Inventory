// Main JavaScript for MedAI Platform

document.addEventListener('DOMContentLoaded', function() {
    console.log('🏥 MedAI Platform Initialized');
    
    // Initialize all features
    initializeThemeToggle();
    initializeContactForm();
    initializeVoiceAssistant();
    initializeAIAssistant();
    initializeSmoothScroll();
});

// Theme Toggle
function initializeThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            // Future: Implement light/dark theme switching
            console.log('Theme toggle clicked');
        });
    }
}

// Contact Form
function initializeContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            
            alert(`Thank you ${name}! We've received your message and will get back to you soon.`);
            contactForm.reset();
        });
    }
}

// ========================================================
// VOICE ASSISTANT — Full-screen overlay + voice recognition
// ========================================================

let activeRecognition = null; // Track active recognition instance

function initializeVoiceAssistant() {
    const voiceAssistantBtn = document.getElementById('voice-assistant-btn');
    const voiceControlBtn = document.getElementById('voice-control-btn');
    const voiceCancelBtn = document.getElementById('voice-cancel-btn');

    if (voiceAssistantBtn) {
        voiceAssistantBtn.addEventListener('click', () => startVoiceRecognition('overlay'));
    }
    
    if (voiceControlBtn) {
        voiceControlBtn.addEventListener('click', () => startVoiceRecognition('overlay'));
    }

    if (voiceCancelBtn) {
        voiceCancelBtn.addEventListener('click', stopVoiceRecognition);
    }
}

function showVoiceOverlay() {
    const overlay = document.getElementById('voice-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';
        const liveText = document.getElementById('voice-transcript-live');
        if (liveText) liveText.textContent = 'Say a command...';
    }
}

function hideVoiceOverlay() {
    const overlay = document.getElementById('voice-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
    }
}

function stopVoiceRecognition() {
    if (activeRecognition) {
        activeRecognition.abort();
        activeRecognition = null;
    }
    hideVoiceOverlay();
    // Remove active state from chat voice button
    const chatVoiceBtn = document.getElementById('chat-voice-btn');
    if (chatVoiceBtn) chatVoiceBtn.classList.remove('voice-btn-active');
}

function startVoiceRecognition(mode) {
    // mode: 'overlay' = full-screen overlay for navigation commands
    //        'chat'    = inline voice input for the chatbot

    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        alert('Sorry, your browser does not support voice recognition. Please use Chrome or Edge.');
        return;
    }

    // Stop any existing recognition
    if (activeRecognition) {
        activeRecognition.abort();
        activeRecognition = null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    activeRecognition = recognition;

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    if (mode === 'overlay') {
        showVoiceOverlay();
    } else if (mode === 'chat') {
        const chatVoiceBtn = document.getElementById('chat-voice-btn');
        if (chatVoiceBtn) chatVoiceBtn.classList.add('voice-btn-active');
    }

    recognition.onstart = function() {
        console.log('🎤 Voice recognition started (' + mode + ')');
    };

    recognition.onresult = function(event) {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        // Show live interim text
        if (mode === 'overlay') {
            const liveText = document.getElementById('voice-transcript-live');
            if (liveText) liveText.textContent = interimTranscript || finalTranscript || '';
        }

        if (finalTranscript) {
            console.log('You said:', finalTranscript);
            if (mode === 'overlay') {
                hideVoiceOverlay();
                handleVoiceCommand(finalTranscript);
            } else if (mode === 'chat') {
                // Put voice text into chat as a user message
                handleChatInput(finalTranscript);
            }
        }
    };

    recognition.onerror = function(event) {
        console.error('Voice recognition error:', event.error);
        if (mode === 'overlay') {
            const liveText = document.getElementById('voice-transcript-live');
            if (liveText) {
                if (event.error === 'no-speech') {
                    liveText.textContent = 'No speech detected. Try again.';
                } else if (event.error === 'not-allowed') {
                    liveText.textContent = 'Microphone access denied. Please allow microphone.';
                } else {
                    liveText.textContent = 'Error: ' + event.error;
                }
            }
            setTimeout(hideVoiceOverlay, 2000);
        }
        if (mode === 'chat') {
            const chatVoiceBtn = document.getElementById('chat-voice-btn');
            if (chatVoiceBtn) chatVoiceBtn.classList.remove('voice-btn-active');
        }
    };

    recognition.onend = function() {
        activeRecognition = null;
        if (mode === 'chat') {
            const chatVoiceBtn = document.getElementById('chat-voice-btn');
            if (chatVoiceBtn) chatVoiceBtn.classList.remove('voice-btn-active');
        }
    };

    recognition.start();
}

function handleVoiceCommand(command) {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('home')) {
        window.location.href = '#home';
        speak('Navigating to home section');
    } else if (lowerCommand.includes('features')) {
        window.location.href = '#features';
        speak('Showing our features');
    } else if (lowerCommand.includes('about')) {
        window.location.href = '#about';
        speak('Showing about section');
    } else if (lowerCommand.includes('contact')) {
        window.location.href = '#contact';
        speak('Navigating to contact section');
    } else if (lowerCommand.includes('diabetes')) {
        speak('Redirecting to diabetes assessment. Please log in first.');
        setTimeout(() => window.location.href = 'login.html', 1500);
    } else if (lowerCommand.includes('lung')) {
        speak('Redirecting to lung cancer screening. Please log in first.');
        setTimeout(() => window.location.href = 'login.html', 1500);
    } else if (lowerCommand.includes('blood pressure') || lowerCommand.includes('pressure')) {
        speak('Redirecting to blood pressure analysis. Please log in first.');
        setTimeout(() => window.location.href = 'login.html', 1500);
    } else if (lowerCommand.includes('dashboard')) {
        speak('Opening dashboard');
        setTimeout(() => window.location.href = 'dashboard.html', 1000);
    } else if (lowerCommand.includes('chat') || lowerCommand.includes('help') || lowerCommand.includes('assistant')) {
        speak('Opening the AI assistant');
        toggleChatWindow(true);
    } else {
        // Fall back to the chatbot for general questions
        speak('Let me check that for you.');
        toggleChatWindow(true);
        setTimeout(() => handleChatInput(command), 500);
    }
}

function speak(text) {
    if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        window.speechSynthesis.speak(utterance);
    }
}

// ========================================================
// AI CHATBOT — Full interactive chat with smart responses
// ========================================================

let chatInitialized = false;

function initializeAIAssistant() {
    const aiAssistantBtn = document.getElementById('ai-assistant-btn');
    const aiChatClose = document.getElementById('ai-chat-close');
    const aiChatSend = document.getElementById('ai-chat-send');
    const aiChatInput = document.getElementById('ai-chat-input');
    const chatVoiceBtn = document.getElementById('chat-voice-btn');

    if (aiAssistantBtn) {
        aiAssistantBtn.addEventListener('click', () => toggleChatWindow());
    }

    if (aiChatClose) {
        aiChatClose.addEventListener('click', () => toggleChatWindow(false));
    }

    if (aiChatSend) {
        aiChatSend.addEventListener('click', () => {
            const input = document.getElementById('ai-chat-input');
            if (input && input.value.trim()) {
                handleChatInput(input.value.trim());
                input.value = '';
            }
        });
    }

    if (aiChatInput) {
        aiChatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (this.value.trim()) {
                    handleChatInput(this.value.trim());
                    this.value = '';
                }
            }
        });
    }

    if (chatVoiceBtn) {
        chatVoiceBtn.addEventListener('click', () => startVoiceRecognition('chat'));
    }
}

function toggleChatWindow(forceState) {
    const aiChatWindow = document.getElementById('ai-chat-window');
    if (!aiChatWindow) return;

    const shouldShow = forceState !== undefined ? forceState : aiChatWindow.classList.contains('hidden');

    if (shouldShow) {
        aiChatWindow.classList.remove('hidden');
        if (!chatInitialized) {
            startAIAssistant();
            chatInitialized = true;
        }
        // Focus input
        setTimeout(() => {
            const input = document.getElementById('ai-chat-input');
            if (input) input.focus();
        }, 300);
    } else {
        aiChatWindow.classList.add('hidden');
    }
}

function startAIAssistant() {
    addChatMessage('assistant', "👋 Hello! I'm your MedAI assistant. How can I help you today?");
    
    setTimeout(() => {
        addChatMessage('assistant', "Here are some things you can ask me:\n• Diabetes symptoms & prevention\n• Lung cancer risk factors\n• Blood pressure management\n• How to use MedAI\n• General health tips");
    }, 800);
}

function addChatMessage(sender, message) {
    const chatMessages = document.getElementById('ai-chat-messages');
    if (!chatMessages) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg-appear';
    wrapper.style.cssText = `display:flex; margin-bottom:0.75rem; ${sender === 'user' ? 'justify-content:flex-end;' : 'justify-content:flex-start;'}`;

    const bubble = document.createElement('div');
    bubble.style.cssText = `
        max-width: 80%;
        padding: 0.65rem 1rem;
        border-radius: ${sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px'};
        font-size: 13px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-wrap: break-word;
        ${sender === 'user' 
            ? 'background: linear-gradient(135deg, #4ade80, #16a34a); color: #fff;' 
            : 'background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.85); border: 1px solid rgba(255,255,255,0.06);'
        }
    `;
    bubble.textContent = message;

    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    const chatMessages = document.getElementById('ai-chat-messages');
    if (!chatMessages) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'typing-indicator';
    wrapper.className = 'chat-msg-appear';
    wrapper.style.cssText = 'display:flex; margin-bottom:0.75rem; justify-content:flex-start;';

    const bubble = document.createElement('div');
    bubble.className = 'typing-dots';
    bubble.style.cssText = 'padding:0.75rem 1.25rem; border-radius:16px 16px 16px 4px; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.06); display:flex; gap:4px;';
    bubble.innerHTML = '<span></span><span></span><span></span>';

    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}

async function handleChatInput(userMessage) {
    // Ensure chat is visible
    toggleChatWindow(true);

    // Add user message
    addChatMessage('user', userMessage);

    // Show typing indicator
    showTypingIndicator();

    // Try local response first (instant)
    const localResponse = generateChatResponse(userMessage);

    if (localResponse) {
        // Got a local match — show it with a small delay for realism
        const delay = 400 + Math.random() * 500;
        setTimeout(() => {
            removeTypingIndicator();
            addChatMessage('assistant', localResponse);
        }, delay);
    } else {
        // No local match — ask Gemini AI
        try {
            const geminiResponse = await askGemini(userMessage);
            removeTypingIndicator();
            addChatMessage('assistant', geminiResponse);
        } catch (err) {
            console.error('Gemini error:', err);
            removeTypingIndicator();
            addChatMessage('assistant', "I'm sorry, I couldn't process that right now. Please try again or ask about:\n• Diabetes, lung cancer, blood pressure\n• How to use MedAI\n• General health tips");
        }
    }
}

function generateChatResponse(input) {
    const lower = input.toLowerCase();

    // --- Greetings ---
    if (/^(hi|hello|hey|good morning|good afternoon|good evening|howdy)/i.test(lower)) {
        return "Hello! 👋 Welcome to MedAI. I can help with:\n• Diabetes, lung cancer, or blood pressure info\n• Navigating the platform\n• General health tips\n• Any health or medical question (powered by Gemini AI)\n\nWhat would you like to know?";
    }

    // --- About MedAI / Self-awareness ---
    if (lower.includes('what is medai') || lower.includes('what\'s medai') || lower.includes('tell me about medai') || lower.includes('about medai') || lower.includes('about this app') || lower.includes('about this platform')) {
        return "🏥 MedAI is an AI-powered medical diagnosis and inventory management platform.\n\n✨ Key Features:\n• AI health assessments for diabetes, lung cancer, and blood pressure\n• Smart symptom checker with Gemini AI integration\n• Medicine inventory management\n• Automated reorder system\n• Voice-controlled navigation\n\nOur machine learning models are trained on extensive medical data to provide 94% accurate preliminary screenings.\n\n⚕️ Note: MedAI assists with early detection but is not a substitute for professional medical advice.";
    }

    if (lower.includes('who made') || lower.includes('who built') || lower.includes('who created') || lower.includes('who developed') || lower.includes('developer')) {
        return "👨‍💻 MedAI was developed as a Smart AI-based Medical Diagnosis and Inventory Management project.\n\nIt combines:\n• Machine Learning for disease prediction\n• Google Gemini AI for intelligent health advice\n• Supabase for secure data management\n• Modern web technologies (HTML, CSS, JavaScript)\n\nThe goal is to make healthcare guidance accessible to everyone.";
    }

    if ((lower.includes('what') && lower.includes('you') && (lower.includes('name') || lower.includes('called'))) || lower === 'who are you' || lower === 'what are you') {
        return "🤖 I'm the MedAI Assistant — your AI health companion!\n\nI'm powered by Google Gemini AI and can help you with:\n• Medical information and health advice\n• Navigating the MedAI platform\n• Understanding symptoms and conditions\n• General wellness tips\n\nI'm available 24/7 right here in the chat, or via voice commands!";
    }

    if (lower.includes('features') && (lower.includes('what') || lower.includes('list') || lower.includes('all') || lower.includes('show'))) {
        return "🌟 MedAI Platform Features:\n\n🩺 Health Assessments:\n• Diabetes risk evaluation\n• Lung cancer screening\n• Blood pressure analysis\n\n🧠 AI-Powered:\n• Gemini AI chatbot (that's me!)\n• Smart symptom analysis\n• Personalized health recommendations\n\n💊 Inventory Management:\n• Medicine stock tracking\n• Automated reorder alerts\n• Order management\n\n🎤 Accessibility:\n• Voice commands\n• Voice-to-text chat input\n• Responsive design for all devices";
    }

    if (lower.includes('technology') || lower.includes('tech stack') || lower.includes('built with') || lower.includes('made with')) {
        return "🛠️ MedAI Tech Stack:\n\n• Frontend: HTML5, CSS3, JavaScript\n• Styling: Tailwind CSS + Bootstrap 5\n• AI: Google Gemini API\n• Database: Supabase (PostgreSQL)\n• Auth: Supabase Authentication\n• Animations: GSAP\n• Voice: Web Speech API\n• Backend: Python Flask (for ML models)";
    }

    // --- Diabetes ---
    if (lower.includes('diabetes')) {
        if (lower.includes('symptom')) {
            return "🩺 Common diabetes symptoms include:\n• Frequent urination\n• Excessive thirst\n• Unexplained weight loss\n• Blurred vision\n• Fatigue\n• Slow-healing wounds\n\nWant to take our AI-powered diabetes assessment? Go to Features → Diabetes Assessment.";
        }
        if (lower.includes('prevent') || lower.includes('avoid')) {
            return "🛡️ Diabetes prevention tips:\n• Maintain a healthy weight\n• Exercise 30+ minutes daily\n• Eat a balanced diet rich in fiber\n• Limit sugar and refined carbs\n• Get regular check-ups\n\nOur assessment can help evaluate your risk!";
        }
        if (lower.includes('type 1') || lower.includes('type one')) {
            return "Type 1 diabetes is an autoimmune condition where the immune system attacks insulin-producing cells. It usually appears in children/young adults and requires insulin therapy. It accounts for ~5-10% of diabetes cases.";
        }
        if (lower.includes('type 2') || lower.includes('type two')) {
            return "Type 2 diabetes is the most common form (~90-95% of cases). The body becomes resistant to insulin or doesn't produce enough. Risk factors include obesity, inactivity, family history, and age. It can often be managed with lifestyle changes.";
        }
        return "🔬 Our AI Diabetes Assessment evaluates your risk based on:\n• Lifestyle factors\n• Symptoms\n• Medical history\n\nWe achieve 94% accuracy. Click 'Start Assessment' in the Features section or say 'diabetes assessment' to begin!";
    }

    // --- Lung cancer ---
    if (lower.includes('lung') && (lower.includes('cancer') || lower.includes('screen'))) {
        if (lower.includes('symptom') || lower.includes('sign')) {
            return "🫁 Warning signs of lung cancer:\n• Persistent cough\n• Coughing up blood\n• Shortness of breath\n• Chest pain\n• Hoarseness\n• Unexplained weight loss\n• Recurring infections\n\nEarly detection saves lives — try our screening tool!";
        }
        if (lower.includes('risk') || lower.includes('cause')) {
            return "⚠️ Lung cancer risk factors:\n• Smoking (primary cause)\n• Secondhand smoke exposure\n• Radon gas exposure\n• Asbestos exposure\n• Family history\n• Air pollution\n\nOur AI screening evaluates these factors for you.";
        }
        return "🫁 Our Lung Cancer Screening tool evaluates your risk based on smoking history, environmental exposures, symptoms, and lifestyle habits.\n\nGo to Features → Lung Cancer Screening to begin.";
    }

    // --- Blood pressure ---
    if (lower.includes('blood pressure') || lower.includes('bp') || lower.includes('hypertension')) {
        if (lower.includes('high') || lower.includes('hypertension')) {
            return "⚡ Hypertension (high blood pressure) is 130/80 mmHg or higher. It's called the 'silent killer' because it often has no symptoms.\n\nRisks: heart attack, stroke, kidney damage.\n\nManage it with diet, exercise, stress reduction, and medication if prescribed.";
        }
        if (lower.includes('normal') || lower.includes('range')) {
            return "📊 Blood pressure categories:\n• Normal: Less than 120/80 mmHg\n• Elevated: 120-129 / <80 mmHg\n• High (Stage 1): 130-139 / 80-89 mmHg\n• High (Stage 2): 140+ / 90+ mmHg\n• Crisis: 180+ / 120+ mmHg";
        }
        if (lower.includes('lower') || lower.includes('reduce') || lower.includes('manage')) {
            return "💪 Tips to lower blood pressure:\n• Reduce sodium intake\n• Exercise regularly (150 min/week)\n• Maintain healthy weight\n• Limit alcohol\n• Manage stress\n• Eat DASH diet (fruits, vegetables, whole grains)\n• Take prescribed medications consistently";
        }
        return "❤️ Our Blood Pressure Analysis evaluates your BP levels and provides personalized recommendations.\n\nGo to Features → Blood Pressure Analysis to get started.";
    }

    // --- Platform usage ---
    if (lower.includes('how') && (lower.includes('use') || lower.includes('work') || lower.includes('start'))) {
        return "🚀 Getting started with MedAI:\n1. Click 'Get Started' or go to Login\n2. Create an account or sign in\n3. Choose a diagnosis (Diabetes, Lung, BP)\n4. Answer the health questionnaire\n5. Get your AI-powered assessment!\n\nYou can also use voice commands — click the microphone button!";
    }

    // --- Login / Account ---
    if (lower.includes('login') || lower.includes('sign up') || lower.includes('account') || lower.includes('register')) {
        return "🔐 To access our diagnosis tools:\n• Click 'Login' in the top navigation\n• Or click 'Sign Up' to create a new account\n• You can also say 'login' or use the 'Get Started' button\n\nYour data is securely stored and private.";
    }

    // --- Navigation ---
    if (lower.includes('navigate') || lower.includes('go to') || lower.includes('take me') || lower.includes('scroll')) {
        if (lower.includes('home')) { document.getElementById('home')?.scrollIntoView({behavior:'smooth'}); return "📍 Scrolling to the Home section!"; }
        if (lower.includes('feature')) { document.getElementById('features')?.scrollIntoView({behavior:'smooth'}); return "📍 Scrolling to Features!"; }
        if (lower.includes('about')) { document.getElementById('about')?.scrollIntoView({behavior:'smooth'}); return "📍 Scrolling to About section!"; }
        if (lower.includes('contact')) { document.getElementById('contact')?.scrollIntoView({behavior:'smooth'}); return "📍 Scrolling to Contact section!"; }
        return "📍 I can navigate to: Home, Features, About, or Contact. Just tell me where!";
    }

    // --- Thanks ---
    if (lower.includes('thank') || lower.includes('thanks') || lower.includes('appreciate')) {
        return "You're welcome! 😊 Let me know if you have any other questions about your health or our platform.";
    }

    // --- Goodbye ---
    if (lower.includes('bye') || lower.includes('goodbye') || lower.includes('see you')) {
        return "Goodbye! 👋 Take care of your health and come back anytime. Stay healthy!";
    }

    // --- Emergency ---
    if (lower.includes('emergency') || lower.includes('heart attack') || lower.includes('stroke') || lower.includes('dying') || lower.includes('can\'t breathe')) {
        return "🚨 If you are experiencing a medical emergency, please call emergency services immediately!\n\n📞 Emergency: 911 (US) / 112 (EU) / 108 (India)\n\nMedAI is not a substitute for emergency medical care.";
    }

    // --- General health ---
    if (lower.includes('healthy') || lower.includes('health tip') || lower.includes('stay healthy')) {
        return "🌿 Top health tips:\n• Sleep 7-9 hours per night\n• Drink 8+ glasses of water daily\n• Exercise 30 minutes most days\n• Eat plenty of fruits and vegetables\n• Manage stress through meditation\n• Get regular health check-ups\n• Avoid smoking and limit alcohol";
    }

    // --- What can you do ---
    if (lower.includes('what can you') || lower.includes('what do you') || lower.includes('your capabilities') || lower.includes('help me')) {
        return "🤖 I can help you with:\n• Information about diabetes, lung cancer, and blood pressure\n• Navigating the MedAI platform\n• General health tips and advice\n• Getting started with health assessments\n• Voice-controlled navigation\n• Any medical or health question (Gemini AI)\n\nJust type your question or use the microphone!";
    }

    // --- No local match → return null to trigger Gemini ---
    return null;
}

// Smooth Scroll
function initializeSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ========================================================
// GEMINI AI INTEGRATION — Fallback for unrecognized queries
// ========================================================

const GEMINI_API_KEY = '';
const GEMINI_MODELS = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite'
];

async function askGemini(userMessage) {
    const systemPrompt = `You are MedAI Assistant, an AI-powered health chatbot embedded in the MedAI medical diagnosis platform.

About MedAI:
- MedAI is an AI-powered medical diagnosis and inventory management platform
- It offers health assessments for diabetes, lung cancer, and blood pressure
- It uses machine learning models with 94% accuracy
- It has a medicine inventory management system with automated reordering
- Built with HTML/CSS/JS frontend, Python Flask backend, Supabase database, and Google Gemini AI
- Users can navigate the platform using voice commands

Your role:
- Answer health and medical questions accurately and helpfully
- Provide general medical information, symptoms, prevention tips, and wellness advice
- Recommend users to consult a real doctor for serious conditions
- When asked about MedAI, describe the platform's features and capabilities
- Keep responses concise (under 200 words) and use bullet points where helpful
- Use relevant emojis to make responses friendly
- Always add a disclaimer for medical advice: "Please consult a healthcare professional for personalized medical advice."
- NEVER diagnose or prescribe specific medications for individual cases
- For emergencies, direct users to call emergency services (911/112/108)`;

    const requestBody = {
        contents: [{
            parts: [
                { text: systemPrompt + '\n\nUser question: ' + userMessage }
            ]
        }],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
            topP: 0.9
        },
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
        ]
    };

    // Try each model with retry
    for (const model of GEMINI_MODELS) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                if (attempt > 0) {
                    // Wait before retry (exponential backoff)
                    await new Promise(r => setTimeout(r, 2000 * attempt));
                }

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                if (response.status === 429) {
                    console.warn(`Rate limited on ${model}, attempt ${attempt + 1}`);
                    continue; // Try next attempt or next model
                }

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('Gemini API error:', response.status, errorData);
                    continue;
                }

                const data = await response.json();
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    return text
                        .replace(/\*\*(.*?)\*\*/g, '$1')
                        .replace(/\*(.*?)\*/g, '$1')
                        .replace(/#{1,3}\s/g, '')
                        .trim();
                }
            } catch (err) {
                console.warn(`Gemini fetch error (${model}, attempt ${attempt + 1}):`, err);
            }
        }
    }

    // All API attempts failed — use smart local fallback
    console.warn('All Gemini attempts failed, using local fallback');
    return getLocalFallbackResponse(userMessage);
}

// ========================================================
// LOCAL FALLBACK — Handles common health queries offline
// ========================================================

function getLocalFallbackResponse(input) {
    const lower = input.toLowerCase();

    // --- Fever ---
    if (lower.includes('fever') || lower.includes('temperature')) {
        return "🌡️ Tips for managing fever:\n• Rest and stay hydrated\n• Take Paracetamol/Acetaminophen as directed\n• Use a cool compress on forehead\n• Wear light clothing\n• Seek medical help if fever exceeds 103°F (39.4°C) or lasts more than 3 days\n\n⚕️ Please consult a healthcare professional for personalized advice.";
    }

    // --- Headache ---
    if (lower.includes('headache') || lower.includes('head pain') || lower.includes('migraine')) {
        return "🤕 Headache relief tips:\n• Drink plenty of water (dehydration is a common cause)\n• Rest in a quiet, dark room\n• Apply a cold or warm compress\n• Try OTC pain relievers (Ibuprofen, Paracetamol)\n• Practice relaxation techniques\n• Get adequate sleep\n\n⚠️ Seek medical help if headaches are severe, sudden, or accompanied by vision changes.\n\n⚕️ Please consult a healthcare professional for personalized advice.";
    }

    // --- Cold / Flu ---
    if (lower.includes('cold') || lower.includes('flu') || lower.includes('cough') || lower.includes('sore throat')) {
        return "🤧 Cold & Flu management:\n• Rest and sleep well\n• Stay hydrated (warm fluids help)\n• Gargle with salt water for sore throat\n• Use honey and lemon tea\n• Take OTC cold medication if needed\n• Use a humidifier\n\n⚠️ See a doctor if symptoms last over 10 days or include high fever.\n\n⚕️ Please consult a healthcare professional for personalized advice.";
    }

    // --- Stomach / Digestion ---
    if (lower.includes('stomach') || lower.includes('nausea') || lower.includes('vomit') || lower.includes('diarrhea') || lower.includes('digestion') || lower.includes('acidity')) {
        return "🤢 Stomach/digestive relief:\n• Eat bland foods (BRAT diet: bananas, rice, applesauce, toast)\n• Stay hydrated with small sips of water\n• Avoid spicy, oily, or dairy foods\n• Try ginger tea for nausea\n• OTC antacids can help with acidity\n\n⚠️ See a doctor if vomiting persists or you notice blood.\n\n⚕️ Please consult a healthcare professional for personalized advice.";
    }

    // --- Skin / Rash / Allergy ---
    if (lower.includes('skin') || lower.includes('rash') || lower.includes('itch') || lower.includes('allergy') || lower.includes('allergic')) {
        return "🩹 Skin/allergy tips:\n• Avoid known allergens and irritants\n• Apply calamine lotion or hydrocortisone cream\n• Take antihistamines (Cetirizine, Loratadine)\n• Keep skin moisturized\n• Use gentle, fragrance-free products\n• Apply cold compress for swelling\n\n⚕️ Please consult a healthcare professional for personalized advice.";
    }

    // --- Eye ---
    if (lower.includes('eye') && (lower.includes('swell') || lower.includes('red') || lower.includes('pain') || lower.includes('itch'))) {
        return "👁️ Eye care tips:\n• Apply a cold compress to reduce swelling\n• Use artificial tears for dryness\n• Avoid touching or rubbing eyes\n• Remove contact lenses if wearing\n• Anti-allergy eye drops can help with itching\n• Wash hands frequently\n\n⚠️ See an eye doctor if pain is severe or vision is affected.\n\n⚕️ Please consult a healthcare professional for personalized advice.";
    }

    // --- Back pain ---
    if (lower.includes('back pain') || lower.includes('backache') || lower.includes('spine')) {
        return "🦴 Back pain management:\n• Apply ice (first 48 hrs) then heat\n• Maintain good posture\n• Gentle stretching and walking\n• OTC pain relievers (Ibuprofen)\n• Avoid heavy lifting\n• Consider a firm mattress\n\n⚠️ See a doctor if pain radiates down legs or causes numbness.\n\n⚕️ Please consult a healthcare professional for personalized advice.";
    }

    // --- Sleep ---
    if (lower.includes('sleep') || lower.includes('insomnia') || lower.includes('can\'t sleep')) {
        return "😴 Better sleep tips:\n• Keep a consistent sleep schedule\n• Avoid screens 1 hour before bed\n• Keep your room cool and dark\n• Limit caffeine after 2 PM\n• Exercise regularly (but not before bed)\n• Try relaxation techniques or meditation\n• Avoid heavy meals before sleep\n\n⚕️ Please consult a healthcare professional for personalized advice.";
    }

    // --- Stress / Anxiety ---
    if (lower.includes('stress') || lower.includes('anxiety') || lower.includes('anxious') || lower.includes('worried') || lower.includes('panic')) {
        return "🧘 Stress & anxiety management:\n• Practice deep breathing (4-7-8 technique)\n• Regular exercise (even 20 min walks help)\n• Limit caffeine and alcohol\n• Talk to someone you trust\n• Try meditation apps\n• Get enough sleep\n• Consider professional counseling\n\n⚕️ Please consult a healthcare professional for personalized advice.";
    }

    // --- Weight / Diet ---
    if (lower.includes('weight') || lower.includes('diet') || lower.includes('nutrition') || lower.includes('calories') || lower.includes('obesity')) {
        return "🥗 Healthy weight tips:\n• Eat balanced meals with protein, fiber, and healthy fats\n• Control portion sizes\n• Drink water before meals\n• Reduce processed food and sugar\n• Exercise 30+ minutes daily\n• Get enough sleep (crucial for metabolism)\n• Track your progress\n\n⚕️ Please consult a healthcare professional for personalized advice.";
    }

    // --- Medicine / Medication general ---
    if (lower.includes('medicine') || lower.includes('medication') || lower.includes('drug') || lower.includes('tablet') || lower.includes('pill')) {
        return "💊 Important medicine guidelines:\n• Always consult a doctor before taking new medication\n• Follow prescribed dosages exactly\n• Complete the full course of antibiotics\n• Check for drug interactions\n• Store medicines properly\n• Don't share prescription medications\n\n⚠️ MedAI does not prescribe medications. Please consult your doctor.\n\n⚕️ Please consult a healthcare professional for personalized advice.";
    }

    // --- Catch-all ---
    return "🤖 That's a great question! I'm powered by Gemini AI for detailed answers, but the AI service is temporarily busy.\n\nIn the meantime, I can help with:\n• 🩺 Diabetes, lung cancer, blood pressure info\n• 🌡️ Fever, headache, cold/flu tips\n• 👁️ Eye, skin, back pain advice\n• 😴 Sleep and stress management\n• 🏥 About MedAI platform\n\nTry asking about any of these topics, or try again in a moment!\n\n⚕️ For urgent issues, please consult a healthcare professional.";
}

// Export functions for use in other files
window.MedAI = {
    speak,
    handleVoiceCommand,
    addChatMessage,
    handleChatInput,
    askGemini
};
