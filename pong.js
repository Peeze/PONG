// PONG, the game. A simple implementation.

// (c) Peeze, December 2022
// https://github.com/Peeze

// Released under the Mozilla Public License Version 2.0
// https://www.mozilla.org/en-US/MPL/2.0/


function randomSign() {
    return Math.pow(-1, Math.floor(2 * Math.random()));
}

function playSound(audioFile, loopAudio=false, autoStart=true) {
    if (audioFile) {
        console.debug("Loading", audioFile);

        let audio = new Audio(audioFile);
        audio.loop = loopAudio;
        if (autoStart) {
            audio.play();
        }

        return audio;
    }
}

function drawScore() {
    // Render score
    var scoreLeft = pongScore[0].toString();
    var scoreRight = pongScore[1].toString();

    // Pad spaces to keep colon centred
    var scoreLength = Math.max(scoreLeft.length, scoreRight.length);
    var padLeft = " ".repeat(Math.max(scoreLength - scoreLeft.length, 0));
    var padRight = " ".repeat(Math.max(scoreLength - scoreRight.length, 0));

    // Assemble score board
    scoreBoard.innerHTML = padLeft + scoreLeft + " : " + scoreRight + padRight;
}

function pauseGame() {
    gamePaused = !gamePaused;

    if (gamePaused) {
        messageContainer.innerHTML = "Paused"; //\u258B\u258B";
        audioAtmo_.pause();  // Don't play music during pause

    } else {
        messageContainer.innerHTML = "";

        if (!atmoPaused) {   // Restart music if it played before
            audioAtmo_.play();
        }
    }
}

function toggleMusic() {
    atmoPaused = !atmoPaused;

    if (!atmoPaused && !gamePaused) {
        audioAtmo_.play();
    } else {
        audioAtmo_.pause();
    }
}

function toggle(e) {
    // Start routine, start by pressing any key
    if (gameStart) {
        gameStart = false;
        gamePaused = false;
        atmoPaused = true;

        messageContainer.innerHTML = "";
    }

    // Detect if key "p" pressed, toggle gamePaused
    else if (e.key === "p" || e.key === " ") {
        pauseGame();
    }

    // Detect if key "m" pressed, toggle music
    else if (e.key === "m") {
        toggleMusic();
    }
}

// Game loop
// =========

// Update the state of the world for the elapsed time since last render
function update(progress) {
    for (gameElement of gameElements) {
        gameElement.update(progress);
    }
}

// Draw the state of the world
function draw() {
    for (gameElement of gameElements) {
        gameElement.draw();
    }
}

function loop(timestamp) {
    var progress = timestamp - lastRender;
    lastRender = timestamp;

    if (!gamePaused) {
        update(progress);
        draw();
    }

    window.requestAnimationFrame(loop);
}

// Game objects
// ============

// Class for the white bar controlled by player
class PongBar {
    //constructor(x, y, width, height, buttonUp, buttonDown, difficulty) {
    constructor(position, size, buttons, difficulty) {
        this.x  = position[0];
        this.y  = position[1];
        this.vx = 0;
        this.vy = 0;
        this.width = size[0];
        this.height = size[1];

        // Set difficulty of controls
        if (difficulty === "baby" || difficulty === "easy") {
            console.log("Baby mode");
            // Baby mode
            this.maxvy = 0.2;      // Maximum speed
            this.acc = 0.1;        // Acceleration when button pressed
            this.drag = 0.9;       // 1 - drag coefficient (1: no drag, 0: most drag)
            this.bounciness = 0.1; // Preservation of momentum when bouncing off wall
        }
        else if (difficulty === "hard" || difficulty === "difficult") {
            console.log("Hard mode");
            // Hard mode
            this.maxvy = 0.2;      // Maximum speed
            this.acc = 0.01;       // Acceleration when button pressed
            this.drag = 0.999;     // 1 - drag coefficient (1: no drag, 0: most drag)
            this.bounciness = 0.9; // Preservation of momentum when bouncing off wall
        }
        else {
            console.log("Default mode");
            // Default mode
            this.maxvy = 0.15;     // Maximum speed
            this.acc = 0.05;       // Acceleration when button pressed
            this.drag = 0.995;     // 1 - drag coefficient (1: no drag, 0: most drag)
            this.bounciness = 0.3; // Preservation of momentum when bouncing off wall
        }

        // Add div to HTML container
        let barElement = document.createElement("DIV");
        barElement.classList.add("pongBar");

        barElement.style.left = position[0] - size[0] / 2 + "%";
        barElement.style.top = position[1] - size[1] / 2 + "%";
        barElement.style.width = size[0] + "%";
        barElement.style.height = size[1] + "%";

        pongContainer.appendChild(barElement);

        this.barElement = barElement;

        // Add key events to move bar
        this.pressedUp = false;
        this.pressedDown = false;

        let that = this;
        let keyDownFunction = function(e) {
            if (e.key === buttons[0]) {
                that.pressedUp = true;
            }
            else if (e.key === buttons[1]) {
                that.pressedDown = true;
            }
        }

        let keyUpFunction = function(e) {
            if (e.key === buttons[0]) {
                that.pressedUp = false;
            }
            else if (e.key === buttons[1]) {
                that.pressedDown = false;
            }
        }

        keyDownFunctions.push(keyDownFunction);
        keyUpFunctions.push(keyUpFunction);
    }

    // Update position and velocity
    update(progress) {
        // Accelerate if button pressed
        if (this.pressedUp) {
            this.vy = Math.max(this.vy - this.acc, -this.maxvy);
        }
        if (this.pressedDown) {
            this.vy = Math.min(this.vy + this.acc,  this.maxvy);
        }

        // Change position
        this.y += this.vy * progress;

        // Detect border collision
        if (this.y <= this.height / 2) {  // Upper border
            // Bounce back, if not pressedUp
            if (this.pressedUp) {
                this.y = this.height / 2;
                //this.vy = 0;
            } else {
                this.y = this.height - this.y;
            }
            this.vy *= -this.bounciness;
        }
        if (this.y >= 100 - this.height / 2) {  // Lower border
            // Bounce back, if not pressedDown
            if (this.pressedDown) {
                this.y = 100 - this.height / 2;
                //this.vy = 0;
            } else {
                this.y = 200 - this.height - this.y;
            }
            this.vy *= -this.bounciness;
        }

        // Decrease speed over time
        this.vy *= Math.pow(this.drag, progress);
    }

    // Draw (i.e. change position of this.barElement)
    draw() {
        //this.barElement.style.left = (this.x - this.width / 2).toString() + "%";
        this.barElement.style.top = (this.y - this.height / 2).toString() + "%";
    }
}


class PongBall {
    constructor(x, y, width, height) {
        this.speedDefault = 0.04;
        this.speedIncrease = 1.03;  // Speed increase after each bar collision
        this.resetDurationDefault = 600;

        this.x  = x;
        this.y  = y;
        this.vx = randomSign() * this.speedDefault;
        this.vy = randomSign() * this.speedDefault;
        this.width = width;
        this.height = height;

        // Parameters for flashing ball
        this.visible = false;
        this.flashDuration = this.resetDurationDefault;
        this.flashSpeed = 100;

        // Waiting state, for reset after score
        this.waitDuration = this.resetDurationDefault;

        // Add div to HTML container
        let ballElement = document.createElement("DIV");
        ballElement.classList.add("pongBall");

        ballElement.style.left = x - width / 2 + "%";
        ballElement.style.top = y - height / 2 + "%";
        ballElement.style.width = width + "%";
        ballElement.style.height = height + "%";

        if (!this.visible) {
            ballElement.style.visibility = "hidden";
        }

        pongContainer.appendChild(ballElement);

        this.ballElement = ballElement;
    }

    update(progress) {
        // If in waiting state
        if (this.waitDuration > 0) {
            this.waitDuration = Math.max(0, this.waitDuration - progress);

            // If waiting ended, reset position
            if (this.waitDuration == 0) {
                this.x = 50;
                this.y = 50;
            }

        } else {
            // Change position
            this.x += this.vx * progress;
            this.y += this.vy * progress;

            // Detect bar collision
            for (gameElement of gameElements) {
                if (gameElement instanceof PongBar) {

                    var xCollision = false;
                    var avgWidth = (gameElement.width + this.width) / 2;
                    var avgHeight = (gameElement.height + this.height) / 2;

                    if (this.vx < 0) {
                        // Direction left
                        var elementBorder = gameElement.x + avgWidth;
                        if (this.x <= elementBorder
                            && this.x - this.vx * progress > elementBorder) {
                            if (Math.abs(this.y - gameElement.y) <= avgHeight) {
                                xCollision = true;
                            }
                        }
                    } else {
                        // Direction right
                        var elementBorder = gameElement.x - avgWidth;
                        if (this.x >= elementBorder
                            && this.x - this.vx * progress < elementBorder) {
                            if (Math.abs(this.y - gameElement.y) <= avgHeight) {
                                xCollision = true;
                            }
                        }
                    }

                    if (xCollision) {
                        playSound(audioHit);

                        //console.log("x collision");
                        if (this.vx < 0) {  // Bounce back
                            this.x = 2 * gameElement.x + gameElement.width - this.x + this.width;
                        } else {
                            this.x = 2 * gameElement.x - gameElement.width - this.x - this.width;
                        }

                        // Change direction, increase speed
                        this.vx *= -this.speedIncrease;
                        this.vy += 0.2 * gameElement.vy;

                    }
                }
            }

            // Detect border collision
            if (this.x < this.width / 2) {  // Left border
                // Right player scored, update score board
                pongScore[1] += 1;
                drawScore();

                // Wait and flash
                this.waitDuration = this.resetDurationDefault;
                this.flashDuration = this.resetDurationDefault;

                // Set position and velocity for resume
                //this.x = 50;
                //this.y = 50;
                this.vy = randomSign() * this.speedDefault;
                this.vx = this.speedDefault;

                playSound(audioScore);
            }
            else if (this.x > 100 - this.width / 2) {  // Right border
                // Left player scored, update score board
                pongScore[0] += 1;
                drawScore();

                // Wait and flash
                this.waitDuration = this.resetDurationDefault;
                this.flashDuration = this.resetDurationDefault;

                // Set position and velocity for resume
                //this.x = 50;
                //this.y = 50;
                this.vy = randomSign() * this.speedDefault;
                this.vx = -this.speedDefault;

                playSound(audioScore);
            }

            if (this.y < this.height / 2) {  // Upper border
                this.y = this.height - this.y;
                this.vy *= -1;
            }
            else if (this.y > 100 - this.height / 2) {  // Lower border
                this.y = 200 - this.height - this.y;
                this.vy *= -1;
            }
        }

        // Flash
        if (this.flashDuration > 0) {
            this.flashDuration = Math.max(0, this.flashDuration - progress);
            this.visible = Boolean((Math.floor(this.flashDuration / this.flashSpeed) + 1) % 3);
        }
    }

    draw() {
        this.ballElement.style.left = (this.x - this.width / 2).toString() + "%";
        this.ballElement.style.top = (this.y - this.height / 2).toString() + "%";

        if (this.visible) {
            this.ballElement.style.visibility = "visible";
        } else {
            this.ballElement.style.visibility = "hidden";
        }
    }
}


// Programme start
// ===============

let pongContainer = document.getElementById("pongContainer");

let keyDownFunctions = [toggle];  // Functions to be executed upon keydown
let keyUpFunctions = [];  // Functions to be executed upon keyup

document.onkeydown = function(e) {  // On keydown, execute all functions in list
    for (keyDownFunction of keyDownFunctions) {
        keyDownFunction(e);
    }
}

document.onkeyup = function(e) {  // On keyup, execute all functions in list
    for (keyUpFunction of keyUpFunctions) {
        keyUpFunction(e);
    }
}

// Create pong bars
let barHeight = 20;
let barWidth = 2 * window.innerHeight / window.innerWidth;

let pongBarLeft = new PongBar(
    [2 * barWidth, 50],         // position
    [barWidth, barHeight],      // size
    ["w", "s"],                 // key bindings
    "default");                 // difficulty
let pongBarRight = new PongBar(
    [100 - 2 * barWidth, 50],   // position
    [barWidth, barHeight],      // size
    ["ArrowUp", "ArrowDown"],   // key bindings
    "default");                 // difficulty

// Create pong ball, aspect ratio correction to ensure square shape
let pongBall = new PongBall(50, 50, barWidth, barWidth * window.innerWidth / window.innerHeight);

let gameElements = [pongBarLeft, pongBarRight, pongBall];

// Create score board
let pongScore = [0, 0];
let scoreBoard = document.createElement("PRE");
scoreBoard.classList.add("pongScoreContainer");
drawScore();

pongContainer.appendChild(scoreBoard);

// Create message container
let messageContainer = document.createElement("DIV");
messageContainer.classList.add("pongMessageContainer");
messageContainer.innerHTML = "Press any key to PONG!";

pongContainer.style.fontSize = Math.min(
    window.innerWidth / 30, window.innerHeight / 5
).toString() + "px";

pongContainer.appendChild(messageContainer);

// Set up audio
let audioHit = "media/hit_01.mp3";
let audioScore = "media/explosion_00.mp3";
let audioAtmo = "media/juhani_junkala_retro_game_music_pack/level1.wav"; //https://opengameart.org/content/5-chiptunes-action
//let audioAtmo = "media/wtpk_retro_game.mp3"; //https://soundcloud.com/user-880303714-187515990/retro-game
//let audioHit = "media/mixkit-drum-deep-impact-563.wav";
//let audioScore = "media/mixkit-cinematic-trailer-apocalypse-horn-724.wav";
//let audioScore = "media/inceptionbutton.mp3";
//let audioAtmo = "media/mixkit-space-soundscape-653.mp3";
let atmoPaused = true;
let audioAtmo_ = playSound(audioAtmo, loopAudio=true, autoStart=!atmoPaused);
audioAtmo_.volume = 0.7;

// Start game loop
let gamePaused = true;
let gameStart = true;  // true during start routine

var lastRender = 0;
window.requestAnimationFrame(loop);
