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
    gravity: 0.27,
    jumpPower: -12,
    grounded: false,
    img: new Image(),
    jumpSound: new Audio("audio/jump.mp3"),
    deathSound: new Audio("audio/death.mp3"),
    backgroundMusic: new Audio("audio/background.mp3"),
    gameWinMusic: new Audio("audio/win.mp3")
};

// Load the image
player.img.src = "images/player.png";

// Set up background music
player.backgroundMusic.loop = true;
player.backgroundMusic.volume = 1.0;
player.gameWinMusic.volume = 1.0;


// Preload background music to reduce delay
player.backgroundMusic.preload = 'auto';
player.backgroundMusic.load();

// Set up death sound
player.deathSound.loop = true;
player.deathSound.volume = 1.0;

//set volume of jump
player.jumpSound.volume = 0.75;

// Obstacle properties
const obstacles = [];
const obstacleWidth = 100 * scale;
const obstacleHeight = 80 * scale;
const platformHeight = 80 * scale; // NEW: Height of the platform
let obstacleSpeed = 6; // Changed to let, so it can be modified
let winningObjectSpeed = 6; //new variable

// Obstacle images
const obstacleImages = [
    "images/spike1.png",
    "images/spike2.jpg",
    "images/spike3.png",
    "images/spike4.jpg",
    "images/spike5.jpg",
    "images/spike6.jpg"
].map(src => {
    const img = new Image();
    img.src = src;
    return img;
});

// NEW: Platform image
const platformImage = new Image();
platformImage.src = "images/platform.png";

// New winning object
const winningObject = {
    x: canvas.width + 300, // Start off-screen to the right
    y: canvas.height - 400 * scale,
    width: 600 * scale,
    height: 400 * scale,
    img: new Image(),
    active: false,
    speed: winningObjectSpeed //uses the winningObjectSpeed variable
};
winningObject.img.src = "images/coop.png"

// Game state
let gameOver = false;
let gameStarted = false;
let gameWon = false;
let score = 0;
const winningScore = 18;
let objectiveFadeOut = false;
let objectiveFadeOutStartTime = 0;
const objectiveFadeOutDuration = 2000;
const objectiveDisplayDuration = 2000;
const minSpawnTime = 800;
const maxSpawnTime = 1700;
let lastObstacleX = canvas.width;
const minDistanceBetweenObstacles = 200; //increased a little bit.
const obstacleImageWidth = 100 * scale;
const obstacleImageHeight = 80 * scale; // Increased obstacle height
const platformImageWidth = 280 * scale; // Increased platform width
const platformImageHeight = 80 * scale;

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
        ctx.fillStyle = obstacle.obstacleType === "platform" ? "green" : "red"; //Different colors for different objects.
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        obstacle.img.onload = () => drawObstacle(obstacle);
    }
}

// Function to spawn an obstacle
function spawnObstacle() {
    if (gameStarted && !gameOver && !gameWon && !winningObject.active) { //added !winningObject.active
        // Decide if it's a spike or a platform
        const isPlatform = Math.random() < 0.3; // 30% chance of being a platform

        let obstacleY, randomImage, width, height, imageWidth, imageHeight;

        if (isPlatform) {
            obstacleY = canvas.height - platformHeight - 10 * scale; // Platform on top of the ground
            randomImage = platformImage;
            width = platformImageWidth;
            height = platformImageHeight;
            imageWidth = platformImageWidth;
            imageHeight = platformImageHeight;
        } else {
            obstacleY = canvas.height - obstacleHeight - 10 * scale + 1;
            randomImage = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
            width = obstacleWidth;
            height = obstacleHeight;
            imageWidth = obstacleImageWidth;
            imageHeight = obstacleImageHeight;
        }

        // Calculate distance to last obstacle
        const distanceToLastObstacle = canvas.width - lastObstacleX;

        // Adjust spawn time if distance is too short
        let spawnTime = Math.random() * (maxSpawnTime - minSpawnTime) + minSpawnTime;
        if (distanceToLastObstacle < minDistanceBetweenObstacles) {
            spawnTime += minDistanceBetweenObstacles - distanceToLastObstacle;
        }

        // Update lastObstacleX
        lastObstacleX = canvas.width;
        obstacles.push({
            x: canvas.width,
            y: obstacleY,
            width: width,
            height: height,
            img: randomImage,
            obstacleType: isPlatform ? "platform" : "spike", // NEW: Type of obstacle
            imageWidth: imageWidth, //width of image
            imageHeight: imageHeight //height of image
        });

        setTimeout(spawnObstacle, spawnTime);
    }
}

// Function to handle player jump
function jump() {
    if (!gameOver && player.grounded) {
        player.dy = player.jumpPower;
        player.grounded = false;
        player.jumpSound.currentTime = 0;
        player.jumpSound.play();
    }
}

// Function to update game logic
function update() {
    if (!gameStarted || gameOver || gameWon) return;

    // Apply gravity
    player.dy += player.gravity;
    player.y += player.dy;

    // Check if player is on the ground
    if (player.y >= canvas.height - player.size - 10 * scale) {
        player.y = canvas.height - player.size - 10 * scale;
        player.dy = 0;
        player.grounded = true;
    }

    // Move and check obstacles
    obstacles.forEach((obstacle, index) => {
        obstacle.x -= obstacleSpeed;

        // Remove off-screen obstacles
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
            // NEW: Only add score if it's a spike
            if (obstacle.obstacleType === "spike") {
                score++;
                //increase speed
                 obstacleSpeed *= 1.1;
                winningObjectSpeed *= 1.1;
            }
        }

        // Check for collision
        if (
            player.x < obstacle.x + obstacle.width &&
            player.x + player.size > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.size > obstacle.y
        ) {
            if (obstacle.obstacleType === "spike") {
                gameOver = true;
                player.deathSound.currentTime = 0;
                player.deathSound.play();
                player.backgroundMusic.pause();
                player.gameWinMusic.pause();
            } else if (obstacle.obstacleType === "platform") {
                // Check if the player is landing on the platform
                if (player.y + player.size <= obstacle.y + 10 && player.dy >= 0) {
                    player.y = obstacle.y - player.size;
                    player.dy = 0;
                    player.grounded = true;
                } else {
                    //If he hits it from the sides or underneath
                    gameOver = true;
                    player.deathSound.currentTime = 0;
                    player.deathSound.play();
                    player.backgroundMusic.pause();
                    player.gameWinMusic.pause();
                }
            }
        }
    });
    // If the winning score is reached, activate the winning object
    if (score >= winningScore && !winningObject.active) {
        winningObject.active = true;
        winningObject.x = canvas.width + 300; //start off screen.
        player.backgroundMusic.pause();
        player.gameWinMusic.play();
        player.gameWinMusic.loop = true;
    }
    //If the winningObject is active, move it across the screen.
    if(winningObject.active){
        winningObject.x -= winningObject.speed; //uses the winning object speed.
    }

    //Check if the player touches the winning object
    if (winningObject.active &&
        player.x < winningObject.x + winningObject.width &&
        player.x + player.size > winningObject.x &&
        player.y < winningObject.y + winningObject.height &&
        player.y + player.size > winningObject.y) {
            gameWon = true;
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
    ctx.fillRect(0, canvas.height - 10 * scale, canvas.width, 10 * scale);

    // Draw score
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Robbers Avoided: " + score, 30, 70);
    // Draw the winning object
    if (winningObject.active) {
        if(winningObject.img.complete){
            ctx.drawImage(winningObject.img, winningObject.x, winningObject.y, winningObject.width, winningObject.height);
        }
    }

    // Game over message
    if (gameOver) {
        ctx.fillStyle = "white";
        ctx.font = "80px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 100);
        ctx.font = "40px Arial";
        ctx.fillText("Balkong Destroyer got robbed", canvas.width / 2, canvas.height / 2 - 40);
        ctx.fillText("He ran away from " + score + " Robbers!", canvas.width / 2, canvas.height / 2 + 30);
        ctx.fillText("Press Space to restart", canvas.width / 2, canvas.height / 2 + 100);
    }

    // Game won message
    if (gameWon) {
        ctx.fillStyle = "white";
        ctx.font = "80px Arial";
        ctx.textAlign = "center";
        ctx.font = "60px Arial";
        ctx.fillText("Balkong Destroyer made it to Coop!", canvas.width / 2, canvas.height / 2 - 80);
        ctx.font = "40px Arial";
        ctx.fillText("Press Space to restart", canvas.width / 2, canvas.height / 2);
    }

    if (!gameStarted && !gameOver && !gameWon) {
        const currentTime = Date.now();
        let alpha = 1;

        if (objectiveFadeOut) {
            const timeSinceFadeStart = currentTime - objectiveFadeOutStartTime;
            alpha = 1 - timeSinceFadeStart / objectiveFadeOutDuration;
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.font = "40px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Objective: Avoid " + winningScore + " Robbers and Reach Coop!", canvas.width / 2, canvas.height / 2 - 120);
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
            player.deathSound.pause();
            player.deathSound.currentTime = 0;
            player.deathSound.loop = true;
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
    lastObstacleX = canvas.width; // Reset when restarting game
    winningObject.active = false; //make sure it is inactive.
    winningObject.x = canvas.width + 300; //reset posision.
    obstacleSpeed = 6; // Reset obstacle speed
    winningObjectSpeed = 6; //reset winningObjectSpeed
    // Stop the death sound if it's playing
    player.deathSound.pause();
    player.deathSound.currentTime = 0;
    player.deathSound.loop = false; // Disable looping for death sound

    // Restart Background Music
    player.backgroundMusic.pause(); //Pauses background music
    player.backgroundMusic.currentTime = 0; //reset music
    
    player.gameWinMusic.pause();
    player.gameWinMusic.currentTime = 0;

    spawnObstacle();
}

// Start the game loop
gameLoop();
