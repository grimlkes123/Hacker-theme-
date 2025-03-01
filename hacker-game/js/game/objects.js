/**
 * Game Objects
 * Contains classes for all game objects: Enemy, DataNode, PowerUp, Projectile, and Particle
 */

class Enemy {
    constructor(gameEngine, x, y, type = 'basic') {
        this.gameEngine = gameEngine;
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.active = true;
        
        // Different properties based on enemy type
        switch(type) {
            case 'fast':
                this.speed = gameEngine.settings.enemySpeed * 1.5;
                this.health = 1;
                this.damage = 10;
                this.color = '#ff0066';
                break;
            case 'heavy':
                this.speed = gameEngine.settings.enemySpeed * 0.7;
                this.health = 3;
                this.damage = 25;
                this.color = '#ff3333';
                this.width = 40;
                this.height = 40;
                break;
            default: // 'basic'
                this.speed = gameEngine.settings.enemySpeed;
                this.health = 2;
                this.damage = 15;
                this.color = '#ff0000';
        }
        
        // Initial rotation and animation properties
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        
        // Animation properties
        this.pulse = 0;
        this.pulseDir = 1;
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        // Move towards player if it exists
        if (this.gameEngine.player) {
            const player = this.gameEngine.player;
            
            // Skip if player is in stealth mode
            if (player.abilities && player.abilities.stealth && player.abilities.stealth.active) {
                this.wander(deltaTime);
                return;
            }
            
            // Calculate direction to player
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                // Normalize direction
                const dirX = dx / distance;
                const dirY = dy / distance;
                
                // Move towards player
                this.x += dirX * this.speed;
                this.y += dirY * this.speed;
                
                // Update rotation to face player
                this.rotation = Math.atan2(dy, dx);
            }
        } else {
            // Wander randomly if no player
            this.wander(deltaTime);
        }
        
        // Update animation
        this.updateAnimation(deltaTime);
    }
    
    wander(deltaTime) {
        // Random direction change sometimes
        if (Math.random() < 0.01) {
            this.rotation += (Math.random() - 0.5) * Math.PI;
        }
        
        // Move in current direction
        this.x += Math.cos(this.rotation) * this.speed;
        this.y += Math.sin(this.rotation) * this.speed;
        
        // Bounce off edges
        if (this.x < 0 || this.x > this.gameEngine.canvas.width) {
            this.rotation = Math.PI - this.rotation;
        }
        if (this.y < 0 || this.y > this.gameEngine.canvas.height) {
            this.rotation = -this.rotation;
        }
    }
    
    updateAnimation(deltaTime) {
        // Update pulse effect
        this.pulse += 0.05 * this.pulseDir;
        if (this.pulse >= 1) {
            this.pulse = 1;
            this.pulseDir = -1;
        } else if (this.pulse <= 0) {
            this.pulse = 0;
            this.pulseDir = 1;
        }
        
        // Rotate
        this.rotation += this.rotationSpeed;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        
        if (this.health <= 0) {
            this.active = false;
        }
    }
    
    render(ctx) {
        if (!this.active) return;
        
        // Save context state
        ctx.save();
        
        // Move to enemy position
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Draw enemy shape based on type
        switch(this.type) {
            case 'fast':
                this.drawTriangle(ctx);
                break;
            case 'heavy':
                this.drawHeavy(ctx);
                break;
            default: // 'basic'
                this.drawBasic(ctx);
                break;
        }
        
        // Restore context
        ctx.restore();
    }
    
    drawBasic(ctx) {
        // Draw hexagon shape for basic enemy
        ctx.beginPath();
        const sides = 6;
        const radius = this.width / 2;
        
        for (let i = 0; i < sides; i++) {
            const angle = i * 2 * Math.PI / sides;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        
        // Fill with gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        gradient.addColorStop(0, '#ff6666');
        gradient.addColorStop(1, this.color);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Stroke
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Inner details
        this.drawEnemyInnerDetails(ctx, radius);
    }
    
    drawTriangle(ctx) {
        // Draw triangle shape for fast enemy
        const halfWidth = this.width / 2;
        
        ctx.beginPath();
        ctx.moveTo(halfWidth, 0); // Top point
        ctx.lineTo(-halfWidth, halfWidth); // Bottom left
        ctx.lineTo(-halfWidth, -halfWidth); // Bottom right
        ctx.closePath();
        
        // Fill with gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, halfWidth);
        gradient.addColorStop(0, '#ff99cc');
        gradient.addColorStop(1, this.color);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Stroke
        ctx.strokeStyle = '#ff0066';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Inner circle
        ctx.beginPath();
        ctx.arc(0, 0, halfWidth / 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0066';
        ctx.fill();
    }
    
    drawHeavy(ctx) {
        // Draw square shape for heavy enemy
        const halfWidth = this.width / 2;
        
        // Main square body
        ctx.beginPath();
        ctx.rect(-halfWidth, -halfWidth, this.width, this.width);
        
        // Fill with gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, halfWidth);
        gradient.addColorStop(0, '#ff9999');
        gradient.addColorStop(1, this.color);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Stroke
        ctx.strokeStyle = '#ff3333';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw X in the center
        ctx.beginPath();
        ctx.moveTo(-halfWidth / 2, -halfWidth / 2);
        ctx.lineTo(halfWidth / 2, halfWidth / 2);
        ctx.moveTo(halfWidth / 2, -halfWidth / 2);
        ctx.lineTo(-halfWidth / 2, halfWidth / 2);
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    drawEnemyInnerDetails(ctx, radius) {
        // Draw a pulsing core
        const coreRadius = radius * 0.4 * (0.8 + this.pulse * 0.2);
        
        ctx.beginPath();
        ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0000';
        ctx.fill();
        
        // Draw energy lines
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            const angle = i * Math.PI * 2 / 3;
            ctx.moveTo(0, 0);
            ctx.lineTo(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius
            );
        }
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

class DataNode {
    constructor(gameEngine, x, y) {
        this.gameEngine = gameEngine;
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.active = true;
        
        // Visual properties
        this.color = '#00ff41'; // Matrix green
        this.pulse = 0;
        this.pulseDirection = 1;
        this.rotation = 0;
        
        // Animation properties
        this.rotationSpeed = (Math.random() * 0.02) + 0.01;
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        // Update pulse animation
        this.pulse += 0.05 * this.pulseDirection;
        if (this.pulse >= 1) {
            this.pulse = 1;
            this.pulseDirection = -1;
        } else if (this.pulse <= 0) {
            this.pulse = 0;
            this.pulseDirection = 1;
        }
        
        // Update rotation
        this.rotation += this.rotationSpeed;
        if (this.rotation >= Math.PI * 2) {
            this.rotation -= Math.PI * 2;
        }
    }
    
    render(ctx) {
        if (!this.active) return;
        
        // Save context
        ctx.save();
        
        // Move to data node position
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Calculate size based on pulse
        const size = this.width * (0.8 + this.pulse * 0.2);
        
        // Draw outer diamond shape
        ctx.beginPath();
        ctx.moveTo(0, -size / 2); // Top
        ctx.lineTo(size / 2, 0);  // Right
        ctx.lineTo(0, size / 2);  // Bottom
        ctx.lineTo(-size / 2, 0); // Left
        ctx.closePath();
        
        // Fill with gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, this.color);
        gradient.addColorStop(1, '#004010');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Stroke
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Inner details
        ctx.beginPath();
        ctx.arc(0, 0, size / 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        // Draw data lines
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const angle = i * Math.PI / 2 + Math.PI / 4;
            ctx.moveTo(0, 0);
            ctx.lineTo(
                Math.cos(angle) * size / 2,
                Math.sin(angle) * size / 2
            );
        }
        
        ctx.strokeStyle = '#00ff41';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Restore context
        ctx.restore();
        
        // Draw glow effect
        ctx.save();
        ctx.globalAlpha = 0.1 + this.pulse * 0.2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

class PowerUp {
    constructor(gameEngine, x, y, type, name, color = '#ffff00') {
        this.gameEngine = gameEngine;
        this.x = x;
        this.y = y;
        this.width = 25;
        this.height = 25;
        this.type = type; // 'stealth', 'shield', etc.
        this.name = name;
        this.color = color;
        this.active = true;
        
        // Visual properties
        this.rotation = 0;
        this.rotationSpeed = 0.03;
        this.pulseValue = 0;
        this.pulseDir = 1;
        
        // Hover effect
        this.originalY = y;
        this.hoverOffset = 0;
        this.hoverSpeed = 0.03;
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        // Rotate
        this.rotation += this.rotationSpeed;
        if (this.rotation >= Math.PI * 2) {
            this.rotation -= Math.PI * 2;
        }
        
        // Pulse
        this.pulseValue += 0.05 * this.pulseDir;
        if (this.pulseValue >= 1) {
            this.pulseValue = 1;
            this.pulseDir = -1;
        } else if (this.pulseValue <= 0) {
            this.pulseValue = 0;
            this.pulseDir = 1;
        }
        
        // Hover effect
        this.hoverOffset = Math.sin(performance.now() * 0.002) * 5;
        this.y = this.originalY + this.hoverOffset;
    }
    
    render(ctx) {
        if (!this.active) return;
        
        // Save context
        ctx.save();
        
        // Move to power-up position
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Calculate size based on pulse
        const size = this.width * (0.9 + this.pulseValue * 0.1);
        
        // Draw different shapes based on power-up type
        switch(this.type) {
            case 'stealth':
                this.drawStealthPowerUp(ctx, size);
                break;
            case 'shield':
                this.drawShieldPowerUp(ctx, size);
                break;
            case 'speedboost':
                this.drawSpeedPowerUp(ctx, size);
                break;
            default:
                this.drawDefaultPowerUp(ctx, size);
        }
        
        // Restore context
        ctx.restore();
        
        // Draw glow effect
        ctx.save();
        ctx.globalAlpha = 0.2 + this.pulseValue * 0.3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
    
    drawStealthPowerUp(ctx, size) {
        const halfSize = size / 2;
        
        // Draw eye symbol
        ctx.beginPath();
        ctx.ellipse(0, 0, halfSize, halfSize / 2, 0, 0, Math.PI * 2);
        
        // Fill with gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, halfSize);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, '#006666');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Stroke
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Pupil
        ctx.beginPath();
        ctx.arc(0, 0, halfSize / 3, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
        
        // Reflection
        ctx.beginPath();
        ctx.arc(halfSize / 6, -halfSize / 6, halfSize / 10, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    }
    
    drawShieldPowerUp(ctx, size) {
        const halfSize = size / 2;
        
        // Draw shield symbol
        ctx.beginPath();
        ctx.moveTo(0, -halfSize);
        ctx.lineTo(halfSize, -halfSize / 3);
        ctx.lineTo(halfSize, halfSize / 2);
        ctx.lineTo(0, halfSize);
        ctx.lineTo(-halfSize, halfSize / 2);
        ctx.lineTo(-halfSize, -halfSize / 3);
        ctx.closePath();
        
        // Fill with gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, halfSize);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, '#666600');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Stroke
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Inner details
        ctx.beginPath();
        ctx.moveTo(0, -halfSize / 2);
        ctx.lineTo(0, halfSize / 2);
        ctx.moveTo(-halfSize / 2, 0);
        ctx.lineTo(halfSize / 2, 0);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    drawSpeedPowerUp(ctx, size) {
        const halfSize = size / 2;
        
        // Draw lightning bolt symbol
        ctx.beginPath();
        ctx.moveTo(-halfSize / 4, -halfSize);
        ctx.lineTo(halfSize / 2, -halfSize / 4);
        ctx.lineTo(0, 0);
        ctx.lineTo(halfSize / 2, 0);
        ctx.lineTo(-halfSize / 4, halfSize);
        ctx.lineTo(0, halfSize / 4);
        ctx.lineTo(-halfSize / 2, 0);
        ctx.closePath();
        
        // Fill with gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, halfSize);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, '#660066');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Stroke
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    drawDefaultPowerUp(ctx, size) {
        const halfSize = size / 2;
        
        // Draw star shape
        ctx.beginPath();
        const spikes = 5;
        const outerRadius = halfSize;
        const innerRadius = halfSize / 2;
        
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = Math.PI * i / spikes;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        
        // Fill with gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, outerRadius);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, '#664400');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Stroke
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class Projectile {
    constructor(gameEngine, x, y, dirX, dirY, damage, speed, color = '#00ff41', owner = null) {
        this.gameEngine = gameEngine;
        this.x = x;
        this.y = y;
        this.dirX = dirX;
        this.dirY = dirY;
        this.damage = damage;
        this.speed = speed;
        this.color = color;
        this.owner = owner; // Reference to who fired it
        this.width = 8;
        this.height = 8;
        this.active = true;
        
        // Visual properties
        this.tailLength = 5;
        this.tail = [];
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        // Store previous position for trail
        this.tail.unshift({ x: this.x, y: this.y });
        if (this.tail.length > this.tailLength) {
            this.tail.pop();
        }
        
        // Move projectile
        this.x += this.dirX * this.speed;
        this.y += this.dirY * this.speed;
        
        // Check if out of bounds
        if (this.x < 0 || this.x > this.gameEngine.canvas.width ||
            this.y < 0 || this.y > this.gameEngine.canvas.height) {
            this.active = false;
        }
    }
    
    render(ctx) {
        if (!this.active) return;
        
        // Draw tail
        if (this.tail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.tail[0].x, this.tail[0].y);
            
            for (let i = 1; i < this.tail.length; i++) {
                ctx.lineTo(this.tail[i].x, this.tail[i].y);
            }
            
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Draw projectile head
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        
        // Fill with gradient
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.width / 2);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, this.color);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class Particle {
    constructor(x, y, vx, vy, color, size, lifespan) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.originalSize = size;
        this.lifespan = lifespan;
        this.originalLifespan = lifespan;
        this.active = true;
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        // Reduce lifespan
        this.lifespan -= deltaTime;
        if (this.lifespan <= 0) {
            this.active = false;
            return;
        }
        
        // Apply velocity
        this.x += this.vx;
        this.y += this.vy;
        
        // Slow down
        this.vx *= 0.98;
        this.vy *= 0.98;
        
        // Shrink as lifespan decreases
        this.size = this.originalSize * (this.lifespan / this.originalLifespan);
    }
    
    render(ctx) {
        if (!this.active) return;
        
        // Calculate opacity based on remaining lifespan
        const opacity = this.lifespan / this.originalLifespan;
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        
        // Apply color with opacity
        const color = this.color.startsWith('#') ? this.hexToRgba(this.color, opacity) : this.color;
        ctx.fillStyle = color;
        ctx.fill();
    }
    
    hexToRgba(hex, alpha) {
        // Convert hex to rgb
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

// Input Handler for controlling the game with keyboard and touch
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
            
            // Right side of screen is fire control
            if (touch.clientX > canvas.width * 0.8) {
                this.keys.fire = true;
            }
            // Bottom right is special ability
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
            if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    // Horizontal swipe
                    this.keys.left = dx < 0;
                    this.keys.right = dx > 0;
                } else {
                    // Vertical swipe
                    this.keys.up = dy < 0;
                    this.keys.down = dy > 0;
                }
                
                // Update start position for continuous movement
                this.touchStartPosition.x = this.touchPosition.x;
                this.touchStartPosition.y = this.touchPosition.y;
            }
        });
        
        // Touch end
        canvas.addEventListener('touchend', e => {
            e.preventDefault();
            this.touchActive = false;
            
            this.keys.fire = false;
            this.keys.special = false;
            
            // Keep movement keys active for a short time to avoid jerky controls
            setTimeout(() => {
                this.keys.up = false;
                this.keys.down = false;
                this.keys.left = false;
                this.keys.right = false;
            }, 50);
        });
    }
    
    createTouchControls() {
        // Create virtual joystick for mobile devices
        const touchControls = document.createElement('div');
        touchControls.className = 'touch-controls';
        touchControls.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            width: 120px;
            height: 120px;
            border-radius: 60px;
            background: rgba(0, 255, 65, 0.2);
            border: 1px solid rgba(0, 255, 65, 0.5);
            z-index: 100;
            touch-action: none;
        `;
        
        const joystickKnob = document.createElement('div');
        joystickKnob.className = 'joystick-knob';
        joystickKnob.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 40px;
            height: 40px;
            margin-left: -20px;
            margin-top: -20px;
            border-radius: 20px;
            background: rgba(0, 255, 65, 0.6);
            border: 1px solid rgba(0, 255, 65, 0.8);
            transition: transform 0.1s;
        `;
        touchControls.appendChild(joystickKnob);
        
        // Add action buttons
        const actionButtons = document.createElement('div');
        actionButtons.className = 'action-buttons';
        actionButtons.style.cssText = `
            position: absolute;
            bottom: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            z-index: 100;
        `;
        
        const fireButton = document.createElement('button');
        fireButton.className = 'fire-button';
        fireButton.style.cssText = `
            width: 60px;
            height: 60px;
            border-radius: 30px;
            background: rgba(255, 0, 65, 0.4);
            border: 1px solid rgba(255, 0, 65, 0.8);
            color: #fff;
            font-weight: bold;
            font-family: monospace;
        `;
        fireButton.textContent = 'FIRE';
        
        const specialButton = document.createElement('button');
        specialButton.className = 'special-button';
        specialButton.style.cssText = `
            width: 60px;
            height: 60px;
            border-radius: 30px;
            background: rgba(0, 255, 255, 0.4);
            border: 1px solid rgba(0, 255, 255, 0.8);
            color: #fff;
            font-weight: bold;
            font-family: monospace;
        `;
        specialButton.textContent = 'SHIFT';
        
        actionButtons.appendChild(fireButton);
        actionButtons.appendChild(specialButton);
        
        // Append controls to document
        document.body.appendChild(touchControls);
        document.body.appendChild(actionButtons);
        
        // Joystick touch handling
        touchControls.addEventListener('touchstart', e => {
            e.preventDefault();
            this.handleJoystickTouch(e, touchControls, joystickKnob);
        });
        
        touchControls.addEventListener('touchmove', e => {
            e.preventDefault();
            this.handleJoystickTouch(e, touchControls, joystickKnob);
        });
        
        touchControls.addEventListener('touchend', e => {
            e.preventDefault();
            joystickKnob.style.transform = 'translate(0, 0)';
            this.keys.up = false;
            this.keys.down = false;
            this.keys.left = false;
            this.keys.right = false;
        });
        
        // Button touch handling
        fireButton.addEventListener('touchstart', e => {
            e.preventDefault();
            this.keys.fire = true;
        });
        
        fireButton.addEventListener('touchend', e => {
            e.preventDefault();
            this.keys.fire = false;
        });
        
        specialButton.addEventListener('touchstart', e => {
            e.preventDefault();
            this.keys.special = true;
        });
        
        specialButton.addEventListener('touchend', e => {
            e.preventDefault();
            this.keys.special = false;
        });
    }
    
    handleJoystickTouch(e, touchControls, joystickKnob) {
        const touch = e.touches[0];
        const rect = touchControls.getBoundingClientRect();
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        // Calculate distance from center
        const dx = touchX - centerX;
        const dy = touchY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize and clamp to joystick bounds
        const maxDistance = rect.width / 2;
        const normalizedDistance = Math.min(distance, maxDistance);
        const angle = Math.atan2(dy, dx);
        
        const clampedX = Math.cos(angle) * normalizedDistance;
        const clampedY = Math.sin(angle) * normalizedDistance;
        
        // Move joystick knob
        joystickKnob.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
        
        // Update keys based on joystick position
        const deadzone = maxDistance * 0.2;
        if (distance > deadzone) {
            this.keys.left = dx < -deadzone;
            this.keys.right = dx > deadzone;
            this.keys.up = dy < -deadzone;
            this.keys.down = dy > deadzone;
        } else {
            this.keys.left = false;
            this.keys.right = false;
            this.keys.up = false;
            this.keys.down = false;
        }
    }
    
    getMovementDirection() {
        // Get normalized movement vector from keys
        const direction = { x: 0, y: 0 };
        
        if (this.keys.left) direction.x -= 1;
        if (this.keys.right) direction.x += 1;
        if (this.keys.up) direction.y -= 1;
        if (this.keys.down) direction.y += 1;
        
        // Normalize diagonal movement
        if (direction.x !== 0 && direction.y !== 0) {
            const magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
            direction.x /= magnitude;
            direction.y /= magnitude;
        }
        
        return direction;
    }
    
    isFirePressed() {
        return this.keys.fire;
    }
    
    isSpecialPressed() {
        return this.keys.special;
    }
}

// Make all game objects globally available
window.Enemy = Enemy;
window.DataNode = DataNode;
window.PowerUp = PowerUp;
window.Projectile = Projectile;
window.Particle = Particle;
window.InputHandler = InputHandler;