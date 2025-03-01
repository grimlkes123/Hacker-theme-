/**
 * Input Handler
 * Manages keyboard and touch inputs for game controls
 */
class InputHandler {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        
        // Current pressed keys
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            fire: false,
            special: false
        };
        
        // Touch controls state
        this.touchActive = false;
        this.touchPosition = { x: 0, y: 0 };
        this.touchStartPosition = { x: 0, y: 0 };
        
        // Initialize input listeners
        this.setupKeyboardControls();
        this.setupTouchControls();
    }
    
    setupKeyboardControls() {
        // Key down event
        window.addEventListener('keydown', e => {
            if (!this.gameEngine.state.running || this.gameEngine.state.paused) return;
            
            switch(e.key) {
                // Movement - Arrow keys
                case 'ArrowUp':
                    this.keys.up = true;
                    break;
                case 'ArrowDown':
                    this.keys.down = true;
                    break;
                case 'ArrowLeft':
                    this.keys.left = true;
                    break;
                case 'ArrowRight':
                    this.keys.right = true;
                    break;
                
                // Movement - WASD
                case 'w':
                case 'W':
                    this.keys.up = true;
                    break;
                case 's':
                case 'S':
                    this.keys.down = true;
                    break;
                case 'a':
                case 'A':
                    this.keys.left = true;
                    break;
                case 'd':
                case 'D':
                    this.keys.right = true;
                    break;
                
                // Action keys
                case ' ':  // Space
                    this.keys.fire = true;
                    break;
                case 'Shift':
                    this.keys.special = true;
                    break;
            }
        });
        
        // Key up event
        window.addEventListener('keyup', e => {
            switch(e.key) {
                // Movement - Arrow keys
                case 'ArrowUp':
                    this.keys.up = false;
                    break;
                case 'ArrowDown':
                    this.keys.down = false;
                    break;
                case 'ArrowLeft':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                    this.keys.right = false;
                    break;
                
                // Movement - WASD
                case 'w':
                case 'W':
                    this.keys.up = false;
                    break;
                case 's':
                case 'S':
                    this.keys.down = false;
                    break;
                case 'a':
                case 'A':
                    this.keys.left = false;
                    break;
                case 'd':
                case 'D':
                    this.keys.right = false;
                    break;
                
                // Action keys
                case ' ':  // Space
                    this.keys.fire = false;
                    break;
                case 'Shift':
                    this.keys.special = false;
                    break;
            }
        });
    }
    
    setupTouchControls() {
        // Add touch controls if on mobile
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            this.createTouchControls();
        }
        
        // Touch events for the game canvas
        const canvas = this.gameEngine.canvas;
        
        // Touch start
        canvas.addEventListener('touchstart', e => {
            e.preventDefault();
            if (!this.gameEngine.state.running || this.gameEngine.state.paused) return;
            
            const touch = e.touches[0];
            this.touchActive = true;
            this.touchStartPosition.x = touch.clientX;
            this.touchStartPosition.y = touch.clientY;
            this.touchPosition.x = touch.clientX;
            this.touchPosition.y = touch.clientY;
            
            // Check if touch is in the right side (fire control)
            if (touch.clientX > canvas.width * 0.8) {
                this.keys.fire = true;
            }
            // Check if touch is in the bottom right (special control)
            if (touch.clientX > canvas.width * 0.8 && touch.clientY > canvas.height * 0.8) {
                this.keys.special = true;
            }
        });
        
        // Touch move
        canvas.addEventListener('touchmove', e => {
            e.preventDefault();
            if (!this.touchActive) return;
            
            const touch = e.touches[0];
            this.touchPosition.x = touch.clientX;
            this.touchPosition.y = touch.clientY;
            
            // Calculate swipe direction for movement
            const dx = this.touchPosition.x - this.touchStartPosition.x;
            const dy = this.touchPosition.y - this.touchStartPosition.y;
            const threshold = 30; // Minimum swipe distance
            
            // Reset directions
            this.keys.up = false;
            this.keys.down = false;
            this.keys.left = false;
            this.keys.right = false;
            
            // Set directions based on swipe
            if (dx < -threshold) this.keys.left = true;
            if (dx > threshold) this.keys.right = true;
            if (dy < -threshold) this.keys.up = true;
            if (dy > threshold) this.keys.down = true;
        });
        
        // Touch end
        canvas.addEventListener('touchend', e => {
            e.preventDefault();
            this.touchActive = false;
            
            // Reset all keys on touch end
            this.keys.up = false;
            this.keys.down = false;
            this.keys.left = false;
            this.keys.right = false;
            this.keys.fire = false;
            this.keys.special = false;
        });
    }
    
    createTouchControls() {
        // Create on-screen controls for touch devices
        const touchControls = document.createElement('div');
        touchControls.className = 'touch-controls';
        touchControls.innerHTML = `
            <div class="d-pad">
                <button class="d-up" id="touch-up">⯅</button>
                <button class="d-right" id="touch-right">⯈</button>
                <button class="d-down" id="touch-down">⯆</button>
                <button class="d-left" id="touch-left">⯇</button>
            </div>
            <div class="action-buttons">
                <button class="fire-btn" id="touch-fire">FIRE</button>
                <button class="special-btn" id="touch-special">SPECIAL</button>
            </div>
        `;
        document.getElementById('game-container').appendChild(touchControls);
        
        // D-pad controls
        document.getElementById('touch-up').addEventListener('touchstart', () => this.keys.up = true);
        document.getElementById('touch-up').addEventListener('touchend', () => this.keys.up = false);
        
        document.getElementById('touch-down').addEventListener('touchstart', () => this.keys.down = true);
        document.getElementById('touch-down').addEventListener('touchend', () => this.keys.down = false);
        
        document.getElementById('touch-left').addEventListener('touchstart', () => this.keys.left = true);
        document.getElementById('touch-left').addEventListener('touchend', () => this.keys.left = false);
        
        document.getElementById('touch-right').addEventListener('touchstart', () => this.keys.right = true);
        document.getElementById('touch-right').addEventListener('touchend', () => this.keys.right = false);
        
        // Action buttons
        document.getElementById('touch-fire').addEventListener('touchstart', () => this.keys.fire = true);
        document.getElementById('touch-fire').addEventListener('touchend', () => this.keys.fire = false);
        
        document.getElementById('touch-special').addEventListener('touchstart', () => this.keys.special = true);
        document.getElementById('touch-special').addEventListener('touchend', () => this.keys.special = false);
        
        // Add touch control styles
        const style = document.createElement('style');
        style.textContent = `
            .touch-controls {
                display: none;
                position: absolute;
                bottom: 20px;
                left: 0;
                width: 100%;
                z-index: 100;
            }
            
            .d-pad {
                position: absolute;
                left: 20px;
                bottom: 20px;
                width: 150px;
                height: 150px;
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                grid-template-rows: repeat(3, 1fr);
            }
            
            .d-pad button {
                background: rgba(0, 255, 65, 0.2);
                border: 1px solid rgba(0, 255, 65, 0.6);
                color: #00ff41;
                font-size: 24px;
                outline: none;
                margin: 2px;
            }
            
            .d-up { grid-column: 2; grid-row: 1; }
            .d-right { grid-column: 3; grid-row: 2; }
            .d-down { grid-column: 2; grid-row: 3; }
            .d-left { grid-column: 1; grid-row: 2; }
            
            .action-buttons {
                position: absolute;
                right: 20px;
                bottom: 20px;
                display: flex;
                flex-direction: column;
            }
            
            .action-buttons button {
                width: 80px;
                height: 80px;
                margin: 5px;
                background: rgba(0, 255, 65, 0.2);
                border: 1px solid rgba(0, 255, 65, 0.6);
                color: #00ff41;
                border-radius: 50%;
                font-family: var(--terminal-font);
                font-weight: bold;
                outline: none;
            }
            
            @media (max-width: 768px) {
                .touch-controls {
                    display: flex;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Get current movement direction for the player
    getMovementDirection() {
        const direction = { x: 0, y: 0 };
        
        if (this.keys.up) direction.y = -1;
        if (this.keys.down) direction.y = 1;
        if (this.keys.left) direction.x = -1;
        if (this.keys.right) direction.x = 1;
        
        // Normalize diagonal movement
        if (direction.x !== 0 && direction.y !== 0) {
            const magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
            direction.x /= magnitude;
            direction.y /= magnitude;
        }
        
        return direction;
    }
    
    // Is fire button pressed
    isFirePressed() {
        return this.keys.fire;
    }
    
    // Is special ability button pressed
    isSpecialPressed() {
        return this.keys.special;
    }
}

// Make globally available
window.InputHandler = InputHandler;
