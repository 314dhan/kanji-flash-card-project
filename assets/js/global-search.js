document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('globalSearchInput');
    const clearBtn = document.getElementById('clearGlobalSearchBtn');
    const editorialList = document.querySelector('.editorial-list');
    const resultsWrapper = document.getElementById('global-search-results');
    const resultsContainer = document.getElementById('global-search-container');
    const welcomeSection = document.querySelector('.welcome-section p');
    
    if (!searchInput) return;

    let allData = [];

    // Fetch all datasets asynchronously to build the global dictionary
    Promise.all([
        fetch('assets/data/hiragana.json').then(r => r.json()).catch(() => []),
        fetch('assets/data/katakana.json').then(r => r.json()).catch(() => []),
        fetch('assets/data/kanji.json').then(r => r.json()).catch(() => []),
        fetch('assets/data/kanjin5.json').then(r => r.json()).catch(() => []),
        fetch('assets/data/kanjin4.json').then(r => r.json()).catch(() => []),
        fetch('assets/data/kanjin3.json').then(r => r.json()).catch(() => []),
        fetch('assets/data/kanjin2.json').then(r => r.json()).catch(() => [])
    ]).then(([hiragana, katakana, kanji, n5, n4, n3, n2]) => {
        const mapData = (list, type, source) => list.map(item => ({...item, _type: type, _source: source}));
        const h = mapData(Array.isArray(hiragana) ? hiragana : [], 'hiragana', 'Hiragana');
        const k = mapData(Array.isArray(katakana) ? katakana : [], 'katakana', 'Katakana');
        const kj = mapData(Array.isArray(kanji) ? kanji : [], 'kanji', 'Base Kanji');
        const kj5 = mapData(Array.isArray(n5) ? n5 : [], 'kanji', 'JLPT N5');
        const kj4 = mapData(Array.isArray(n4) ? n4 : [], 'kanji', 'JLPT N4');
        const kj3 = mapData(Array.isArray(n3) ? n3 : [], 'kanji', 'JLPT N3');
        const kj2 = mapData(Array.isArray(n2) ? n2 : [], 'kanji', 'JLPT N2');
        allData = [...h, ...k, ...kj, ...kj5, ...kj4, ...kj3, ...kj2];
    }).catch(e => console.error("Error loading global search data", e));

    const renderResults = (query) => {
        resultsContainer.innerHTML = '';
        if (!query) {
            editorialList.style.display = '';
            resultsWrapper.style.display = 'none';
            if (welcomeSection) welcomeSection.style.display = '';
            clearBtn.style.display = 'none';
            return;
        }

        editorialList.style.display = 'none';
        if (welcomeSection) welcomeSection.style.display = 'none';
        resultsWrapper.style.display = 'block';
        clearBtn.style.display = 'block';

        const matches = allData.filter(item => {
            let text = '';
            if (item._type === 'hiragana' || item._type === 'katakana') {
                text = ((item.kana || '') + ' ' + (item.romaji || '')).toLowerCase();
            } else if (item._type === 'kanji') {
                const meaning = item.meaning || item.arti || '';
                text = ((item.kanji || '') + ' ' + meaning + ' ' + (item.reading || '') + ' ' + (item.romaji || '') + ' ' + (item.onyomi || '') + ' ' + (item.kunyomi || '')).toLowerCase();
            }
            return text.includes(query);
        });

        if (matches.length === 0) {
            resultsContainer.innerHTML = '<p style="color: white; width: 100%; text-align: center; grid-column: 1 / -1;">No results found.</p>';
            return;
        }

        matches.forEach(item => {
            const el = document.createElement('div');
            el.className = 'kanji-item';
            
            const typeId = document.createElement('div');
            typeId.className = 'kanji-id';
            // Color map for global index tags
            typeId.style.backgroundColor = item._type === 'kanji' ? '#e74c3c' : (item._type === 'katakana' ? '#3498db' : '#2ecc71');
            typeId.textContent = item._type.charAt(0).toUpperCase() + item._type.slice(1);

            const charEl = document.createElement('div');
            charEl.className = 'kanji-char';
            charEl.textContent = item.kana || item.kanji;

            const mainReading = document.createElement('div');
            mainReading.className = 'kanji-meaning';
            mainReading.textContent = item._type === 'kanji' ? (item.meaning || item.arti || '') : (item.romaji || '');

            el.appendChild(typeId);
            el.appendChild(charEl);
            el.appendChild(mainReading);
            
            // Render the source tag
            const sourceBadge = document.createElement('div');
            sourceBadge.className = 'kanji-reading';
            var color = '#7f8c8d';
            if(item._source.includes('N5')) color = '#2ecc71';
            else if(item._source.includes('N4')) color = '#f1c40f';
            else if(item._source.includes('N3')) color = '#e67e22';
            else if(item._source.includes('N2')) color = '#e74c3c';
            else color = 'var(--accent)';
            sourceBadge.innerHTML = `<span style="font-weight: bold; color: ${color};">Source:</span> ${item._source}`;
            el.appendChild(sourceBadge);

            // Append additional Kanji translations if available
            if (item._type === 'kanji') {
                if (item.onyomi && item.onyomi !== '-') {
                    const r = document.createElement('div');
                    r.className = 'kanji-reading';
                    r.innerHTML = `<span style="font-weight: bold;">On:</span> ${item.onyomi}`;
                    el.appendChild(r);
                }
                if (item.kunyomi && item.kunyomi !== '-') {
                    const r = document.createElement('div');
                    r.className = 'kanji-reading';
                    r.innerHTML = `<span style="font-weight: bold;">Kun:</span> ${item.kunyomi}`;
                    el.appendChild(r);
                }
                if (item.romaji && item.romaji !== '-') {
                    const r = document.createElement('div');
                    r.className = 'kanji-reading';
                    r.innerHTML = `<span style="font-weight: bold;">Romaji:</span> ${item.romaji}`;
                    el.appendChild(r);
                }
                if (item.reading && item.reading !== '-') {
                    const r = document.createElement('div');
                    r.className = 'kanji-reading';
                    r.innerHTML = `<span style="font-weight: bold;">Reading:</span> ${item.reading}`;
                    el.appendChild(r);
                }
            }

            resultsContainer.appendChild(el);
        });
    };

    searchInput.addEventListener('input', (e) => {
        renderResults(e.target.value.toLowerCase().trim());
    });

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        renderResults('');
        searchInput.focus();
    });
});
