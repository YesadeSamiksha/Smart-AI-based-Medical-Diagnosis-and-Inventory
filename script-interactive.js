// MedAI - Interactive Script Handler
// Handles contact forms, voice control, AI assistants, theme toggling, and spotlight effects

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    initializeSpotlightCards();
    initializeContactForm();
    initializeVoiceControl();
    initializeAIAssistants();
    initializeThemeToggle();
    initializeMobileMenu();
});

// ==================== NAVIGATION ====================
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.pill');
    
    navLinks.forEach(link => {
        // Hover animation for pills
        link.addEventListener('mouseenter', (e) => {
            const circle = link.querySelector('.hover-circle');
            const labelHover = link.querySelector('.pill-label-hover');
            
            if (circle && labelHover) {
                gsap.to(circle, {
                    scale: 2.5,
                    opacity: 1,
                    duration: 0.4,
                    ease: 'power2.out'
                });
                
                gsap.fromTo(labelHover,
                    { y: '100%', opacity: 0 },
                    { y: '0%', opacity: 1, duration: 0.3, ease: 'power2.out' }
                );
            }
        });
        
        link.addEventListener('mouseleave', (e) => {
            const circle = link.querySelector('.hover-circle');
            const labelHover = link.querySelector('.pill-label-hover');
            
            if (circle && labelHover) {
                gsap.to(circle, {
                    scale: 0,
                    opacity: 0,
                    duration: 0.3,
                    ease: 'power2.in'
                });
                
                gsap.to(labelHover, {
                    y: '-100%',
                    opacity: 0,
                    duration: 0.2,
                    ease: 'power2.in'
                });
            }
        });
        
        // Active state handling
        link.addEventListener('click', (e) => {
            navLinks.forEach(l => l.classList.remove('is-active'));
            link.classList.add('is-active');
        });
    });
    
    // Smooth scrolling for anchor links
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

// ==================== MOBILE MENU ====================
function initializeMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('open');
            
            // Animate hamburger lines
            const lines = mobileMenuBtn.querySelectorAll('.hamburger-line');
            if (mobileMenu.classList.contains('open')) {
                gsap.to(lines[0], { rotation: 45, y: 7, duration: 0.3 });
                gsap.to(lines[1], { rotation: -45, duration: 0.3 });
            } else {
                gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3 });
                gsap.to(lines[1], { rotation: 0, duration: 0.3 });
            }
        });
        
        // Close menu when clicking a link
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
                const lines = mobileMenuBtn.querySelectorAll('.hamburger-line');
                gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3 });
                gsap.to(lines[1], { rotation: 0, duration: 0.3 });
            });
        });
    }
}

// ==================== SPOTLIGHT CARD EFFECTS ====================
function initializeSpotlightCards() {
    const spotlightCards = document.querySelectorAll('.spotlight-card, .spotlight-form, .spotlight-disclaimer');
    
    spotlightCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            card.style.setProperty('--mouse-x', `${x}%`);
            card.style.setProperty('--mouse-y', `${y}%`);
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.setProperty('--mouse-x', '50%');
            card.style.setProperty('--mouse-y', '50%');
        });
    });
}

// ==================== CONTACT FORM ====================
function initializeContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                message: document.getElementById('message').value
            };
            
            // Show loading state
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Sending...';
            submitBtn.disabled = true;
            
            try {
                // Simulate API call (replace with actual endpoint)
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Success feedback
                showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
                contactForm.reset();
            } catch (error) {
                // Error feedback
                showNotification('Failed to send message. Please try again.', 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

// ==================== VOICE CONTROL ====================
function initializeVoiceControl() {
    const voiceBtn = document.getElementById('voice-control-btn');
    
    if (!voiceBtn) return;
    
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        voiceBtn.addEventListener('click', () => {
            showNotification('Voice control is not supported in your browser.', 'error');
        });
        return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    
    let isListening = false;
    
    voiceBtn.addEventListener('click', () => {
        if (isListening) {
            recognition.stop();
            return;
        }
        
        recognition.start();
        isListening = true;
        voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i><span>Stop Listening</span>';
        voiceBtn.classList.add('bg-red-600');
        voiceBtn.classList.remove('bg-gray-800');
    });
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        handleVoiceCommand(transcript);
    };
    
    recognition.onend = () => {
        isListening = false;
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i><span>Use Voice Control</span>';
        voiceBtn.classList.remove('bg-red-600');
        voiceBtn.classList.add('bg-gray-800');
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        showNotification('Voice recognition error. Please try again.', 'error');
    };
}

function handleVoiceCommand(command) {
    console.log('Voice command:', command);
    
    // Navigation commands
    if (command.includes('home') || command.includes('start')) {
        document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
        speak('Navigating to home section');
    } else if (command.includes('feature')) {
        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
        speak('Showing features');
    } else if (command.includes('about')) {
        document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
        speak('Navigating to about section');
    } else if (command.includes('contact')) {
        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
        speak('Opening contact form');
    } else if (command.includes('login') || command.includes('sign in')) {
        speak('Redirecting to login page');
        setTimeout(() => window.location.href = 'login.html', 500);
    } else if (command.includes('diabetes')) {
        speak('Opening diabetes diagnosis');
        setTimeout(() => window.location.href = 'diagnosis-diabetes.html', 500);
    } else if (command.includes('lung') || command.includes('cancer')) {
        speak('Opening lung cancer screening');
        setTimeout(() => window.location.href = 'diagnosis-lung.html', 500);
    } else if (command.includes('blood pressure') || command.includes('bp')) {
        speak('Opening blood pressure assessment');
        setTimeout(() => window.location.href = 'diagnosis-bp.html', 500);
    } else {
        speak('Sorry, I didn\'t understand that command');
    }
}

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
}

// ==================== AI ASSISTANTS ====================
function initializeAIAssistants() {
    // Floating assistant toggles
    const voiceAssistantBtn = document.getElementById('voice-assistant');
    const aiAssistantBtn = document.getElementById('ai-assistant');
    
    if (voiceAssistantBtn) {
        voiceAssistantBtn.addEventListener('click', () => {
            showNotification('Voice Assistant activated! Try saying "Show features" or "Go to login"', 'info');
            // Trigger voice recognition
            document.getElementById('voice-control-btn')?.click();
        });
    }
    
    if (aiAssistantBtn) {
        aiAssistantBtn.addEventListener('click', () => {
            showNotification('AI Chat Assistant coming soon! This will help you navigate and answer medical questions.', 'info');
            // TODO: Open AI chat modal
        });
    }
}

// ==================== THEME TOGGLE ====================
function initializeThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    
    if (!themeToggle) return;
    
    // Check for saved theme preference or default to dark
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        
        // Animate transition
        gsap.to(document.body, {
            opacity: 0.95,
            duration: 0.1,
            yoyo: true,
            repeat: 1,
            ease: 'power1.inOut'
        });
    });
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    const icon = themeToggle.querySelector('i');
    if (theme === 'dark') {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}

// ==================== NOTIFICATIONS ====================
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };
    
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 100px;
            right: 20px;
            background: rgba(10, 10, 15, 0.95);
            border: 1px solid ${colors[type]};
            border-radius: 12px;
            padding: 16px 24px;
            color: white;
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 10000;
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            max-width: 400px;
        ">
            <i class="fas ${icons[type]}" style="color: ${colors[type]}; font-size: 20px;"></i>
            <span style="flex: 1;">${message}</span>
            <button onclick="this.closest('.notification-toast').remove()" 
                    style="background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 18px;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    gsap.fromTo(notification.firstElementChild,
        { x: 400, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
    );
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        gsap.to(notification.firstElementChild, {
            x: 400,
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => notification.remove()
        });
    }, 5000);
}

// ==================== UTILITY FUNCTIONS ====================

// Smooth scroll to top
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Accessibility: Keyboard navigation
document.addEventListener('keydown', (e) => {
    // ESC to close modals/menus
    if (e.key === 'Escape') {
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu?.classList.contains('open')) {
            document.getElementById('mobileMenuBtn')?.click();
        }
    }
});

// Accessibility: Skip to main content
const skipLink = document.createElement('a');
skipLink.href = '#home';
skipLink.textContent = 'Skip to main content';
skipLink.className = 'skip-link';
skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    background: #6366f1;
    color: white;
    padding: 8px;
    text-decoration: none;
    z-index: 10001;
`;
skipLink.addEventListener('focus', () => {
    skipLink.style.top = '0';
});
skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
});
document.body.prepend(skipLink);

console.log('MedAI Interactive Script Loaded ✓');
