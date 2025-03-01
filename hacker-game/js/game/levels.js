// This file manages the different levels of the game, including level progression, difficulty scaling, and environment setup.

const levels = [
    {
        level: 1,
        difficulty: 'easy',
        environment: 'basic',
        enemies: 5,
        description: 'Welcome to the hacker world! Get ready to face your first challenge.',
        objectives: ['Collect 10 data packets', 'Avoid detection by the security system']
    },
    {
        level: 2,
        difficulty: 'medium',
        environment: 'intermediate',
        enemies: 10,
        description: 'You are getting better! The challenges are becoming tougher.',
        objectives: ['Collect 15 data packets', 'Defeat 3 enemy hackers']
    },
    {
        level: 3,
        difficulty: 'hard',
        environment: 'advanced',
        enemies: 15,
        description: 'You are now in the advanced level. Stay sharp!',
        objectives: ['Collect 20 data packets', 'Survive for 60 seconds']
    },
    {
        level: 4,
        difficulty: 'expert',
        environment: 'complex',
        enemies: 20,
        description: 'Only the best hackers can survive this level. Good luck!',
        objectives: ['Collect 25 data packets', 'Defeat 5 enemy hackers', 'Avoid traps']
    }
];

function getLevel(levelNumber) {
    return levels.find(level => level.level === levelNumber);
}

function nextLevel(currentLevel) {
    if (currentLevel < levels.length) {
        return getLevel(currentLevel + 1);
    }
    return null; // No more levels
}