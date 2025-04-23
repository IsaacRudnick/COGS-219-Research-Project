let allMainLevels = [
	"levels/_filler.csv",
	"levels/_filler.csv",
	"levels/_filler_with_interruption_no_bonus.csv",
	"levels/_filler_with_interruption_no_bonus.csv",
	"levels/cond3_LS_peripheral_bonus_interrupted.csv",
	"levels/cond4_LS_peripheral_bonus_normal.csv",
	"levels/cond5_LS_central_bonus_interrupted.csv",
	"levels/cond6_LS_central_bonus_normal.csv",
	"levels/cond7_HS_peripheral_bonus_interrupted.csv",
	"levels/cond8_HS_peripheral_bonus_normal.csv",
	"levels/cond9_HS_central_bonus_normal.csv",
	"levels/cond10_HS_central_bonus_interrupted.csv",
];

// 5 of each in allMainLevels, shuffled
let numOfEachCondition = 10;
let allLevels = [];
for (let i = 0; i < numOfEachCondition; i++) {
	allLevels.push(...allMainLevels);
}
allLevels = allLevels.sort(() => Math.random() - 0.5);

class Game {
	constructor() {
		// Make game instance available globally
		window.game = this;

		// Collect window size
		const windowWidth = screen.availWidth;
		const windowHeight = screen.availHeight;

		// Store window dimensions for later use
		this.windowDimensions = {
			width: windowWidth,
			height: windowHeight,
		};

		// Check if display is too small
		if (windowWidth < 1500 || windowHeight < 900) {
			alert(
				`Your display (${windowWidth}px × ${windowHeight}px) is too small to play this game. The minimum required resolution is 1500×900 pixels.`
			);
			// Prevent the game from continuing
			throw new Error("Display resolution too small");
		}

		// alert(`Window dimensions: ${windowWidth}px × ${windowHeight}px`);

		this.score = 0;
		this.currentLane = 2; // Start in middle lane
		this.gameTimeDecimal = 0;
		this.ignoreNextMove = false;
		this.gameLoop = null;
		this.animationLoop = null;
		this.events = [];
		this.userInputs = [];
		this.isGameOver = false;
		this.activeBonus = null;
		this.conditionOrders = [
			"levels/_practice.csv", // Practice trial
		];

		this.conditionOrders.push(...allLevels); // Add all levels to the condition orders
		console.log(this.conditionOrders);

		// Keep track of which condition we are in
		this.conditionIndex = 0;
		this.isPracticeTrial = true; // Flag to track if we're in the practice trial

		this.levelStartTime = 0;
		this.levelEndTime = 0;
		this.survey = new Survey();
		this.participantData = null;
		this.postGameData = null;

		// New structured logging system
		this.gameLog = {
			preGameSurvey: null,
			rounds: [],
			postGameSurvey: null,
		};

		// Track current round data
		this.currentRound = {
			conditionFile: "",
			startTime: 0,
			endTime: 0,
			events: [],
			score: 0,
		};

		// Track active bonus for timing collection
		this.activeBonusSpawnTime = 0;

		// DOM elements
		this.scoreElement = document.getElementById("score");
		this.timerElement = document.getElementById("timer");
		this.gameOverElement = document.getElementById("game-over");
		this.finalScoreElement = document.getElementById("final-score");
		this.levelElement = document.getElementById("level");

		// Bind event listeners
		this.handleKeyPress = this.handleKeyPress.bind(this);

		this.startTime = null;

		// Cache for pre-fetched level data
		this.levelCache = {};

		// Initialize game
		this.init();
	}

	async init() {
		// Show pre-game survey (demographics)
		this.participantData = await this.survey.showPreGameSurvey();
		console.log("Participant data:", this.participantData);

		// Show game rules survey
		await this.survey.showGameRulesSurvey();
		console.log("Game rules survey completed");

		// Demonstrate bonus bugs
		await this.demonstrateBonusBugs();
		console.log("Bonus bug demonstration completed");

		// Show practice readiness survey
		await this.survey.showPracticeReadinessSurvey();
		console.log("Practice readiness survey completed");

		// Pre-fetch all level files
		await this.preFetchLevels();
		console.log("All level files pre-fetched");

		// Load first level
		await this.loadLevel(this.conditionOrders[0]);

		// Create player
		this.createPlayer();

		// Start game loops
		this.startGameLoop();
		this.startTime = Date.now();
		this.startAnimationLoop();

		// Add event listeners
		document.addEventListener("keydown", this.handleKeyPress);
		// this.restartButton.addEventListener("click", this.restartGame);
	}

	async demonstrateBonusBugs() {
		return new Promise((resolve) => {
			// Create player for demonstration
			// this.createPlayer();

			// Show message about upcoming bonus bug
			const message = document.createElement("div");
			message.style.position = "fixed";
			message.style.top = "50%";
			message.style.left = "50%";
			message.style.transform = "translate(-50%, -50%)";
			message.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
			message.style.color = "white";
			message.style.padding = "20px";
			message.style.borderRadius = "10px";
			message.style.zIndex = "1000";
			message.style.textAlign = "center";
			message.style.fontSize = "24px";
			message.textContent =
				"You will now see a demonstration of the bonus bugs. One will spawn on the left, then another in the middle, just like they do in the real game";
			document.body.appendChild(message);

			// Remove message and show first bonus bug after 3 seconds
			setTimeout(() => {
				message.remove();
				this.createBonus({ position: "left" });

				// Show second bonus bug after 4 seconds
				setTimeout(() => {
					this.createBonus({ position: "2" }); // Middle lane

					// Resolve after second bonus bug disappears
					setTimeout(() => {
						// Remove player
						// this.player.remove();
						resolve();
					}, 5000);
				}, 5000);
			}, 5000);
		});
	}

	// New method to pre-fetch all level files
	async preFetchLevels() {
		console.log("Pre-fetching all level files...");

		// Create a loading indicator
		const loadingIndicator = document.createElement("div");
		loadingIndicator.className = "loading-indicator";
		loadingIndicator.innerHTML = `
			<div class="loading-content">
				<h2>Loading Game Levels</h2>
				<div class="progress-container">
					<div class="progress-bar" id="loading-progress"></div>
				</div>
				<p id="loading-text">Loading level files...</p>
			</div>
		`;
		document.body.appendChild(loadingIndicator);

		// Get unique level files (remove duplicates)
		const uniqueLevels = [...new Set(this.conditionOrders)];
		const totalLevels = uniqueLevels.length;
		let loadedLevels = 0;

		// Update progress bar
		const progressBar = document.getElementById("loading-progress");
		const loadingText = document.getElementById("loading-text");

		// Fetch all level files in parallel
		const fetchPromises = uniqueLevels.map(async (levelFile) => {
			try {
				const response = await fetch(
					`https://raw.githubusercontent.com/IsaacRudnick/COGS-219-Research-Project/main/${levelFile}`
				);
				const text = await response.text();

				// Store in cache
				this.levelCache[levelFile] = text;

				// Update progress
				loadedLevels++;
				const progress = (loadedLevels / totalLevels) * 100;
				progressBar.style.width = `${progress}%`;
				loadingText.textContent = `Loading level files... ${loadedLevels}/${totalLevels}`;

				return { levelFile, success: true };
			} catch (error) {
				console.error(`Error pre-fetching level ${levelFile}:`, error);
				alert("Level acquisiton error. Please try again and refresh the page.");
				return { levelFile, success: false, error };
			}
		});

		// Wait for all fetches to complete
		await Promise.all(fetchPromises);

		// Remove loading indicator
		document.body.removeChild(loadingIndicator);

		console.log("All level files pre-fetched successfully");
	}

	async loadLevel(levelFile) {
		try {
			let text;

			// Check if level is in cache
			if (this.levelCache[levelFile]) {
				console.log(`Using cached level data for ${levelFile}`);
				text = this.levelCache[levelFile];
			} else {
				// Fallback to fetching if not in cache
				console.log(`Level ${levelFile} not in cache, fetching...`);
				const response = await fetch(
					`https://raw.githubusercontent.com/IsaacRudnick/COGS-219-Research-Project/main/${levelFile}`
				);
				text = await response.text();
			}

			if (this.levelElement) {
				this.levelElement.textContent = `Condition ${levelFile}`;
			}

			// Calculate time offset based on previous level end time
			const timeOffset = this.levelEndTime;

			// Parse events and apply time offset
			const newEvents = text
				.split("\n")
				.filter((line) => line.trim())
				.slice(1) // Skip the header row
				.map((line) => {
					const parts = line.split(",").map((s) => s.trim());
					if (parts[0] === "Bonus") {
						return {
							type: parts[0],
							time: parseFloat(parts[1]) + timeOffset,
							position: parts[2], // 'left', 'right', or lane number
							triggered: false,
						};
					} else if (parts[0] === "EndRound") {
						return {
							type: parts[0],
							time: parseFloat(parts[1]) + timeOffset,
							triggered: false,
						};
					} else {
						return {
							type: parts[0],
							time: parseFloat(parts[1]) + timeOffset,
							lane: parseInt(parts[2]),
							triggered: false,
						};
					}
				});

			// Find the EndRound event to set the level end time
			const endRoundEvent = newEvents.find((event) => event.type === "EndRound");
			if (endRoundEvent) {
				this.levelEndTime = endRoundEvent.time;
			}

			// Add new events to the existing events array
			this.events = [...this.events, ...newEvents];

			// Initialize new round data
			this.currentRound = {
				conditionFile: levelFile,
				startTime: this.gameTime,
				endTime: 0,
				events: [],
				score: this.score,
			};

			// Log round start
			this.logRoundStart(levelFile);
		} catch (error) {
			console.error("Error loading level:", error);
		}
	}

	createPlayer() {
		const player = document.createElement("div");
		player.className = "player";

		// Create flash overlay
		const flashOverlay = document.createElement("div");
		flashOverlay.className = "player-flash";
		player.appendChild(flashOverlay);

		document.getElementById(`lane${this.currentLane}`).appendChild(player);
		this.player = player;
		this.playerFlash = flashOverlay;
	}

	startGameLoop() {
		this.gameLoop = setInterval(() => {
			this.gameTimeDecimal += 0.01667; // Update every 16ms (approximately 60fps)
			this.timerElement.textContent = this.gameTimeDecimal.toFixed(1);

			// Check for events
			this.checkEvents();
		}, 16); // Update every 16ms (approximately 60fps)
	}

	startAnimationLoop() {
		let lastTime = 0;
		const animate = (currentTime) => {
			if (this.isGameOver) return;

			// Calculate delta time for smooth animation
			const deltaTime = currentTime - lastTime;
			lastTime = currentTime;

			// Move obstacles with delta time for consistent speed
			this.moveObstacles(deltaTime);

			// Request next frame
			this.animationFrame = requestAnimationFrame(animate);
		};

		// Start animation loop
		this.animationFrame = requestAnimationFrame(animate);
	}

	checkEvents() {
		this.events.forEach((event) => {
			if (!event.triggered && this.gameTimeDecimal >= event.time) {
				if (event.type === "Ignore") {
					this.ignoreNextMove = true;
					console.log("Ignoring next move");
				} else if (event.type === "Bonus") {
					this.createBonus(event);
				} else if (event.type === "EndRound") {
					this.endRound();
				} else {
					this.createObstacle(event.type, event.lane);
				}
				event.triggered = true;
			}
		});
	}

	createObstacle(type, lane) {
		const laneElement = document.getElementById(`lane${lane}`);
		if (!laneElement) {
			console.error(`Invalid lane number: ${lane}`);
			return;
		}
		const obstacle = document.createElement("div");
		obstacle.className = `obstacle ${type.toLowerCase()}`;
		obstacle.dataset.type = type;
		// Set initial position at the top of the viewport
		obstacle.style.top = "-100px";

		// Log obstacle creation
		this.logEvent("obstacleSpawned", {
			type: type,
			lane: lane,
			time: Date.now(),
		});

		laneElement.appendChild(obstacle);
	}

	createBonus(event) {
		const bonus = document.createElement("div");
		bonus.className = "bonus";
		bonus.dataset.position = event.position;
		bonus.style.opacity = "0";
		bonus.style.transform = "scale(1)";

		if (event.position === "left" || event.position === "right") {
			document.body.appendChild(bonus);
			// Move left bonus more to the right (from 20px to 100px)
			bonus.style[event.position] = event.position === "left" ? "100px" : "20px";
			// For side bonuses, keep them centered vertically
			bonus.style.top = "30%";
			bonus.style.transform = "translateY(-50%) scale(1)";
		} else {
			// For lane bonuses, position them in the middle of the screen
			const laneElement = document.getElementById(`lane${event.position}`);
			laneElement.appendChild(bonus);
			// Position the bonus in the middle of the screen
			bonus.style.top = "30%";
			// Make sure the bonus is horizontally centered in the lane
			bonus.style.left = "50%";
			bonus.style.transform = "translate(-50%, -50%) scale(1)";
		}

		// Log bonus spawned event
		this.logEvent("bonusSpawned", {
			position: event.position,
			time: Date.now(),
		});

		// Store spawn time for collection timing
		this.activeBonusSpawnTime = this.gameTimeDecimal;

		console.log(`Created bonus at position: ${event.position}`);

		// Fade in and scale up over 2 seconds
		let opacity = 0;
		let scale = 1;
		const fadeInterval = setInterval(() => {
			if (opacity < 1) {
				opacity += 0.025; // Larger increments for faster fade-in
				bonus.style.opacity = opacity;
			}
			if (scale < 8) {
				scale += 0.15; // Increment scale
				// Apply scale while preserving any existing transforms
				if (event.position === "left" || event.position === "right") {
					bonus.style.transform = `translateY(-50%) scale(${scale})`;
				} else {
					bonus.style.transform = `translateX(-50%) scale(${scale})`;
				}
			}
		}, 100); // 100ms interval with 0.025 increments = 4 seconds to reach full opacity

		// Remove 3 seconds after first appeared
		setTimeout(() => {
			clearInterval(fadeInterval);
			this.activeBonus = null;
			bonus.remove();
		}, 3500);

		this.activeBonus = bonus;
	}

	moveObstacles(deltaTime) {
		const obstacles = document.querySelectorAll(".obstacle");
		const moveSpeed = (deltaTime / 16) * 8; // Normalize speed based on 60fps
		const gameContainer = document.querySelector(".game-container");
		const containerHeight = gameContainer.clientHeight;

		obstacles.forEach((obstacle) => {
			const currentTop = parseFloat(obstacle.style.top);
			obstacle.style.top = `${currentTop + moveSpeed}px`;

			// Remove obstacles that have moved past the bottom of the screen
			if (currentTop > containerHeight) {
				obstacle.remove();
				return; // Skip collision check for removed obstacles
			}

			if (obstacle.dataset.collided === "true") {
				return; // Skip collision check for already-hit obstacles
			}

			// Check collision
			const playerY = containerHeight - containerHeight * 0.15; // Player's Y position (15% from bottom)

			// Check if obstacle is in the player's vertical range
			if (currentTop > playerY - 40 && currentTop < playerY + 40) {
				// Check if obstacle is in the same lane as the player
				const lane = obstacle.parentElement.id.replace("lane", "");
				if (parseInt(lane) === this.currentLane) {
					// Get hitbox positions
					const playerRect = this.player.getBoundingClientRect();
					const obstacleRect = obstacle.getBoundingClientRect();

					// Calculate the center points
					let playerCenterX = playerRect.left + playerRect.width / 2;
					if (this.player.style.transform === "rotate(90deg)") {
						playerCenterX -= 40;
					}
					const playerCenterY = playerRect.top + playerRect.height / 2;
					const obstacleCenterX = obstacleRect.left + obstacleRect.width / 2;
					const obstacleCenterY = obstacleRect.top + obstacleRect.height / 2;

					// Calculate the distance between centers
					const dx = playerCenterX - obstacleCenterX;
					const dy = playerCenterY - obstacleCenterY;
					const distance = Math.sqrt(dx * dx + dy * dy);

					// Define collision thresholds based on obstacle type and container size
					let collisionThreshold;
					if (obstacle.dataset.type === "Coin") {
						// For coins, use a smaller collision radius since they're more precise
						collisionThreshold = Math.min(30, containerHeight * 0.05); // 5% of container height or 30px, whichever is smaller
					} else {
						// For water, use a larger collision radius
						collisionThreshold = Math.min(40, containerHeight * 0.067); // 6.7% of container height or 40px, whichever is smaller
					}

					// Check if the distance is less than the threshold
					const isIntersecting = distance < collisionThreshold;

					if (isIntersecting) {
						// Handle collision based on obstacle type
						const obstacleType = obstacle.dataset.type;

						if (obstacleType === "Coin") {
							// For coins, handle collision and remove the obstacle
							this.handleCollision(obstacleType);
							obstacle.remove();
						} else if (obstacleType === "Water") {
							// For water, always handle collision regardless of previous collisions
							this.handleCollision(obstacleType);
							obstacle.dataset.collided = "true";
						}
					}
				}
			}
		});
	}

	handleCollision(type) {
		console.log(`Collision detected with: ${type}`);

		switch (type) {
			case "Water":
				this.score -= 100;
				this.showScorePopup(-100);
				this.logEvent("waterHit", {
					time: Date.now(),
				});
				this.flashPlayer("red");
				break;
			case "Coin":
				this.score += 10;
				this.showScorePopup(10);
				this.logEvent("coinCollected", {
					time: Date.now(),
				});
				this.flashPlayer("green");
				break;
			default:
				console.warn(`Unknown collision type: ${type}`);
				break;
		}
		this.scoreElement.textContent = this.score;
	}

	flashPlayer(color) {
		this.playerFlash.style.backgroundColor = color;
		this.playerFlash.style.opacity = "0.5";

		setTimeout(() => {
			this.playerFlash.style.opacity = "0";
		}, 200);
	}

	showSlippedNotification() {
		// Create slipped notification element
		const notification = document.createElement("div");
		notification.className = "score-popup slipped";
		notification.textContent = "Slipped!";

		// Position the notification next to the frog
		const playerRect = this.player.getBoundingClientRect();
		notification.style.left = `${playerRect.right + 10}px`;

		// Check for existing popups and stack vertically
		const existingPopups = document.querySelectorAll(".score-popup");
		if (existingPopups.length > 0) {
			// Position above the highest existing popup
			const highestPopup = Array.from(existingPopups).reduce((highest, current) => {
				const currentTop = parseFloat(current.style.top);
				const highestTop = parseFloat(highest.style.top);
				return currentTop < highestTop ? current : highest;
			});

			const highestTop = parseFloat(highestPopup.style.top);
			notification.style.top = `${highestTop - 30}px`; // 30px above the highest popup
		} else {
			// First popup, position at middle of player
			notification.style.top = `${playerRect.top + playerRect.height / 2}px`;
		}

		// Add to the document
		document.body.appendChild(notification);

		// Animate the notification
		notification.style.opacity = "1";
		notification.style.transform = "translateY(0)";

		// Remove after animation completes
		setTimeout(() => {
			notification.remove();
		}, 1000);
	}

	handleKeyPress(event) {
		if (this.isGameOver) return;

		const key = event.key;

		// Handle bonus collection with space key
		if (key === " ") {
			if (this.activeBonus) {
				this.collectBonus();
			} else {
				// Penalty for pressing space when no bonus is available
				this.score -= 50;
				this.showScorePopup(-50);
				this.scoreElement.textContent = this.score;
				this.flashPlayer("DarkOrange");

				// Log the penalty
				this.logEvent("spacePenalty", {
					time: Date.now(),
				});
			}
			return;
		}

		// Handle arrow keys for movement
		if (key !== "ArrowLeft" && key !== "ArrowRight") {
			return;
		}

		let newLane = this.currentLane;

		// Log the action with detailed information
		this.logEvent("movement", {
			key: key,
			fromLane: this.currentLane,
			wasIgnored: this.ignoreNextMove,
			time: Date.now(),
		});

		if (this.ignoreNextMove) {
			// Rotate frog for .1 seconds to indicate slippage
			this.player.style.transform = "rotate(90deg)";
			// Show slipped notification
			this.showSlippedNotification();
			setTimeout(() => {
				this.player.style.transform = null;
				this.ignoreNextMove = false; // Reset ignore state
			}, 1000);
		} else {
			if (key === "ArrowLeft") {
				newLane = Math.max(this.currentLane - 1, 1);
			} else if (key === "ArrowRight") {
				newLane = Math.min(this.currentLane + 1, 3);
			}
		}

		// Update player position
		if (newLane !== this.currentLane) {
			this.currentLane = newLane;
			this.updatePlayerPosition();
		}
	}

	updatePlayerPosition() {
		this.player.parentElement.removeChild(this.player);
		document.getElementById(`lane${this.currentLane}`).appendChild(this.player);
	}

	collectBonus() {
		const bonus = this.activeBonus;
		if (!bonus) return;
		this.activeBonus = null;

		// Log bonus collection with time since spawn
		const timeSinceSpawn = this.gameTimeDecimal - this.activeBonusSpawnTime;
		const position = bonus.dataset.position;

		this.logEvent("bonusCollected", {
			position: position,
			timeSinceSpawn: timeSinceSpawn,
			time: Date.now(),
		});

		// Get player position
		const playerRect = this.player.getBoundingClientRect();

		// Calculate player center point
		const playerX = playerRect.left + playerRect.width / 2;
		const playerY = playerRect.top + playerRect.height / 2;

		// Calculate bonus position based on its position attribute
		let bonusX, bonusY;

		if (position === "left" || position === "right") {
			// For side bonuses, use fixed positions
			bonusX = position === "left" ? 100 : window.innerWidth - 100; // Adjusted from 20px to 100px
			bonusY = window.innerHeight * 0.3; // 30% from the top of the screen
		} else {
			// For lane bonuses, use the actual position
			const bonusRect = bonus.getBoundingClientRect();
			bonusX = bonusRect.left + bonusRect.width / 2;
			bonusY = bonusRect.top + bonusRect.height / 2;
		}

		// Calculate distance and angle
		const dx = bonusX - playerX;
		const dy = bonusY - playerY;
		const distance = Math.sqrt(dx * dx + dy * dy);
		const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

		// Create tongue effect
		const tongue = document.createElement("div");
		tongue.className = "bonus-tongue";

		// Set initial tongue properties
		tongue.style.width = "0";
		tongue.style.height = "4px";
		tongue.style.left = `${playerX}px`;
		tongue.style.top = `${playerY}px`;
		tongue.style.transform = `rotate(${angle}deg)`;
		tongue.style.transformOrigin = "left center";
		tongue.style.backgroundColor = "#FF69B4"; // Pink color for the tongue
		tongue.style.borderRadius = "2px";
		tongue.style.position = "fixed";
		tongue.style.zIndex = "9";
		document.body.appendChild(tongue);

		// Animate tongue extension
		let currentWidth = 0;
		const targetWidth = distance;
		const animationDuration = 200; // 200ms for the animation
		const startTime = performance.now();

		const animateTongue = (currentTime) => {
			const elapsed = currentTime - startTime;
			const progress = Math.min(elapsed / animationDuration, 1);

			// Ease out cubic function for smooth animation
			const easeOut = 1 - Math.pow(1 - progress, 3);
			currentWidth = targetWidth * easeOut;

			tongue.style.width = `${currentWidth}px`;

			if (progress < 1) {
				requestAnimationFrame(animateTongue);
			} else {
				// Add points immediately
				this.score += 50;
				this.showScorePopup(50);
				this.scoreElement.textContent = this.score;

				// Animate tongue retraction
				const retractStartTime = performance.now();
				const retractAnimation = (retractTime) => {
					const retractElapsed = retractTime - retractStartTime;
					const retractProgress = Math.min(retractElapsed / animationDuration, 1);

					// Ease in cubic function for smooth retraction
					const easeIn = Math.pow(retractProgress, 3);
					currentWidth = targetWidth * (1 - easeIn);

					tongue.style.width = `${currentWidth}px`;

					if (retractProgress < 1) {
						requestAnimationFrame(retractAnimation);
					} else {
						// Clean up
						tongue.remove();
						bonus.remove();
						this.activeBonus = null;
					}
				};
				requestAnimationFrame(retractAnimation);
			}
		};

		requestAnimationFrame(animateTongue);
	}

	// New structured logging methods
	logEvent(eventType, eventData) {
		// Add to current round events
		this.currentRound.events.push({
			type: eventType,
			...eventData,
			score: this.score,
		});

		// Also keep the old logging for backward compatibility
		this.logUserInput({
			time: Date.now(),
			action: eventType,
			...eventData,
		});
	}

	logRoundStart(conditionFile) {
		console.log(`Starting round: ${conditionFile}`);
		this.logEvent("roundStart", {
			conditionFile: conditionFile,
			time: Date.now(),
		});
	}

	logRoundEnd() {
		// Update round end time and score
		this.currentRound.endTime = parseFloat(Date.now());
		this.currentRound.score = this.score;

		// Add to rounds array
		this.gameLog.rounds.push({ ...this.currentRound });

		console.log(`Round ended: ${this.currentRound.conditionFile}`);
		this.logEvent("roundEnd", {
			conditionFile: this.currentRound.conditionFile,
			time: Date.now(),
		});
	}

	logUserInput(action) {
		this.userInputs.push({
			time: Date.now(),
			action: action,
			score: this.score,
		});
	}

	gameOver() {
		this.isGameOver = true;
		clearInterval(this.gameLoop);
		cancelAnimationFrame(this.animationFrame);
		this.finalScoreElement.textContent = this.score;
		this.gameOverElement.classList.remove("hidden");

		// Send game data to server
		this.saveGameData();
	}

	async saveGameData() {
		// Prepare the complete game log
		const gameData = {
			finalScore: this.score,
			duration: parseFloat(this.gameTimeDecimal.toFixed(2)),
			preGameSurvey: this.participantData,
			rounds: this.gameLog.rounds,
			postGameSurvey: this.postGameData,
		};

		try {
			const response = await fetch("https://pipe.jspsych.org/api/data/", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "*/*",
				},
				body: JSON.stringify({
					// From https://pipe.jspsych.org/admin/89ERoPlCPRcB
					experimentID: "89ERoPlCPRcB",
					filename: `frog_game_${Date.now()}.json`,
					data: JSON.stringify(gameData),
				}),
			});
			console.log("Game data saved:", response.ok);
			document.body.innerHTML = `<div style="text-align: center; padding: 20px;">Game data saved. Thank you for participating!</div>`;
		} catch (error) {
			console.error("Error saving game data:", error);
			alert("Error saving game data. Please email this file to jdeleeuw@vassar.edu");

			// Replace entire HTML with that alert
			document.body.innerHTML = `<div style="text-align: center; padding: 20px;">Error saving game data. Please email this file to jdeleeuw@vassar.edu</div>`;

			// Save game data to a file
			const blob = new Blob([JSON.stringify(gameData)], {
				type: "application/json",
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `data_frog_game${Date.now()}.json`;
			a.click();
			URL.revokeObjectURL(url);
		}
	}

	endRound() {
		// Log round end
		this.logRoundEnd();

		// Check if there's a next level
		this.conditionIndex++;
		if (this.conditionIndex < this.conditionOrders.length) {
			// If we just finished the practice trial, show the readiness survey
			if (this.isPracticeTrial) {
				this.isPracticeTrial = false;
				this.showReadinessSurvey();
			} else {
				// Load the next level
				// Remove queued ignore
				this.ignoreNextMove = false;
				this.loadLevel(this.conditionOrders[this.conditionIndex]);
			}
		} else {
			// Game completed
			console.log("Game completed!");
			this.gameCompleted();
		}
	}

	async showReadinessSurvey() {
		// Show readiness survey
		console.log("Showing readiness survey...");
		await this.survey.showReadinessSurvey();

		// Stop existing game loops
		clearInterval(this.gameLoop);
		cancelAnimationFrame(this.animationFrame);

		// Reset game state
		this.gameTimeDecimal = 0;
		this.timerElement.textContent = "0.0";
		// Start players in real game with score of 10k to avoid negative scores demotivating them
		this.score = 10000;
		this.scoreElement.textContent = "0";
		this.events = [];
		this.userInputs = [];
		this.activeBonus = null;

		// Remove any existing obstacles
		const obstacles = document.querySelectorAll(".obstacle");
		obstacles.forEach((obstacle) => obstacle.remove());

		// Reset level end time to ensure proper time offset for the next level
		this.levelEndTime = 0;

		// After the survey is completed, load the next level
		await this.loadLevel(this.conditionOrders[this.conditionIndex]);

		// Restart game loops
		this.startGameLoop();
		this.startAnimationLoop();
	}

	async gameCompleted() {
		// Stop game loops
		this.isGameOver = true;
		clearInterval(this.gameLoop);
		cancelAnimationFrame(this.animationFrame);

		// Show post-game survey
		console.log("Showing post-game survey...");
		const completeData = await this.survey.showPostGameSurvey({
			finalScore: this.score,
			totalTime: Date.now(),
			rounds: this.gameLog.rounds,
		});

		// Store post-game survey data
		this.postGameData = completeData.postGame;
		this.gameLog.postGameSurvey = this.postGameData;

		// Save complete data to server
		this.saveGameData();

		// Show experiment explanation alert
		alert(
			"Thank you for participating. This was an experiment on attention when control was lost. Specifically, we wanted to see how people's attention would change when they lost control in high vs. low stakes situations."
		);

		// 	TODO: Change to proper link
		window.location = "https://app.prolific.co/submissions/complete?cc=CFUDN4XZ";
	}

	showScorePopup(amount) {
		// Create score popup element
		const popup = document.createElement("div");
		popup.className = "score-popup";
		popup.textContent = amount > 0 ? `+${amount}` : amount;

		// Add class for positive/negative styling
		if (amount > 0) {
			popup.classList.add("positive");
		} else {
			popup.classList.add("negative");
		}

		// Position the popup next to the frog
		const playerRect = this.player.getBoundingClientRect();
		popup.style.left = `${playerRect.right + 10}px`;

		// Check for existing popups and stack vertically
		const existingPopups = document.querySelectorAll(".score-popup");
		if (existingPopups.length > 0) {
			// Position above the highest existing popup
			const highestPopup = Array.from(existingPopups).reduce((highest, current) => {
				const currentTop = parseFloat(current.style.top);
				const highestTop = parseFloat(highest.style.top);
				return currentTop < highestTop ? current : highest;
			});

			const highestTop = parseFloat(highestPopup.style.top);
			popup.style.top = `${highestTop - 30}px`; // 30px above the highest popup
		} else {
			// First popup, position at middle of player
			popup.style.top = `${playerRect.top + playerRect.height / 2}px`;
		}

		// Add to the document
		document.body.appendChild(popup);

		// Animate the popup
		popup.style.opacity = "1";
		popup.style.transform = "translateY(0)";

		// Remove after animation completes
		setTimeout(() => {
			popup.remove();
		}, 1000);
	}
}

// Start the game when the page loads
window.addEventListener("load", () => {
	// Check screen dimensions before starting the game
	const screenWidth = screen.innerWidth;
	const screenHeight = screen.innerHeight;

	// If screen is too small, show alert and don't start the game
	if (screenWidth < 1500 || screenHeight < 900) {
		alert(
			`Your screen resolution (${screenWidth}px × ${screenHeight}px) is too small to participate in this study. The minimum required resolution is 1500×900 pixels.`
		);
		// Create a message on the page instead of starting the game
		document.body.innerHTML = `
			<div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
				<h1>Screen Resolution Too Small</h1>
				<p>Your screen resolution (${screenWidth}px × ${screenHeight}px) is too small to participate in this study.</p>
				<p>The minimum required resolution is 1500×900 pixels.</p>

			</div>
		`;
		return;
	}

	// If screen is large enough, start the game
	new Game();
});
