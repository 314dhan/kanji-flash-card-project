document.addEventListener('DOMContentLoaded', () => {
    // Screens
    const startScreen = document.getElementById('start-screen');
    const gameContainer = document.getElementById('game-container');

    // Buttons
    const playBtn = document.getElementById('play-btn');
    const submitBtn = document.getElementById('submit-btn');
    const nextBtn = document.getElementById('next-btn');

    // Game Display Elements
    const scoreValueEl = document.querySelector('.score-value');
    const progressFillEl = document.querySelector('.progress-fill');
    const kanjiCharacterEl = document.querySelector('.kanji-character');
    const resultEl = document.getElementById('result');
    const answerInputEl = document.getElementById('answer-input');
    const quizLengthInput = document.getElementById('quiz-length-input');
    const hintDisplay = document.getElementById('hint-display');
    const hintIcon = document.getElementById('hint-icon');
    const hintText = document.getElementById('hint-text');

    // Start/End Screen Elements
    const startScreenTitle = startScreen.querySelector('.title');
    const startScreenSubtitle = startScreen.querySelector('.subtitle');

    // Game State
    let kanjiData = [];
    let currentKanji = null;
    let score = 0;
    let seenIndices = [];
    let quizLength = 10;

    // --- Data Loading ---
    fetch('assets/data/kanji-n4.json')
        .then(response => response.json())
        .then(data => {
            kanjiData = data;
            quizLengthInput.max = kanjiData.length;
            playBtn.disabled = false;
            playBtn.querySelector('span').textContent = 'Start Learning';
        })
        .catch(error => {
            console.error("Error fetching kanji data:", error);
            startScreenTitle.textContent = 'Error';
            startScreenSubtitle.textContent = 'Could not load Kanji data.';
        });

    // --- Game Flow Functions ---
    function startGame() {
        const desiredLength = parseInt(quizLengthInput.value, 10);
        if (!isNaN(desiredLength) && desiredLength > 0) {
            quizLength = desiredLength;
        }

        score = 0;
        seenIndices = [];
        scoreValueEl.textContent = score;
        document.getElementById('score-max').textContent = `/ ${quizLength}`;
        progressFillEl.style.width = '0%';

        startScreen.classList.remove('active');
        gameContainer.classList.add('active');

        displayNewKanji();
    }

    function displayNewKanji() {
        if (seenIndices.length >= quizLength || kanjiData.length === 0) {
            endGame();
            return;
        }

        // Update progress
        const progressPercent = (seenIndices.length / quizLength) * 100;
        progressFillEl.style.width = `${progressPercent}%`;

        // Reset result message and hint
        resultEl.classList.remove('show', 'correct', 'incorrect');
        if (hintIcon) {
            hintIcon.classList.add('active');
        }
        if (hintText) {
            hintText.classList.remove('active');
        }

        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * kanjiData.length);
        } while (seenIndices.includes(randomIndex));
        
        seenIndices.push(randomIndex);
        currentKanji = kanjiData[randomIndex];
        
        kanjiCharacterEl.textContent = currentKanji.kanji;
        kanjiCharacterEl.parentElement.style.animation = 'none';
        void kanjiCharacterEl.parentElement.offsetWidth;
        kanjiCharacterEl.parentElement.style.animation = 'flipIn 0.6s ease-out';

        answerInputEl.value = '';
        answerInputEl.disabled = false;
        submitBtn.disabled = false;
        nextBtn.disabled = true;
        answerInputEl.focus();
    }

    function checkAnswer() {
        const userAnswer = answerInputEl.value.trim().toLowerCase();
        if (!userAnswer || !currentKanji) return;

        const correctReadings = currentKanji.reading.split(',').map(r => r.trim().toLowerCase());
        const isCorrect = correctReadings.includes(userAnswer);

        resultEl.classList.add('show');
        if (isCorrect) {
            score++;
            scoreValueEl.textContent = score;
            resultEl.textContent = `Correct! Meaning: ${currentKanji.meaning}`;
            resultEl.classList.add('correct');
            new Audio('assets/sound/correct.mp3').play();
        } else {
            const feedback = `Reading: ${currentKanji.reading}, Meaning: ${currentKanji.meaning}`;
            resultEl.textContent = `Wrong! ${feedback}`;
            resultEl.classList.add('incorrect');
            new Audio('assets/sound/wrong.mp3').play();
        }
        
        answerInputEl.disabled = true;
        submitBtn.disabled = true;
        nextBtn.disabled = false;
    }

    function endGame() {
        const finalProgress = (seenIndices.length / quizLength) * 100;
        progressFillEl.style.width = `${finalProgress}%`;

        gameContainer.classList.remove('active');
        startScreen.classList.add('active');
        
        startScreenTitle.textContent = 'Quiz Complete!';
        startScreenSubtitle.textContent = `Your final score is ${score} out of ${quizLength}`;
        playBtn.querySelector('span').textContent = 'Play Again';
    }

    // --- Event Listeners for starting game and interactions ---
    playBtn.addEventListener('click', startGame);
    submitBtn.addEventListener('click', checkAnswer);
    nextBtn.addEventListener('click', displayNewKanji);
    if (hintDisplay) {
        hintDisplay.addEventListener('click', () => {
            if (currentKanji) {
                if (hintIcon.classList.contains('active')) {
                    hintIcon.classList.remove('active');
                    hintText.textContent = `Meaning: ${currentKanji.meaning}`;
                    hintText.classList.add('active');
                } else {
                    hintText.classList.remove('active');
                    hintIcon.classList.add('active');
                }
            }
        });
    }
    answerInputEl.addEventListener('keyup', (event) => {
        if (event.key === 'Enter' && !submitBtn.disabled) {
            checkAnswer();
        }
    });

    // --- Initial State ---
    playBtn.disabled = true;
    playBtn.querySelector('span').textContent = 'Loading...';
});