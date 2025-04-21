// Add CSS for incorrect answers
const style = document.createElement("style");
style.textContent = `
    .incorrect-answer {
        background-color: #ffebee;
        border: 1px solid #ffcdd2;
        border-radius: 4px;
        padding: 10px;
        margin-bottom: 10px;
    }
    
    .incorrect-answer label {
        color: #d32f2f;
    }
    
    .incorrect-answer .radio-group {
        border-left: 3px solid #d32f2f;
        padding-left: 10px;
    }
`;
document.head.appendChild(style);

class Survey {
	constructor() {
		this.preGameData = {};
		this.postGameData = {};
		this.surveyContainer = document.createElement("div");
		this.surveyContainer.className = "survey-container";
		document.body.appendChild(this.surveyContainer);
	}

	showPreGameSurvey() {
		return new Promise((resolve) => {
			this.surveyContainer.innerHTML = `
                <div class="survey-content">
                    <h2>Pre-Game Survey</h2>
                    <p>Please answer the following questions before starting the game.</p>
                    
                    <div class="survey-question">
                        <label for="age">Age: <span class="required">*</span></label>
                        <input type="number" id="age" min="18" max="100" required>
                    </div>
                    
                    <div class="survey-question">
                        <label for="gender">Gender: <span class="required">*</span></label>
                        <select id="gender" required>
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="non-binary">Non-binary</option>
                            <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                    </div>
                    
                    <div class="survey-question">
                        <label for="gaming-experience">Video Game Experience (hours per week): <span class="required">*</span></label>
                        <select id="gaming-experience" required>
                            <option value="">Select experience level</option>
                            <option value="0">0 hours per week</option>
                            <option value="1-2">1-2 hours per week</option>
                            <option value="2-10">2-10 hours per week</option>
                            <option value="10-20">10-20 hours per week</option>
                            <option value=">20">More than 20 hours per week</option>
                        </select>
                    </div>
                    
                    <div class="survey-question">
                        <label for="handedness">Handedness: <span class="required">*</span></label>
                        <select id="handedness" required>
                            <option value="">Select handedness</option>
                            <option value="right">Right-handed</option>
                            <option value="left">Left-handed</option>
                            <option value="ambidextrous">Ambidextrous</option>
                        </select>
                    </div>
                    
                    <div class="survey-question">
                        <label for="device">Device Type: <span class="required">*</span></label>
                        <select id="device" required>
                            <option value="">Select device</option>
                            <option value="laptop">Laptop</option>
                            <option value="desktop">Desktop</option>
                        </select>
                    </div>
                    
                    <button id="start-game-btn" class="survey-button">Start Game</button>
                </div>
            `;

			document.getElementById("start-game-btn").addEventListener("click", () => {
				// Validate all required fields
				const age = document.getElementById("age").value;
				const gender = document.getElementById("gender").value;
				const gamingExperience = document.getElementById("gaming-experience").value;
				const handedness = document.getElementById("handedness").value;
				const device = document.getElementById("device").value;

				// Check if any field is empty
				if (!age || !gender || !gamingExperience || !handedness || !device) {
					alert("Please fill in all required fields before starting the game.");
					return;
				}

				this.preGameData = {
					age: age,
					gender: gender,
					gamingExperience: gamingExperience,
					handedness: handedness,
					device: device,
					timestamp: new Date().toISOString(),
					// Add window dimensions to the pre-game survey data
					windowWidth: screen.availWidth,
					windowHeight: screen.availHeight,
				};

				this.surveyContainer.classList.add("hidden");
				resolve(this.preGameData);
			});
		});
	}

	showPostGameSurvey(gameData) {
		return new Promise((resolve) => {
			this.surveyContainer.classList.remove("hidden");
			this.surveyContainer.innerHTML = `
                <div class="survey-content">
                    <h2>Post-Game Survey</h2>
                    <p>Thank you for playing! Please answer the following questions about your experience.</p>
                    
                    <div class="survey-question">
                        <label for="experience">How would you rate your overall experience with the game? <span class="required">*</span></label>
                        <select id="experience" required>
                            <option value="">Select rating</option>
                            <option value="very-poor">Very Poor</option>
                            <option value="poor">Poor</option>
                            <option value="neutral">Neutral</option>
                            <option value="good">Good</option>
                            <option value="very-good">Very Good</option>
                            <option value="excellent">Excellent</option>
                        </select>
                    </div>
                    
                    <div class="survey-question">
                        <label for="technical-issues">Did you experience any technical difficulties? <span class="required">*</span></label>
                        <select id="technical-issues" required>
                            <option value="">Select option</option>
                            <option value="no">No</option>
                            <option value="yes">Yes</option>
                        </select>
                    </div>
                    
                    <div class="survey-question" id="technical-details-container" style="display: none;">
                        <label for="technical-details">Please describe the technical difficulties: <span class="required">*</span></label>
                        <textarea id="technical-details" rows="3" required></textarea>
                    </div>
                    
                    <div class="survey-question">
                        <label for="other-notes">Any other notes or feedback (optional):</label>
                        <textarea id="other-notes" rows="3"></textarea>
                    </div>
                    
                    <button id="submit-survey-btn" class="survey-button">Submit Survey</button>
                </div>
            `;

			// Show/hide technical details textarea based on selection
			document.getElementById("technical-issues").addEventListener("change", (e) => {
				const detailsContainer = document.getElementById("technical-details-container");
				const technicalDetails = document.getElementById("technical-details");

				if (e.target.value === "yes") {
					detailsContainer.style.display = "block";
					technicalDetails.required = true;
				} else {
					detailsContainer.style.display = "none";
					technicalDetails.required = false;
				}
			});

			document.getElementById("submit-survey-btn").addEventListener("click", () => {
				// Validate all required fields
				const experience = document.getElementById("experience").value;
				const technicalIssues = document.getElementById("technical-issues").value;
				const technicalDetails = document.getElementById("technical-details").value;

				// Check if any required field is empty
				if (!experience || !technicalIssues) {
					alert("Please fill in all required fields before submitting the survey.");
					return;
				}

				// If technical issues is yes, make sure details are provided
				if (technicalIssues === "yes" && !technicalDetails) {
					alert("Please describe the technical difficulties you experienced.");
					return;
				}

				this.postGameData = {
					experience: experience,
					technicalIssues: technicalIssues,
					technicalDetails: technicalDetails,
					otherNotes: document.getElementById("other-notes").value,
					timestamp: new Date().toISOString(),
				};

				// Combine all data
				const completeData = {
					preGame: this.preGameData,
					gameData: gameData,
					postGame: this.postGameData,
				};

				this.surveyContainer.classList.add("hidden");
				resolve(completeData);
			});
		});
	}

	showReadinessSurvey() {
		return new Promise((resolve) => {
			this.surveyContainer.classList.remove("hidden");
			this.surveyContainer.innerHTML = `
                <div class="survey-content">
                    <h2>Practice Complete</h2>
                    <p>You have completed the practice trial. Please take a moment to review your experience.</p>
                    <p>When you are ready to continue to the main trials, click the button below.</p>
                    
                    <button id="ready-button" class="survey-button">I'm Ready to Continue</button>
                </div>
            `;

			document.getElementById("ready-button").addEventListener("click", () => {
				this.surveyContainer.classList.add("hidden");
				resolve();
			});
		});
	}

	showGameRulesSurvey() {
		return new Promise((resolve) => {
			this.surveyContainer.classList.remove("hidden");
			this.surveyContainer.innerHTML = `
                <div class="survey-content">
                    <h2>Game Rules</h2>
                    <p>In this game you will navigate between three lanes of logs as Mr. Frog, who hopes to make it to the frog gala in his fancy suit and hat. Your goal is to collect as many bugs as you can without falling in the water, or else Mr. Frog's suit and hat will get too wet. Use the right and left arrow keys to stay on the logs as they float downstream. The arrow keys will move your frog between the logs, either left or right. To collect bugs, you must let them fly into your mouth by putting yourself in the same lane as them. Each bug is worth (10) points, and falling into the water will make you lose you (100) points. 
                    <br/>
                    Occasionally, a purple bonus bug will appear in either the middle or the left of the screen. They can be hard to spot. Bonus bugs are worth (50) points and can be collected by pressing the spacebar, but you will lose (50) points if you press the spacebar when there isn't a bonus bug present. Grab them before they disappear! 
                    <br/>
                    Be careful - The logs are wet and you will sometimes slip at random. When you slip, your arrow keys won't work for a short period, but <strong>you can still collect bonus bugs with the space bar</strong>. While you cannot prevent slipping, try your best to avoid getting Mr. Frog wet!
                    </p>
                    
                    <div class="survey-question" id="q1-container">
                        <label>How do you catch regular bugs?</label>
                        <div class="radio-group">
                            <label><input type="radio" name="q1" value="a"> Press "Q" key</label>
                            <label><input type="radio" name="q1" value="b"> Stand in the path of the bugs as they move closer</label>
                            <label><input type="radio" name="q1" value="c"> Click the mouse</label>
                        </div>
                    </div>
                    
                    <div class="survey-question" id="q2-container">
                        <label>How do you catch bonus bugs?</label>
                        <div class="radio-group">
                            <label><input type="radio" name="q2" value="a"> Move your frog to catch them</label>
                            <label><input type="radio" name="q2" value="b"> Press the "C" key</label>
                            <label><input type="radio" name="q2" value="c"> Press the spacebar</label>
                        </div>
                    </div>
                    
                    <div class="survey-question" id="q3-container">
                        <label>How do you move the frog?</label>
                        <div class="radio-group">
                            <label><input type="radio" name="q3" value="a"> The arrow keys</label>
                            <label><input type="radio" name="q3" value="b"> The mouse</label>
                            <label><input type="radio" name="q3" value="c"> The "W, A, S, D" keys</label>
                        </div>
                    </div>
                    
                    <div class="survey-question" id="q4-container">
                        <label>How many points do you lose for falling into the water?</label>
                        <div class="radio-group">
                            <label><input type="radio" name="q4" value="a"> 100 points</label>
                            <label><input type="radio" name="q4" value="b"> 50 points</label>
                            <label><input type="radio" name="q4" value="c"> 10 points</label>
                        </div>
                    </div>
                    
                    <div class="survey-question" id="q5-container">
                        <label>How many points are regular bugs worth?</label>
                        <div class="radio-group">
                            <label><input type="radio" name="q5" value="a"> 100 points</label>
                            <label><input type="radio" name="q5" value="b"> 10 points</label>
                            <label><input type="radio" name="q5" value="c"> 50 points</label>
                        </div>
                    </div>
                    
                    <div class="survey-question" id="q6-container">
                        <label>How many points are bonus bugs worth?</label>
                        <div class="radio-group">
                            <label><input type="radio" name="q6" value="a"> 50 points</label>
                            <label><input type="radio" name="q6" value="b"> 100 points</label>
                            <label><input type="radio" name="q6" value="c"> 10 points</label>
                        </div>
                    </div>
                    
                    <div class="survey-question" id="q7-container">
                        <label>What can you still do while recovering from slipping?</label>
                        <div class="radio-group">
                            <label><input type="radio" name="q7" value="a"> Move between lanes</label>
                            <label><input type="radio" name="q7" value="b"> Jump</label>
                            <label><input type="radio" name="q7" value="c"> Catch a bonus bug</label>
                        </div>
                    </div>
                    
                    <div id="rules-error" style="color: red; display: none; margin-bottom: 15px;">
                        Please answer all questions correctly to continue.
                    </div>
                    
                    <button id="submit-rules-btn" class="survey-button">Submit Answers</button>
                </div>
            `;

			document.getElementById("submit-rules-btn").addEventListener("click", () => {
				// Get all answers
				const q1 = document.querySelector('input[name="q1"]:checked')?.value;
				const q2 = document.querySelector('input[name="q2"]:checked')?.value;
				const q3 = document.querySelector('input[name="q3"]:checked')?.value;
				const q4 = document.querySelector('input[name="q4"]:checked')?.value;
				const q5 = document.querySelector('input[name="q5"]:checked')?.value;
				const q6 = document.querySelector('input[name="q6"]:checked')?.value;
				const q7 = document.querySelector('input[name="q7"]:checked')?.value;

				// Check if all questions are answered
				if (!q1 || !q2 || !q3 || !q4 || !q5 || !q6 || !q7) {
					document.getElementById("rules-error").textContent = "Please answer all questions.";
					document.getElementById("rules-error").style.display = "block";
					return;
				}

				// Check if all answers are correct
				const correctAnswers = {
					q1: "b", // Stand in the path of the bugs
					q2: "c", // Press the spacebar
					q3: "a", // The arrow keys
					q4: "a", // 100 points
					q5: "b", // 10 points
					q6: "a", // 50 points
					q7: "c", // Catch a bonus bug
				};

				// Reset any previous error styling
				for (let i = 1; i <= 7; i++) {
					const container = document.getElementById(`q${i}-container`);
					container.classList.remove("incorrect-answer");

					// Remove any previous correct/incorrect indicators
					const indicators = container.querySelectorAll(".answer-indicator");
					indicators.forEach((indicator) => indicator.remove());
				}

				// Check each answer individually and mark incorrect ones
				let incorrectCount = 0;
				const incorrectQuestions = [];

				if (q1 !== correctAnswers.q1) {
					document.getElementById("q1-container").classList.add("incorrect-answer");
					incorrectCount++;
					incorrectQuestions.push("How to catch regular bugs");
				}

				if (q2 !== correctAnswers.q2) {
					document.getElementById("q2-container").classList.add("incorrect-answer");
					incorrectCount++;
					incorrectQuestions.push("How to catch bonus bugs");
				}

				if (q3 !== correctAnswers.q3) {
					document.getElementById("q3-container").classList.add("incorrect-answer");
					incorrectCount++;
					incorrectQuestions.push("How to move the frog");
				}

				if (q4 !== correctAnswers.q4) {
					document.getElementById("q4-container").classList.add("incorrect-answer");
					incorrectCount++;
					incorrectQuestions.push("Points lost for falling in water");
				}

				if (q5 !== correctAnswers.q5) {
					document.getElementById("q5-container").classList.add("incorrect-answer");
					incorrectCount++;
					incorrectQuestions.push("Points for regular bugs");
				}

				if (q6 !== correctAnswers.q6) {
					document.getElementById("q6-container").classList.add("incorrect-answer");
					incorrectCount++;
					incorrectQuestions.push("Points for bonus bugs");
				}

				if (q7 !== correctAnswers.q7) {
					document.getElementById("q7-container").classList.add("incorrect-answer");
					incorrectCount++;
					incorrectQuestions.push("What you can do while slipping");
				}

				if (incorrectCount > 0) {
					// Show specific error message with incorrect questions
					let errorMessage = `You have ${incorrectCount} incorrect answer${
						incorrectCount > 1 ? "s" : ""
					}. Please correct: `;
					errorMessage += incorrectQuestions.join(", ");

					document.getElementById("rules-error").textContent = errorMessage;
					document.getElementById("rules-error").style.display = "block";
					return;
				}

				// All answers are correct, proceed
				this.surveyContainer.classList.add("hidden");
				resolve();
			});
		});
	}

	showPracticeReadinessSurvey() {
		return new Promise((resolve) => {
			this.surveyContainer.classList.remove("hidden");
			this.surveyContainer.innerHTML = `
                <div class="survey-content">
                    <h2>Ready to Practice?</h2>
                    <p>You will now begin the practice trial. This is your chance to get familiar with the game mechanics before the main trials.</p>
                    <p>When you are ready to start practicing, click the button below.</p>
                    
                    <button id="practice-ready-button" class="survey-button">I'm Ready to Practice</button>
                </div>
            `;

			document.getElementById("practice-ready-button").addEventListener("click", () => {
				this.surveyContainer.classList.add("hidden");
				resolve();
			});
		});
	}

	hide() {
		this.surveyContainer.classList.add("hidden");
	}
}
