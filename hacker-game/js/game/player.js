/**
 * Player Class
 * Controls the player character, abilities, and actions
 */
class Player {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.ctx = gameEngine.ctx;
        
        // Basic properties
        this.width = 32;
        this.height = 32;
        this.resetPosition();
        
        // Movement properties
        this.speed = 4;
        this.isBoosting = false;
        this.boostSpeed = 8;
        this.boostCooldown = 0;
        this.boostCooldownTime = 3000; // ms
        this.boostDuration = 0;
        this.boostMaxDuration = 1000; // ms
        
        // Display properties
        this.color = '#00ff41'; // Matrix green
        this.rotation = 0;
        this.targetRotation = 0;
        this.rotationSpeed = 0.15;
        
        // Game properties
        this.health = 100;
        this.maxHealth = 100;
        this.isAlive = true;
        this.invulnerable = false;
        this.invulnerableTime = 0;
        this.invulnerableDuration = 1500; // ms after taking damage
        
        // Ability system
        this.abilities = {
            stealth: {
                active: false,
                duration: 0,
                maxDuration: 3000, // ms
                cooldown: 0,
                cooldownTime: 8000 // ms
            },
            shield: {
                active: false,
                duration: 0,
                maxDuration: 4000, // ms
                cooldown: 0,
                cooldownTime: 12000 // ms
            }
        };
        
        // Shooting properties
        this.fireRate = 300; // ms
        this.lastShot = 0;
        
        // Animation properties
        this.frame = 0;
        this.frameCount = 8;
        this.frameDelay = 100; // ms
        this.frameTimer = 0;
        
        // Trail
        this.trail = [];
        this.maxTrailLength = 8;
        this.trailUpdateDelay = 50; // ms
        this.trailTimer = 0;
        
        // Generate procedural avatar
        this.generateAvatar();
    }
    
    resetPosition() {
        // Position player in the center-bottom of the canvas
        const canvas = this.gameEngine.canvas;
        this.x = canvas.width / 2;
        this.y = canvas.height * 0.8;
        
        // Reset movement
        this.dx = 0;
        this.dy = 0;
    }
    
    generateAvatar() {
        // Create a unique procedural avatar shape
        this.avatarPoints = [];
        const segments = 10;
        const baseRadius = this.width / 2;
        
        for (let i = 0; i < segments; i++) {
            const angle = (Math.PI * 2 / segments) * i;
            
            // Randomize radius slightly for organic feel
            const radiusVariance = (i % 3 === 0) ? 0.8 : 1;
            const radius = baseRadius * (0.8 + Math.random() * 0.4) * radiusVariance;
            
            this.avatarPoints.push({
                angle: angle,
                radius: radius,
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }
        
        // Generate inner details
        this.innerLines = [];
        for (let i = 0; i < 5; i++) {
            const startPoint = Math.floor(Math.random() * segments);
            const endPoint = (startPoint + Math.floor(segments / 2)) % segments;
            this.innerLines.push({
                start: startPoint,
                end: endPoint
            });
        }
        
        // Generate thruster positions
        this.thrusters = [
            { x: -baseRadius * 0.7, y: baseRadius * 0.9 },
            { x: baseRadius * 0.7, y: baseRadius * 0.9 }
        ];
    }
    
    update(deltaTime) {
        if (!this.isAlive) return;
        
        // Update cooldowns
        this.updateCooldowns(deltaTime);
        
        // Handle movement
        this.handleMovement(deltaTime);
        
        // Handle firing
        this.handleFiring(deltaTime);
        
        // Handle abilities
        this.handleAbilities(deltaTime);
        
        // Update animation
        this.updateAnimation(deltaTime);
        
        // Update trail
        this.updateTrail(deltaTime);
    }
    
    updateCooldowns(deltaTime) {
        // Update invulnerability
        if (this.invulnerable) {
            this.invulnerableTime -= deltaTime;
            if (this.invulnerableTime <= 0) {
                this.invulnerable = false;
            }
        }
        
        // Update stealth cooldown
        if (this.abilities.stealth.active) {
            this.abilities.stealth.duration -= deltaTime;
            if (this.abilities.stealth.duration <= 0) {
                this.abilities.stealth.active = false;
                this.abilities.stealth.cooldown = this.abilities.stealth.cooldownTime;
            }
        } else if (this.abilities.stealth.cooldown > 0) {
            this.abilities.stealth.cooldown -= deltaTime;
        }
        
        // Update shield cooldown
        if (this.abilities.shield.active) {
            this.abilities.shield.duration -= deltaTime;
            if (this.abilities.shield.duration <= 0) {
                this.abilities.shield.active = false;
                this.abilities.shield.cooldown = this.abilities.shield.cooldownTime;
            }
        } else if (this.abilities.shield.cooldown > 0) {
            this.abilities.shield.cooldown -= deltaTime;
        }
        
        // Update boost
        if (this.isBoosting) {
            this.boostDuration -= deltaTime;
            if (this.boostDuration <= 0) {
                this.isBoosting = false;
                this.boostCooldown = this.boostCooldownTime;
            }
        } else if (this.boostCooldown > 0) {
            this.boostCooldown -= deltaTime;
        }
    }
    
    handleMovement(deltaTime) {
        if (!this.gameEngine.inputHandler) return;
        
        // Get movement direction from input
        const direction = this.gameEngine.inputHandler.getMovementDirection();
        
        // Calculate movement speed (normal or boosted)
        const currentSpeed = this.isBoosting ? this.boostSpeed : this.speed;
        
        // Apply movement
        this.x += direction.x * currentSpeed;
        this.y += direction.y * currentSpeed;
        
        // Keep player within bounds
        const canvas = this.gameEngine.canvas;
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        
        this.x = Math.max(halfWidth, Math.min(this.x, canvas.width - halfWidth));
        this.y = Math.max(halfHeight, Math.min(this.y, canvas.height - halfHeight));
        
        // Update rotation based on movement
        if (direction.x !== 0 || direction.y !== 0) {
            this.targetRotation = Math.atan2(direction.y, direction.x) + Math.PI / 2;
            
            // Handle angle wrap-around for smooth rotation
            while (this.targetRotation - this.rotation > Math.PI) this.rotation += Math.PI * 2;
            while (this.rotation - this.targetRotation > Math.PI) this.rotation -= Math.PI * 2;
            
            // Smooth rotation
            this.rotation += (this.targetRotation - this.rotation) * this.rotationSpeed;
        }
        
        // Try to boost if shift is pressed
        if (this.gameEngine.inputHandler.isSpecialPressed() && this.boostCooldown <= 0 && !this.isBoosting) {
            this.activateBoost();
        }
    }
    
    activateBoost() {
        this.isBoosting = true;
        this.boostDuration = this.boostMaxDuration;
        
        // Play boost sound
        if (this.gameEngine.audioSynth) {
            this.gameEngine.audioSynth.createSweep(300, 800, 0.3, 'sine', 0.2);
        }
    }
    
    handleFiring(deltaTime) {
        if (!this.gameEngine.inputHandler) return;
        
        const now = performance.now();
        
        // Check if fire button is pressed and cooldown is over
        if (this.gameEngine.inputHandler.isFirePressed() && now - this.lastShot > this.fireRate) {
            this.shoot();
            this.lastShot = now;
        }
    }
    
    shoot() {
        // Calculate projectile spawn position (in front of player)
        const angle = this.rotation;
        const spawnDistance = this.width / 2;
        const spawnX = this.x + Math.sin(angle) * spawnDistance;
        const spawnY = this.y - Math.cos(angle) * spawnDistance;
        
        // Create projectile
        const projectile = new Projectile(
            this.gameEngine,
            spawnX,
            spawnY,
            Math.sin(angle), // x direction
            -Math.cos(angle), // y direction
            10, // damage
            this.gameEngine.settings.projectileSpeed,
            '#00ffff', // cyan color
            this // owner reference
        );
        
        // Add to game engine's projectile array
        this.gameEngine.projectiles.push(projectile);
        
        // Play shoot sound
        if (this.gameEngine.audioSynth) {
            this.gameEngine.audioSynth.playShoot();
        }
    }
    
    handleAbilities(deltaTime) {
        if (!this.gameEngine.inputHandler) return;
        
        // Check for ability activation - can be extended for multiple abilities
        if (this.gameEngine.inputHandler.isSpecialPressed()) {
            // Prioritize shields if both are available
            if (this.abilities.shield.cooldown <= 0 && !this.abilities.shield.active) {
                this.activateAbility('shield');
            } else if (this.abilities.stealth.cooldown <= 0 && !this.abilities.stealth.active) {
                this.activateAbility('stealth');
            }
        }
    }
    
    activateAbility(name) {
        const ability = this.abilities[name];
        if (!ability || ability.active || ability.cooldown > 0) return false;
        
        // Activate the ability
        ability.active = true;
        ability.duration = ability.maxDuration;
        
        // Special effects for each ability
        if (name === 'stealth') {
            // Create stealth effect
            this.createStealthEffect();
        } else if (name === 'shield') {
            // Create shield effect
            this.createShieldEffect();
        }
        
        // Play power-up sound
        if (this.gameEngine.audioSynth) {
            this.gameEngine.audioSynth.playPowerUp();
        }
        
        return true;
    }
    
    createStealthEffect() {
        // Add visual feedback for stealth activation
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            const particle = new Particle(
                this.x,
                this.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#00ffff',
                Math.random() * 5 + 2,
                Math.random() * 1000 + 500
            );
            this.gameEngine.particles.push(particle);
        }
        
        // Add message to terminal if available
        if (this.gameEngine.terminalInstance) {
            this.gameEngine.terminalInstance.writeToTerminal(
                '> Stealth mode activated: Network signature masked for ' + 
                (this.abilities.stealth.maxDuration / 1000).toFixed(1) + ' seconds',
                'success'
            );
        }
    }
    
    createShieldEffect() {
        // Add visual feedback for shield activation
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const particle = new Particle(
                this.x + Math.cos(angle) * this.width,
                this.y + Math.sin(angle) * this.width,
                Math.cos(angle) * 0.5,
                Math.sin(angle) * 0.5,
                '#ffff00',
                Math.random() * 4 + 2,
                Math.random() * 1000 + 500
            );
            this.gameEngine.particles.push(particle);
        }
        
        // Add message to terminal if available
        if (this.gameEngine.terminalInstance) {
            this.gameEngine.terminalInstance.writeToTerminal(
                '> Defense shield activated: Protected from security protocols for ' + 
                (this.abilities.shield.maxDuration / 1000).toFixed(1) + ' seconds',
                'success'
            );
        }
    }
    
    updateAnimation(deltaTime) {
        this.frameTimer += deltaTime;
        if (this.frameTimer > this.frameDelay) {
            this.frame = (this.frame + 1) % this.frameCount;
            this.frameTimer = 0;
        }
    }
    
    updateTrail(deltaTime) {
        this.trailTimer += deltaTime;
        if (this.trailTimer > this.trailUpdateDelay) {
            // Add current position to trail
            this.trail.unshift({ x: this.x, y: this.y, rotation: this.rotation });
            
            // Keep trail at desired length
            if (this.trail.length > this.maxTrailLength) {
                this.trail.pop();
            }
            
            this.trailTimer = 0;
        }
    }
    
    takeDamage(amount) {
        // Check if player can take damage
        if (this.invulnerable || this.abilities.shield.active || !this.isAlive) return;
        
        // Apply damage
        this.health -= amount;
        
        // Clamp health to 0-max
        this.health = Math.max(0, Math.min(this.health, this.maxHealth));
        
        // Check if dead
        if (this.health <= 0) {
            this.die();
            return;
        }
        
        // Set invulnerability
        this.invulnerable = true;
        this.invulnerableTime = this.invulnerableDuration;
        
        // Play damage sound
        if (this.gameEngine.audioSynth) {
            this.gameEngine.audioSynth.playDamage();
        }
        
        // Create damage visual effect
        this.createDamageEffect();
        
        // Update UI
        this.gameEngine.updateUI();
    }
    
    createDamageEffect() {
        // Scatter damage particles
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 2;
            const particle = new Particle(
                this.x,
                this.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#ff3333',
                Math.random() * 4 + 2,
                Math.random() * 500 + 300
            );
            this.gameEngine.particles.push(particle);
        }
        
        // Add glitch effect if available
        if (window.glitchEffect) {
            window.glitchEffect.triggerIntenseGlitch(500);
        }
    }
    
    die() {
        this.isAlive = false;
        this.health = 0;
        
        // Create explosion effect
        this.createExplosionEffect();
        
        // Play death sound
        if (this.gameEngine.audioSynth) {
            this.gameEngine.audioSynth.playExplosion();
        }
        
        // Game over
        if (this.gameEngine.state) {
            this.gameEngine.state.gameOver = true;
            
            // Call the global handler if available
            if (window.handleGameOver) {
                window.handleGameOver(this.gameEngine.state.score);
            }
        }
    }
    
    createExplosionEffect() {
        // Create large explosion
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 3;
            const size = Math.random() * 5 + 3;
            const lifespan = Math.random() * 1500 + 500;
            
            // Mix colors for varied explosion particles
            const colors = ['#ff3333', '#ff9900', '#ffff00', '#00ff41', '#ffffff'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            const particle = new Particle(
                this.x,
                this.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                size,
                lifespan
            );
            this.gameEngine.particles.push(particle);
        }
        
        // Add terminal message
        if (this.gameEngine.terminalInstance) {
            this.gameEngine.terminalInstance.writeToTerminal(
                '> CRITICAL ERROR: Connection terminated by security systems',
                'error'
            );
        }
        
        // Major glitch effect
        if (window.glitchEffect) {
            window.glitchEffect.triggerIntenseGlitch(2000);
        }
    }
    
    reset() {
        // Reset position
        this.resetPosition();
        
        // Reset health and state
        this.health = this.maxHealth;
        this.isAlive = true;
        this.invulnerable = false;
        
        // Reset abilities
        for (const key in this.abilities) {
            this.abilities[key].active = false;
            this.abilities[key].duration = 0;
            this.abilities[key].cooldown = 0;
        }
        
        // Reset boost
        this.isBoosting = false;
        this.boostDuration = 0;
        this.boostCooldown = 0;
        
        // Reset trail
        this.trail = [];
    }
    
    render(ctx) {
        if (!this.isAlive) return;
        
        // Draw trail
        this.renderTrail(ctx);
        
        // Save context
        ctx.save();
        
        // Position and rotate
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Set transparency for stealth mode
        if (this.abilities.stealth.active) {
            ctx.globalAlpha = 0.4;
        } else if (this.invulnerable) {
            // Blink when invulnerable
            ctx.globalAlpha = Math.sin(performance.now() * 0.01) * 0.5 + 0.5;
        }
        
        // Draw player avatar
        this.renderAvatar(ctx);
        
        // Draw shield if active
        if (this.abilities.shield.active) {
            this.renderShield(ctx);
        }
        
        // Draw thrusters if moving
        const movingKeys = this.gameEngine.inputHandler ? Object.values(this.gameEngine.inputHandler.keys).some(key => key) : false;
        if (movingKeys) {
            this.renderThrusters(ctx);
        }
    }
    
    renderTrail(ctx) {
        // Skip if not enough trail points
        if (this.trail.length < 2) return;
        
        // Draw trail line
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        
        for (let i = 1; i < this.trail.length; i++) {
            ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        
        ctx.strokeStyle = 'rgba(0, 255, 65, 0.3)';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Inner glow
        ctx.strokeStyle = 'rgba(0, 255, 65, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    renderAvatar(ctx) {
        // Draw outer shape
        ctx.beginPath();
        ctx.moveTo(this.avatarPoints[0].x, this.avatarPoints[0].y);
        
        for (let i = 1; i < this.avatarPoints.length; i++) {
            ctx.lineTo(this.avatarPoints[i].x, this.avatarPoints[i].y);
        }
        
        ctx.closePath();
        
        // Fill with gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width / 2);
        gradient.addColorStop(0, '#00ff41');
        gradient.addColorStop(1, '#004010');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Stroke outline
        ctx.strokeStyle = '#00ff41';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw inner details
        this.renderInnerDetails(ctx);
        
        // Draw center point
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#00ff41';
        ctx.fill();
    }
    
    renderInnerDetails(ctx) {
        // Draw connections between inner points
        ctx.beginPath();
        
        for (const line of this.innerLines) {
            const start = this.avatarPoints[line.start];
            const end = this.avatarPoints[line.end];
            
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
        }
        
        ctx.strokeStyle = '#00ff41';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    renderShield(ctx) {
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2 + 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    
    renderThrusters(ctx) {
        for (const thruster of this.thrusters) {
            ctx.beginPath();
            ctx.arc(thruster.x, thruster.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = this.isBoosting ? '#00ffff' : '#00ff41';
            ctx.fill();
        }
    }
}

export default Player;