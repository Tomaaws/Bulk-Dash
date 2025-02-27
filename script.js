// script.js
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Increased canvas dimensions
canvas.width = 1200;
canvas.height = 600;

// Scale factor
const scale = 1.5; // Now everything is based on this scale

// Player properties
const player = {
    x: 100,
    y: canvas.height - 100 * scale, // Adjusted y-position for larger player
    size: 100 * scale, // 1.5 times player size
    dy: 0,
    gravity: 0.44, // Increased gravity (was 0.3)
    jumpPower: -16, // Reduced jump power (was -14)
    grounded: false,
    img: new Image(),
    jumpSound: new Audio("audio/jump.mp3"),
    deathSound: new Audio("audio/death.mp3"),
    backgroundMusic: new Audio("audio/background.mp3")
};

// Load the image
player.img.src = "images/player.png";

// Set up background music
player.backgroundMusic.loop = true; // Enable looping
player.backgroundMusic.volume = 0.5; // Set volume (0.0 to 1.0)

// Preload background music to reduce delay
player.backgroundMusic.preload = 'auto';
player.backgroundMusic.load();

// Set up death sound to loop
player.deathSound.loop = true; // Enable looping for death sound
player.deathSound.volume = 0.5;

// Obstacle properties
const obstacles = [];
const obstacleWidth = 100 * scale; // 1.5 times obstacle width
const obstacleHeight = 80 * scale; // 1.5 times obstacle height
const obstacleSpeed = 6; // Increased obstacle speed (was 4.5)

// Obstacle images
const obstacleImages = [
    "images/spike1.png",
    "images/spike2.png",
    "images/spike3.png",
].map(src => {
    const img = new Image();
    img.src = src;
    return img;
});

// Game state
let gameOver = false;
let gameStarted = false;
let gameWon = false; // New: Track if the game is won
let score = 0;
const winningScore = 25;
let objectiveFadeOut = false; // New: Track if the objective is fading out
let objectiveFadeOutStartTime = 0; // New: Time when fade out started
const objectiveFadeOutDuration = 2000; // New: Fade out duration in milliseconds (2 seconds)
const objectiveDisplayDuration = 2000; // 2 seconds
const minSpawnTime = 800; // The shortest time between spawns
const maxSpawnTime = 1700; // The longest time between spawns

// Function to draw the player
function drawPlayer() {
    if (player.img.complete) {
        ctx.drawImage(player.img, player.x, player.y, player.size, player.size);
    } else {
        ctx.fillStyle = "blue";
        ctx.fillRect(player.x, player.y, player.size, player.size);
        player.img.onload = drawPlayer;
    }
}

// Function to draw an obstacle
function drawObstacle(obstacle) {
    if (obstacle.img.complete) {
        ctx.drawImage(obstacle.img, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    } else {
        ctx.fillStyle = "red";
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        obstacle.img.onload = () => drawObstacle(obstacle);
    }
}

// Function to spawn an obstacle
function spawnObstacle() {
    if (gameStarted && !gameOver && !gameWon) { // Changed order here
        const obstacleY = canvas.height - obstacleHeight - 10 * scale + 1; // Adjusted y-position for larger obstacles
        const randomImage = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
        obstacles.push({ x: canvas.width, y: obstacleY, width: obstacleWidth, height: obstacleHeight, img: randomImage });
        const spawnTime = Math.random() * (maxSpawnTime - minSpawnTime) + minSpawnTime; //only using these now.
        setTimeout(spawnObstacle, spawnTime);
    }
}

// Function to handle player jump
function jump() {
    if (!gameOver && player.grounded) { //stop jump from working if game is over
        player.dy = player.jumpPower;
        player.grounded = false;
        player.jumpSound.currentTime = 0;
        player.jumpSound.play();
    }
}

// Function to update game logic
function update() {
    if (!gameStarted || gameOver || gameWon) return; // Corrected condition here

    // Apply gravity
    player.dy += player.gravity;
    player.y += player.dy;

    // Check if player is on the ground
    if (player.y >= canvas.height - player.size - 10 * scale) { // Adjusted for larger player
        player.y = canvas.height - player.size - 10 * scale; // Adjusted for larger player
        player.dy = 0;
        player.grounded = true;
    }

    // Move and check obstacles
    obstacles.forEach((obstacle, index) => {
        obstacle.x -= obstacleSpeed;

        // Remove off-screen obstacles
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
            score++;
        }

        // Check for collision
        if (
            player.x < obstacle.x + obstacle.width &&
            player.x + player.size > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.size > obstacle.y
        ) {
            gameOver = true;
            player.deathSound.currentTime = 0;
            player.deathSound.play();
            player.backgroundMusic.pause(); // Pause background music on death
        }
    });

    // Check for win condition
    if (score >= winningScore) {
        gameWon = true;
        player.backgroundMusic.pause();
    }
    // Objective fade-out logic
    if (gameStarted && !objectiveFadeOut && Date.now() >= objectiveFadeOutStartTime) {
        objectiveFadeOut = true;
    }
}

// Function to draw everything on the canvas
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the player
    drawPlayer();

    // Draw the obstacles
    obstacles.forEach(drawObstacle);

    // Draw the ground
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(0, canvas.height - 10 * scale, canvas.width, 10 * scale); // Adjusted for larger obstacles

    // Draw score
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Robbers Avoided: " + score, 30, 70);

    // Game over message
    if (gameOver) {
        ctx.fillStyle = "white";
        ctx.font = "80px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 100); // Increased the Y value
        ctx.font = "40px Arial";
        ctx.fillText("Balkong Destroyer got robbed", canvas.width / 2, canvas.height / 2 - 40); // Changed y value
        ctx.fillText("He ran away from " + score + " Robbers!", canvas.width / 2, canvas.height / 2 + 30); // Changed y value
        ctx.fillText("Press Space to restart", canvas.width / 2, canvas.height / 2 + 100);
    }

    // Game won message
    if (gameWon) {
        ctx.fillStyle = "white";
        ctx.font = "80px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Balkong Destroyer made it to Coop Svea!", canvas.width / 2, canvas.height / 2 - 80);
        ctx.font = "40px Arial";
        ctx.fillText("Press Space to restart", canvas.width / 2, canvas.height / 2);
    }

    if (!gameStarted && !gameOver && !gameWon) {
        const currentTime = Date.now();
        let alpha = 1; // Default full opacity

        if (objectiveFadeOut) {
            const timeSinceFadeStart = currentTime - objectiveFadeOutStartTime;
            alpha = 1 - timeSinceFadeStart / objectiveFadeOutDuration;
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`; // Apply fade effect
        ctx.font = "40px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Objective: Avoid 25 Robbers and Reach Coop Svea!", canvas.width / 2, canvas.height / 2 - 120);
        ctx.font = "80px Arial";
        ctx.fillText("Press Space to start", canvas.width / 2, canvas.height / 2);
    }
}

// Main game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Event listener for jump
window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        if (gameOver || gameWon) {
            restartGame();
            return;
        }
        if (!gameStarted) {
            player.deathSound.pause(); //stop audio when starting
            player.deathSound.currentTime = 0; //reset time
            player.deathSound.loop = true; // Enable looping for death sound
            startGame();
        } else {
          jump();
        }
    }
});

//functions for the start and restart of the game
function startGame() {
    gameStarted = true;
    //start music on game start
    player.backgroundMusic.play();
    spawnObstacle();
    // Set the fade-out start time when the game starts
    objectiveFadeOutStartTime = Date.now() + objectiveDisplayDuration;
}

function restartGame() {
    gameOver = false;
    gameWon = false; // Reset gameWon on restart
    gameStarted = false;
    objectiveFadeOut = false; // Reset fade out
    objectiveFadeOutStartTime = 0; // reset time
    score = 0;
    player.y = canvas.height - player.size - 10 * scale;
    player.dy = 0;
    player.grounded = false;
    obstacles.length = 0;

    // Stop the death sound if it's playing
    player.deathSound.pause();
    player.deathSound.currentTime = 0;
    player.deathSound.loop = false; // Disable looping for death sound
    
    // Restart Background Music
    player.backgroundMusic.pause(); //Pauses background music
    player.backgroundMusic.currentTime = 0; //reset music

    spawnObstacle();
}

// Start the game loop
gameLoop();
