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
    const kanaCharacterEl = document.querySelector('.kanji-character');
    const resultEl = document.getElementById('result');
    const answerInputEl = document.getElementById('answer-input');
    const quizLengthInput = document.getElementById('quiz-length-input');
    const rangeSelector = document.getElementById('range-selector');
    const startRangeInput = document.getElementById('start-range-input');
    const endRangeInput = document.getElementById('end-range-input');
    const maxKanaRangeEl = document.getElementById('max-kana-range');
    
    // Start/End Screen Elements
    const startScreenTitle = startScreen.querySelector('.title');
    const startScreenSubtitle = startScreen.querySelector('.subtitle');

    // Game State
    let kanaData = [];
    let currentKana = null;
    let score = 0;
    let questionsAnswered = 0;
    let quizIndices = [];
    let quizLength = 10;

    // --- Data Loading ---
    fetch('assets/data/katakana.json')
        .then(response => response.json())
        .then(data => {
            kanaData = data;
            quizLengthInput.max = kanaData.length;
            maxKanaRangeEl.textContent = kanaData.length;
            startRangeInput.max = kanaData.length;
            endRangeInput.max = kanaData.length;
            endRangeInput.value = Math.min(20, kanaData.length);
            playBtn.disabled = false;
            playBtn.querySelector('span').textContent = 'Start Learning';
        })
        .catch(error => {
            console.error("Error fetching katakana data:", error);
            startScreenTitle.textContent = 'Error';
            startScreenSubtitle.textContent = 'Could not load Katakana data.';
        });

    // --- Game Flow Functions ---
    function startGame() {
        const desiredLength = parseInt(quizLengthInput.value, 10);
        if (!isNaN(desiredLength) && desiredLength > 0) {
            quizLength = Math.min(desiredLength, kanaData.length); // Ensure quiz length doesn't exceed available data
        }

        score = 0;
        questionsAnswered = 0;
        scoreValueEl.textContent = score;
        document.getElementById('score-max').textContent = `/ ${quizLength}`;
        progressFillEl.style.width = '0%';

        const learningMode = document.querySelector('input[name="learning-mode"]:checked').value;
        let availableIndices = [...Array(kanaData.length).keys()];

        if (learningMode === 'random-range') {
            const start = parseInt(startRangeInput.value, 10) || 1;
            const end = parseInt(endRangeInput.value, 10) || kanaData.length;
            const minIdx = Math.max(0, Math.min(start, end) - 1);
            const maxIdx = Math.min(kanaData.length - 1, Math.max(start, end) - 1);
            
            availableIndices = [];
            for (let i = minIdx; i <= maxIdx; i++) {
                availableIndices.push(i);
            }
        }

        if (learningMode === 'random' || learningMode === 'random-range') {
            // Shuffle available indices
            for (let i = availableIndices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
            }
        } else if (learningMode === 'sequential') {
            // Already sequential from 0 to N-1
        }

        // Trim the list to the desired quiz length
        quizIndices = availableIndices.slice(0, quizLength);
        
        // Re-adjust quizLength if there are fewer available items than requested
        quizLength = quizIndices.length;
        document.getElementById('score-max').textContent = `/ ${quizLength}`;

        startScreen.classList.remove('active');
        gameContainer.classList.add('active');

        displayNewKana();
    }

    function displayNewKana() {
        if (questionsAnswered >= quizLength || kanaData.length === 0) {
            endGame();
            return;
        }

        // Update progress
        const progressPercent = (questionsAnswered / quizLength) * 100;
        progressFillEl.style.width = `${progressPercent}%`;

        // Reset result message
        resultEl.classList.remove('show', 'correct', 'incorrect');

        const currentIndex = quizIndices[questionsAnswered];
        currentKana = kanaData[currentIndex];
        
        kanaCharacterEl.textContent = currentKana.kana;
        kanaCharacterEl.parentElement.style.animation = 'none';
        void kanaCharacterEl.parentElement.offsetWidth; // Trigger reflow
        kanaCharacterEl.parentElement.style.animation = 'flipIn 0.6s ease-out';

        answerInputEl.value = '';
        answerInputEl.disabled = false;
        submitBtn.disabled = false;
        nextBtn.disabled = true;
        answerInputEl.focus();
    }

    function checkAnswer() {
        const userAnswer = answerInputEl.value.trim().toLowerCase();
        if (!userAnswer || !currentKana) return;

        const isCorrect = userAnswer === currentKana.romaji.toLowerCase();

        resultEl.classList.add('show');
        if (isCorrect) {
            score++;
            scoreValueEl.textContent = score;
            resultEl.textContent = 'Correct!';
            resultEl.classList.add('correct');
            new Audio('assets/sound/correct.mp3').play();
        } else {
            resultEl.textContent = `Wrong! The correct answer is ${currentKana.romaji}`;
            resultEl.classList.add('incorrect');
            new Audio('assets/sound/wrong.mp3').play();
        }
        
        questionsAnswered++; // Increment after answering
        answerInputEl.disabled = true;
        submitBtn.disabled = true;
        nextBtn.disabled = false;
    }

    function endGame() {
        const finalProgress = (questionsAnswered / quizLength) * 100;
        progressFillEl.style.width = `${finalProgress}%`;

        gameContainer.classList.remove('active');
        startScreen.classList.add('active');
        
        startScreenTitle.textContent = 'Quiz Complete!';
        startScreenSubtitle.textContent = `Your final score is ${score} out of ${quizLength}`;
        playBtn.querySelector('span').textContent = 'Play Again';
    }

    // --- Event Listeners ---
    playBtn.addEventListener('click', startGame);
    submitBtn.addEventListener('click', checkAnswer);
    nextBtn.addEventListener('click', displayNewKana);
    answerInputEl.addEventListener('keyup', (event) => {
        if (event.key === 'Enter' && !submitBtn.disabled) {
            checkAnswer();
        }
    });

    document.querySelectorAll('input[name="learning-mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const mode = e.target.value;
            rangeSelector.style.display = mode === 'random-range' ? 'block' : 'none';
        });
    });

    startRangeInput.addEventListener('change', () => {
        let value = parseInt(startRangeInput.value, 10);
        const max = parseInt(startRangeInput.max, 10);
        if (isNaN(value) || value < 1) {
            startRangeInput.value = 1;
        } else if (value > max) {
            startRangeInput.value = max;
        }
    });

    endRangeInput.addEventListener('change', () => {
        let value = parseInt(endRangeInput.value, 10);
        const max = parseInt(endRangeInput.max, 10);
        if (isNaN(value) || value < 1) {
            endRangeInput.value = 1;
        } else if (value > max) {
            endRangeInput.value = max;
        }
    });

    // --- Initial State ---
    playBtn.disabled = true;
    playBtn.querySelector('span').textContent = 'Loading...';
});