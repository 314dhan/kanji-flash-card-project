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
    fetch('assets/data/hiragana.json')
        .then(response => response.json())
        .then(data => {
            kanaData = data;
            quizLengthInput.max = kanaData.length;
            playBtn.disabled = false;
            playBtn.querySelector('span').textContent = 'Start Learning';
        })
        .catch(error => {
            console.error("Error fetching hiragana data:", error);
            startScreenTitle.textContent = 'Error';
            startScreenSubtitle.textContent = 'Could not load Hiragana data.';
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

        // Create and shuffle indices for the quiz
        quizIndices = [...Array(kanaData.length).keys()];
        for (let i = quizIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [quizIndices[i], quizIndices[j]] = [quizIndices[j], quizIndices[i]];
        }
        // Trim the shuffled list to the desired quiz length
        quizIndices = quizIndices.slice(0, quizLength);

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

    // --- Initial State ---
    playBtn.disabled = true;
    playBtn.querySelector('span').textContent = 'Loading...';
});