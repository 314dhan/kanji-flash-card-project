document.addEventListener('DOMContentLoaded', () => {
    const hiraganaListContainer = document.getElementById('hiragana-list-container');

    if (!hiraganaListContainer) {
        console.error('Hiragana list container not found.');
        return;
    }

    fetch('assets/data/hiragana.json')
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

            data.forEach((hiragana, index) => {
                const hiraganaItem = document.createElement('div');
                hiraganaItem.classList.add('kanji-item'); // Reusing kanji-item style

                const hiraganaId = document.createElement('div');
                hiraganaId.classList.add('kanji-id');
                hiraganaId.textContent = index + 1;

                const hiraganaChar = document.createElement('div');
                hiraganaChar.classList.add('kanji-char'); // Reusing kanji-char style
                hiraganaChar.textContent = hiragana.kana;

                const hiraganaRomaji = document.createElement('div');
                hiraganaRomaji.classList.add('kanji-meaning'); // Reusing kanji-meaning style
                hiraganaRomaji.textContent = hiragana.romaji;

                hiraganaItem.appendChild(hiraganaId);
                hiraganaItem.appendChild(hiraganaChar);
                hiraganaItem.appendChild(hiraganaRomaji);

                hiraganaListContainer.appendChild(hiraganaItem);
            });
        })
        .catch(error => {
            console.error('Error fetching or processing hiragana data:', error);
            hiraganaListContainer.innerHTML = '<p style="color: #ff6b6b; text-align: center;">Failed to load Hiragana list. Please check the console for more details.</p>';
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
});
