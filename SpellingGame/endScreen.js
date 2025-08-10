// endScreen.js

let flowerAngle = 0; // Rotation angle
let hasPlayedClap = false; // Prevent multiple plays


function drawEndScreen() {
  background(199, 0, 57); 
  
  if (!hasPlayedClap) {
    clapSound.play();
    hasPlayedClap = true;
  }
  
   let rotation = sin(frameCount * 0.1) * 0.2;
  
  drawRotatingFlower(width * 1/9, height * 2/9, rotation, 1.5);  // Top left
  drawRotatingFlower(width * 6/7, height * 2/7, -rotation, 1.5); // Top right
  drawRotatingFlower(width * 1/5, height * 3/4, rotation, 1.5);  // Bottom left
  drawRotatingFlower(width * 4/5, height * 4/5, -rotation, 1.5); // Bottom right
  drawRotatingFlower(width * 2/3, height * 7/8, rotation, 1.5);
  drawRotatingFlower(width / 3, height * 1/7, -rotation, 1.5);

  // "Congratulations" text
  fill(255); // White text
  textFont('arbuckle-black');
  textSize(80);
  textAlign(CENTER, CENTER);
  text("Congratulations!", width / 2, height *2/ 5);
  
  // Instructions Section
  fill(255);
  textFont('fira-code');
  textSize(20);
  textAlign(CENTER, TOP);
  noStroke();
  
  let messageX = width/2 
  let messageY = height / 2 - 47;
  let messageWidth = width/1.5 ;  // Ensuring equal space on both sides
  
  textWrap(WORD);
  textLeading(17);
  
  let messageText = 
    "You completed all 5 levels of the game!";
  
  text(messageText, messageX, messageY + 40, messageWidth);


  // Draw Restart button
  drawResetButton();
}

function drawResetButton() {
  let buttonX = width / 2;
  let buttonY = height * 3/5;
  let buttonWidth = 250;
  let buttonHeight = 60;

  // Button hover effect
  if (mouseX > buttonX - buttonWidth / 2 && mouseX < buttonX + buttonWidth / 2 &&
      mouseY > buttonY - buttonHeight / 2 && mouseY < buttonY + buttonHeight / 2) {
    fill(255, 82, 182); // Light pink when hovered
  } else {
    fill(237, 94, 1); // White by default
  }

  // Draw button
  rectMode(CENTER);
  rect(buttonX, buttonY, buttonWidth, buttonHeight, 10);

  // Button text
  fill(255); // Black text
  textFont('fira-code');
  textSize(23);
  textAlign(CENTER, CENTER);
  text("Restart Game", buttonX, buttonY);
}

function handleEndScreenMousePress() {
  let buttonX = width / 2;
  let buttonY = height * 3/5;
  let buttonWidth = 200;
  let buttonHeight = 50;
  
  if (mouseX > buttonX - buttonWidth / 2 && mouseX < buttonX + buttonWidth / 2 &&
      mouseY > buttonY - buttonHeight / 2 && mouseY < buttonY + buttonHeight / 2) {
    restartGame();
  }
}

function restartGame() {
  currentLevel = 0;
  selectRandomWords();
  letters = levels[currentLevel];
  initializeLetterPositions();
  showLevelComplete = false;
  gameState = 'landing';
  hasPlayedClap = false; // Reset for the next round
}

function drawRotatingFlower(x, y, angle, scaleFactor = 1) {
  push(); // Save current transformation state
  translate(x, y); // Move to flower position
  rotate(angle); // Apply rotation
  scale(scaleFactor);
  drawFlower(0, 0); // Draw flower at origin
  pop(); // Restore transformation state
}
