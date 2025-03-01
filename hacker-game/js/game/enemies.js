// This file defines enemy characters, their behaviors, and interactions with the player.

class Enemy {
    constructor(x, y, speed) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.width = 50; // Width of the enemy
        this.height = 50; // Height of the enemy
        this.alive = true; // Status of the enemy
    }

    move() {
        this.x -= this.speed; // Move the enemy left
        if (this.x < 0) {
            this.alive = false; // Mark as dead if it goes off screen
        }
    }

    draw(context) {
        if (this.alive) {
            context.fillStyle = 'red'; // Color of the enemy
            context.fillRect(this.x, this.y, this.width, this.height); // Draw the enemy
        }
    }

    reset(x, y) {
        this.x = x; // Reset position
        this.y = y;
        this.alive = true; // Reset status
    }
}

// Function to create a new enemy
function createEnemy() {
    const x = canvas.width; // Start from the right edge of the canvas
    const y = Math.random() * (canvas.height - 50); // Random vertical position
    const speed = Math.random() * 3 + 2; // Random speed between 2 and 5
    return new Enemy(x, y, speed);
}

// Function to update all enemies
function updateEnemies(enemies) {
    enemies.forEach(enemy => {
        enemy.move();
    });
}

// Function to draw all enemies
function drawEnemies(context, enemies) {
    enemies.forEach(enemy => {
        enemy.draw(context);
    });
}