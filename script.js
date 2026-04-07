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

// Voice Assistant
function initializeVoiceAssistant() {
    const voiceAssistantBtn = document.getElementById('voice-assistant-btn');
    const voiceControlBtn = document.getElementById('voice-control-btn');
    
    if (voiceAssistantBtn) {
        voiceAssistantBtn.addEventListener('click', startVoiceRecognition);
    }
    
    if (voiceControlBtn) {
        voiceControlBtn.addEventListener('click', startVoiceRecognition);
    }
}

function startVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = function() {
            console.log('🎤 Voice recognition started');
            const status = document.getElementById('ai-chat-status');
            if (status) status.textContent = 'Listening...';
        };

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            console.log('You said:', transcript);
            handleVoiceCommand(transcript);
        };

        recognition.onerror = function(event) {
            console.error('Voice recognition error:', event.error);
            const status = document.getElementById('ai-chat-status');
            if (status) status.textContent = 'Error: ' + event.error;
        };

        recognition.onend = function() {
            console.log('Voice recognition ended');
            const status = document.getElementById('ai-chat-status');
            if (status) status.textContent = 'Click to speak again';
        };

        recognition.start();
    } else {
        alert('Sorry, your browser does not support voice recognition. Please use Chrome or Edge.');
    }
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
    } else {
        speak('I did not understand that command. Try saying home, features, about, contact, or the name of a diagnosis service.');
    }
}

function speak(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        window.speechSynthesis.speak(utterance);
    }
}

// AI Assistant
function initializeAIAssistant() {
    const aiAssistantBtn = document.getElementById('ai-assistant-btn');
    const aiChatWindow = document.getElementById('ai-chat-window');

    if (aiAssistantBtn) {
        aiAssistantBtn.addEventListener('click', function() {
            if (aiChatWindow) {
                aiChatWindow.classList.toggle('hidden');
                if (!aiChatWindow.classList.contains('hidden')) {
                    startAIAssistant();
                }
            }
        });
    }
}

function startAIAssistant() {
    const chatMessages = document.getElementById('ai-chat-messages');
    if (chatMessages && chatMessages.children.length === 0) {
        addChatMessage('assistant', 'Hello! I am your MedAI assistant. How can I help you today?');
        
        setTimeout(() => {
            addChatMessage('assistant', 'You can ask me about:\n• Diabetes symptoms\n• Lung health\n• Blood pressure management\n• How to use our platform');
        }, 1000);
    }
}

function addChatMessage(sender, message) {
    const chatMessages = document.getElementById('ai-chat-messages');
    if (chatMessages) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `mb-3 ${sender === 'user' ? 'text-right' : ''}`;
        
        const bubble = document.createElement('div');
        bubble.className = `inline-block px-4 py-2 rounded-lg ${
            sender === 'user' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-700 text-gray-200'
        }`;
        bubble.style.maxWidth = '80%';
        bubble.textContent = message;
        
        messageDiv.appendChild(bubble);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
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

// Export functions for use in other files
window.MedAI = {
    speak,
    handleVoiceCommand,
    addChatMessage
};
