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

    // New Elements for Learning Modes
    const categorySelector = document.getElementById('category-selector');
    const categorySelect = document.getElementById('category-select');

    // Start/End Screen Elements
    const startScreenTitle = startScreen.querySelector('.title');
    const startScreenSubtitle = startScreen.querySelector('.subtitle');

    // Game State
    let kanjiData = [];
    let currentKanji = null;
    let score = 0;
    let seenKanjiIds = []; // Changed from indices to IDs for better tracking
    let quizLength = 10;
    let userProgress = {
        mastered: [],
        weak: [],
        lastStudy: null,
        streak: 0
    };

    // Kanji Categories
    const kanjiCategories = {
        "basic": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 
                 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
                 41, 42, 43, 44, 45, 46, 47, 48, 49, 50],
        "numbers-time": [7, 28, 29, 30, 31, 56, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145],
        "places": [5, 6, 40, 41, 65, 70, 115, 154, 159, 161, 163, 164, 246],
        "family": [54, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207],
        "activities": [15, 43, 44, 46, 89, 92, 97, 98, 168, 230, 94, 95, 96],
        "nature": [57, 58, 59, 60, 62, 63, 64, 66, 67, 68, 123, 124]
    };

    // --- Data Loading ---
    fetch('assets/data/kanji-n4.json')
        .then(response => response.json())
        .then(data => {
            kanjiData = data;
            quizLengthInput.max = kanjiData.length;
            playBtn.disabled = false;
            playBtn.querySelector('span').textContent = 'Start Learning';
            
            // Load user progress from localStorage
            loadUserProgress();
        })
        .catch(error => {
            console.error("Error fetching kanji data:", error);
            startScreenTitle.textContent = 'Error';
            startScreenSubtitle.textContent = 'Could not load Kanji data.';
        });

    // --- Progress Management ---
    function loadUserProgress() {
        const saved = localStorage.getItem('kanjiMasterProgress');
        if (saved) {
            userProgress = JSON.parse(saved);
        }
    }

    function saveUserProgress() {
        localStorage.setItem('kanjiMasterProgress', JSON.stringify(userProgress));
    }

    function updateProgress(isCorrect) {
        if (!currentKanji) return;
        
        if (isCorrect) {
            // Add to mastered if not already there
            if (!userProgress.mastered.includes(currentKanji.id)) {
                userProgress.mastered.push(currentKanji.id);
            }
            // Remove from weak list
            userProgress.weak = userProgress.weak.filter(id => id !== currentKanji.id);
            userProgress.streak++;
        } else {
            // Add to weak list if wrong
            if (!userProgress.weak.includes(currentKanji.id)) {
                userProgress.weak.push(currentKanji.id);
            }
            userProgress.streak = 0;
        }
        
        userProgress.lastStudy = new Date().toISOString();
        saveUserProgress();
    }

    // --- Learning Mode Functions ---
    function getAvailableKanji() {
        const learningMode = document.querySelector('input[name="learning-mode"]:checked').value;
        let availableKanji = [];

        switch(learningMode) {
            case "sequential":
                // Learn in order (by ID = frequency)
                availableKanji = kanjiData
                    .filter(k => !seenKanjiIds.includes(k.id))
                    .sort((a, b) => a.id - b.id);
                break;

            case "by-category":
                const category = categorySelect.value;
                const categoryIds = kanjiCategories[category] || [];
                availableKanji = kanjiData
                    .filter(k => categoryIds.includes(k.id) && !seenKanjiIds.includes(k.id));
                break;

            case "weak-first":
                // Focus on weak kanji first
                const weakKanji = kanjiData.filter(k => userProgress.weak.includes(k.id));
                availableKanji = weakKanji.filter(k => !seenKanjiIds.includes(k.id));
                if (availableKanji.length === 0) {
                    // If no weak kanji left, use all unseen kanji
                    availableKanji = kanjiData.filter(k => !seenKanjiIds.includes(k.id));
                }
                break;

            case "random":
            default:
                // Original random behavior
                availableKanji = kanjiData.filter(k => !seenKanjiIds.includes(k.id));
                break;
        }

        return availableKanji;
    }

    // --- Game Flow Functions ---
    function startGame() {
        const desiredLength = parseInt(quizLengthInput.value, 10);
        if (!isNaN(desiredLength) && desiredLength > 0) {
            quizLength = Math.min(desiredLength, kanjiData.length);
        }

        score = 0;
        seenKanjiIds = [];
        scoreValueEl.textContent = score;
        document.getElementById('score-max').textContent = `/ ${quizLength}`;
        progressFillEl.style.width = '0%';

        startScreen.classList.remove('active');
        gameContainer.classList.add('active');

        displayNewKanji();
    }

    function displayNewKanji() {
        if (seenKanjiIds.length >= quizLength || kanjiData.length === 0) {
            endGame();
            return;
        }

        // Update progress
        const progressPercent = (seenKanjiIds.length / quizLength) * 100;
        progressFillEl.style.width = `${progressPercent}%`;

        // Reset UI
        resultEl.classList.remove('show', 'correct', 'incorrect');
        if (hintIcon) {
            hintIcon.classList.add('active');
        }
        if (hintText) {
            hintText.classList.remove('active');
        }

        // Get next kanji based on learning mode
        const availableKanji = getAvailableKanji();
        
        if (availableKanji.length === 0) {
            endGame();
            return;
        }

        let nextKanji;
        const learningMode = document.querySelector('input[name="learning-mode"]:checked').value;
        
        if (learningMode === "random") {
            // Original random selection
            nextKanji = availableKanji[Math.floor(Math.random() * availableKanji.length)];
        } else {
            // For structured modes, take the first one
            nextKanji = availableKanji[0];
        }

        currentKanji = nextKanji;
        seenKanjiIds.push(currentKanji.id);
        
        // Display kanji
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
            updateProgress(true);
        } else {
            const feedback = `Reading: ${currentKanji.reading}, Meaning: ${currentKanji.meaning}`;
            resultEl.textContent = `Wrong! ${feedback}`;
            resultEl.classList.add('incorrect');
            new Audio('assets/sound/wrong.mp3').play();
            updateProgress(false);
        }
        
        answerInputEl.disabled = true;
        submitBtn.disabled = true;
        nextBtn.disabled = false;
    }

    function endGame() {
        const finalProgress = (seenKanjiIds.length / quizLength) * 100;
        progressFillEl.style.width = `${finalProgress}%`;

        gameContainer.classList.remove('active');
        startScreen.classList.add('active');
        
        // Show progress summary
        const totalMastered = userProgress.mastered.length;
        const totalWeak = userProgress.weak.length;
        
        startScreenTitle.textContent = 'Quiz Complete!';
        startScreenSubtitle.innerHTML = `
            Your final score: ${score} out of ${quizLength}<br>
            Mastered: ${totalMastered} kanji | Need practice: ${totalWeak} kanji
            ${userProgress.streak > 0 ? `<br>Current streak: ${userProgress.streak} correct in a row!` : ''}
        `;
        playBtn.querySelector('span').textContent = 'Play Again';
    }

    // --- Event Listeners ---
    playBtn.addEventListener('click', startGame);
    submitBtn.addEventListener('click', checkAnswer);
    nextBtn.addEventListener('click', displayNewKanji);

    // Learning mode selector
    document.querySelectorAll('input[name="learning-mode"]').forEach(radio => {
        radio.addEventListener('change', function() {
            categorySelector.style.display = this.value === 'by-category' ? 'block' : 'none';
        });
    });

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