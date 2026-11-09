const gameScene = document.querySelector(".game-scene");
const gameCanvas = document.querySelector(".platformer-canvas");
const gameStatus = document.querySelector("#game-status");
const discoveryCards = [...document.querySelectorAll(".discovery-card")];

if (gameScene instanceof HTMLElement && gameCanvas instanceof HTMLCanvasElement) {
  const context = gameCanvas.getContext("2d");

  if (!context) {
    throw new Error("The browser could not start the platform game.");
  }

  const player = { x: 30, y: 0, width: 28, height: 38, velocityY: 0, direction: 1 };
  const controls = { left: false, right: false, jump: false };
  let jumpQueued = false;
  let jumpQueueExpiresAt = 0;
  const blockHeights = [63, 88, 59, 82];
  const blockPositions = [0.2, 0.4, 0.6, 0.8];
  const blockSize = 40;
  const gravity = 1450;
  const jumpStrength = 535;
  let sceneWidth = 0;
  let sceneHeight = 0;
  let discovered = 0;
  let lastFrame = 0;

  function resizeScene() {
    const bounds = gameScene.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;
    sceneWidth = bounds.width;
    sceneHeight = bounds.height;
    gameCanvas.width = Math.round(sceneWidth * pixelRatio);
    gameCanvas.height = Math.round(sceneHeight * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    player.x = Math.min(player.x, Math.max(0, sceneWidth - player.width));
  }

  function getBlocks() {
    return blockPositions.map((position, index) => ({
      x: sceneWidth * position - blockSize / 2,
      y: blockHeights[index],
      size: blockSize,
      index
    }));
  }

  function discoverBlock(index) {
    const card = discoveryCards[index];
    if (!card || card.classList.contains("is-visible")) return;

    card.classList.add("is-visible");
    card.setAttribute("aria-hidden", "false");
    discovered += 1;
    gameStatus.textContent = discovered === discoveryCards.length
      ? "All 4 story blocks discovered — nice work!"
      : `${discovered} of 4 blocks discovered`;
  }

  function drawScene(timestamp) {
    const delta = Math.min((timestamp - lastFrame) / 1000 || 0, 0.035);
    lastFrame = timestamp;

    const direction = Number(controls.right) - Number(controls.left);
    if (direction !== 0) {
      player.x += direction * 225 * delta;
      player.direction = direction;
    }
    player.x = Math.max(0, Math.min(sceneWidth - player.width, player.x));

    const floorY = sceneHeight - 31;
    const playerTopBeforeGravity = player.y;
    player.velocityY += gravity * delta;
    player.y += player.velocityY * delta;

    if ((controls.jump || jumpQueued) && player.y >= floorY - player.height - 1) {
      player.velocityY = -jumpStrength;
      player.y = floorY - player.height - 1;
      jumpQueued = false;
    } else if (performance.now() > jumpQueueExpiresAt) {
      jumpQueued = false;
    }

    if (player.y >= floorY - player.height) {
      player.y = floorY - player.height;
      player.velocityY = 0;
    } else if (player.velocityY < 0) {
      for (const block of getBlocks()) {
        if (
          !discoveryCards[block.index]?.classList.contains("is-visible")
          && playerTopBeforeGravity >= block.y + block.size
          && player.y <= block.y + block.size
          && player.x + player.width > block.x + 5
          && player.x < block.x + block.size - 5
        ) {
          player.y = block.y + block.size + 1;
          player.velocityY = 0;
          discoverBlock(block.index);
          break;
        }
      }
    }

    context.clearRect(0, 0, sceneWidth, sceneHeight);

    const sky = context.createLinearGradient(0, 0, 0, sceneHeight);
    sky.addColorStop(0, "#eaf1dd");
    sky.addColorStop(1, "#f7f8f2");
    context.fillStyle = sky;
    context.fillRect(0, 0, sceneWidth, sceneHeight);

    context.fillStyle = "#dce8ce";
    context.beginPath();
    context.ellipse(sceneWidth * 0.2, sceneHeight + 20, sceneWidth * 0.38, 76, 0, 0, Math.PI * 2);
    context.ellipse(sceneWidth * 0.77, sceneHeight + 27, sceneWidth * 0.42, 84, 0, 0, Math.PI * 2);
    context.fill();

    for (const block of getBlocks()) {
      const unlocked = discoveryCards[block.index]?.classList.contains("is-visible");
      context.fillStyle = unlocked ? "#a8be82" : "#f2cb76";
      context.strokeStyle = unlocked ? "#718c58" : "#bd9750";
      context.lineWidth = 2;
      context.beginPath();
      context.roundRect(block.x, block.y, block.size, block.size, 6);
      context.fill();
      context.stroke();
      context.fillStyle = unlocked ? "#fff" : "#684f29";
      context.font = "700 20px 'DM Sans', sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(unlocked ? "✓" : "?", block.x + block.size / 2, block.y + block.size / 2 + 1);
      context.font = "700 9px 'DM Sans', sans-serif";
      context.fillStyle = "#66745e";
      context.fillText(String(block.index + 1).padStart(2, "0"), block.x + block.size / 2, block.y - 9);
    }

    context.fillStyle = "#759565";
    context.fillRect(0, floorY, sceneWidth, sceneHeight - floorY);
    context.fillStyle = "#94ae78";
    context.fillRect(0, floorY, sceneWidth, 5);
    context.fillStyle = "#829c6a";
    for (let x = 10; x < sceneWidth; x += 32) {
      context.fillRect(x, floorY + 13, 14, 3);
    }

    const characterY = Math.round(player.y);
    const characterX = Math.round(player.x);
    context.save();
    if (player.direction < 0) {
      context.translate(characterX + player.width, 0);
      context.scale(-1, 1);
    } else {
      context.translate(characterX, 0);
    }
    context.fillStyle = "#b46143";
    context.fillRect(5, characterY, 20, 6);
    context.fillStyle = "#d88b64";
    context.fillRect(8, characterY + 6, 15, 11);
    context.fillStyle = "#26362e";
    context.fillRect(18, characterY + 9, 3, 3);
    context.fillStyle = "#507d5b";
    context.fillRect(5, characterY + 17, 21, 12);
    context.fillStyle = "#425f80";
    context.fillRect(7, characterY + 29, 18, 7);
    context.fillStyle = "#35443a";
    context.fillRect(4, characterY + 35, 10, 3);
    context.fillRect(21, characterY + 35, 10, 3);
    context.restore();

    window.requestAnimationFrame(drawScene);
  }

  function setControl(name, pressed) {
    if (name in controls) {
      controls[name] = pressed;
      if (name === "jump" && pressed) {
        jumpQueued = true;
        jumpQueueExpiresAt = performance.now() + 200;
      }
    }
  }

  gameScene.addEventListener("keydown", event => {
    const key = event.key.toLowerCase();
    const name = key === "a"
      ? "left"
      : key === "d"
        ? "right"
        : key === " "
          ? "jump"
          : null;

    if (name) {
      event.preventDefault();
      setControl(name, true);
    }
  });

  gameScene.addEventListener("keyup", event => {
    const key = event.key.toLowerCase();
    const name = key === "a"
      ? "left"
      : key === "d"
        ? "right"
        : key === " "
          ? "jump"
          : null;

    if (name) {
      event.preventDefault();
      setControl(name, false);
    }
  });

  gameScene.addEventListener("click", () => gameScene.focus());

  gameScene.addEventListener("focusout", () => {
    controls.left = false;
    controls.right = false;
    controls.jump = false;
    jumpQueued = false;
  });

  window.addEventListener("blur", () => {
    controls.left = false;
    controls.right = false;
    controls.jump = false;
    jumpQueued = false;
  });

  gameScene.parentElement.querySelector(".game-reset").addEventListener("click", () => {
    for (const card of discoveryCards) {
      card.classList.remove("is-visible");
      card.setAttribute("aria-hidden", "true");
    }
    discovered = 0;
    player.x = 30;
    player.y = sceneHeight - 31 - player.height;
    player.velocityY = 0;
    player.direction = 1;
    controls.left = false;
    controls.right = false;
    controls.jump = false;
    jumpQueued = false;
    gameStatus.textContent = "0 of 4 blocks discovered";
    gameScene.focus();
  });

  new ResizeObserver(resizeScene).observe(gameScene);
  resizeScene();
  window.requestAnimationFrame(drawScene);
}

const gateInputs = { a: false, b: false };
const gateButtons = [...document.querySelectorAll(".input-switch")];
const gateSvg = document.querySelector(".or-gate-svg");
const gateTruth = document.querySelector(".gate-truth");
const outputMessage = document.querySelector(".output-message");
const outputIndicator = outputMessage.querySelector(".output-indicator");

function updateGate() {
  const output = gateInputs.a || gateInputs.b;
  const stateA = Number(gateInputs.a);
  const stateB = Number(gateInputs.b);
  const stateOutput = Number(output);

  for (const button of gateButtons) {
    const input = button.dataset.input;
    const isOn = gateInputs[input];
    button.setAttribute("aria-pressed", String(isOn));
    button.querySelector(".switch-state").textContent = isOn ? "ON" : "OFF";
  }

  gateSvg.querySelector(".input-wire-a").classList.toggle("is-on", gateInputs.a);
  gateSvg.querySelector(".input-wire-b").classList.toggle("is-on", gateInputs.b);
  gateSvg.querySelector(".output-wire").classList.toggle("is-on", output);
  gateSvg.querySelector(".output-lamp").classList.toggle("is-on", output);
  gateTruth.textContent = `A: ${stateA}  |  B: ${stateB}  →  Output: ${stateOutput}`;
  outputMessage.classList.toggle("is-on", output);
  outputIndicator.nextSibling.textContent = ` Output is ${output ? "ON" : "OFF"}`;
}

for (const button of gateButtons) {
  button.addEventListener("click", () => {
    const input = button.dataset.input;
    gateInputs[input] = !gateInputs[input];
    updateGate();
  });
}
