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
    const rangeSelector = document.getElementById('range-selector');
    const startRangeInput = document.getElementById('start-range-input');
    const endRangeInput = document.getElementById('end-range-input');
    const maxKanjiRangeEl = document.getElementById('max-kanji-range');
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
            const urlParams = new URLSearchParams(window.location.search);
            const level = urlParams.get('level');
            let dataUrl = 'assets/data/kanji.json';
            let isJlpt = false;

            if (level && ['n2', 'n3', 'n4', 'n5'].includes(level.toLowerCase())) {
                dataUrl = `assets/data/kanji${level.toLowerCase()}.json`;
                isJlpt = true;
                startScreenSubtitle.textContent = `JLPT ${level.toUpperCase()} Kanji Challenge`;
                answerInputEl.placeholder = "Enter reading (romaji)";
                
                // Update back button to go to JLPT selection instead of main menu
                const backBtn = document.querySelector('a[href="index.html"]');
                if (backBtn) {
                    backBtn.href = 'jlpt-kanji.html';
                    backBtn.querySelector('span').textContent = 'Back to JLPT Selection';
                }
                const listBtn = document.querySelector('a[href="kanji-list.html"]');
                if (listBtn) {
                    listBtn.href = `kanji-list.html?level=${level}`;
                }

                // Hide category option for JLPT
                const categoryOption = document.querySelector('input[name="learning-mode"][value="by-category"]');
                if (categoryOption && categoryOption.parentElement) {
                    categoryOption.parentElement.style.display = 'none';
                }
            }

            const response = await fetch(dataUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const rawData = await response.json();
            
            // Map data if it's JLPT format
            if (isJlpt) {
                kanjiData = rawData.map(item => {
                    // Combine romaji and kana readings as acceptable answers
                    const romajiAnswers = item.romaji ? item.romaji.replace(/;/g, ',').split(',').map(s => s.trim()) : [];
                    const kanaAnswers = `${item.onyomi}, ${item.kunyomi}`.replace(/-/g, '').split(',').map(s => s.trim()).filter(s => s && s !== '-');
                    
                    return {
                        id: item.id,
                        kanji: item.kanji,
                        meaning: item.arti,
                        onyomi: item.onyomi,
                        kunyomi: item.kunyomi,
                        // Combine all for checking
                        reading: [...romajiAnswers, ...kanaAnswers].join(', ')
                    };
                });
            } else {
                kanjiData = rawData;
            }
            
            quizLengthInput.max = kanjiData.length;
            maxKanjiNumberEl.textContent = kanjiData.length;
            maxKanjiRangeEl.textContent = kanjiData.length;
            startKanjiInput.max = kanjiData.length;
            startRangeInput.max = kanjiData.length;
            endRangeInput.max = kanjiData.length;
            endRangeInput.value = Math.min(20, kanjiData.length);
            
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
        } else if (learningMode === "random-range") {
            const start = parseInt(startRangeInput.value, 10) || 1;
            const end = parseInt(endRangeInput.value, 10) || kanjiData.length;
            
            // Filter by ID range (assuming IDs are sequential and represent their position if possible)
            // or just use slice if we assume index-based range as requested
            const minId = Math.min(start, end);
            const maxId = Math.max(start, end);
            
            baseKanji = kanjiData.filter(k => k.id >= minId && k.id <= maxId);
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
            case "random-range":
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
    const kanaToRomajiMap = {
        'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
        'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
        'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
        'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
        'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
        'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
        'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
        'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
        'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
        'わ': 'wa', 'を': 'wo', 'ん': 'n',
        'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
        'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
        'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
        'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
        'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
        'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
        'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
        'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
        'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
        'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
        'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
        'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
        'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
        'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
        'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
        'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
        'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
        'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
        'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
        'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to',
        'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
        'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
        'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
        'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
        'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
        'ワ': 'wa', 'ヲ': 'wo', 'ン': 'n',
        'ガ': 'ga', 'ギ': 'gi', 'グ': 'gu', 'ゲ': 'ge', 'ゴ': 'go',
        'ザ': 'za', 'ジ': 'ji', 'ズ': 'zu', 'ゼ': 'ze', 'ゾ': 'zo',
        'ダ': 'da', 'ヂ': 'ji', 'ヅ': 'zu', 'デ': 'de', 'ド': 'do',
        'バ': 'ba', 'ビ': 'bi', 'ブ': 'bu', 'ベ': 'be', 'ボ': 'bo',
        'パ': 'pa', 'ピ': 'pi', 'プ': 'pu', 'ペ': 'pe', 'ポ': 'po'
    };

    function kanaToRomaji(text) {
        if (!text) return '';
        let result = text;
        // Simple replacement for basic kana to romaji for comparison
        // This is a simplified version, ideally use a library for production
        Object.entries(kanaToRomajiMap).sort((a, b) => b[0].length - a[0].length).forEach(([kana, romaji]) => {
            const regex = new RegExp(kana, 'g');
            result = result.replace(regex, romaji);
        });
        return result.toLowerCase();
    }

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
        
        // Check for direct match (romaji to romaji or kana to kana)
        let isCorrect = correctReadings.includes(userAnswer);

        // If not correct, try converting correct readings from kana to romaji for comparison
        if (!isCorrect) {
            const romajiReadings = correctReadings.map(r => kanaToRomaji(r));
            isCorrect = romajiReadings.includes(userAnswer);
        }

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
            Your final score: ${score} out of ${quizLength}
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

        const romajiReading = kanaToRomaji(currentKanji.reading);
        const readingDisplay = (currentKanji.reading.toLowerCase() !== romajiReading.toLowerCase()) 
            ? `${currentKanji.reading} (${romajiReading})` 
            : currentKanji.reading;

        if (isCorrect) {
            resultEl.textContent = `Correct! Meaning: ${currentKanji.meaning}`;
            resultEl.classList.add('correct');
            new Audio('assets/sound/correct.mp3').play();
        } else {
            resultEl.textContent = `Wrong! Reading: ${readingDisplay}, Meaning: ${currentKanji.meaning}`;
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
                rangeSelector.style.display = mode === 'random-range' ? 'block' : 'none';

                if (mode === 'continue') {
                    const lastIndex = getLastStudiedIndex();
                    // We don't need to set the input, but this logic is here if we want to show it
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