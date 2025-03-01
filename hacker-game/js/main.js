/**
 * Main Game Controller
 * Handles initialization, loading sequence, and game state management
 */
document.addEventListener('DOMContentLoaded', () => {
    // Game instance references
    let game = null;
    let audioSynth = null;
    let terminalInstance = null;
    
    // UI elements
    const loadingScreen = document.getElementById('loading-screen');
    const progressFill = document.querySelector('.progress-fill');
    const loadingText = document.getElementById('loading-text');
    
    // Game overlay elements
    const gameContainer = document.getElementById('game-container');
    const instructionsOverlay = document.getElementById('instructions');
    const gameOverOverlay = document.getElementById('game-over');
    const levelCompleteOverlay = document.getElementById('level-complete');
    const pauseMenuOverlay = document.getElementById('pause-menu');
    
    // Button references
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const nextLevelButton = document.getElementById('next-level-button');
    const resumeButton = document.getElementById('resume-button');
    const restartFromPauseButton = document.getElementById('restart-from-pause');
    
    // Debug logging
    console.log('DOM fully loaded, initializing game components...');
    console.log('Start button element:', startButton);
    
    // Make sure we have the game canvas ready
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Game canvas not found in the DOM');
        return;
    }
    
    // Initialization sequence
    function init() {
        // Set up button listeners
        setupEventListeners();
        
        // Start loading sequence
        startLoadingSequence();
    }
    
    function setupEventListeners() {
        // Game start button
        if (startButton) {
            startButton.addEventListener('click', (e) => {
                console.log('Start button clicked');
                startGame();
                e.preventDefault(); // Prevent default behavior
            });
        } else {
            console.error('Start button not found');
        }
        
        // Game over screen restart button
        if (restartButton) {
            restartButton.addEventListener('click', restartGame);
        }
        
        // Level complete next level button
        if (nextLevelButton) {
            nextLevelButton.addEventListener('click', loadNextLevel);
        }
        
        // Pause menu buttons
        if (resumeButton) {
            resumeButton.addEventListener('click', resumeGame);
        }
        
        if (restartFromPauseButton) {
            restartFromPauseButton.addEventListener('click', restartGame);
        }
        
        // Keyboard events for game control
        window.addEventListener('keydown', handleKeyDown);
    }
    
    function handleKeyDown(e) {
        // Only handle certain keys globally
        if (e.key === 'Escape') {
            if (game && game.state && game.state.running && !game.state.gameOver) {
                togglePause();
            }
        }
    }
    
    function togglePause() {
        if (!game) return;
        
        if (game.state.paused) {
            // Resume game
            pauseMenuOverlay.classList.remove('active');
            game.resume();
            if (audioSynth) audioSynth.resumeAudio();
        } else {
            // Pause game
            pauseMenuOverlay.classList.add('active');
            game.pause();
            if (audioSynth) audioSynth.pauseAudio();
        }
    }
    
    function startLoadingSequence() {
        console.log('Starting loading sequence...');
        // Show the loading screen
        loadingScreen.style.display = 'flex';
        
        // Initialize terminal early so we can show output
        initializeTerminal();
        
        // Initialize audio system early to prevent delay
        initializeAudio();
        
        // Simulate loading steps with terminal-like feedback
        const loadingSteps = [
            { text: "Initializing system core...", duration: 600 },
            { text: "Loading encryption modules...", duration: 500 },
            { text: "Establishing secure connection...", duration: 700 },
            { text: "Bypassing security measures...", duration: 800 },
            { text: "Compiling neural network...", duration: 400 },
            { text: "Generating procedural elements...", duration: 600 },
            { text: "Preparing game environment...", duration: 400 }
        ];
        
        let currentStep = 0;
        const totalSteps = loadingSteps.length;
        
        function performNextStep() {
            if (currentStep >= totalSteps) {
                completeLoading();
                return;
            }
            
            const step = loadingSteps[currentStep];
            const progress = Math.round(((currentStep + 1) / totalSteps) * 100);
            
            // Update progress bar
            progressFill.style.width = `${progress}%`;
            loadingText.textContent = step.text;
            
            // Add to terminal
            if (terminalInstance) {
                terminalInstance.writeToTerminal(`> ${step.text}`);
            }
            
            // Simulate processing time with a timeout that won't get stuck
            setTimeout(() => {
                if (terminalInstance) {
                    terminalInstance.writeToTerminal(
                        `[SUCCESS] Operation complete`,
                        'response'
                    );
                }
                currentStep++;
                
                // Use requestAnimationFrame for better timing
                requestAnimationFrame(performNextStep);
            }, step.duration);
        }
        
        // Start the loading sequence with a slight delay
        setTimeout(() => requestAnimationFrame(performNextStep), 500);
    }
    
    function initializeTerminal() {
        try {
            // Check if Terminal class exists
            if (typeof Terminal === 'function') {
                terminalInstance = new Terminal('terminal-container');
                terminalInstance.writeToTerminal("> System boot sequence initiated...");
            } else {
                console.warn("Terminal class not found, creating fallback");
                // Create a simple fallback terminal object
                terminalInstance = createFallbackTerminal();
            }
        } catch (e) {
            console.error("Failed to initialize terminal:", e);
            // Create basic fallback
            terminalInstance = createFallbackTerminal();
        }
    }
    
    function createFallbackTerminal() {
        return {
            writeToTerminal: function(text, className) {
                console.log(`Terminal: ${text}`);
                const terminalOutput = document.querySelector('.terminal-output');
                if (terminalOutput) {
                    const line = document.createElement('div');
                    line.className = className || 'terminal-line';
                    line.textContent = text;
                    terminalOutput.appendChild(line);
                    terminalOutput.scrollTop = terminalOutput.scrollHeight;
                }
            }
        };
    }
    
    function initializeAudio() {
        try {
            // Check if AudioSynthesizer class exists
            if (typeof AudioSynthesizer === 'function') {
                audioSynth = new AudioSynthesizer();
            } else {
                // Create dummy audio object
                audioSynth = createDummyAudio();
                console.warn("AudioSynthesizer not found, using dummy audio");
            }
        } catch (e) {
            console.error("Failed to initialize audio:", e);
            // Create dummy audio object
            audioSynth = createDummyAudio();
        }
    }
    
    function createDummyAudio() {
        return {
            playAmbientBackground: function() { console.log("Audio: ambient background"); },
            playGameStart: function() { console.log("Audio: game start"); },
            playGameOver: function() { console.log("Audio: game over"); },
            playLevelComplete: function() { console.log("Audio: level complete"); },
            playLevelUp: function() { console.log("Audio: level up"); },
            playShoot: function() { console.log("Audio: shoot"); },
            playDamage: function() { console.log("Audio: damage"); },
            playExplosion: function() { console.log("Audio: explosion"); },
            playDataCollect: function() { console.log("Audio: data collect"); },
            playPowerUp: function() { console.log("Audio: power up"); },
            resumeAudio: function() { console.log("Audio: resume"); },
            pauseAudio: function() { console.log("Audio: pause"); }
        };
    }
    
    function completeLoading() {
        try {
            console.log('Loading complete, initializing game components...');
            if (terminalInstance) {
                terminalInstance.writeToTerminal("> Initialization complete. System ready.");
            }
            
            // Initialize background effects
            initializeBackground();
            
            // Initialize game engine with error handling
            initializeGameEngine();
            
            // Wait a bit, then fade out the loading screen
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                loadingScreen.style.transition = 'opacity 1s ease-out';
                
                // Remove loading screen after fade
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    instructionsOverlay.classList.add('active');
                    
                    // Play ambient background sound
                    if (audioSynth) {
                        audioSynth.playAmbientBackground();
                    }
                }, 1000);
            }, 800);
        } catch (e) {
            console.error("Error during loading completion:", e);
            
            // Force complete loading even if there's an error
            loadingScreen.style.display = 'none';
            instructionsOverlay.classList.add('active');
            
            // Show error in terminal
            if (terminalInstance) {
                terminalInstance.writeToTerminal("> ERROR: System initialization encountered issues. Continuing with limited functionality.", "error");
            }
        }
    }
    
    function initializeBackground() {
        try {
            // Initialize matrix effect if available
            if (typeof MatrixEffect === 'function') {
                const matrixEffect = new MatrixEffect();
                matrixEffect.start();
                window.matrixEffect = matrixEffect;
            }
            
            // Initialize glitch effect if available
            if (typeof GlitchEffect === 'function') {
                const glitchEffect = new GlitchEffect();
                glitchEffect.setIntensity(0.6);
                glitchEffect.start();
                window.glitchEffect = glitchEffect;
            }
            
            // Initialize background if available
            if (typeof HackerBackground === 'function') {
                const hackerBackground = new HackerBackground();
                window.hackerBackground = hackerBackground;
            }
        } catch (e) {
            console.error("Error initializing visual effects:", e);
            // Continue without background effects
        }
    }
    
    function initializeGameEngine() {
        try {
            console.log('Initializing game engine...');
            // Create a dummy game engine if the real one doesn't exist
            if (typeof GameEngine !== 'function') {
                console.warn('GameEngine class not found, using simplified version');
                window.GameEngine = createSimplifiedGameEngine();
            }
            
            // Initialize the canvas context
            const ctx = canvas.getContext('2d');
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
            
            // Create the game engine
            game = new GameEngine();
            
            // If game engine expects these parameters
            if (audioSynth && terminalInstance) {
                game.audioSynth = audioSynth;
                game.terminalInstance = terminalInstance;
            }
            
            // Make it globally accessible
            window.gameInstance = game;
            console.log('Game engine initialized successfully');
        } catch (e) {
            console.error("Failed to initialize game engine:", e);
            // Create simple game placeholder for UI functionality
            game = createSimplifiedGameEngine();
        }
    }
    
    function createSimplifiedGameEngine() {
        // Basic game engine implementation if the real one isn't loaded
        return {
            state: { running: false, paused: false, gameOver: false, level: 1, score: 0 },
            settings: {
                enemySpawnRate: 2000,
                dataNodeSpawnRate: 3000,
                powerUpSpawnRate: 15000,
                enemySpeed: 2,
                projectileSpeed: 8,
                maxEnemies: 10
            },
            canvas: canvas,
            ctx: canvas.getContext('2d'),
            init: function() {
                console.log("Game init called");
                this.canvas.width = this.canvas.clientWidth;
                this.canvas.height = this.canvas.clientHeight;
                this.player = new Player(this);
                this.enemies = [];
                this.dataNodes = [];
                this.projectiles = [];
                this.particles = [];
                this.inputHandler = new InputHandler(this);
            },
            start: function() {
                console.log("Game start called");
                this.state.running = true;
                this.gameLoop();
            },
            gameLoop: function() {
                if (!this.state.running) return;
                
                // Clear canvas
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                
                // Draw some placeholder content
                this.ctx.fillStyle = '#00ff41';
                this.ctx.font = '20px monospace';
                this.ctx.fillText('Game Running - Level ' + this.state.level, 20, 30);
                
                if (this.state.running && !this.state.paused) {
                    requestAnimationFrame(this.gameLoop.bind(this));
                }
            },
            pause: function() {
                console.log("Game pause called");
                this.state.paused = true;
            },
            resume: function() {
                console.log("Game resume called");
                this.state.paused = false;
                if (this.state.running) {
                    this.gameLoop();
                }
            },
            resetGameState: function() {
                console.log("Game reset called");
                this.state.level = 1;
                this.state.score = 0;
                this.state.gameOver = false;
                if (this.player) {
                    this.player.reset();
                }
            },
            loadNextLevel: function() {
                console.log("Next level called");
                this.state.level++;
            },
            updateUI: function() {
                document.getElementById('score').textContent = `Score: ${this.state.score}`;
                if (this.player) {
                    document.getElementById('health').textContent = `Health: ${this.player.health}`;
                }
                document.getElementById('level').textContent = `Level: ${this.state.level}`;
            }
        };
    }
    
    function startGame() {
        console.log('Starting game...');
        if (!game) {
            console.error("Game not initialized");
            return;
        }
        
        // Hide instructions
        instructionsOverlay.classList.remove('active');
        
        // Initialize game
        game.init();
        game.start();
        
        // Play game start sound
        if (audioSynth) {
            audioSynth.playGameStart();
        }
        
        // Add a message to terminal
        if (terminalInstance) {
            terminalInstance.writeToTerminal("> Infiltration started. Objective: bypass all security layers.");
        }
        
        console.log('Game started successfully');
    }
    
    function restartGame() {
        if (!game) return;
        
        // Hide any active overlay
        gameOverOverlay.classList.remove('active');
        pauseMenuOverlay.classList.remove('active');
        
        // Reset and start the game
        game.resetGameState();
        game.start();
        
        // Play restart sound
        if (audioSynth) {
            audioSynth.playGameStart();
        }
        
        // Add message to terminal
        if (terminalInstance) {
            terminalInstance.writeToTerminal("> System rebooted. Starting new infiltration attempt.");
        }
    }
    
    function loadNextLevel() {
        if (!game) return;
        
        // Hide level complete overlay
        levelCompleteOverlay.classList.remove('active');
        
        // Load next level
        game.loadNextLevel();
        
        // Play level transition sound
        if (audioSynth) {
            audioSynth.playLevelUp();
        }
        
        // Add message to terminal
        if (terminalInstance && game.state) {
            terminalInstance.writeToTerminal(`> Accessing security level ${game.state.level}...`);
        }
    }
    
    function resumeGame() {
        pauseMenuOverlay.classList.remove('active');
        
        if (game) {
            game.resume();
        }
        
        // Resume audio
        if (audioSynth) {
            audioSynth.resumeAudio();
        }
    }
    
    // Global event handlers for game events
    window.handleGameOver = function(finalScore) {
        // Show game over screen with final score
        document.getElementById('final-score').textContent = finalScore || 0;
        gameOverOverlay.classList.add('active');
        
        // Play game over sound
        if (audioSynth) {
            audioSynth.playGameOver();
        }
        
        // Add message to terminal
        if (terminalInstance) {
            terminalInstance.writeToTerminal("> ALERT: Connection terminated. Security countermeasures detected.", "error");
        }
    };
    
    window.handleLevelComplete = function(level, score) {
        // Show level complete screen
        levelCompleteOverlay.classList.add('active');
        
        // Play level complete sound
        if (audioSynth) {
            audioSynth.playLevelComplete();
        }
        
        // Add message to terminal
        if (terminalInstance) {
            terminalInstance.writeToTerminal(`> Security level ${level || 1} bypassed successfully! Score: ${score || 0}`, "success");
        }
    };
    
    // Start initialization
    console.log('Starting initialization...');
    init();
});