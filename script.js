const symbols = ["🍎", "🌼", "🐳", "🦊", "🍄", "🌙", "🐸", "🍋"];

const board = document.querySelector("#gameBoard");
const movesDisplay = document.querySelector("#moves");
const matchesDisplay = document.querySelector("#matches");
const timerDisplay = document.querySelector("#timer");
const restartButton = document.querySelector("#restartButton");
const soundButton = document.querySelector("#soundButton");
const soundIcon = document.querySelector("#soundIcon");
const winModal = document.querySelector("#winModal");
const playAgainButton = document.querySelector("#playAgainButton");

let firstCard = null;
let secondCard = null;
let locked = false;
let moves = 0;
let matches = 0;
let seconds = 0;
let timerId = null;
let soundEnabled = true;

function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const remainingSeconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

function startTimer() {
  if (timerId) return;

  timerId = window.setInterval(() => {
    seconds += 1;
    timerDisplay.textContent = formatTime(seconds);
  }, 1000);
}

function playTone(frequency, duration = 0.08) {
  if (!soundEnabled) return;

  const AudioContext = window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) return;

  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;

  gain.gain.setValueAtTime(0.08, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    context.currentTime + duration
  );

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start();
  oscillator.stop(context.currentTime + duration);

  oscillator.addEventListener("ended", () => {
    context.close();
  });
}

function createCard(symbol, index) {
  const card = document.createElement("button");

  card.className = "card";
  card.type = "button";
  card.dataset.symbol = symbol;
  card.setAttribute("aria-label", `${index + 1}번째 카드, 뒤집기`);

  card.innerHTML = `
    <span class="card-inner">
      <span class="card-face card-back" aria-hidden="true"></span>
      <span class="card-face card-front" aria-hidden="true">${symbol}</span>
    </span>
  `;

  card.addEventListener("click", () => {
    flipCard(card);
  });

  return card;
}

function flipCard(card) {
  if (
    locked ||
    card === firstCard ||
    card.classList.contains("is-matched")
  ) {
    return;
  }

  startTimer();

  card.classList.add("is-flipped");
  card.setAttribute(
    "aria-label",
    `뒤집힌 카드, ${card.dataset.symbol}`
  );

  playTone(440);

  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;

  moves += 1;
  movesDisplay.textContent = moves;

  checkPair();
}

function checkPair() {
  if (firstCard.dataset.symbol === secondCard.dataset.symbol) {
    firstCard.classList.add("is-matched");
    secondCard.classList.add("is-matched");

    firstCard.disabled = true;
    secondCard.disabled = true;

    matches += 1;
    matchesDisplay.textContent = matches;

    playTone(660, 0.16);

    resetTurn();

    if (matches === symbols.length) {
      window.setTimeout(showWin, 650);
    }

    return;
  }

  locked = true;

  window.setTimeout(() => {
    [firstCard, secondCard].forEach((card) => {
      card.classList.remove("is-flipped");
      card.setAttribute("aria-label", "카드 뒤집기");
    });

    playTone(260, 0.12);

    resetTurn();
  }, 850);
}

function resetTurn() {
  firstCard = null;
  secondCard = null;
  locked = false;
}

function showWin() {
  window.clearInterval(timerId);
  timerId = null;

  document.querySelector("#finalMoves").textContent = `${moves}회`;
  document.querySelector("#finalTime").textContent =
    formatTime(seconds);

  winModal.hidden = false;
  playAgainButton.focus();
}

function newGame() {
  window.clearInterval(timerId);

  timerId = null;
  firstCard = null;
  secondCard = null;
  locked = false;

  moves = 0;
  matches = 0;
  seconds = 0;

  movesDisplay.textContent = "0";
  matchesDisplay.textContent = "0";
  timerDisplay.textContent = "00:00";

  winModal.hidden = true;

  const shuffledCards = shuffle([
    ...symbols,
    ...symbols
  ]).map(createCard);

  board.replaceChildren(...shuffledCards);
}

restartButton.addEventListener("click", newGame);

playAgainButton.addEventListener("click", newGame);

soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;

  soundButton.setAttribute(
    "aria-pressed",
    String(soundEnabled)
  );

  soundButton.setAttribute(
    "aria-label",
    soundEnabled ? "효과음 끄기" : "효과음 켜기"
  );

  soundIcon.textContent = soundEnabled ? "♪" : "×";

  if (soundEnabled) {
    playTone(520);
  }
});

newGame();