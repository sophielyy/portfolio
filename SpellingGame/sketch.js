let cnv; 
let video;
let handPose;
let hands = [];
let wordPools = [
  ['HAND', 'PLAY', 'BEAM', 'BEST', 'JUMP', 'CALM'], // 4-letter words
  ['OASIS', 'BRAVE', 'FLAME', 'CLOUD', 'SHIFT', 'DREAM'], // 5-letter words
  ['EXCUSE', 'PUZZLE', 'WISDOM', 'BRIGHT', 'JOYFUL', 'COMEDY'], // 6-letter words
  ['JACKPOT', 'AMAZING', 'DIGITAL', 'WHISPER', 'JOURNEY', 'FANTASY'], // 7-letter words
  ['FABULOUS', 'MOUNTAIN', 'SYMPHONY', 'LAUGHTER', 'SUNSHINE', 'DISCOVER'] // 8-letter words
];
let levels = []; // Will hold the selected words for each level
let currentLevel = 0;
let letters = levels[currentLevel];
let letterPositions = [];
let grabbedLetter = null;
let levelComplete = false;
let transitionAlpha = 0;
let transitioning = false;
let transitionStartTime = 0;
let fadeOut = false;
let showLevelComplete = false;
let levelCompleteTime = 0;
let levelCompleteSound;
let letterPickupSound;
let transitionColor = [199, 0, 57 ]; // Transition effect color
let currentShakingLetterIndex = 0; 
let hintStartTime = 0;
let hintActive = false;
let hintTimerStarted = false;
let shakeDuration = 3000; // Duration of shake in milliseconds
let shakeAmplitude = 2;  // Amplitude of shake (pixels)
let shakeStartTime = 0;
let nextLetterToShake = -1;
let gameState = 'landing'; // Add this global variable to track game state
let startButtonHover = false;
let levelStartTime = 0; // Track when the level started
let lastPressTime = 0; // For debouncing hint button
let clapSound;
let testingMode = false;


function preload() {
  handPose = ml5.handPose();
  levelCompleteSound = loadSound('level_complete.mp3');
  letterPickupSound = loadSound('letter_pickup.mp3');
  clapSound = loadSound('clap.mp3');
}

function setup() {
  cnv=createCanvas(windowHeight*4/3,windowHeight);
  let newCanvasX = (windowWidth-windowHeight*4/3)/2;
  let newCanvasY = (0);
  cnv.position(newCanvasX,newCanvasY)
  video = createCapture(VIDEO);
  video.size(windowHeight*4/3,windowHeight);
  video.hide();
  
  selectRandomWords(); // Add this line
  handPose.detectStart(video, gotHands);
  initializeLetterPositions();
  levelStartTime = millis(); // Initialize level start time
  
  if (testingMode) {
  gameState = 'end';
  }
}

function selectRandomWords() {
  levels = [];
  for (let i = 0; i < wordPools.length; i++) {
    let pool = wordPools[i];
    let randomIndex = Math.floor(random(pool.length));
    let selectedWord = pool[randomIndex];
    levels.push(selectedWord.split('')); // Split the word into array of letters
  }
  // Update the current level's letters
  letters = levels[currentLevel];
}

function initializeLetterPositions() {
  letterPositions = letters.map(() => ({
    x: random(50, width - 50), 
    y: random(50, height - 50),
    angle: random(-PI / 6, PI / 6) // Random rotation
  }));
  
  // Reset hint timer when positions are initialized
  hintStartTime = millis();
  levelStartTime = millis(); // Reset level start time
}

function gotHands(results) {
  hands = results;
  for (let i = 0; i < hands.length; i++) {
    for (let j = 0; j < hands[i].keypoints.length; j++) {
      let keypoint = hands[i].keypoints[j];
      keypoint.x = width - keypoint.x; // Mirror effect
    }
  }
}

function drawLandingPage() {
  // Background
  background(255); // White background
  
  // Title
  textFont('arbuckle-black');
  textAlign(CENTER, CENTER);
  
  // Game Title
  fill(237, 94, 1); // Orange color
  textSize(80);
  text("Spelling Game!", width / 2, height / 5);
  noStroke();
  
  // Instructions Section
  fill(0);
  textFont('fira-code');
  textSize(17);
  textAlign(LEFT, TOP);
  noStroke();
  
  let instructionsX = width/2 
  let instructionsY = height / 2 - 190;
  let instructionsWidth = width/1.7 ;  // Ensuring equal space on both sides
  
  textWrap(WORD);
  textLeading(22);
  
  
  // Detailed instructions
  let instructionsText = 
    "1. Use your thumb and index finger to pick up a letter.\n\n" +
    "2. Place the letters on the lines to create a word.\n\n" +
    "3. If the word is correct, the level is completed.\n\n" +
    "4. If you are stuck, the next letter that needs to be placed will shake.\n\n" +
    "5. After 10 seconds, a sound button will appear.\n\n";
  
  text(instructionsText, instructionsX, instructionsY + 40, instructionsWidth);

  // Start Button
  textAlign(CENTER, CENTER);
  
  // Hover effect for start button
  if (mouseX > width / 2 - 100 && mouseX < width / 2 + 100 &&
      mouseY > height * 7/9 - 25 && mouseY < height * 7/9 + 25) {
    fill(255, 82, 182); // Bright pink when hovering
    startButtonHover = true;
  } else {
    fill(237, 94, 1); // Orange
    startButtonHover = false;
  }
  
  // Draw start button
  rectMode(CENTER);
  rect(width / 2, height * 7/9, 250, 60, 20);
  
  // Start button text
  fill(255);
  textSize(25);
  text("Start", width / 2, height * 7/9);
  textFont('fira-code')
}

function mousePressed() {
  // Check if start button is clicked on landing page
  if (gameState === 'landing' && 
      mouseX > width/2 - 100 && mouseX < width/2 + 100 &&
      mouseY > height * 7/9 - 25 && mouseY < height * 7/9 + 25) {
    gameState = 'playing';
    selectRandomWords();
    letters = levels[currentLevel];
    initializeLetterPositions();
  }
  
  // Check if sound button is clicked during gameplay
  if (gameState === 'playing' && millis() - levelStartTime > 10000) {
    let hintButtonX = width - 85;
    let hintButtonY = 90;
    let hintButtonWidth = 140;
    let hintButtonHeight = 45;
    
    if (mouseX > hintButtonX - hintButtonWidth / 2 && mouseX < hintButtonX + hintButtonWidth / 2 &&
        mouseY > hintButtonY - hintButtonHeight / 2 && mouseY < hintButtonY + hintButtonHeight / 2) {
      // Only trigger if enough time has passed since last press
      if (millis() - lastPressTime > 1000) {
        showHint();
        lastPressTime = millis();
      }
    }
  }
  
  // Check if restart button is clicked at end screen
  if (gameState === 'end') {
    handleEndScreenMousePress();
  }
}

function draw() {
  if (gameState === 'landing') {
    drawLandingPage();
  } else if (gameState === 'playing') {
    // Existing game draw logic
    push();
    scale(-1, 1);
    image(video, -width, 0, width, height);
    pop();

    // Draw hand keypoints and detect grabbing
    for (let hand of hands) {
      if (hand.keypoints) {
        let thumb = hand.keypoints[4];
        let index = hand.keypoints[8];
        let d = dist(thumb.x, thumb.y, index.x, index.y);

        drawFlower(thumb.x, thumb.y, 1.5);
        drawFlower(index.x, index.y, 1.5);

        for (let i = 0; i < letters.length; i++) {
          let letterPos = letterPositions[i];
          let letterDist = dist(thumb.x, thumb.y, letterPos.x, letterPos.y);

          // Check if letter is being grabbed
          if (d < 50 && letterDist < 70) {
            // Play sound only when letter is first grabbed
            if (grabbedLetter === null) {
              letterPickupSound.play();
            }
            grabbedLetter = i;
          }
        }
        if (d > 70) {
          grabbedLetter = null;
        }
      }
    }

    // Move grabbed letter
    if (grabbedLetter !== null && hands.length > 0) {
      let thumb = hands[0].keypoints[4];
      let index = hands[0].keypoints[8];
      if (thumb && index) {
        let avgX = (thumb.x + index.x) / 2;
        let avgY = (thumb.y + index.y) / 2;
        letterPositions[grabbedLetter].x = avgX;
        letterPositions[grabbedLetter].y = avgY;
        letterPositions[grabbedLetter].angle = 0; // Reset rotation when grabbed
      }
    }

    // Draw letters with rotation and grab indication
    textFont('arbuckle-black');
    textSize(150);
    strokeWeight(5);
    textAlign(CENTER, CENTER);
    for (let i = 0; i < letters.length; i++) {
      let letterPos = letterPositions[i];

      push();
      translate(letterPos.x, letterPos.y);
      rotate(letterPos.angle); // Apply rotation

      // Change stroke color when grabbed
      if (i === grabbedLetter) {
        stroke(255, 238, 226); 
        strokeWeight(8);
        fill(237, 94, 1); 
      } else {
        fill(237, 94, 1);
      }

      text(letters[i], 0, 0);
      pop();
    }

    drawTargetLines();
    checkLevelComplete();

    // Display level number
    fill(255);
    textSize(40);
    strokeWeight(4);
    textAlign(RIGHT, TOP);
    text(`Level ${currentLevel + 1}`, width - 10, 10);

    // Only show SOUND button after 10 seconds
    if (millis() - levelStartTime > 10000) {
      let hintButtonX = width - 85;
      let hintButtonY = 90;
      let hintButtonWidth = 140;
      let hintButtonHeight = 45;

      // Draw the button with hover effect
      if (mouseX > hintButtonX - hintButtonWidth / 2 && mouseX < hintButtonX + hintButtonWidth / 2 &&
          mouseY > hintButtonY - hintButtonHeight / 2 && mouseY < hintButtonY + hintButtonHeight / 2) {
        fill(237, 94, 1); // Bright pink when hovering
        strokeWeight(2);
      } else {
        fill(255, 82, 182);
        strokeWeight(2);// Orange
      }
      
      rectMode(CENTER);
      rect(hintButtonX, hintButtonY, hintButtonWidth, hintButtonHeight, 10);

      // Button text
      fill(255);
      textFont('fira-code');
      textSize(24);
      strokeWeight(0);
      textAlign(CENTER, CENTER);
      text("Sound", hintButtonX, hintButtonY);
    }

    if (showLevelComplete) {
      fill(255, 82, 182);
      textSize(50);
      textFont('arbuckle-black');
      strokeWeight(5);
      textAlign(CENTER, CENTER);
      text("Level Complete!", width / 2, height / 2);

      if (millis() - levelCompleteTime > 2000 && !transitioning) {
        startTransition();
      }
    }

    // Handle transition effect
    if (transitioning) {
      drawTransition();
    }
  } else if (gameState === 'end') {
    drawEndScreen();
  }
}

function showHint() {
  // Always play the word when the hint button is pressed
  speakWord(letters.join(''));  // Join the letters of the current word and say them aloud
  
  // Set hint active state only if it's not already active
  if (!hintActive) {
    hintActive = true;
    hintStartTime = millis();
  }
}

function drawTargetLines() {
  stroke(0);
  strokeWeight(7);
  for (let i = 0; i < letters.length; i++) {
    let xPos = width / (letters.length + 1) * (i + 1);
    line(xPos - 50, height - 80, xPos + 50, height - 80);
  }
}

function checkLevelComplete() {
  // Create a copy of letters to track which letters have been used
  let usedLetters = new Array(letters.length).fill(false);
  let letterCounts = {};

  // First, count the occurrences of each letter
  letters.forEach(letter => {
    letterCounts[letter] = (letterCounts[letter] || 0) + 1;
  });

  // Check if all letters are placed correctly, allowing duplicates to be flexible
  let allCorrect = letters.every((expectedLetter, i) => {
    let targetX = width / (letters.length + 1) * (i + 1);
    
    // Find a letter that matches and hasn't been used yet
    for (let j = 0; j < letters.length; j++) {
      if (usedLetters[j]) continue; // Skip already used letters
      
      let letterPos = letterPositions[j];
      let placedCorrectly = 
        abs(letterPos.x - targetX) < 50 && 
        abs(letterPos.y - (height - 100)) < 100 &&
        letters[j] === expectedLetter;
      
      if (placedCorrectly) {
        usedLetters[j] = true;
        return true;
      }
    }
    
    return false;
  });

  // Hint and shaking logic remains the same as in the previous implementation
  if (!allCorrect && millis() - hintStartTime > 10000 && !hintActive) {
    hintActive = true;
    shakeStartTime = millis();
    
    // Find the first misplaced letter
    for (let i = 0; i < letters.length; i++) {
      let targetX = width / (letters.length + 1) * (i + 1);
      let letterPos = letterPositions[i];
      
      if (abs(letterPos.x - targetX) >= 50 || abs(letterPos.y - (height - 100)) >= 100) {
        nextLetterToShake = i;
        break;
      }
    }
  }

  // Shaking logic
  if (!allCorrect && millis() - hintStartTime > 10000) {
    if (nextLetterToShake !== -1) {
      shakeLetter(nextLetterToShake);
    }
  } else if (allCorrect && hintActive) {
    hintActive = false;
    nextLetterToShake = -1;
  }

  // Level complete logic
  if (allCorrect && !showLevelComplete) {
    showLevelComplete = true;
    levelCompleteTime = millis();
    levelCompleteSound.play();
  }
}

function shakeLetter(letterIndex) {
  let shakeTime = millis() - shakeStartTime;
  if (shakeTime < shakeDuration) {
    let shakeOffset = sin(shakeTime * TWO_PI / 200) * shakeAmplitude; // Shake effect using sine wave
    
    // Alternate shake direction for more dramatic effect
    let direction = (shakeTime % 400 < 200) ? 1 : -1;
    
    letterPositions[letterIndex].x += shakeOffset * direction;  // Apply shake to the letter's X position
  }
}

function startTransition() {
  if (!transitioning) {
    transitioning = true;
    transitionAlpha = 0;
    transitionStartTime = millis();
    fadeOut = false;
  }
}

function drawTransition() {
  let elapsed = millis() - transitionStartTime;
  if (!fadeOut) {
    transitionAlpha = map(elapsed, 0, 2500, 0, 255);
    if (elapsed > 2500) {
      // Only call nextLevel if not in final game completion state
      if (currentLevel < levels.length) {
        nextLevel();
      }
      fadeOut = true;
      transitionStartTime = millis();
    }
  } else {
    transitionAlpha = map(elapsed, 0, 2500, 255, 0);
    if (transitionAlpha <= 0) {
      transitioning = false;
    }
  }
  
  // Ensure the entire screen is filled with the transition color
  fill(transitionColor[0], transitionColor[1], transitionColor[2], transitionAlpha);
  rectMode(CORNER);
  rect(0, 0, width, height);
}

function nextLevel() {
  if (currentLevel < levels.length - 1) {
    currentLevel++;
    letters = levels[currentLevel];
    initializeLetterPositions();
    transitioning = false;
    transitionAlpha = 0;
    showLevelComplete = false;
    
    hintActive = false;
    nextLetterToShake = -1;
  } else {
    // Add this to handle game completion
    gameState = 'end';
  }
}

function drawFlower(x, y, scaleFactor = 1) {
  push();
  translate(x, y);
  scale(scaleFactor);
  fill(255, 201, 0);
  noStroke();
  for (let i = 0; i < 5; i++) {
    ellipse(10, 0, 15, 15);
    rotate(PI / 2.5);
  }
  fill(255, 201, 0);
  ellipse(0, 0, 20, 20);
  pop();
}

function speakWord(word) {
  // Cancel any ongoing speech if it's speaking
  if (speechSynthesis.speaking) {
    console.log("Canceling current speech...");
    speechSynthesis.cancel();
  }

  // Delay to ensure cancelation finishes before triggering speech again
  setTimeout(function() {
    // Create a new speech utterance
    let utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US'; // Set language to English
    
    // Event listener for when the speech finishes
    utterance.onend = function() {
      console.log("Speech has finished.");
    };

    // Start speaking the word
    console.log("Starting new speech...");
    speechSynthesis.speak(utterance);
  }, 0); // 200ms delay before retriggering speech
}


function restartGame() {
  currentLevel = 0;
  selectRandomWords(); // Add this line
  letters = levels[currentLevel];
  initializeLetterPositions();
  showLevelComplete = false;
  gameState = 'landing';
}

