document.addEventListener('DOMContentLoaded', () => {
    const kanjiListContainer = document.getElementById('kanji-list-container');

    if (!kanjiListContainer) {
        console.error('Kanji list container not found.');
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const level = urlParams.get('level');
    let dataUrl = 'assets/data/kanji.json';
    let titleText = 'Kanji List';
    let isJlpt = false;

    if (level && ['n2', 'n3', 'n4', 'n5'].includes(level.toLowerCase())) {
        dataUrl = `assets/data/kanji${level.toLowerCase()}.json`;
        titleText = `JLPT ${level.toUpperCase()} Kanji List`;
        isJlpt = true;
        
        const titleEl = document.querySelector('.title');
        if (titleEl) titleEl.textContent = titleText;
        const backBtn = document.querySelector('.back-button');
        if (backBtn) backBtn.href = 'jlpt-kanji.html';
    }

    fetch(dataUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data)) {
                throw new Error('Data is not an array.');
            }
            
            // Sort data by id
            data.sort((a, b) => a.id - b.id);

            data.forEach((kanji, index) => {
                const kanjiItem = document.createElement('div');
                kanjiItem.classList.add('kanji-item');

                const kanjiId = document.createElement('div');
                kanjiId.classList.add('kanji-id');
                kanjiId.textContent = index + 1;

                const kanjiChar = document.createElement('div');
                kanjiChar.classList.add('kanji-char');
                kanjiChar.textContent = kanji.kanji;

                const kanjiMeaning = document.createElement('div');
                kanjiMeaning.classList.add('kanji-meaning');
                kanjiMeaning.textContent = isJlpt ? kanji.arti : kanji.meaning;

                const onyomiReading = document.createElement('div');
                onyomiReading.classList.add('kanji-reading');
                const onyomiRomaji = isJlpt ? kanaToRomaji(kanji.onyomi) : '';
                onyomiReading.innerHTML = `<span style="font-weight: bold;">On:</span> ${kanji.onyomi || '-'} ${onyomiRomaji ? `(${onyomiRomaji})` : ''}`;

                const kunyomiReading = document.createElement('div');
                kunyomiReading.classList.add('kanji-reading');
                const kunyomiRomaji = isJlpt ? kanaToRomaji(kanji.kunyomi) : '';
                kunyomiReading.innerHTML = `<span style="font-weight: bold;">Kun:</span> ${kanji.kunyomi || '-'} ${kunyomiRomaji ? `(${kunyomiRomaji})` : ''}`;

                const readings = [];
                if (isJlpt) {
                    if (kanji.onyomi && kanji.onyomi !== '-') readings.push(kanji.onyomi);
                    if (kanji.kunyomi && kanji.kunyomi !== '-') readings.push(kanji.kunyomi);
                }

                const generalReading = document.createElement('div');
                generalReading.classList.add('kanji-reading');
                const combinedReading = readings.join(', ') || '-';
                const combinedRomaji = isJlpt ? kanaToRomaji(combinedReading) : '';
                generalReading.innerHTML = `<span style="font-weight: bold;">Reading:</span> ${isJlpt ? combinedReading : (kanji.reading || '-')} ${isJlpt && combinedRomaji ? `(${combinedRomaji})` : ''}`;

                kanjiItem.appendChild(kanjiId);
                kanjiItem.appendChild(kanjiChar);
                kanjiItem.appendChild(kanjiMeaning);
                kanjiItem.appendChild(onyomiReading);
                kanjiItem.appendChild(kunyomiReading);
                kanjiItem.appendChild(generalReading);

                kanjiListContainer.appendChild(kanjiItem);
            });
        })
        .catch(error => {
            console.error('Error fetching or processing kanji data:', error);
            kanjiListContainer.innerHTML = '<p style="color: #ff6b6b; text-align: center;">Failed to load Kanji list. Please check the console for more details.</p>';
        });

    // Scroll to top button logic
    const scrollToTopBtn = document.getElementById("scrollToTopBtn");

    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
                scrollToTopBtn.style.display = "block";
            } else {
                scrollToTopBtn.style.display = "none";
            }
        });

        scrollToTopBtn.addEventListener("click", () => {
            document.body.scrollTop = 0; // For Safari
            document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
        });
    }

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
        'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'de': 'de', 'ど': 'do',
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
        if (!text || text === '-') return '';
        let result = text;
        Object.entries(kanaToRomajiMap).sort((a, b) => b[0].length - a[0].length).forEach(([kana, romaji]) => {
            const regex = new RegExp(kana, 'g');
            result = result.replace(regex, romaji);
        });
        return result.toLowerCase().replace(/-/g, '');
    }
});