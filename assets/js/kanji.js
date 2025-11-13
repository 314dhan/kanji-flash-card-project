document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selection ---
    const startScreen = document.getElementById('start-screen');
    const gameContainer = document.getElementById('game-container');
    const playBtn = document.getElementById('play-btn');
    const submitBtn = document.getElementById('submit-btn');
    const nextBtn = document.getElementById('next-btn');
    const scoreValueEl = document.querySelector('.score-value');
    const scoreMaxEl = document.getElementById('score-max');
    const progressFillEl = document.querySelector('.progress-fill');
    const kanjiCharacterEl = document.querySelector('.kanji-character');
    const resultEl = document.getElementById('result');
    const answerInputEl = document.getElementById('answer-input');
    const quizLengthInput = document.getElementById('quiz-length-input');
    const maxKanjiNumberEl = document.getElementById('max-kanji-number');
    const hintDisplay = document.getElementById('hint-display');
    const hintIcon = document.getElementById('hint-icon');
    const hintText = document.getElementById('hint-text');
    const categorySelector = document.getElementById('category-selector');
    const categorySelect = document.getElementById('category-select');
    const specificKanjiSelector = document.getElementById('specific-kanji-selector');
    const startKanjiInput = document.getElementById('start-kanji-input');
    const startScreenTitle = startScreen.querySelector('.title');
    const startScreenSubtitle = startScreen.querySelector('.subtitle');

    // --- Game State ---
    let kanjiData = [];
    let currentKanji = null;
    let score = 0;
    let seenKanjiIds = [];
    let quizLength = 10;
    let userProgress = {
        mastered: [],
        weak: [],
        lastStudy: null,
        streak: 0
    };

    // --- Kanji Categories (Hardcoded) ---
    const kanjiCategories = {
        "basic": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50],
        "numbers-time": [7, 28, 29, 30, 31, 56, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145],
        "places": [5, 6, 40, 41, 65, 70, 115, 154, 159, 161, 163, 164, 246],
        "family": [54, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207],
        "activities": [15, 43, 44, 46, 89, 92, 97, 98, 168, 230, 94, 95, 96],
        "nature": [57, 58, 59, 60, 62, 63, 64, 66, 67, 68, 123, 124]
    };

    // --- Data Loading ---
    async function loadKanjiData() {
        try {
            const response = await fetch('assets/data/kanji-n4.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            kanjiData = await response.json();
            
            quizLengthInput.max = kanjiData.length;
            maxKanjiNumberEl.textContent = kanjiData.length;
            startKanjiInput.max = kanjiData.length;
            
            playBtn.disabled = false;
            playBtn.querySelector('span').textContent = 'Start Learning';
            
            loadUserProgress();
        } catch (error) {
            console.error("Error fetching kanji data:", error);
            startScreenTitle.textContent = 'Error';
            startScreenSubtitle.textContent = 'Could not load Kanji data. Please refresh.';
            playBtn.disabled = true;
        }
    }

    // --- Progress Management ---
    function loadUserProgress() {
        const saved = localStorage.getItem('kanjiMasterProgress');
        if (saved) {
            userProgress = JSON.parse(saved);
        }
    }

    function saveUserProgress() {
        userProgress.lastStudy = new Date().toISOString();
        localStorage.setItem('kanjiMasterProgress', JSON.stringify(userProgress));
    }

    function updateProgress(isCorrect) {
        if (!currentKanji) return;

        const { id } = currentKanji;
        if (isCorrect) {
            if (!userProgress.mastered.includes(id)) {
                userProgress.mastered.push(id);
            }
            userProgress.weak = userProgress.weak.filter(weakId => weakId !== id);
            userProgress.streak++;
        } else {
            if (!userProgress.weak.includes(id)) {
                userProgress.weak.push(id);
            }
            userProgress.streak = 0;
        }
        saveUserProgress();
    }

    // --- Kanji Filtering and Selection ---
    function getLastStudiedIndex() {
        if (userProgress.mastered.length === 0) return 0;
        const maxMasteredId = Math.max(...userProgress.mastered);
        const lastIndex = kanjiData.findIndex(k => k.id === maxMasteredId);
        // Start from the item *after* the last mastered one
        return Math.min(lastIndex + 1, kanjiData.length - 1);
    }

    function getAvailableKanji() {
        const learningMode = document.querySelector('input[name="learning-mode"]:checked').value;
        let baseKanji = [...kanjiData];

        // Determine the starting point based on the learning mode
        if (learningMode === "specific") {
            const startNumber = parseInt(startKanjiInput.value, 10) || 1;
            const startIndex = Math.max(0, Math.min(startNumber - 1, kanjiData.length - 1));
            baseKanji = kanjiData.slice(startIndex);
        } else if (learningMode === "continue") {
            const lastStudiedIndex = getLastStudiedIndex();
            if (lastStudiedIndex > 0) {
                baseKanji = kanjiData.slice(lastStudiedIndex);
            }
        }

        let availableKanji = [];
        switch (learningMode) {
            case "by-category":
                const categoryIds = kanjiCategories[categorySelect.value] || [];
                availableKanji = baseKanji.filter(k => categoryIds.includes(k.id) && !seenKanjiIds.includes(k.id));
                break;
            case "weak-first":
                const weakKanji = baseKanji.filter(k => userProgress.weak.includes(k.id) && !seenKanjiIds.includes(k.id));
                availableKanji = weakKanji.length > 0 ? weakKanji : baseKanji.filter(k => !seenKanjiIds.includes(k.id));
                break;
            case "random":
                availableKanji = baseKanji.filter(k => !seenKanjiIds.includes(k.id));
                // Shuffle for random mode
                if (availableKanji.length > 0) {
                    for (let i = availableKanji.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [availableKanji[i], availableKanji[j]] = [availableKanji[j], availableKanji[i]];
                    }
                }
                break;
            case "sequential":
            case "specific":
            case "continue":
            default:
                availableKanji = baseKanji.filter(k => !seenKanjiIds.includes(k.id));
                break;
        }
        return availableKanji;
    }

    // --- Game Flow ---
    function startGame() {
        const desiredLength = parseInt(quizLengthInput.value, 10);
        quizLength = (!isNaN(desiredLength) && desiredLength > 0) ? Math.min(desiredLength, kanjiData.length) : 10;

        score = 0;
        seenKanjiIds = [];
        updateScoreDisplay();
        scoreMaxEl.textContent = `/ ${quizLength}`;
        progressFillEl.style.width = '0%';

        startScreen.classList.remove('active');
        gameContainer.classList.add('active');

        displayNewKanji();
    }

    function displayNewKanji() {
        if (seenKanjiIds.length >= quizLength) {
            endGame();
            return;
        }

        updateGameHeader();
        resetUIForNewCard();

        const availableKanji = getAvailableKanji();
        if (availableKanji.length === 0) {
            endGame("No more Kanji available in this mode!");
            return;
        }

        // For random mode, we just pick the first one from the pre-shuffled list
        const nextKanji = availableKanji[0];

        currentKanji = nextKanji;
        seenKanjiIds.push(currentKanji.id);

        kanjiCharacterEl.textContent = currentKanji.kanji;
        kanjiCharacterEl.parentElement.style.animation = 'none';
        void kanjiCharacterEl.parentElement.offsetWidth; // Trigger reflow
        kanjiCharacterEl.parentElement.style.animation = 'flipIn 0.6s ease-out';
    }

    function checkAnswer() {
        const userAnswer = answerInputEl.value.trim().toLowerCase();
        if (!userAnswer || !currentKanji) return;

        const correctReadings = currentKanji.reading.split(',').map(r => r.trim().toLowerCase());
        const isCorrect = correctReadings.includes(userAnswer);

        updateProgress(isCorrect);
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

    function endGame(message = 'Quiz Complete!') {
        updateGameHeader(); // Final progress bar update
        gameContainer.classList.remove('active');
        startScreen.classList.add('active');

        const totalMastered = userProgress.mastered.length;
        const totalWeak = userProgress.weak.length;
        
        startScreenTitle.textContent = message;
        startScreenSubtitle.innerHTML = `
            Your final score: ${score} out of ${quizLength}<br>
            Mastered: ${totalMastered} kanji | Need practice: ${totalWeak} kanji
            ${userProgress.streak > 2 ? `<br>Current streak: ${userProgress.streak} correct in a row! 🔥` : ''}
        `;
        playBtn.querySelector('span').textContent = 'Play Again';
    }

    // --- UI Update Functions ---
    function updateScoreDisplay() {
        scoreValueEl.textContent = score;
    }

    function updateGameHeader() {
        const progressPercent = (seenKanjiIds.length / quizLength) * 100;
        progressFillEl.style.width = `${progressPercent}%`;
    }

    function resetUIForNewCard() {
        resultEl.classList.remove('show', 'correct', 'incorrect');
        hintIcon.classList.add('active');
        hintText.classList.remove('active');
        answerInputEl.value = '';
        answerInputEl.disabled = false;
        submitBtn.disabled = false;
        nextBtn.disabled = true;
        answerInputEl.focus();
    }

    function showResult(isCorrect) {
        resultEl.classList.remove('correct', 'incorrect'); // Reset classes
        resultEl.classList.add('show');
        if (isCorrect) {
            resultEl.textContent = `Correct! Meaning: ${currentKanji.meaning}`;
            resultEl.classList.add('correct');
            new Audio('assets/sound/correct.mp3').play();
        } else {
            resultEl.textContent = `Wrong! Reading: ${currentKanji.reading}, Meaning: ${currentKanji.meaning}`;
            resultEl.classList.add('incorrect');
            new Audio('assets/sound/wrong.mp3').play();
        }
    }

    function toggleHint() {
        if (!currentKanji) return;
        const isIconActive = hintIcon.classList.contains('active');
        if (isIconActive) {
            hintIcon.classList.remove('active');
            hintText.textContent = `Meaning: ${currentKanji.meaning}`;
            hintText.classList.add('active');
        } else {
            hintText.classList.remove('active');
            hintIcon.classList.add('active');
        }
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        playBtn.addEventListener('click', startGame);
        submitBtn.addEventListener('click', checkAnswer);
        nextBtn.addEventListener('click', displayNewKanji);
        hintDisplay.addEventListener('click', toggleHint);

        answerInputEl.addEventListener('keyup', (event) => {
            if (event.key === 'Enter' && !submitBtn.disabled) {
                checkAnswer();
            }
        });

        document.querySelectorAll('input[name="learning-mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const mode = e.target.value;
                categorySelector.style.display = mode === 'by-category' ? 'block' : 'none';
                specificKanjiSelector.style.display = mode === 'specific' ? 'block' : 'none';

                if (mode === 'continue') {
                    const lastIndex = getLastStudiedIndex();
                    // We don't need to set the input, but this logic is here if we want to show it
                }
            });
        });

        startKanjiInput.addEventListener('change', () => {
            let value = parseInt(startKanjiInput.value, 10);
            const max = parseInt(startKanjiInput.max, 10);
            if (isNaN(value) || value < 1) {
                startKanjiInput.value = 1;
            } else if (value > max) {
                startKanjiInput.value = max;
            }
        });
    }

    // --- Initialization ---
    function init() {
        playBtn.disabled = true;
        playBtn.querySelector('span').textContent = 'Loading...';
        setupEventListeners();
        loadKanjiData();
    }

    init();
});