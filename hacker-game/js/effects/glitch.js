/**
 * Glitch Effect System
 * Adds random visual glitches and distortions to create a cyberpunk atmosphere
 */
class GlitchEffect {
    constructor() {
        this.active = false;
        this.intensity = 0.5; // Glitch intensity 0-1
        this.intervalId = null;
        this.glitchDuration = 200; // ms
        
        // Create the glitch overlay elements
        this.createGlitchElements();
    }
    
    createGlitchElements() {
        // Create main glitch container
        this.container = document.createElement('div');
        this.container.className = 'glitch-container';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
            opacity: 0;
            mix-blend-mode: overlay;
        `;
        
        // Create RGB split layers
        this.redLayer = document.createElement('div');
        this.redLayer.className = 'glitch-layer red-layer';
        this.redLayer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: transparent;
            opacity: 0.4;
        `;
        
        this.greenLayer = document.createElement('div');
        this.greenLayer.className = 'glitch-layer green-layer';
        this.greenLayer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: transparent;
            opacity: 0.4;
        `;
        
        this.blueLayer = document.createElement('div');
        this.blueLayer.className = 'glitch-layer blue-layer';
        this.blueLayer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: transparent;
            opacity: 0.4;
        `;
        
        // Create noise overlay
        this.noiseOverlay = document.createElement('div');
        this.noiseOverlay.className = 'noise-overlay';
        this.noiseOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: url('data:image/png;base64,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');
            opacity: 0;
            animation: noise 0.5s linear infinite;
        `;
        
        // Create horizontal lines
        this.horizontalLines = document.createElement('div');
        this.horizontalLines.className = 'horizontal-lines';
        this.horizontalLines.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: repeating-linear-gradient(
                0deg,
                rgba(0, 0, 0, 0) 0px,
                rgba(0, 0, 0, 0) 1px,
                rgba(0, 255, 65, 0.1) 2px,
                rgba(0, 0, 0, 0) 3px
            );
            background-size: 100% 4px;
            opacity: 0;
        `;
        
        // Append all elements
        this.container.appendChild(this.redLayer);
        this.container.appendChild(this.greenLayer);
        this.container.appendChild(this.blueLayer);
        this.container.appendChild(this.noiseOverlay);
        this.container.appendChild(this.horizontalLines);
        
        document.body.appendChild(this.container);
        
        // Define CSS keyframes for noise animation
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes noise {
                0%, 100% { background-position: 0 0; }
                10% { background-position: -5% -10%; }
                20% { background-position: -15% 5%; }
                30% { background-position: 7% -25%; }
                40% { background-position: 20% 25%; }
                50% { background-position: -25% 10%; }
                60% { background-position: 15% 5%; }
                70% { background-position: 0% 15%; }
                80% { background-position: 25% 35%; }
                90% { background-position: -10% 10%; }
            }
        `;
        document.head.appendChild(style);
    }
    
    setIntensity(value) {
        this.intensity = Math.min(Math.max(value, 0), 1);
    }
    
    applyGlitch() {
        if (!this.active) return;
        
        // Show glitch container
        this.container.style.opacity = '1';
        
        // Random RGB shift strength based on intensity
        const maxOffset = 10 * this.intensity;
        
        // Apply random RGB shifts
        this.redLayer.style.boxShadow = `inset ${Math.random() * maxOffset - maxOffset/2}px ${Math.random() * maxOffset - maxOffset/2}px ${Math.random() * 20}px rgba(255, 0, 0, ${0.2 * this.intensity})`;
        this.greenLayer.style.boxShadow = `inset ${Math.random() * maxOffset - maxOffset/2}px ${Math.random() * maxOffset - maxOffset/2}px ${Math.random() * 20}px rgba(0, 255, 0, ${0.2 * this.intensity})`;
        this.blueLayer.style.boxShadow = `inset ${Math.random() * maxOffset - maxOffset/2}px ${Math.random() * maxOffset - maxOffset/2}px ${Math.random() * 20}px rgba(0, 0, 255, ${0.2 * this.intensity})`;
        
        // Random offset for RGB layers
        this.redLayer.style.transform = `translate(${Math.random() * maxOffset - maxOffset/2}px, ${Math.random() * maxOffset - maxOffset/2}px)`;
        this.greenLayer.style.transform = `translate(${Math.random() * maxOffset - maxOffset/2}px, ${Math.random() * maxOffset - maxOffset/2}px)`;
        this.blueLayer.style.transform = `translate(${Math.random() * maxOffset - maxOffset/2}px, ${Math.random() * maxOffset - maxOffset/2}px)`;
        
        // Show horizontal lines with random intensity
        if (Math.random() < this.intensity * 0.8) {
            this.horizontalLines.style.opacity = (Math.random() * 0.5 + 0.2) * this.intensity;
        } else {
            this.horizontalLines.style.opacity = '0';
        }
        
        // Show noise with random intensity
        if (Math.random() < this.intensity * 0.7) {
            this.noiseOverlay.style.opacity = (Math.random() * 0.3 + 0.1) * this.intensity;
        } else {
            this.noiseOverlay.style.opacity = '0';
        }
        
        // Set timeout to revert the glitch
        setTimeout(() => {
            // Hide or reduce glitch effect
            this.container.style.opacity = '0';
            this.noiseOverlay.style.opacity = '0';
            this.horizontalLines.style.opacity = '0';
        }, this.glitchDuration);
    }
    
    start() {
        if (this.active) return;
        this.active = true;
        
        // Apply glitch effect at random intervals
        const minDelay = 1000; // Minimum milliseconds between glitches
        const maxDelay = 8000; // Maximum milliseconds between glitches
        
        const applyRandomGlitch = () => {
            if (!this.active) return;
            
            this.applyGlitch();
            
            // Calculate next glitch timing
            const nextDelay = Math.random() * (maxDelay - minDelay) + minDelay;
            setTimeout(applyRandomGlitch, nextDelay);
        };
        
        // Start the random glitch cycle
        applyRandomGlitch();
    }
    
    stop() {
        this.active = false;
        this.container.style.opacity = '0';
        this.noiseOverlay.style.opacity = '0';
        this.horizontalLines.style.opacity = '0';
    }
    
    triggerIntenseGlitch(duration = 1000) {
        // Store original intensity
        const originalIntensity = this.intensity;
        
        // Set high intensity
        this.intensity = 1.0;
        
        // Apply multiple glitches rapidly
        let count = 0;
        const rapidGlitches = setInterval(() => {
            this.applyGlitch();
            count++;
            
            if (count > duration / 100) {
                clearInterval(rapidGlitches);
                // Restore original intensity
                this.intensity = originalIntensity;
            }
        }, 100);
    }
}

// Initialize and start the glitch effect when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    const glitchEffect = new GlitchEffect();
    glitchEffect.setIntensity(0.6); // Set initial intensity
    glitchEffect.start();
    
    // Make it available globally
    window.glitchEffect = glitchEffect;
    
    // Trigger intense glitch on game events (example)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'g') {
            glitchEffect.triggerIntenseGlitch();
        }
    });
});