// Config required: window.KANA_CONFIG = { dataUrl, progressKey, idPrefix, title, subtitle }
document.addEventListener('DOMContentLoaded', () => {
    const cfg = window.KANA_CONFIG;

    const startScreen = document.getElementById('start-screen');
    const gameContainer = document.getElementById('game-container');
    const playBtn = document.getElementById('play-btn');
    const submitBtn = document.getElementById('submit-btn');
    const nextBtn = document.getElementById('next-btn');
    const restartBtn = document.getElementById('restart-btn');
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
    const multipleChoiceToggle = document.getElementById('multiple-choice-toggle');
    const inputContainer = document.getElementById('input-container');
    const choicesContainer = document.getElementById('choices-container');
    const muteBtn = document.getElementById('mute-btn');
    const startScreenTitle = startScreen.querySelector('.title');
    const startScreenSubtitle = startScreen.querySelector('.subtitle');

    let kanaData = [];
    let currentKana = null;
    let score = 0;
    let questionsAnswered = 0;
    let quizIndices = [];
    let wrongIndices = [];
    let quizLength = 10;
    let timerInterval = null;
    let timeLeft = 0;
    let isCountdownActive = false;
    let isRepetitionMode = false;
    let isMultipleChoiceMode = false;
    let isMuted = localStorage.getItem('isMuted') === 'true';
    let userProgress = { mastered: [], weak: [], lastStudy: null };

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

    function loadUserProgress() {
        const saved = localStorage.getItem(cfg.progressKey);
        if (saved) userProgress = JSON.parse(saved);
    }

    function saveUserProgress() {
        userProgress.lastStudy = new Date().toISOString();
        localStorage.setItem(cfg.progressKey, JSON.stringify(userProgress));
    }

    function updateProgress(isCorrect) {
        if (!currentKana) return;
        const idx = kanaData.indexOf(currentKana);
        if (idx === -1) return;
        const id = `${cfg.idPrefix}-${idx}`;

        if (isCorrect) {
            if (!userProgress.mastered.includes(id)) userProgress.mastered.push(id);
            userProgress.weak = userProgress.weak.filter(weakId => weakId !== id);
        } else {
            if (!userProgress.weak.includes(id)) userProgress.weak.push(id);
        }
        saveUserProgress();
    }

    fetch(cfg.dataUrl)
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
            console.error(`Error fetching ${cfg.idPrefix} data:`, error);
            startScreenTitle.textContent = 'Error';
            startScreenSubtitle.textContent = `Could not load ${cfg.title} data.`;
        });

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

    function startGame(reviewIndices = null) {
        if (reviewIndices) {
            wrongIndices = [];
            quizIndices = reviewIndices;
            quizLength = quizIndices.length;
            score = 0;
            questionsAnswered = 0;
            scoreValueEl.textContent = score;
            document.getElementById('score-max').textContent = `/ ${quizLength}`;
            progressFillEl.style.width = '0%';
            startScreen.classList.remove('active');
            gameContainer.classList.add('active');
            window.scrollTo(0, 0);
            stopTimer();
            isRepetitionMode = false;
            currentKana = null;
            displayNewKana();
            return;
        }

        wrongIndices = [];
        const learningMode = document.querySelector('input[name="learning-mode"]:checked').value;
        const desiredLength = parseInt(quizLengthInput.value, 10);

        if (learningMode === 'weak-first') {
            const weakPoints = userProgress.weak.filter(id => typeof id === 'string' && id.startsWith(`${cfg.idPrefix}-`));
            quizLength = weakPoints.length;
            if (quizLength === 0) {
                showToast(`You have no weak points in ${cfg.title} yet! Try other modes first.`, 'warning', 'No Weak Points Found');
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
            for (let i = minIdx; i <= maxIdx; i++) availableIndices.push(i);
        } else if (learningMode === 'weak-first') {
            availableIndices = userProgress.weak
                .filter(id => typeof id === 'string' && id.startsWith(`${cfg.idPrefix}-`))
                .map(id => parseInt(id.replace(`${cfg.idPrefix}-`, ''), 10));
        }

        if (learningMode === 'random' || learningMode === 'random-range' || learningMode === 'weak-first') {
            for (let i = availableIndices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
            }
        }

        quizIndices = availableIndices.slice(0, quizLength);
        quizLength = quizIndices.length;
        document.getElementById('score-max').textContent = `/ ${quizLength}`;

        startScreen.classList.remove('active');
        gameContainer.classList.add('active');
        window.scrollTo(0, 0);

        if (countdownToggle.checked) {
            startTimer(parseInt(countdownMinutesInput.value, 10) || 1);
        } else {
            stopTimer();
        }

        isRepetitionMode = repetitionToggle.checked;
        isMultipleChoiceMode = multipleChoiceToggle ? multipleChoiceToggle.checked : false;

        if (isRepetitionMode) {
            currentKana = kanaData[quizIndices[0]];
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

        progressFillEl.style.width = `${(questionsAnswered / quizLength) * 100}%`;
        resultEl.classList.remove('show', 'correct', 'incorrect');

        if (!(isRepetitionMode && currentKana)) {
            currentKana = kanaData[quizIndices[questionsAnswered]];
        }

        if (idDisplayEl && currentKana) {
            idDisplayEl.textContent = `ID: ${kanaData.indexOf(currentKana) + 1}`;
        }

        kanaCharacterEl.textContent = currentKana.kana;
        kanaCharacterEl.parentElement.style.animation = 'none';
        void kanaCharacterEl.parentElement.offsetWidth;
        kanaCharacterEl.parentElement.style.animation = 'flipIn 0.6s ease-out';

        answerInputEl.value = '';
        answerInputEl.disabled = false;
        submitBtn.disabled = false;
        nextBtn.disabled = true;
        nextBtn.classList.remove('mc-pinned');

        setupAnswerMode();
    }

    function isAnswerCorrect(answer) {
        const userAnswer = (answer || '').trim().toLowerCase().replace(/-/g, '');
        if (!userAnswer || !currentKana) return false;
        return userAnswer === currentKana.romaji.toLowerCase().replace(/-/g, '');
    }

    function recordAnswer(isCorrect) {
        updateProgress(isCorrect);

        if (!isCorrect) {
            const idx = kanaData.indexOf(currentKana);
            if (idx !== -1 && !wrongIndices.includes(idx)) wrongIndices.push(idx);
        }

        resultEl.classList.add('show');
        if (isCorrect) {
            score++;
            scoreValueEl.textContent = score;
            resultEl.textContent = 'Correct!';
            resultEl.classList.add('correct');
            playSound('assets/sound/correct.mp3');
        } else {
            resultEl.textContent = `Wrong! The correct answer is ${currentKana.romaji}`;
            resultEl.classList.add('incorrect');
            playSound('assets/sound/wrong.mp3');
        }

        questionsAnswered++;
        nextBtn.disabled = false;
        nextBtn.focus();
    }

    function checkAnswer() {
        if (!answerInputEl.value.trim() || !currentKana) return;
        recordAnswer(isAnswerCorrect(answerInputEl.value));
        answerInputEl.disabled = true;
        submitBtn.disabled = true;
    }

    // --- Multiple Choice Mode ---
    function shuffleArray(arr) {
        const copy = arr.slice();
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    function buildChoiceOptions() {
        const correct = currentKana.romaji;
        const used = new Set([correct.toLowerCase().replace(/-/g, '')]);
        const distractors = [];

        for (const k of shuffleArray(kanaData)) {
            if (k === currentKana) continue;
            const option = k.romaji;
            const norm = option.toLowerCase().replace(/-/g, '');
            if (!norm || used.has(norm)) continue;
            used.add(norm);
            distractors.push(option);
            if (distractors.length === 3) break;
        }

        return shuffleArray([correct, ...distractors]);
    }

    function renderChoices() {
        choicesContainer.innerHTML = '';
        choicesContainer.classList.remove('answered');
        buildChoiceOptions().forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.textContent = option;
            btn.addEventListener('click', () => handleChoice(option, btn));
            choicesContainer.appendChild(btn);
        });
    }

    function handleChoice(selected, btn) {
        if (choicesContainer.classList.contains('answered')) return;
        choicesContainer.classList.add('answered');

        const isCorrect = isAnswerCorrect(selected);

        choicesContainer.querySelectorAll('.choice-btn').forEach(b => {
            b.disabled = true;
            if (isAnswerCorrect(b.textContent)) b.classList.add('correct');
        });
        if (!isCorrect) btn.classList.add('incorrect');

        recordAnswer(isCorrect);
        nextBtn.classList.add('mc-pinned');
    }

    function setupAnswerMode() {
        if (isMultipleChoiceMode) {
            inputContainer.style.display = 'none';
            choicesContainer.style.display = 'grid';
            renderChoices();
        } else {
            choicesContainer.style.display = 'none';
            choicesContainer.innerHTML = '';
            inputContainer.style.display = 'flex';
            answerInputEl.focus();
        }
    }

    function endGame(message = 'Quiz Complete!') {
        stopTimer();
        nextBtn.classList.remove('mc-pinned');
        progressFillEl.style.width = `${(questionsAnswered / quizLength) * 100}%`;
        showResultsModal(score, quizLength, [...wrongIndices], message);
    }

    function showResultsModal(finalScore, total, wrongIdxSnapshot, message) {
        const wrongItems = wrongIdxSnapshot.map(i => kanaData[i]).filter(Boolean);
        const hasWrong = wrongItems.length > 0;

        const overlay = document.createElement('div');
        overlay.className = 'results-modal-overlay';
        overlay.innerHTML = `
            <div class="results-modal">
                <div class="results-modal-header">
                    <div class="results-modal-score">
                        <span class="score-big">${finalScore}</span>
                        <span class="score-label">/ ${total} correct</span>
                    </div>
                    <div class="results-modal-title">${message}</div>
                </div>
                ${hasWrong ? `
                <div class="results-wrong-label">Wrong Answers (${wrongItems.length})</div>
                <div class="results-wrong-list">
                    ${wrongItems.map(item => `
                        <div class="wrong-item">
                            <div class="wrong-item-char">${item.kana}</div>
                            <div class="wrong-item-info">
                                <div class="wrong-item-meaning">${item.romaji}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ` : `<div class="results-wrong-label">Perfect score! No mistakes.</div>`}
                <div class="results-modal-actions">
                    ${hasWrong ? `<button class="btn-review">&#128260; Review Mistakes (${wrongItems.length})</button>` : ''}
                    <button class="btn-secondary btn-play-again">Play Again</button>
                    <button class="btn-secondary btn-back-menu">Back to Menu</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        void overlay.offsetWidth;
        overlay.classList.add('active');

        if (hasWrong) {
            overlay.querySelector('.btn-review').addEventListener('click', () => {
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 350);
                startGame(wrongIdxSnapshot);
            });
        }

        overlay.querySelector('.btn-play-again').addEventListener('click', () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 350);
            gameContainer.classList.remove('active');
            startScreen.classList.add('active');
            startGame();
        });

        overlay.querySelector('.btn-back-menu').addEventListener('click', () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 350);
            gameContainer.classList.remove('active');
            startScreen.classList.add('active');
            startScreenTitle.textContent = cfg.title;
            startScreenSubtitle.textContent = cfg.subtitle;
            playBtn.querySelector('span').textContent = 'Start Learning';
        });
    }

    function showToast(message, type = 'info', title = '') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
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
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    playBtn.addEventListener('click', () => startGame());
    submitBtn.addEventListener('click', checkAnswer);
    nextBtn.addEventListener('click', displayNewKana);
    restartBtn.addEventListener('click', () => startGame());
    if (muteBtn) muteBtn.addEventListener('click', toggleMute);

    countdownToggle.addEventListener('change', () => {
        countdownSettings.style.display = countdownToggle.checked ? 'block' : 'none';
    });

    countdownMinutesInput.addEventListener('change', () => {
        let value = parseInt(countdownMinutesInput.value, 10);
        if (isNaN(value) || value < 1) countdownMinutesInput.value = 1;
        else if (value > 60) countdownMinutesInput.value = 60;
    });

    answerInputEl.addEventListener('keyup', (event) => {
        if (event.key === 'Enter' && !submitBtn.disabled) checkAnswer();
    });

    document.querySelectorAll('input[name="learning-mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const mode = e.target.value;
            rangeSelector.style.display = mode === 'random-range' ? 'block' : 'none';
            const quizLengthContainer = document.querySelector('.quiz-length-container');
            if (quizLengthContainer) {
                quizLengthContainer.style.display = (mode === 'weak-first' || mode === 'random-range') ? 'none' : 'block';
            }
        });
    });

    startRangeInput.addEventListener('change', () => {
        let value = parseInt(startRangeInput.value, 10);
        const max = parseInt(startRangeInput.max, 10);
        if (isNaN(value) || value < 1) startRangeInput.value = 1;
        else if (value > max) startRangeInput.value = max;
    });

    endRangeInput.addEventListener('change', () => {
        let value = parseInt(endRangeInput.value, 10);
        const max = parseInt(endRangeInput.max, 10);
        if (isNaN(value) || value < 1) endRangeInput.value = 1;
        else if (value > max) endRangeInput.value = max;
    });

    playBtn.disabled = true;
    playBtn.querySelector('span').textContent = 'Loading...';
    updateMuteUI();
});
