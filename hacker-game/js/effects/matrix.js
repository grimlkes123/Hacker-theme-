/**
 * Matrix Digital Rain Effect
 * Creates the classic "Matrix" style digital rain effect in the background
 */
class MatrixEffect {
    constructor(canvasId = null) {
        // Create canvas if no ID is provided
        if (!canvasId) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'matrix-canvas';
            this.canvas.className = 'matrix-effect';
            document.getElementById('background').appendChild(this.canvas);
        } else {
            this.canvas = document.getElementById(canvasId);
        }

        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();

        // Characters to use in the matrix rain (Japanese katakana and various symbols)
        this.characters = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+-=[]{}|;:,./<>?';
        
        // Initialize variables
        this.fontSize = 14;
        this.columns = Math.floor(this.canvas.width / this.fontSize);
        this.drops = [];
        this.speeds = [];
        this.brightness = [];
        this.active = false;

        // Initialize arrays
        for (let i = 0; i < this.columns; i++) {
            this.drops[i] = Math.floor(Math.random() * -100); // Random starting position above the canvas
            this.speeds[i] = Math.random() * 3 + 2; // Random speed between 2 and 5
            this.brightness[i] = Math.random() * 0.5 + 0.5; // Random brightness between 0.5 and 1
        }

        // Bind the animation and resize handlers
        this.animate = this.animate.bind(this);
        this.resizeCanvas = this.resizeCanvas.bind(this);
        window.addEventListener('resize', this.resizeCanvas);
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Recalculate columns when resized
        this.columns = Math.floor(this.canvas.width / this.fontSize);
        
        // Reset drops or extend array if window grew wider
        if (this.drops && this.drops.length > 0) {
            const oldLength = this.drops.length;
            
            if (this.columns > oldLength) {
                // Window got wider, add more drops
                for (let i = oldLength; i < this.columns; i++) {
                    this.drops[i] = Math.floor(Math.random() * -100);
                    this.speeds[i] = Math.random() * 3 + 2;
                    this.brightness[i] = Math.random() * 0.5 + 0.5;
                }
            } else {
                // Window got narrower, resize arrays
                this.drops = this.drops.slice(0, this.columns);
                this.speeds = this.speeds.slice(0, this.columns);
                this.brightness = this.brightness.slice(0, this.columns);
            }
        }
    }

    start() {
        if (!this.active) {
            this.active = true;
            this.animate();
        }
    }

    stop() {
        this.active = false;
    }

    animate() {
        if (!this.active) return;

        // Semi-transparent black to create fade effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = 0; i < this.drops.length; i++) {
            // Select a random character
            const text = this.characters.charAt(Math.floor(Math.random() * this.characters.length));
            
            // Draw the leading character (bright)
            if (this.drops[i] > 0) {
                this.ctx.font = `${this.fontSize}px monospace`;
                this.ctx.fillStyle = `rgba(0, 255, 65, ${this.brightness[i]})`;
                this.ctx.fillText(text, i * this.fontSize, this.drops[i]);
                
                // Draw trailing characters (dimmer)
                for (let j = 1; j < 20; j++) {
                    if (this.drops[i] - j * this.fontSize > 0) {
                        const trailOpacity = this.brightness[i] * (1 - j * 0.05);
                        if (trailOpacity > 0) {
                            this.ctx.fillStyle = `rgba(0, 255, 65, ${trailOpacity})`;
                            const trailChar = this.characters.charAt(Math.floor(Math.random() * this.characters.length));
                            this.ctx.fillText(trailChar, i * this.fontSize, this.drops[i] - j * this.fontSize);
                        }
                    }
                }
            }
            
            // Move drop down by its speed
            this.drops[i] += this.speeds[i];
            
            // Reset drop to top when it goes offscreen
            if (this.drops[i] > this.canvas.height * 1.5) {
                this.drops[i] = Math.floor(Math.random() * -50) - 50; // Start above the canvas
                this.speeds[i] = Math.random() * 3 + 2; // New random speed
                
                // Random chance to "burst" with faster speed
                if (Math.random() < 0.1) {
                    this.speeds[i] *= 1.5;
                }
            }
        }

        // Continue the animation loop
        requestAnimationFrame(this.animate);
    }

    addRandomBurst() {
        // Make random columns suddenly drop faster
        const burstCount = Math.floor(Math.random() * 10) + 5;
        for (let i = 0; i < burstCount; i++) {
            const columnIndex = Math.floor(Math.random() * this.columns);
            this.speeds[columnIndex] *= 2; // Double the speed temporarily
            
            // Reset after a while
            setTimeout(() => {
                this.speeds[columnIndex] = Math.random() * 3 + 2;
            }, Math.random() * 2000 + 1000);
        }
    }
}

// Initialize and start the matrix effect when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    const matrixEffect = new MatrixEffect();
    matrixEffect.start();
    
    // Add random bursts occasionally
    setInterval(() => {
        matrixEffect.addRandomBurst();
    }, 5000);
    
    // Make global for other scripts to access
    window.matrixEffect = matrixEffect;
});