/**
 * Terminal Effect System
 * Creates an interactive terminal with realistic typing animations and command handling
 */
class Terminal {
    constructor(containerId = null) {
        // Create terminal container if no ID provided
        if (!containerId) {
            this.container = document.createElement('div');
            this.container.id = 'terminal-container';
            this.container.className = 'terminal-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById(containerId);
        }
        
        // Check if container exists
        if (!this.container) {
            console.error(`Terminal container with ID ${containerId} not found`);
            return;
        }
        
        // Terminal configuration
        this.config = {
            prompt: '<span class="prompt-user">root@cyberspace</span>:<span class="prompt-dir">~/system</span>$ ',
            greetingMessage: [
                "<span class='system-msg'>=== CyberNET Terminal v3.7.9 ===</span>",
                "<span class='system-msg'>Secure connection established.</span>",
                "<span class='system-msg'>Type 'help' for available commands.</span>"
            ],
            typingSpeed: {
                min: 30,  // Minimum milliseconds per character
                max: 90   // Maximum milliseconds per character
            },
            maxHistorySize: 100,
            maxTerminalLines: 200
        };
        
        // Terminal state
        this.state = {
            active: false,
            currentInput: '',
            cursorPosition: 0,
            history: [],
            historyIndex: -1,
            temporaryInput: '',
            commandExecuting: false
        };
        
        // Available commands
        this.commands = {
            help: this.cmdHelp.bind(this),
            clear: this.cmdClear.bind(this),
            echo: this.cmdEcho.bind(this),
            date: this.cmdDate.bind(this),
            ls: this.cmdLs.bind(this),
            cat: this.cmdCat.bind(this),
            hack: this.cmdHack.bind(this),
            connect: this.cmdConnect.bind(this),
            decrypt: this.cmdDecrypt.bind(this),
            status: this.cmdStatus.bind(this),
            matrix: this.cmdMatrix.bind(this),
            glitch: this.cmdGlitch.bind(this)
        };
        
        // Virtual file system
        this.fileSystem = {
            '/': {
                type: 'dir',
                contents: {
                    'home': { 
                        type: 'dir',
                        contents: {
                            'documents': {
                                type: 'dir',
                                contents: {
                                    'readme.txt': {
                                        type: 'file',
                                        content: 'This is a secret terminal interface for the Matrix hacking game.\nUse commands to interact with the system and unlock hidden features.'
                                    },
                                    'mission.log': {
                                        type: 'file',
                                        content: 'MISSION DETAILS:\n----------------\nObjective: Infiltrate the mainframe\nSecurity Level: Maximum\nAccess Code: ********\nStatus: In Progress'
                                    }
                                }
                            },
                            'games': {
                                type: 'dir',
                                contents: {
                                    'howtoplay.txt': {
                                        type: 'file',
                                        content: 'Use arrow keys or WASD to move.\nSpace to fire.\nEsc to pause the game.'
                                    }
                                }
                            }
                        }
                    },
                    'system': {
                        type: 'dir',
                        contents: {
                            'config.sys': {
                                type: 'file',
                                content: 'SYSTEM CONFIGURATION\n-------------------\nRenderer: WebGL\nAudio: Enabled\nDifficulty: Medium\nDebug: false'
                            },
                            'logs': {
                                type: 'dir',
                                contents: {
                                    'error.log': {
                                        type: 'file',
                                        content: 'ERROR [2023-05-15]: Failed to connect to server #127\nERROR [2023-06-02]: Memory allocation failed\nWARNING [2023-06-10]: Unauthorized access attempt detected\nERROR [2023-06-22]: Connection timeout'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
        
        // Current directory path
        this.currentPath = '/system';
        
        // Initialize the terminal
        this.init();
    }
    
    init() {
        try {
            // Create terminal elements
            this.createTerminalElements();
            
            // Add event listeners
            this.addEventListeners();
            
            // Find output element
            this.outputElement = this.container.querySelector('.terminal-output');
            if (!this.outputElement) {
                // Create output area if it doesn't exist
                this.outputElement = document.createElement('div');
                this.outputElement.className = 'terminal-output';
                this.container.appendChild(this.outputElement);
            }
            
            // Display greeting message
            this.displayGreeting();
            
            // Show initial prompt
            this.displayPrompt();
            
            // Set terminal as active
            this.state.active = true;
        } catch (error) {
            console.error("Failed to initialize terminal:", error);
        }
    }
    
    createTerminalElements() {
        // Check if the terminal header already exists
        if (!this.container.querySelector('.terminal-header')) {
            // Create header
            const header = document.createElement('div');
            header.className = 'terminal-header';
            header.innerHTML = `
                <span>terminal@cyberspace:~</span>
                <div class="terminal-controls">
                    <span class="terminal-minimize">_</span>
                    <span class="terminal-maximize">□</span>
                    <span class="terminal-close">×</span>
                </div>
            `;
            this.container.appendChild(header);
        }
        
        // Create output area if it doesn't exist
        if (!this.container.querySelector('.terminal-output')) {
            this.outputElement = document.createElement('div');
            this.outputElement.className = 'terminal-output';
            this.container.appendChild(this.outputElement);
        } else {
            this.outputElement = this.container.querySelector('.terminal-output');
        }
        
        // Create input line
        this.inputLineElement = document.createElement('div');
        this.inputLineElement.className = 'terminal-input-line';
        this.container.appendChild(this.inputLineElement);
        
        // Create prompt
        this.promptElement = document.createElement('span');
        this.promptElement.className = 'terminal-prompt';
        this.promptElement.innerHTML = this.config.prompt;
        this.inputLineElement.appendChild(this.promptElement);
        
        // Create input element
        this.inputElement = document.createElement('span');
        this.inputElement.className = 'terminal-input';
        this.inputLineElement.appendChild(this.inputElement);
        
        // Create cursor element
        this.cursorElement = document.createElement('span');
        this.cursorElement.className = 'terminal-cursor';
        this.cursorElement.innerHTML = '█';
        this.inputLineElement.appendChild(this.cursorElement);
        
        // Start cursor blinking
        setInterval(() => {
            if (this.cursorElement) {
                this.cursorElement.style.visibility = 
                    this.cursorElement.style.visibility === 'hidden' ? 'visible' : 'hidden';
            }
        }, 500);
    }
    
    // Public method for writing to terminal from outside
    writeToTerminal(message, className = '') {
        if (!this.outputElement) {
            console.error("Terminal output element not found");
            return;
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = className || 'terminal-line';
        messageElement.innerHTML = message;
        this.outputElement.appendChild(messageElement);
        
        // Auto-scroll to the bottom
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
        
        // Limit number of lines in terminal
        while (this.outputElement.children.length > this.config.maxTerminalLines) {
            this.outputElement.removeChild(this.outputElement.firstChild);
        }
    }
    
    addEventListeners() {
        // Key events for the terminal
        document.addEventListener('keydown', (e) => {
            if (!this.state.active || this.state.commandExecuting) return;
            
            // Handle special keys
            switch (e.key) {
                case 'Enter':
                    this.handleEnter();
                    break;
                case 'Backspace':
                    this.handleBackspace();
                    break;
                case 'ArrowUp':
                    this.handleArrowUp();
                    break;
                case 'ArrowDown':
                    this.handleArrowDown();
                    break;
                default:
                    // Only handle alphanumeric or special characters
                    if (e.key.length === 1) {
                        this.handleCharacterInput(e.key);
                    }
                    break;
            }
        });
        
        // Terminal controls
        const minimize = this.container.querySelector('.terminal-minimize');
        const maximize = this.container.querySelector('.terminal-maximize');
        const close = this.container.querySelector('.terminal-close');
        
        if (minimize) {
            minimize.addEventListener('click', () => {
                this.container.classList.toggle('minimized');
            });
        }
        
        if (maximize) {
            maximize.addEventListener('click', () => {
                this.container.classList.toggle('maximized');
            });
        }
        
        if (close) {
            close.addEventListener('click', () => {
                this.container.style.display = 'none';
            });
        }
    }
    
    displayGreeting() {
        if (!this.outputElement) return;
        
        this.config.greetingMessage.forEach((message) => {
            this.writeToTerminal(message);
        });
    }
    
    displayPrompt() {
        if (!this.inputElement) return;
        
        this.inputElement.innerHTML = '';
        if (this.cursorElement) {
            this.cursorElement.style.display = 'inline';
        }
    }
    
    handleEnter() {
        const command = this.inputElement.textContent.trim();
        
        // Log the command in history
        if (command) {
            this.state.history.push(command);
            if (this.state.history.length > this.config.maxHistorySize) {
                this.state.history.shift();
            }
            this.state.historyIndex = this.state.history.length;
        }
        
        // Display the command
        this.writeToTerminal(`${this.config.prompt}${command}`);
        
        // Execute the command
        if (command) {
            this.executeCommand(command);
        }
        
        // Reset input
        this.inputElement.textContent = '';
        this.state.cursorPosition = 0;
    }
    
    handleBackspace() {
        const currentInput = this.inputElement.textContent;
        if (currentInput.length > 0) {
            this.inputElement.textContent = currentInput.slice(0, -1);
            this.state.cursorPosition = Math.max(0, this.state.cursorPosition - 1);
        }
    }
    
    handleArrowUp() {
        if (this.state.history.length === 0) return;
        
        if (this.state.historyIndex === this.state.history.length) {
            // Save current input before navigating history
            this.state.temporaryInput = this.inputElement.textContent;
        }
        
        this.state.historyIndex = Math.max(0, this.state.historyIndex - 1);
        this.inputElement.textContent = this.state.history[this.state.historyIndex];
        this.state.cursorPosition = this.inputElement.textContent.length;
    }
    
    handleArrowDown() {
        if (this.state.historyIndex < this.state.history.length - 1) {
            this.state.historyIndex++;
            this.inputElement.textContent = this.state.history[this.state.historyIndex];
        } else if (this.state.historyIndex === this.state.history.length - 1) {
            // Restore temporary input
            this.state.historyIndex = this.state.history.length;
            this.inputElement.textContent = this.state.temporaryInput || '';
        }
        
        this.state.cursorPosition = this.inputElement.textContent.length;
    }
    
    handleCharacterInput(character) {
        // Only handle printable characters
        if (character.length === 1) {
            const currentInput = this.inputElement.textContent;
            this.inputElement.textContent = currentInput + character;
            this.state.cursorPosition++;
        }
    }
    
    executeCommand(commandStr) {
        const [cmd, ...args] = commandStr.split(' ');
        
        if (this.commands[cmd]) {
            try {
                this.commands[cmd](args.join(' '));
            } catch (error) {
                this.writeToTerminal(`Error executing ${cmd}: ${error.message}`);
                console.error(`Error executing command ${cmd}:`, error);
            }
        } else {
            this.writeToTerminal(`Command not found: ${cmd}`);
        }
    }
    
    cmdHelp() {
        this.writeToTerminal('Available commands: help, clear, echo [message], date, ls, cat [file], hack, connect, decrypt, status, matrix, glitch');
    }
    
    cmdClear() {
        if (this.outputElement) {
            this.outputElement.innerHTML = '';
        }
    }
    
    cmdEcho(message) {
        this.writeToTerminal(message || '');
    }
    
    cmdDate() {
        this.writeToTerminal(new Date().toString());
    }
    
    cmdLs() {
        try {
            const currentDir = this.getCurrentDirectory();
            if (currentDir && currentDir.contents) {
                const files = Object.keys(currentDir.contents);
                if (files.length === 0) {
                    this.writeToTerminal('Directory is empty');
                } else {
                    const fileList = files.join(' ');
                    this.writeToTerminal(fileList);
                }
            } else {
                this.writeToTerminal('Invalid directory');
            }
        } catch (error) {
            this.writeToTerminal('Error accessing directory');
            console.error(error);
        }
    }
    
    cmdCat(file) {
        try {
            if (!file) {
                this.writeToTerminal('Usage: cat [filename]');
                return;
            }
            
            const currentDir = this.getCurrentDirectory();
            if (currentDir && currentDir.contents && currentDir.contents[file] && 
                currentDir.contents[file].type === 'file') {
                this.writeToTerminal(currentDir.contents[file].content);
            } else {
                this.writeToTerminal(`File not found: ${file}`);
            }
        } catch (error) {
            this.writeToTerminal('Error reading file');
            console.error(error);
        }
    }
    
    cmdHack() {
        this.writeToTerminal('Hacking in progress...');
        this.state.commandExecuting = true;
        
        // Show progress updates
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            this.writeToTerminal(`[${progress}%] Bypassing security...`);
            
            if (progress >= 100) {
                clearInterval(interval);
                this.writeToTerminal('Hack successful! Access granted.', 'success');
                this.state.commandExecuting = false;
                
                // Trigger game effects if available
                if (window.glitchEffect) {
                    window.glitchEffect.triggerIntenseGlitch(1000);
                }
            }
        }, 300);
    }
    
    cmdConnect() {
        this.writeToTerminal('Connecting to server...');
        setTimeout(() => {
            this.writeToTerminal('Connection established.', 'success');
        }, 1000);
    }
    
    cmdDecrypt() {
        this.writeToTerminal('Decrypting data...');
        this.state.commandExecuting = true;
        
        // Simulate decryption with progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 20;
            
            // Display random hex data
            let hexData = '';
            for (let i = 0; i < 8; i++) {
                hexData += Math.floor(Math.random() * 16).toString(16);
            }
            this.writeToTerminal(`[${progress}%] 0x${hexData.toUpperCase()}`);
            
            if (progress >= 100) {
                clearInterval(interval);
                this.writeToTerminal('Decryption complete. Data accessible.', 'success');
                this.state.commandExecuting = false;
            }
        }, 400);
    }
    
    cmdStatus() {
        const stats = {
            cpu: Math.floor(Math.random() * 30) + 70, // 70-99%
        };
        this.writeToTerminal(`CPU Usage: ${stats.cpu}%`);
    }
    
    cmdMatrix() {
        this.writeToTerminal('Entering the Matrix...');
        setTimeout(() => {
            this.writeToTerminal('Welcome to the Matrix.');
        }, 2000);
    }
    
    cmdGlitch() {
        this.writeToTerminal('Glitching the system...');
        setTimeout(() => {
            this.writeToTerminal('System glitch detected.');
        }, 2000);
    }
    
    getCurrentDirectory() {
        const pathParts = this.currentPath.split('/').filter(Boolean);
        let currentDir = this.fileSystem['/'];
        for (const part of pathParts) {
            currentDir = currentDir.contents[part];
        }
        return currentDir;
    }
}

// Initialize the terminal
const terminal = new Terminal();