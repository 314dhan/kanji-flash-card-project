document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selection ---
    const startScreen = document.getElementById('start-screen');
    const gameContainer = document.getElementById('game-container');
    const playBtn = document.getElementById('play-btn');
    const submitBtn = document.getElementById('submit-btn');
    const nextBtn = document.getElementById('next-btn');
    const restartBtn = document.getElementById('restart-btn');
    const scoreValueEl = document.querySelector('.score-value');
    const scoreMaxEl = document.getElementById('score-max');
    const progressFillEl = document.querySelector('.progress-fill');
    const kanjiCharacterEl = document.querySelector('.kanji-character');
    const resultEl = document.getElementById('result');
    const answerInputEl = document.getElementById('answer-input');
    const quizLengthInput = document.getElementById('quiz-length-input');
    const hintDisplay = document.getElementById('hint-display');
    const hintIcon = document.getElementById('hint-icon');
    const hintText = document.getElementById('hint-text');
    const categorySelector = document.getElementById('category-selector');
    const categorySelect = document.getElementById('category-select');
    const countdownToggle = document.getElementById('countdown-toggle');
    const countdownSettings = document.getElementById('countdown-settings');
    const countdownMinutesInput = document.getElementById('countdown-minutes');
    const noHintsToggle = document.getElementById('no-hints-toggle');
    const timerDisplay = document.getElementById('timer-display');
    const timerValueEl = document.getElementById('timer-value');
    const idDisplayEl = document.getElementById('id-display');
    const muteBtn = document.getElementById('mute-btn');

    // --- Game State ---
    let similarGroups = [];
    let flattenedKanji = [];
    let currentKanji = null;
    let score = 0;
    let seenKanjiIds = [];
    let quizLength = 10;
    let timerInterval = null;
    let timeLeft = 0;
    let isCountdownActive = false;
    let isMuted = localStorage.getItem('isMuted') === 'true';

    // --- Audio Management ---
    function updateMuteUI() {
        if (muteBtn) {
            muteBtn.textContent = isMuted ? '🔇' : '🔊';
            muteBtn.classList.toggle('muted', isMuted);
        }
    }

    function toggleMute() {
        isMuted = !isMuted;
        localStorage.setItem('isMuted', isMuted);
        updateMuteUI();
    }

    function playSound(src) {
        if (!isMuted) {
            new Audio(src).play().catch(e => console.error("Audio play failed:", e));
        }
    }

    // --- Data Loading ---
    async function loadData() {
        try {
            const response = await fetch('assets/data/similar-kanji.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            similarGroups = await response.json();
            
            // Populate category selector
            similarGroups.forEach(group => {
                const option = document.createElement('option');
                option.value = group.id;
                option.textContent = group.category;
                categorySelect.appendChild(option);
            });

            // Flatten kanji for random/sequential modes
            // Add group info to each kanji
            similarGroups.forEach(group => {
                group.kanjiList.forEach(kanji => {
                    const uniqueId = `${group.id}-${kanji.kanji}`;
                    if (!flattenedKanji.find(k => k.uniqueId === uniqueId)) {
                        flattenedKanji.push({
                            ...kanji,
                            uniqueId: uniqueId,
                            groupId: group.id
                        });
                    }
                });
            });

            quizLengthInput.max = flattenedKanji.length;
            playBtn.disabled = false;
            playBtn.querySelector('span').textContent = 'Start Learning';
            updateMuteUI();
        } catch (error) {
            console.error("Error fetching similar kanji data:", error);
            playBtn.disabled = true;
        }
    }

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
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerValueEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // --- Game Flow ---
    function startGame() {
        const learningMode = document.querySelector('input[name="learning-mode"]:checked').value;
        const desiredLength = parseInt(quizLengthInput.value, 10);
        
        let pool = [];
        if (learningMode === 'by-category') {
            const groupId = parseInt(categorySelect.value, 10);
            const group = similarGroups.find(g => g.id === groupId);
            pool = group ? group.kanjiList.map(k => ({...k, uniqueId: `${groupId}-${k.kanji}`})) : [];
            quizLength = pool.length;
        } else {
            pool = [...flattenedKanji];
            quizLength = Math.min(desiredLength, pool.length);
        }

        if (learningMode === 'random') {
            pool.sort(() => Math.random() - 0.5);
        }

        score = 0;
        seenKanjiIds = [];
        currentPool = pool;
        updateScoreDisplay();
        scoreMaxEl.textContent = `/ ${quizLength}`;
        
        startScreen.classList.remove('active');
        gameContainer.classList.add('active');
        window.scrollTo(0, 0); // Ensure game starts at top

        if (countdownToggle.checked) {
            startTimer(parseInt(countdownMinutesInput.value, 10) || 1);
        }

        if (noHintsToggle.checked) {
            hintDisplay.style.display = 'none';
        } else {
            hintDisplay.style.display = 'flex';
        }

        displayNewKanji();
    }

    let currentPool = [];

    function displayNewKanji() {
        if (seenKanjiIds.length >= quizLength) {
            endGame();
            return;
        }

        resetUIForNewCard();
        
        currentKanji = currentPool[seenKanjiIds.length];
        seenKanjiIds.push(currentKanji.uniqueId || currentKanji.kanji);

        if (idDisplayEl) idDisplayEl.textContent = `Group: ${currentKanji.groupId || 'Mixed'}`;
        kanjiCharacterEl.textContent = currentKanji.kanji;
        
        const progressPercent = (seenKanjiIds.length / quizLength) * 100;
        progressFillEl.style.width = `${progressPercent}%`;
    }

    function checkAnswer() {
        const userAnswer = answerInputEl.value.trim().toLowerCase();
        if (!userAnswer || !currentKanji) return;

        const correctReadings = currentKanji.reading.split(/[,;]/).map(r => r.trim().toLowerCase());
        const isCorrect = correctReadings.includes(userAnswer);

        showResult(isCorrect);

        if (isCorrect) {
            score++;
            updateScoreDisplay();
        }

        answerInputEl.disabled = true;
        submitBtn.disabled = true;
        nextBtn.disabled = false;
        nextBtn.focus();
    }

    function showResult(isCorrect) {
        resultEl.classList.add('show');
        if (isCorrect) {
            resultEl.textContent = `Correct! Meaning: ${currentKanji.meaning}`;
            resultEl.classList.add('correct');
            playSound('assets/sound/correct.mp3');
        } else {
            resultEl.textContent = `Wrong! Reading: ${currentKanji.reading}, Meaning: ${currentKanji.meaning}`;
            resultEl.classList.add('incorrect');
            playSound('assets/sound/wrong.mp3');
        }
    }

    function endGame(message = 'Quiz Complete!') {
        stopTimer();
        gameContainer.classList.remove('active');
        startScreen.classList.add('active');
        document.querySelector('.title').textContent = message;
        document.querySelector('.subtitle').textContent = `Score: ${score} / ${quizLength}`;
        playBtn.querySelector('span').textContent = 'Play Again';
    }

    function resetUIForNewCard() {
        resultEl.classList.remove('show', 'correct', 'incorrect');
        answerInputEl.value = '';
        answerInputEl.disabled = false;
        submitBtn.disabled = false;
        nextBtn.disabled = true;
        answerInputEl.focus();
        hintIcon.classList.add('active');
        hintText.classList.remove('active');
    }

    function updateScoreDisplay() {
        scoreValueEl.textContent = score;
    }

    function toggleHint() {
        if (!currentKanji) return;
        if (hintIcon.classList.contains('active')) {
            hintIcon.classList.remove('active');
            hintText.textContent = `Meaning: ${currentKanji.meaning}`;
            hintText.classList.add('active');
        } else {
            hintText.classList.remove('active');
            hintIcon.classList.add('active');
        }
    }

    // --- Event Listeners ---
    playBtn.addEventListener('click', startGame);
    submitBtn.addEventListener('click', checkAnswer);
    nextBtn.addEventListener('click', displayNewKanji);
    restartBtn.addEventListener('click', startGame);
    hintDisplay.addEventListener('click', toggleHint);
    if (muteBtn) muteBtn.addEventListener('click', toggleMute);

    answerInputEl.addEventListener('keyup', (e) => {
        if (e.key === 'Enter' && !submitBtn.disabled) checkAnswer();
    });

    document.querySelectorAll('input[name="learning-mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const mode = e.target.value;
            categorySelector.style.display = mode === 'by-category' ? 'block' : 'none';
            
            // Hide quiz length input for "By Similarity Group" mode
            const quizLengthContainer = document.querySelector('.quiz-length-container');
            if (quizLengthContainer) {
                quizLengthContainer.style.display = mode === 'by-category' ? 'none' : 'block';
            }
        });
    });

    countdownToggle.addEventListener('change', () => {
        countdownSettings.style.display = countdownToggle.checked ? 'block' : 'none';
    });

    loadData();
});
