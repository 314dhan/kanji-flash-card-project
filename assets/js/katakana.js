document.addEventListener('DOMContentLoaded', () => {
    // Screens
    const startScreen = document.getElementById('start-screen');
    const gameContainer = document.getElementById('game-container');

    // Buttons
    const playBtn = document.getElementById('play-btn');
    const submitBtn = document.getElementById('submit-btn');
    const nextBtn = document.getElementById('next-btn');
    const restartBtn = document.getElementById('restart-btn');

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
    const countdownToggle = document.getElementById('countdown-toggle');
    const countdownSettings = document.getElementById('countdown-settings');
    const countdownMinutesInput = document.getElementById('countdown-minutes');
    const timerDisplay = document.getElementById('timer-display');
    const timerValueEl = document.getElementById('timer-value');
    const idDisplayEl = document.getElementById('id-display');
    const repetitionToggle = document.getElementById('repetition-toggle');
    
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
    let timerInterval = null;
    let timeLeft = 0;
    let isCountdownActive = false;
    let isRepetitionMode = false;
    let userProgress = {
        mastered: [],
        weak: [],
        lastStudy: null
    };

    // --- Progress Management ---
    function loadUserProgress() {
        const saved = localStorage.getItem('katakanaMasterProgress');
        if (saved) {
            userProgress = JSON.parse(saved);
        }
    }

    function saveUserProgress() {
        userProgress.lastStudy = new Date().toISOString();
        localStorage.setItem('katakanaMasterProgress', JSON.stringify(userProgress));
    }

    function updateProgress(isCorrect) {
        if (!currentKana) return;

        // Use prefixed index as ID for katakana
        const idx = kanaData.indexOf(currentKana);
        if (idx === -1) return;
        const id = `katakana-${idx}`;

        if (isCorrect) {
            if (!userProgress.mastered.includes(id)) {
                userProgress.mastered.push(id);
            }
            userProgress.weak = userProgress.weak.filter(weakId => weakId !== id);
        } else {
            if (!userProgress.weak.includes(id)) {
                userProgress.weak.push(id);
            }
        }
        saveUserProgress();
    }

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
            loadUserProgress();
        })
        .catch(error => {
            console.error("Error fetching katakana data:", error);
            startScreenTitle.textContent = 'Error';
            startScreenSubtitle.textContent = 'Could not load Katakana data.';
        });

    // --- Timer Management ---
    function startTimer(minutes) {
        clearInterval(timerInterval);
        timeLeft = minutes * 60;
        updateTimerDisplay();
        
        timerDisplay.style.display = 'flex';
        isCountdownActive = true;

        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();

            if (timeLeft <= 10) {
                timerDisplay.style.color = '#ff5252';
                timerDisplay.style.borderColor = 'rgba(255, 82, 82, 0.5)';
            }

            if (timeLeft <= 0) {
                stopTimer();
                endGame("Time's Up!");
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
        isCountdownActive = false;
        timerDisplay.style.display = 'none';
        timerDisplay.style.color = '#ffeb3b';
        timerDisplay.style.borderColor = 'rgba(255,235,59,0.3)';
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerValueEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // --- Game Flow Functions ---
    function startGame() {
        const learningMode = document.querySelector('input[name="learning-mode"]:checked').value;
        const desiredLength = parseInt(quizLengthInput.value, 10);
        
        if (learningMode === 'weak-first') {
            // Count weak points that belong to katakana
            const katakanaWeakPoints = userProgress.weak.filter(id => typeof id === 'string' && id.startsWith('katakana-'));
            quizLength = katakanaWeakPoints.length;
            
            if (quizLength === 0) {
                showToast("You have no weak points in Katakana yet! Try other modes first.", 'warning', 'No Weak Points Found');
                return;
            }
        } else if (learningMode === 'random-range') {
            const start = parseInt(startRangeInput.value, 10) || 1;
            const end = parseInt(endRangeInput.value, 10) || kanaData.length;
            quizLength = Math.abs(end - start) + 1;
        } else if (!isNaN(desiredLength) && desiredLength > 0) {
            quizLength = Math.min(desiredLength, kanaData.length);
        }

        score = 0;
        questionsAnswered = 0;
        scoreValueEl.textContent = score;
        document.getElementById('score-max').textContent = `/ ${quizLength}`;
        progressFillEl.style.width = '0%';

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
        } else if (learningMode === 'weak-first') {
            // Map "katakana-0" back to index 0
            availableIndices = userProgress.weak
                .filter(id => typeof id === 'string' && id.startsWith('katakana-'))
                .map(id => parseInt(id.replace('katakana-', ''), 10));
        }

        if (learningMode === 'random' || learningMode === 'random-range' || learningMode === 'weak-first') {
            // Shuffle available indices
            for (let i = availableIndices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
            }
        }

        // Trim the list to the desired quiz length
        quizIndices = availableIndices.slice(0, quizLength);
        
        // Re-adjust quizLength if there are fewer available items than requested
        quizLength = quizIndices.length;
        document.getElementById('score-max').textContent = `/ ${quizLength}`;

        startScreen.classList.remove('active');
        gameContainer.classList.add('active');

        // Start Countdown if enabled
        if (countdownToggle.checked) {
            const minutes = parseInt(countdownMinutesInput.value, 10) || 1;
            startTimer(minutes);
        } else {
            stopTimer();
        }

        isRepetitionMode = repetitionToggle.checked;
        if (isRepetitionMode) {
            const currentIndex = quizIndices[0];
            currentKana = kanaData[currentIndex];
        } else {
            currentKana = null;
        }
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

        if (isRepetitionMode && currentKana) {
            // Keep using the same kana
        } else {
            const currentIndex = quizIndices[questionsAnswered];
            currentKana = kanaData[currentIndex];
        }
        
        if (idDisplayEl && currentKana) {
            const idx = kanaData.indexOf(currentKana);
            idDisplayEl.textContent = `ID: ${idx + 1}`;
        }

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
        
        updateProgress(isCorrect);

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
        nextBtn.focus();
    }

    function endGame(message = 'Quiz Complete!') {
        stopTimer();
        const finalProgress = (questionsAnswered / quizLength) * 100;
        progressFillEl.style.width = `${finalProgress}%`;

        gameContainer.classList.remove('active');
        startScreen.classList.add('active');
        
        startScreenTitle.textContent = message;
        startScreenSubtitle.textContent = `Your final score is ${score} out of ${quizLength}`;
        playBtn.querySelector('span').textContent = 'Play Again';
    }

    function showToast(message, type = 'info', title = '') {
        // Create container if it doesn't exist
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
            <div class="toast-progress"></div>
        `;

        container.appendChild(toast);
        void toast.offsetWidth;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 500);
        }, 3000);
    }

    // --- Event Listeners ---
    playBtn.addEventListener('click', startGame);
    submitBtn.addEventListener('click', checkAnswer);
    nextBtn.addEventListener('click', displayNewKana);
    restartBtn.addEventListener('click', startGame);

    countdownToggle.addEventListener('change', () => {
        countdownSettings.style.display = countdownToggle.checked ? 'block' : 'none';
    });

    countdownMinutesInput.addEventListener('change', () => {
        let value = parseInt(countdownMinutesInput.value, 10);
        if (isNaN(value) || value < 1) {
            countdownMinutesInput.value = 1;
        } else if (value > 60) {
            countdownMinutesInput.value = 60;
        }
    });

    answerInputEl.addEventListener('keyup', (event) => {
        if (event.key === 'Enter' && !submitBtn.disabled) {
            checkAnswer();
        }
    });

    document.querySelectorAll('input[name="learning-mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const mode = e.target.value;
            rangeSelector.style.display = mode === 'random-range' ? 'block' : 'none';
            
            // Hide quiz length input for weak points and random-range mode
            const quizLengthContainer = document.querySelector('.quiz-length-container');
            if (quizLengthContainer) {
                quizLengthContainer.style.display = (mode === 'weak-first' || mode === 'random-range') ? 'none' : 'block';
            }
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