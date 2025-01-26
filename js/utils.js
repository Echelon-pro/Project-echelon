// Vibrant colors for usernames
const vibrantColors = [
    '#FF1493', // Deep Pink
    '#00BFFF', // Deep Sky Blue
    '#FF69B4', // Hot Pink
    '#32CD32', // Lime Green
    '#FFD700', // Gold
    '#FF4500', // Orange Red
    '#9370DB', // Medium Purple
    '#00FA9A', // Medium Spring Green
    '#FF6347', // Tomato
    '#4169E1'  // Royal Blue
];

// Store username colors in memory
const userColors = new Map();

// Function to get consistent color for username
export function getUserColor(username) {
    if (!userColors.has(username)) {
        // Generate a deterministic index based on username
        const index = Array.from(username).reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const color = vibrantColors[index % vibrantColors.length];
        userColors.set(username, color);
    }
    return userColors.get(username);
}
