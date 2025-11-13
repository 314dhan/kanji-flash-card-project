document.addEventListener('DOMContentLoaded', () => {
    const katakanaListContainer = document.getElementById('katakana-list-container');

    if (!katakanaListContainer) {
        console.error('Katakana list container not found.');
        return;
    }

    fetch('assets/data/katakana.json')
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

            data.forEach(katakana => {
                const katakanaItem = document.createElement('div');
                katakanaItem.classList.add('kanji-item'); // Reusing kanji-item style

                const katakanaChar = document.createElement('div');
                katakanaChar.classList.add('kanji-char'); // Reusing kanji-char style
                katakanaChar.textContent = katakana.kana;

                const katakanaRomaji = document.createElement('div');
                katakanaRomaji.classList.add('kanji-meaning'); // Reusing kanji-meaning style
                katakanaRomaji.textContent = katakana.romaji;

                katakanaItem.appendChild(katakanaChar);
                katakanaItem.appendChild(katakanaRomaji);

                katakanaListContainer.appendChild(katakanaItem);
            });
        })
        .catch(error => {
            console.error('Error fetching or processing katakana data:', error);
            katakanaListContainer.innerHTML = '<p style="color: #ff6b6b; text-align: center;">Failed to load Katakana list. Please check the console for more details.</p>';
        });
});
