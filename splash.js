// splash.js - Handles the EasyCafe premium splash screen particles, loading animation, and transition.
(function() {
    document.addEventListener('DOMContentLoaded', () => {
        const splash = document.getElementById('splash-screen');
        const progressBar = document.getElementById('splash-progress-bar');
        const particlesContainer = document.getElementById('splash-particles');

        if (!splash || !progressBar) return;

        // 1. Generate Floating Particles
        const particleCount = 18;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('splash-particle');
            
            // Randomize styling for premium organic feel
            const size = Math.random() * 6 + 2; // 2px to 8px
            const left = Math.random() * 100; // 0% to 100%
            const duration = Math.random() * 4 + 4; // 4s to 8s
            const delay = Math.random() * -8; // Negative delay so some start half-way
            const opacity = Math.random() * 0.4 + 0.2; // 0.2 to 0.6

            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${left}%`;
            particle.style.bottom = `-20px`;
            particle.style.animationDuration = `${duration}s`;
            particle.style.animationDelay = `${delay}s`;
            particle.style.opacity = opacity;
            
            particlesContainer.appendChild(particle);
        }

        // 2. Smooth Loading Progression (0.5 seconds total)
        let progress = 0;
        const duration = 500; // ms
        const intervalTime = 15; // ms
        const totalSteps = duration / intervalTime;
        let currentStep = 0;

        const updateProgress = () => {
            currentStep++;
            
            // Generate non-linear progress step for an organic, "thinking" feel (like Claude/Gemini)
            // Starts fast, slows down around 60%, has a slight pause, then finishes
            const t = currentStep / totalSteps;
            // Cubic bezier easing approximation
            let easeT;
            if (t < 0.4) {
                easeT = t * 1.5;
            } else if (t < 0.75) {
                easeT = 0.6 + (t - 0.4) * 0.4; // slow down
            } else {
                easeT = 0.74 + (t - 0.75) * 1.04; // accelerate to finish
            }
            
            progress = Math.min(100, Math.floor(easeT * 100));
            progressBar.style.width = `${progress}%`;

            if (currentStep < totalSteps) {
                setTimeout(updateProgress, intervalTime);
            } else {
                // Complete!
                finishSplash();
            }
        };

        // Start loading
        setTimeout(updateProgress, 200);

        // 3. Dismiss Splash Screen
        function finishSplash() {
            // Add fade and slide out class
            splash.classList.add('splash-hidden');
            
            // Set up and reveal the home screen welcome greeting
            setupWelcomeGreeting();
            
            // Clean up DOM after transition ends to free resources
            splash.addEventListener('transitionend', (e) => {
                if (e.propertyName === 'transform' || e.propertyName === 'opacity') {
                    splash.style.display = 'none';
                    // Trigger a custom event in case other components want to know the app has launched
                    document.dispatchEvent(new CustomEvent('app-launched'));
                }
            });
        }

        // 4. Dynamic Home Screen Welcome Greeting
        function setupWelcomeGreeting() {
            const badge = document.getElementById('welcome-greeting-badge');
            const badgeText = document.getElementById('welcome-text-badge');
            if (!badge || !badgeText) return;

            const hour = new Date().getHours();
            let greeting = 'Welcome to EasyCafe';
            if (hour < 12) {
                greeting = 'Good Morning · Welcome to EasyCafe';
            } else if (hour < 17) {
                greeting = 'Good Afternoon · Welcome to EasyCafe';
            } else {
                greeting = 'Good Evening · Welcome to EasyCafe';
            }

            badgeText.textContent = greeting;

            // Fade and slide in the welcome greeting badge beautifully
            setTimeout(() => {
                badge.classList.add('show');
            }, 300);
        }
    });
})();
