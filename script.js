document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("game-board");
    const scoreDisplay = document.getElementById("score");
    const livesDisplay = document.getElementById("lives");
    const startModal = document.getElementById("start-modal");
    const startBtn = document.getElementById("start-btn");
    const gameOverModal = document.getElementById("game-over-modal");
    const restartBtn = document.getElementById("restart-btn");
    const winModal = document.getElementById("win-modal");
    const winScoreDisplay = document.getElementById("win-score");
    const winRestartBtn = document.getElementById("win-restart-btn");
    const finalScoreDisplay = document.getElementById("final-score");

    // Controls
    const btnUp = document.getElementById("btn-up");
    const btnDown = document.getElementById("btn-down");
    const btnLeft = document.getElementById("btn-left");
    const btnRight = document.getElementById("btn-right");

    const width = 15; // 15x15 grid
    let squares = [];
    let score = 0;
    let lives = 3;
    let pacmanCurrentIndex = 0;
    let ghosts = [];
    let gameTimer;
    let isGameOver = false;
    let ghostTimer;
    let pacmanTimer;
    let currentDirection = 0;
    let nextDirection = 0;

    // 0 - pac-dot
    // 1 - wall
    // 2 - ghost-lair
    // 3 - power-pellet (strawberry)
    // 4 - empty
    const layout = [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0,
        0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1,
        1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 2, 1, 0, 1, 1, 1, 0, 1,
        1, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1,
        0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1,
        0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1,
        1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1,
    ];

    // Create board
    function createBoard() {
        // Grid columns are now handled in CSS for responsiveness
        grid.innerHTML = "";
        squares = [];
        for (let i = 0; i < layout.length; i++) {
            const square = document.createElement("div");
            square.classList.add("cell");
            grid.appendChild(square);
            squares.push(square);

            if (layout[i] === 1) {
                square.classList.add("wall");
            } else if (layout[i] === 0) {
                square.classList.add("pac-dot");
                square.innerHTML = '<div class="dot"></div>';
            } else if (layout[i] === 2) {
                square.classList.add("ghost-lair");
            } else if (layout[i] === 3) {
                square.classList.add("power-pellet");
                square.innerHTML = '<div class="super-food">🍓</div>';
            }
        }

        // Randomly place 4 strawberries
        let strawberryCount = 0;
        while (strawberryCount < 4) {
            const randomIndex = Math.floor(Math.random() * squares.length);
            if (squares[randomIndex].classList.contains("pac-dot")) {
                squares[randomIndex].classList.remove("pac-dot");
                squares[randomIndex].classList.add("power-pellet");
                squares[randomIndex].innerHTML =
                    '<div class="super-food">🍓</div>';
                strawberryCount++;
            }
        }

        // Place Pac-Man
        pacmanCurrentIndex = 112; // Starting position
        squares[pacmanCurrentIndex].classList.add("pacman");
    }

    // Start Game
    function startGame() {
        startModal.classList.add("hidden");
        gameOverModal.classList.add("hidden");
        winModal.classList.add("hidden");

        isGameOver = false;
        score = 0;
        lives = 3;
        scoreDisplay.innerHTML = score;
        livesDisplay.innerHTML = lives;

        clearTimeout(ghostTimer);
        clearInterval(pacmanTimer);
        ghosts.forEach((ghost) => clearInterval(ghost.timerId));

        createBoard();

        currentDirection = 0;
        nextDirection = 0;
        pacmanTimer = setInterval(movePacmanLoop, 300); // Move every 300ms

        document.addEventListener("keydown", movePacman);
        ghostTimer = setTimeout(() => {
            if (isGameOver) return;

            // Initialize Ghosts
            ghosts = [
                new Ghost("blinky", 16, 250),
                new Ghost("pinky", 16, 300),
                new Ghost("inky", 16, 350),
                new Ghost("clyde", 16, 400),
            ];

            ghosts.forEach((ghost) => {
                squares[ghost.currentIndex].classList.add(
                    "ghost",
                    ghost.className,
                );
                squares[ghost.currentIndex].innerHTML = "👻";
                moveGhost(ghost);
            });
        }, 5000);

        document.addEventListener("keydown", movePacman);
    }

    startBtn.addEventListener("click", startGame);
    restartBtn.addEventListener("click", startGame);
    winRestartBtn.addEventListener("click", startGame);

    // Controls
    btnUp.addEventListener("click", () => setDirection(-width));
    btnDown.addEventListener("click", () => setDirection(width));
    btnLeft.addEventListener("click", () => setDirection(-1));
    btnRight.addEventListener("click", () => setDirection(1));

    function setDirection(direction) {
        if (isGameOver) return;
        nextDirection = direction;
    }

    function movePacmanLoop() {
        if (isGameOver) return;

        // Try to move in nextDirection if valid
        if (nextDirection !== 0) {
            const potentialNextIndex = pacmanCurrentIndex + nextDirection;
            if (
                potentialNextIndex >= 0 &&
                potentialNextIndex < width * width &&
                !squares[potentialNextIndex].classList.contains("wall") &&
                !squares[potentialNextIndex].classList.contains("ghost-lair")
            ) {
                currentDirection = nextDirection;
            }
        }

        // Move in currentDirection
        if (currentDirection !== 0) {
            const nextIndex = pacmanCurrentIndex + currentDirection;

            if (
                nextIndex >= 0 &&
                nextIndex < width * width &&
                !squares[nextIndex].classList.contains("wall") &&
                !squares[nextIndex].classList.contains("ghost-lair")
            ) {
                squares[pacmanCurrentIndex].classList.remove("pacman");
                pacmanCurrentIndex = nextIndex;
                squares[pacmanCurrentIndex].classList.add("pacman");

                pacDotEaten();
                powerPelletEaten();
                checkForGameOver();
                checkForWin();
            } else {
                // Hit a wall, stop
                // currentDirection = 0; // Optional: stop if hit wall
                // usually in PacMan you keep pressing against the wall
            }
        }
    }

    function movePacman(e) {
        if (isGameOver) return;

        let direction = 0;
        switch (e.key) {
            case "ArrowLeft":
                direction = -1;
                break;
            case "ArrowUp":
                direction = -width;
                break;
            case "ArrowRight":
                direction = 1;
                break;
            case "ArrowDown":
                direction = width;
                break;
        }

        if (direction !== 0) {
            setDirection(direction);
        }
    }

    function pacDotEaten() {
        if (squares[pacmanCurrentIndex].classList.contains("pac-dot")) {
            score++;
            scoreDisplay.innerHTML = score;
            squares[pacmanCurrentIndex].classList.remove("pac-dot");
            squares[pacmanCurrentIndex].innerHTML = ""; // Remove the inner dot div
        }
    }

    function powerPelletEaten() {
        if (squares[pacmanCurrentIndex].classList.contains("power-pellet")) {
            score += 10;
            scoreDisplay.innerHTML = score;
            squares[pacmanCurrentIndex].classList.remove("power-pellet");
            squares[pacmanCurrentIndex].innerHTML = ""; // Remove strawberry

            // Scare ghosts
            ghosts.forEach((ghost) => (ghost.isScared = true));
            setTimeout(unScareGhosts, 12000); // 12 seconds
        }
    }

    function unScareGhosts() {
        ghosts.forEach((ghost) => (ghost.isScared = false));
    }

    class Ghost {
        constructor(className, startIndex, speed) {
            this.className = className;
            this.startIndex = startIndex;
            this.speed = speed;
            this.currentIndex = startIndex;
            this.isScared = false;
            this.timerId = NaN;
        }
    }

    function moveGhost(ghost) {
        const directions = [-1, 1, width, -width];
        let direction =
            directions[Math.floor(Math.random() * directions.length)];

        ghost.timerId = setInterval(function () {
            if (isGameOver) {
                clearInterval(ghost.timerId);
                return;
            }

            // If collision with wall or ghost, change direction
            if (
                !squares[ghost.currentIndex + direction].classList.contains(
                    "wall",
                ) &&
                !squares[ghost.currentIndex + direction].classList.contains(
                    "ghost",
                )
            ) {
                // Remove ghost
                squares[ghost.currentIndex].classList.remove(
                    "ghost",
                    ghost.className,
                    "scared",
                );
                squares[ghost.currentIndex].innerHTML = squares[
                    ghost.currentIndex
                ].innerHTML.replace("👻", "");

                // If the cell was a dot or power pellet, we need to respect that visuals are handled by class CSS
                // But we removed the ghost innerHTML which was just the emoji
                // If it's a dot or pellet, the innerHTML might have been cleared by ghost placement?
                // Actually, let's fix the Ghost display logic.
                // We should append the ghost emoji, not replace content if we want to be fancy,
                // but simpler: just manage classes and maybe overlay.
                // For simplicity, let's just re-add the dot/pellet HTML if it's there?
                // CSS background approach is safer for the board items, but we used innerHTML for dots.
                // Let's just restore the innerHTML based on class
                if (squares[ghost.currentIndex].classList.contains("pac-dot")) {
                    squares[ghost.currentIndex].innerHTML =
                        '<div class="dot"></div>';
                } else if (
                    squares[ghost.currentIndex].classList.contains(
                        "power-pellet",
                    )
                ) {
                    squares[ghost.currentIndex].innerHTML =
                        '<div class="super-food">🍓</div>';
                } else {
                    squares[ghost.currentIndex].innerHTML = "";
                }

                ghost.currentIndex += direction;

                squares[ghost.currentIndex].classList.add(
                    "ghost",
                    ghost.className,
                );
                squares[ghost.currentIndex].innerHTML = "👻";

                if (ghost.isScared) {
                    squares[ghost.currentIndex].classList.add("scared");
                }
            } else {
                direction =
                    directions[Math.floor(Math.random() * directions.length)];
            }

            checkForGameOver();
        }, ghost.speed);
    }

    function checkForGameOver() {
        if (
            squares[pacmanCurrentIndex].classList.contains("ghost") &&
            !squares[pacmanCurrentIndex].classList.contains("scared")
        ) {
            lives--;
            livesDisplay.innerHTML = lives;

            // Respawn Pacman
            squares[pacmanCurrentIndex].classList.remove("pacman");
            pacmanCurrentIndex = 112;
            squares[pacmanCurrentIndex].classList.add("pacman");

            if (lives === 0) {
                ghosts.forEach((ghost) => clearInterval(ghost.timerId));
                isGameOver = true;
                finalScoreDisplay.innerHTML = score;
                gameOverModal.classList.remove("hidden");
            }
        } else if (
            squares[pacmanCurrentIndex].classList.contains("ghost") &&
            squares[pacmanCurrentIndex].classList.contains("scared")
        ) {
            squares[pacmanCurrentIndex].classList.remove("ghost", "scared");
            // Find the ghost object
            const ghost = ghosts.find(
                (g) => g.currentIndex === pacmanCurrentIndex,
            );
            if (ghost) {
                // Send ghost back to lair
                squares[pacmanCurrentIndex].innerHTML = ""; // Remove ghost emoji
                ghost.currentIndex = ghost.startIndex;
                score += 20;
                scoreDisplay.innerHTML = score;
                squares[ghost.currentIndex].classList.add(
                    "ghost",
                    ghost.className,
                );
                squares[ghost.currentIndex].innerHTML = "👻";
            }
        }
    }

    function checkForWin() {
        const dotsLeft = document.querySelectorAll(".pac-dot").length;
        const pelletsLeft = document.querySelectorAll(".power-pellet").length;

        if (dotsLeft >0 && pelletsLeft === 0) {
            ghosts.forEach((ghost) => clearInterval(ghost.timerId));
            isGameOver = true;
            winScoreDisplay.innerHTML = score;
            winModal.classList.remove("hidden");
        }
    }
});
