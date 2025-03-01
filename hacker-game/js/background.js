/**
 * Interactive Hacker Background
 * Creates an immersive cyberpunk background with multiple layered effects
 */
class HackerBackground {
    constructor() {
        this.background = document.getElementById('background');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.mousePosition = { x: 0, y: 0 };
        this.nodes = [];
        this.connections = [];
        this.particlesConfig = {
            count: 50,
            connectionDistance: 150,
            speed: 0.5
        };
        
        // Track mouse position
        document.addEventListener('mousemove', (e) => {
            this.mousePosition.x = e.clientX;
            this.mousePosition.y = e.clientY;
        });
        
        // Handle resize
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Initialize all background components
        this.init();
    }
    
    init() {
        // Add hexagonal grid overlay
        this.createHexGrid();
        
        // Add floating network nodes
        this.createNetworkNodes();
        
        // Create binary code streams
        this.createBinaryStreams();
        
        // Add circuit pattern
        this.createCircuitPattern();
        
        // Add scanlines
        this.createScanlines();
    }
    
    handleResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Update all resizable elements
        const elements = this.background.querySelectorAll('canvas');
        elements.forEach(canvas => {
            canvas.width = this.width;
            canvas.height = this.height;
        });
        
        // Regenerate background elements
        this.background.innerHTML = '';
        this.init();
    }
    
    createHexGrid() {
        const hexGridContainer = document.createElement('div');
        hexGridContainer.className = 'hex-grid';
        hexGridContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: transparent;
            background-image: radial-gradient(circle, rgba(0, 255, 65, 0.1) 1px, transparent 1px);
            background-size: 30px 30px;
            opacity: 0.3;
            z-index: 1;
        `;
        this.background.appendChild(hexGridContainer);
    }
    
    createNetworkNodes() {
        // Create canvas for nodes and connections
        const nodeCanvas = document.createElement('canvas');
        nodeCanvas.className = 'node-canvas';
        nodeCanvas.width = this.width;
        nodeCanvas.height = this.height;
        nodeCanvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 2;
        `;
        this.background.appendChild(nodeCanvas);
        
        const ctx = nodeCanvas.getContext('2d');
        
        // Create random nodes
        for (let i = 0; i < this.particlesConfig.count; i++) {
            this.nodes.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: Math.random() * 3 + 2,
                vx: (Math.random() - 0.5) * this.particlesConfig.speed,
                vy: (Math.random() - 0.5) * this.particlesConfig.speed,
                color: `rgba(0, ${Math.floor(Math.random() * 155) + 100}, ${Math.floor(Math.random() * 100) + 40}, ${Math.random() * 0.5 + 0.5})`
            });
        }
        
        // Add mouse node (follows cursor)
        this.mouseNode = {
            x: this.width / 2,
            y: this.height / 2,
            radius: 0,
            targetRadius: 5,
            vx: 0,
            vy: 0,
            color: 'rgba(255, 0, 255, 0.8)'
        };
        this.nodes.push(this.mouseNode);
        
        // Animation loop for nodes and connections
        const animateNodes = () => {
            ctx.clearRect(0, 0, this.width, this.height);
            
            // Update mouse node
            this.mouseNode.x += (this.mousePosition.x - this.mouseNode.x) * 0.1;
            this.mouseNode.y += (this.mousePosition.y - this.mouseNode.y) * 0.1;
            
            // Draw connections first
            ctx.lineWidth = 0.5;
            
            for (let i = 0; i < this.nodes.length; i++) {
                const nodeA = this.nodes[i];
                
                // Check for connected nodes
                for (let j = i + 1; j < this.nodes.length; j++) {
                    const nodeB = this.nodes[j];
                    const dx = nodeB.x - nodeA.x;
                    const dy = nodeB.y - nodeA.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < this.particlesConfig.connectionDistance) {
                        // Calculate opacity based on distance
                        const opacity = 1 - distance / this.particlesConfig.connectionDistance;
                        
                        // Special effect for mouse node connections
                        if (nodeA === this.mouseNode || nodeB === this.mouseNode) {
                            ctx.strokeStyle = `rgba(255, 0, 255, ${opacity * 0.5})`;
                            ctx.lineWidth = 1;
                        } else {
                            ctx.strokeStyle = `rgba(0, 255, 65, ${opacity * 0.25})`;
                            ctx.lineWidth = 0.5;
                        }
                        
                        // Draw connection line
                        ctx.beginPath();
                        ctx.moveTo(nodeA.x, nodeA.y);
                        ctx.lineTo(nodeB.x, nodeB.y);
                        ctx.stroke();
                    }
                }
            }
            
            // Draw and update nodes
            for (let i = 0; i < this.nodes.length; i++) {
                const node = this.nodes[i];
                
                // Skip mouse node here (handled separately)
                if (node === this.mouseNode) continue;
                
                // Draw node
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fillStyle = node.color;
                ctx.fill();
                
                // Update position
                node.x += node.vx;
                node.y += node.vy;
                
                // Bounce off edges
                if (node.x < 0 || node.x > this.width) node.vx *= -1;
                if (node.y < 0 || node.y > this.height) node.vy *= -1;
            }
            
            // Draw mouse node with glowing effect
            ctx.beginPath();
            ctx.arc(this.mouseNode.x, this.mouseNode.y, this.mouseNode.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.mouseNode.color;
            ctx.fill();
            
            // Add glow effect
            const gradient = ctx.createRadialGradient(
                this.mouseNode.x, this.mouseNode.y, this.mouseNode.radius,
                this.mouseNode.x, this.mouseNode.y, this.mouseNode.radius * 4
            );
            gradient.addColorStop(0, 'rgba(255, 0, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
            
            ctx.beginPath();
            ctx.arc(this.mouseNode.x, this.mouseNode.y, this.mouseNode.radius * 4, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Animate the mouse node radius with pulse effect
            if (Math.random() > 0.95) {
                this.mouseNode.targetRadius = Math.random() * 5 + 3;
            }
            this.mouseNode.radius += (this.mouseNode.targetRadius - this.mouseNode.radius) * 0.1;
            
            requestAnimationFrame(animateNodes);
        };
        
        animateNodes();
    }
    
    createBinaryStreams() {
        const binaryCanvas = document.createElement('canvas');
        binaryCanvas.className = 'binary-canvas';
        binaryCanvas.width = this.width;
        binaryCanvas.height = this.height;
        binaryCanvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0.3;
            z-index: 1;
        `;
        this.background.appendChild(binaryCanvas);
        
        const ctx = binaryCanvas.getContext('2d');
        const columns = Math.floor(this.width / 20); // Binary columns
        const drops = [];
        const chars = '01';
        
        // Initialize streams
        for (let i = 0; i < columns; i++) {
            drops[i] = Math.floor(Math.random() * -100);
        }
        
        const drawBinary = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, this.width, this.height);
            
            ctx.fillStyle = 'rgba(0, 255, 65, 0.25)';
            ctx.font = '15px monospace';
            
            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * 20, drops[i] * 20);
                
                if (drops[i] * 20 > this.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                
                drops[i]++;
            }
            
            requestAnimationFrame(drawBinary);
        };
        
        drawBinary();
    }
    
    createCircuitPattern() {
        const circuitCanvas = document.createElement('canvas');
        circuitCanvas.className = 'circuit-canvas';
        circuitCanvas.width = this.width;
        circuitCanvas.height = this.height;
        circuitCanvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0.15;
            z-index: 1;
        `;
        this.background.appendChild(circuitCanvas);
        
        const ctx = circuitCanvas.getContext('2d');
        
        // Draw circuit pattern
        const drawCircuit = (x, y, width, height, depth = 0) => {
            if (width < 10 || height < 10 || depth > 4) return;
            
            // Draw circuit frame
            ctx.strokeStyle = 'rgba(0, 255, 65, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, width, height);
            
            // Add circuit nodes
            if (Math.random() > 0.7) {
                ctx.fillStyle = 'rgba(0, 255, 65, 0.5)';
                ctx.beginPath();
                ctx.arc(x + width / 2, y + height / 2, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Random subdivision
            if (Math.random() > 0.5) {
                // Horizontal split
                const splitY = y + height / 2;
                drawCircuit(x, y, width, splitY - y, depth + 1);
                drawCircuit(x, splitY, width, y + height - splitY, depth + 1);
            } else {
                // Vertical split
                const splitX = x + width / 2;
                drawCircuit(x, y, splitX - x, height, depth + 1);
                drawCircuit(splitX, y, x + width - splitX, height, depth + 1);
            }
        };
        
        // Create circuit grid
        const gridSize = 200;
        for (let x = 0; x < this.width; x += gridSize) {
            for (let y = 0; y < this.height; y += gridSize) {
                drawCircuit(x, y, gridSize, gridSize);
            }
        }
    }
    
    createScanlines() {
        const scanlineDiv = document.createElement('div');
        scanlineDiv.className = 'scanlines';
        scanlineDiv.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: repeating-linear-gradient(
                0deg,
                rgba(0, 0, 0, 0) 0px,
                rgba(0, 0, 0, 0) 1px,
                rgba(0, 0, 0, 0.1) 2px,
                rgba(0, 0, 0, 0.1) 3px
            );
            z-index: 10;
            pointer-events: none;
        `;
        this.background.appendChild(scanlineDiv);
        
        // Add moving scanline
        const activeScanline = document.createElement('div');
        activeScanline.className = 'active-scanline';
        activeScanline.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 5px;
            background: linear-gradient(
                to bottom,
                rgba(0, 255, 65, 0),
                rgba(0, 255, 65, 0.5),
                rgba(0, 255, 65, 0)
            );
            animation: scanline-move 8s linear infinite;
            z-index: 11;
            pointer-events: none;
        `;
        this.background.appendChild(activeScanline);
        
        // Add scanline animation keyframes
        if (!document.getElementById('scanline-keyframes')) {
            const style = document.createElement('style');
            style.id = 'scanline-keyframes';
            style.innerHTML = `
                @keyframes scanline-move {
                    0% { transform: translateY(-5px); }
                    100% { transform: translateY(100vh); }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Initialize the background when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    const hackerBackground = new HackerBackground();
    
    // Make it globally accessible
    window.hackerBackground = hackerBackground;
});