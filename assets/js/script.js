document.addEventListener('DOMContentLoaded', () => {
    // Game Elements
    const startScreen = document.getElementById('start-screen');
    const gameContainer = document.getElementById('game-container');
    const playBtn = document.getElementById('play-btn');
    const scoreEl = document.getElementById('score');
    const kanjiCardEl = document.getElementById('kanji-card');
    const answerInputEl = document.getElementById('answer-input');
    const submitBtn = document.getElementById('submit-btn');
    const nextBtn = document.getElementById('next-btn');
    const resultEl = document.getElementById('result');
    const startScreenTitle = startScreen.querySelector('h1');

    // Game State
    let kanjiData = [];
    let currentKanji = null;
    let score = 0;
    let seenIndices = [];
    const QUIZ_LENGTH = 10;

    // Initial setup
    gameContainer.style.display = 'none';
    playBtn.disabled = true;

    // Fetch Kanji data once
    fetch('assets/data/kanji-n4.json')
        .then(response => response.json())
        .then(data => {
            kanjiData = data;
            playBtn.disabled = false; // Enable play button after data is loaded
        })
        .catch(error => {
            console.error("Error fetching kanji data:", error);
            startScreenTitle.textContent = 'Error loading data.';
        });

    function startGame() {
        score = 0;
        seenIndices = [];
        scoreEl.textContent = `Score: ${score}`;
        startScreenTitle.textContent = 'Kanji Flashcard Quiz'; // Reset title
        playBtn.textContent = 'Play';
        
        startScreen.style.display = 'none';
        gameContainer.style.display = 'flex';

        displayNewKanji();
    }

    function displayNewKanji() {
        if (seenIndices.length >= QUIZ_LENGTH || kanjiData.length === 0) {
            endGame();
            return;
        }

        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * kanjiData.length);
        } while (seenIndices.includes(randomIndex));
        
        seenIndices.push(randomIndex);
        currentKanji = kanjiData[randomIndex];
        
        kanjiCardEl.textContent = currentKanji.kanji;
        resultEl.textContent = '';
        answerInputEl.value = '';
        answerInputEl.disabled = false;
        submitBtn.disabled = false;
        nextBtn.style.display = 'none';
        answerInputEl.focus();
    }

    function checkAnswer() {
        const userAnswer = answerInputEl.value.trim().toLowerCase();
        if (!userAnswer || !currentKanji) return;

        const correctReadings = currentKanji.reading.split(',').map(r => r.trim().toLowerCase());
        const isCorrect = correctReadings.includes(userAnswer);

        if (isCorrect) {
            score++;
            scoreEl.textContent = `Score: ${score}`;
            resultEl.textContent = `Correct! Meaning: ${currentKanji.meaning}`;
            resultEl.style.color = 'green';
        } else {
            const feedback = `Reading: ${currentKanji.reading}, Meaning: ${currentKanji.meaning}`;
            resultEl.textContent = `Wrong! ${feedback}`;
            resultEl.style.color = 'red';
        }
        
        answerInputEl.disabled = true;
        submitBtn.disabled = true;
        nextBtn.style.display = 'inline-block';
    }

    function endGame() {
        gameContainer.style.display = 'none';
        startScreen.style.display = 'block';
        
        startScreenTitle.textContent = `Quiz Complete! Your score: ${score}/${QUIZ_LENGTH}`;
        playBtn.textContent = 'Play Again';
    }

    // Event Listeners
    playBtn.addEventListener('click', startGame);
    submitBtn.addEventListener('click', checkAnswer);
    nextBtn.addEventListener('click', displayNewKanji);
    answerInputEl.addEventListener('keyup', (event) => {
        if (event.key === 'Enter' && !submitBtn.disabled) {
            checkAnswer();
        }
    });
});
