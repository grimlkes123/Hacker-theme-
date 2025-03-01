/**
 * Game Engine
 * Core system for managing game state, updates, and rendering
 */
class GameEngine {
    constructor(audioSynth, terminalInstance) {
        console.log('Initializing game engine...');
        
        // Set up canvas
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Store references to audio and terminal systems
        this.audioSynth = audioSynth;
        this.terminalInstance = terminalInstance;
        
        // Set canvas dimensions
        this.resizeCanvas();
        window.addEventListener('resize', this.resizeCanvas.bind(this));
        
        // Game state
        this.state = {
            running: false,
            paused: false,
            gameOver: false,
            level: 1,
            score: 0,
            highScore: localStorage.getItem('hackergame_highscore') || 0
        };
        
        // Game objects
        this.player = null;
        this.enemies = [];
        this.dataNodes = [];
        this.projectiles = [];
        this.particles = [];
        this.powerUps = [];
        
        // Game settings that scale with level
        this.settings = {
            enemySpawnRate: 2000, // ms
            dataNodeSpawnRate: 3000, // ms
            powerUpSpawnRate: 15000, // ms
            enemySpeed: 2,
            projectileSpeed: 8,
            maxEnemies: 10,
            dataNodesForNextLevel: 10
        };
        
        // Timers for spawning objects
        this.timers = {
            enemySpawn: 0,
            dataNodeSpawn: 0,
            powerUpSpawn: 0,
            lastFrameTime: 0
        };
        
        // Track collected data nodes for level progression
        this.collectedDataNodes = 0;
        
        console.log('Setting up input handler...');
        try {
            // Initialize InputHandler if available
            if (typeof InputHandler === 'function') {
                this.inputHandler = new InputHandler(this);
                console.log('Input handler created successfully');
            } else {
                console.error('InputHandler class not available');
            }
        } catch (e) {
            console.error('Failed to create input handler:', e);
        }
    }
    
    resizeCanvas() {
        // Set canvas size based on container
        const container = this.canvas.parentElement;
        if (!container) return;
        
        const containerWidth = container.clientWidth || window.innerWidth;
        const containerHeight = container.clientHeight || window.innerHeight;
        
        this.canvas.width = Math.min(containerWidth * 0.8, 800);
        this.canvas.height = Math.min(containerHeight * 0.8, 600);
        
        console.log(`Canvas resized to ${this.canvas.width}x${this.canvas.height}`);
    }
    
    init() {
        console.log('Initializing game state...');
        
        try {
            // Create player if Player class exists
            if (typeof Player === 'function') {
                this.player = new Player(this);
                console.log('Player created successfully');
            } else {
                // Create a simplified player
                console.warn('Player class not found, creating simplified player');
                this.createSimplifiedPlayer();
            }
            
            // Reset game state
            this.resetGameState();
            
            // Log initialization in terminal
            if (this.terminalInstance) {
                this.terminalInstance.writeToTerminal(
                    '> Game system initialized. Breach protocols active.', 
                    'system'
                );
            }
            
            console.log('Game initialization complete');
        } catch (e) {
            console.error('Error during game initialization:', e);
        }
    }
    
    createSimplifiedPlayer() {
        // Create a simple player object with basic functionality
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height * 0.8,
            width: 30,
            height: 30,
            radius: 15,
            speed: 5,
            health: 100,
            maxHealth: 100,
            color: '#00ff41',
            score: 0,
            trail: [],
            abilities: {
                stealth: { active: false, duration: 0, cooldown: 0 },
                shield: { active: false, duration: 0, cooldown: 0 }
            },
            reset: function() {
                this.x = this.canvas.width / 2;
                this.y = this.canvas.height * 0.8;
                this.health = 100;
                this.score = 0;
            },
            takeDamage: function(amount) {
                this.health = Math.max(0, this.health - amount);
            },
            update: function(deltaTime) {
                // Update player based on input
                const direction = this.gameEngine.inputHandler.getMovementDirection();
                this.x += direction.x * this.speed;
                this.y += direction.y * this.speed;
            },
            render: function(ctx) {
                // Draw player
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        };
        
        // Add reference to game engine
        this.player.gameEngine = this;
    }
    
    resetGameState() {
        console.log('Resetting game state...');
        
        // Reset game state
        this.state.gameOver = false;
        this.state.level = 1;
        this.state.score = 0;
        
        // Reset player
        if (this.player) {
            if (typeof this.player.reset === 'function') {
                this.player.reset();
            } else {
                // Basic reset
                this.player.x = this.canvas.width / 2;
                this.player.y = this.canvas.height * 0.8;
                this.player.health = 100;
                this.player.score = 0;
            }
        }
        
        // Clear all arrays
        this.enemies = [];
        this.dataNodes = [];
        this.projectiles = [];
        this.particles = [];
        this.powerUps = [];
        
        // Reset level-specific settings
        this.settings.enemySpawnRate = 2000;
        this.settings.enemySpeed = 2;
        this.settings.maxEnemies = 10;
        
        // Reset collected data
        this.collectedDataNodes = 0;
        
        // Reset timers
        this.timers.enemySpawn = 0;
        this.timers.dataNodeSpawn = 0;
        this.timers.powerUpSpawn = 0;
        
        // Update UI
        this.updateUI();
        
        console.log('Game state reset complete');
    }
    
    updateUI() {
        try {
            // Update score and health display
            document.getElementById('score').textContent = `Score: ${this.state.score}`;
            document.getElementById('health').textContent = `Health: ${this.player ? this.player.health : 0}`;
            document.getElementById('level').textContent = `Level: ${this.state.level}`;
        } catch (e) {
            console.error('Error updating UI:', e);
        }
    }
    
    start() {
        console.log('Starting game...');
        if (!this.state.running) {
            // Set game as running
            this.state.running = true;
            this.state.paused = false;
            this.timers.lastFrameTime = performance.now();
            
            // Start game loop
            requestAnimationFrame(this.gameLoop.bind(this));
            
            // Log game start
            if (this.terminalInstance) {
                this.terminalInstance.writeToTerminal('> Infiltration sequence initiated.');
            }
            
            // Spawn initial data nodes
            for (let i = 0; i < 5; i++) {
                setTimeout(() => this.spawnDataNode(), i * 500);
            }
        }
    }
    
    stop() {
        console.log('Stopping game...');
        this.state.running = false;
    }
    
    pause() {
        console.log('Pausing game...');
        this.state.paused = true;
    }
    
    resume() {
        console.log('Resuming game...');
        if (this.state.paused) {
            this.state.paused = false;
            this.timers.lastFrameTime = performance.now();
            this.gameLoop();
        }
    }
    
    gameLoop(timestamp) {
        if (!this.state.running || this.state.gameOver) {
            return;
        }
        
        if (this.state.paused) {
            // If paused, just request next frame but don't update
            requestAnimationFrame(this.gameLoop.bind(this));
            return;
        }
        
        // Calculate delta time for smooth animations
        const deltaTime = timestamp - (this.timers.lastFrameTime || timestamp);
        this.timers.lastFrameTime = timestamp;
        
        // Update game state
        this.update(deltaTime);
        
        // Render game
        this.render();
        
        // Request next frame
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    update(deltaTime) {
        // Cap delta time to avoid huge jumps if tab was in background
        const cappedDeltaTime = Math.min(deltaTime, 100);
        
        // Update timers
        this.updateTimers(cappedDeltaTime);
        
        // Update player
        if (this.player && typeof this.player.update === 'function') {
            this.player.update(cappedDeltaTime);
        }
        
        // Update enemies
        this.updateEnemies(cappedDeltaTime);
        
        // Update data nodes
        this.updateDataNodes(cappedDeltaTime);
        
        // Update projectiles
        this.updateProjectiles(cappedDeltaTime);
        
        // Update particles
        this.updateParticles(cappedDeltaTime);
        
        // Update power-ups
        this.updatePowerUps(cappedDeltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Check level completion condition
        this.checkLevelCompletion();
    }
    
    updateTimers(deltaTime) {
        // Enemy spawn timer
        this.timers.enemySpawn += deltaTime;
        if (this.timers.enemySpawn >= this.settings.enemySpawnRate && 
            this.enemies.length < this.settings.maxEnemies) {
            this.spawnEnemy();
            this.timers.enemySpawn = 0;
        }
        
        // Data node spawn timer
        this.timers.dataNodeSpawn += deltaTime;
        if (this.timers.dataNodeSpawn >= this.settings.dataNodeSpawnRate) {
            this.spawnDataNode();
            this.timers.dataNodeSpawn = 0;
        }
        
        // Power-up spawn timer
        this.timers.powerUpSpawn += deltaTime;
        if (this.timers.powerUpSpawn >= this.settings.powerUpSpawnRate) {
            this.spawnPowerUp();
            this.timers.powerUpSpawn = 0;
        }
    }
    
    updateEnemies(deltaTime) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Update enemy position and behavior
            if (typeof enemy.update === 'function') {
                enemy.update(deltaTime);
            }
            
            // Remove enemies that are no longer active
            if (!enemy.active) {
                this.enemies.splice(i, 1);
            }
        }
    }
    
    updateDataNodes(deltaTime) {
        for (let i = this.dataNodes.length - 1; i >= 0; i--) {
            const dataNode = this.dataNodes[i];
            
            // Update data node animation or movement
            if (typeof dataNode.update === 'function') {
                dataNode.update(deltaTime);
            }
            
            // Remove data nodes that are no longer active
            if (!dataNode.active) {
                this.dataNodes.splice(i, 1);
            }
        }
    }
    
    updateProjectiles(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Update projectile position
            projectile.update(deltaTime);
            
            // Remove projectiles that are off-screen or have hit something
            if (!projectile.active || 
                projectile.x < 0 || 
                projectile.x > this.canvas.width || 
                projectile.y < 0 || 
                projectile.y > this.canvas.height) {
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update particle position and fade
            particle.update(deltaTime);
            
            // Remove particles that have completed their lifespan
            if (!particle.active) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updatePowerUps(deltaTime) {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            
            // Update power-up animation or movement
            powerUp.update(deltaTime);
            
            // Remove power-ups that are no longer active
            if (!powerUp.active) {
                this.powerUps.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        if (!this.player) return;
        
        // Check player collision with enemies
        for (const enemy of this.enemies) {
            if (this.checkCollision(this.player, enemy)) {
                if (!this.player.invulnerable && !this.player.abilities.shield.active) {
                    this.player.takeDamage(20);
                    this.createExplosion(enemy.x, enemy.y);
                    
                    // Play damage sound
                    if (this.audioSynth) {
                        this.audioSynth.playDamage();
                    }
                    
                    // Trigger screen shake/glitch
                    if (window.glitchEffect) {
                        window.glitchEffect.triggerIntenseGlitch(300);
                    }
                    
                    // Update UI
                    this.updateUI();
                    
                    // Remove the enemy
                    enemy.active = false;
                }
            }
        }
        
        // Check player collision with data nodes
        for (const dataNode of this.dataNodes) {
            if (this.checkCollision(this.player, dataNode)) {
                this.collectDataNode(dataNode);
            }
        }
        
        // Check player collision with power-ups
        for (const powerUp of this.powerUps) {
            if (this.checkCollision(this.player, powerUp)) {
                this.collectPowerUp(powerUp);
            }
        }
        
        // Check projectiles collision with enemies
        for (const projectile of this.projectiles) {
            for (const enemy of this.enemies) {
                if (this.checkCollision(projectile, enemy)) {
                    enemy.takeDamage(projectile.damage);
                    projectile.active = false;
                    
                    // Create hit particles
                    this.createHitEffect(projectile.x, projectile.y);
                    
                    // Add score if enemy is destroyed
                    if (!enemy.active) {
                        this.addScore(100);
                    }
                    
                    break; // Projectile can only hit one enemy
                }
            }
        }
    }
    
    checkCollision(objA, objB) {
        // Simple rectangle collision
        return (
            objA.x < objB.x + objB.width &&
            objA.x + objA.width > objB.x &&
            objA.y < objB.y + objB.height &&
            objA.y + objA.height > objB.y
        );
    }
    
    collectDataNode(dataNode) {
        // Mark as collected
        dataNode.active = false;
        
        // Increment counter
        this.collectedDataNodes++;
        
        // Add score
        this.addScore(50);
        
        // Play sound
        if (this.audioSynth) {
            this.audioSynth.playDataCollect();
        }
        
        // Create particle effect
        this.createDataCollectEffect(dataNode.x, dataNode.y);
        
        // Update UI
        this.updateUI();
        
        // Add message to terminal
        if (this.terminalInstance) {
            this.terminalInstance.writeToTerminal(
                `> Data packet collected (${this.collectedDataNodes}/${this.settings.dataNodesForNextLevel})`,
                'success'
            );
        }
    }
    
    collectPowerUp(powerUp) {
        // Mark as collected
        powerUp.active = false;
        
        // Apply power-up effect
        if (this.player) {
            this.player.activateAbility(powerUp.type);
        }
        
        // Play sound
        if (this.audioSynth) {
            this.audioSynth.playPowerUp();
        }
        
        // Create particle effect
        this.createPowerUpEffect(powerUp.x, powerUp.y);
        
        // Add message to terminal
        if (this.terminalInstance) {
            this.terminalInstance.writeToTerminal(
                `> ${powerUp.name} activated`,
                'system'
            );
        }
    }
    
    checkLevelCompletion() {
        if (this.collectedDataNodes >= this.settings.dataNodesForNextLevel) {
            this.completeLevel();
        }
    }
    
    completeLevel() {
        // Stop the game loop temporarily
        this.state.paused = true;
        
        // Show level complete screen
        if (window.handleLevelComplete) {
            window.handleLevelComplete(this.state.level, this.state.score);
        }
        
        // Play level complete sound
        if (this.audioSynth) {
            this.audioSynth.playLevelComplete();
        }
        
        // Add message to terminal
        if (this.terminalInstance) {
            this.terminalInstance.writeToTerminal(
                `> Security level ${this.state.level} bypassed successfully!`,
                'success'
            );
        }
    }
    
    loadNextLevel() {
        // Increase level
        this.state.level++;
        
        // Reset data node counter
        this.collectedDataNodes = 0;
        
        // Scale difficulty
        this.settings.enemySpawnRate *= 0.9; // Spawn enemies faster
        this.settings.enemySpeed += 0.5; // Enemies move faster
        this.settings.maxEnemies += 2; // More enemies on screen
        this.settings.dataNodesForNextLevel += 5; // Need more data nodes
        
        // Clear objects
        this.enemies = [];
        this.dataNodes = [];
        this.projectiles = [];
        
        // Reset player position but keep health and score
        if (this.player) {
            this.player.resetPosition();
        }
        
        // Update UI
        this.updateUI();
        
        // Unpause the game
        this.state.paused = false;
        
        // Log level transition
        if (this.terminalInstance) {
            this.terminalInstance.writeToTerminal(
                `> Accessing security level ${this.state.level}...`,
                'system'
            );
        }
    }
    
    addScore(points) {
        this.state.score += points;
        
        // Update high score if needed
        if (this.state.score > this.state.highScore) {
            this.state.highScore = this.state.score;
            localStorage.setItem('hackergame_highscore', this.state.score);
        }
        
        // Update UI
        this.updateUI();
    }
    
    spawnEnemy() {
        // Determine spawn position (from any edge)
        let x, y;
        const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        
        switch(edge) {
            case 0: // Top
                x = Math.random() * this.canvas.width;
                y = -50;
                break;
            case 1: // Right
                x = this.canvas.width + 50;
                y = Math.random() * this.canvas.height;
                break;
            case 2: // Bottom
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + 50;
                break;
            case 3: // Left
                x = -50;
                y = Math.random() * this.canvas.height;
                break;
        }
        
        // Create enemy with random type
        const enemyTypes = ['basic', 'fast', 'heavy'];
        const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        
        this.enemies.push(new Enemy(this, x, y, type));
    }
    
    spawnDataNode() {
        // Calculate a random position that's not too close to the player or enemies
        let x, y, validPosition = false;
        const margin = 50; // Minimum distance from edges
        
        // Try 10 times to find a valid position
        for (let attempts = 0; attempts < 10 && !validPosition; attempts++) {
            x = margin + Math.random() * (this.canvas.width - margin * 2);
            y = margin + Math.random() * (this.canvas.height - margin * 2);
            
            // Check distance from player
            if (this.player) {
                const distToPlayer = Math.hypot(x - this.player.x, y - this.player.y);
                if (distToPlayer < 150) continue; // Too close to player
            }
            
            // Check distance from enemies
            let tooCloseToEnemy = false;
            for (const enemy of this.enemies) {
                const distToEnemy = Math.hypot(x - enemy.x, y - enemy.y);
                if (distToEnemy < 100) {
                    tooCloseToEnemy = true;
                    break;
                }
            }
            
            validPosition = !tooCloseToEnemy;
        }
        
        // Create data node if position is valid
        if (validPosition) {
            this.dataNodes.push(new DataNode(this, x, y));
        }
    }
    
    spawnPowerUp() {
        // Calculate random position (similar to data node)
        let x = 50 + Math.random() * (this.canvas.width - 100);
        let y = 50 + Math.random() * (this.canvas.height - 100);
        
        // Define power-up types
        const powerUpTypes = [
            { id: 'stealth', name: 'Stealth Mode', color: '#00ffff' },
            { id: 'shield', name: 'Shield', color: '#ffff00' },
            { id: 'speedboost', name: 'Speed Boost', color: '#ff00ff' }
        ];
        
        // Select a random power-up
        const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        
        // Create the power-up
        this.powerUps.push(new PowerUp(
            this,
            x,
            y,
            powerUpType.id,
            powerUpType.name,
            powerUpType.color
        ));
        
        // Announce power-up
        if (this.terminalInstance) {
            this.terminalInstance.writeToTerminal(
                `> ${powerUpType.name} power-up available`,
                'system'
            );
        }
    }
    
    createExplosion(x, y) {
        // Create explosion particles
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            const size = Math.random() * 4 + 3;
            const lifespan = Math.random() * 500 + 300;
            
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#ff3333', // Red
                size,
                lifespan
            ));
        }
    }
    
    createHitEffect(x, y) {
        // Create hit particles
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 0.5;
            const size = Math.random() * 3 + 2;
            const lifespan = Math.random() * 300 + 200;
            
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#ffffff', // White
                size,
                lifespan
            ));
        }
    }
    
    createDataCollectEffect(x, y) {
        // Create data collection particles
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            const size = Math.random() * 3 + 2;
            const lifespan = Math.random() * 400 + 200;
            
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#00ff41', // Green
                size,
                lifespan
            ));
        }
    }
    
    createPowerUpEffect(x, y) {
        // Create power-up collection particles
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            const size = Math.random() * 4 + 2;
            const lifespan = Math.random() * 500 + 300;
            
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#ffff00', // Yellow
                size,
                lifespan
            ));
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid background
        this.drawGrid();
        
        // Draw data nodes
        this.dataNodes.forEach(node => node.render(this.ctx));
        
        // Draw power-ups
        this.powerUps.forEach(powerUp => powerUp.render(this.ctx));
        
        // Draw player
        if (this.player) {
            this.player.render(this.ctx);
        }
        
        // Draw enemies
        this.enemies.forEach(enemy => enemy.render(this.ctx));
        
        // Draw projectiles
        this.projectiles.forEach(projectile => projectile.render(this.ctx));
        
        // Draw particles
        this.particles.forEach(particle => particle.render(this.ctx));
        
        // Draw objective
        this.drawObjective();
    }
    
    drawGrid() {
        // Draw grid lines
        this.ctx.strokeStyle = 'rgba(0, 255, 65, 0.2)';
        this.ctx.lineWidth = 1;
        
        // Draw vertical grid lines
        const gridSize = 40;
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Draw horizontal grid lines
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawObjective() {
        // Draw progress bar for the current level
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(20, 20, 200, 10);
        
        const progress = Math.min(
            this.collectedDataNodes / this.settings.dataNodesForNextLevel, 
            1
        );
        
        this.ctx.fillStyle = '#00ff41';
        this.ctx.fillRect(20, 20, 200 * progress, 10);
        
        // Draw text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(
            `Data: ${this.collectedDataNodes}/${this.settings.dataNodesForNextLevel}`, 
            20, 
            50
        );
    }
}

// Make globally available
window.GameEngine = GameEngine;