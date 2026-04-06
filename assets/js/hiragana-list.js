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

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');

    if (searchInput && clearBtn) {
        const filterItems = () => {
            const query = searchInput.value.toLowerCase();
            clearBtn.style.display = query ? 'block' : 'none';
            const items = hiraganaListContainer.querySelectorAll('.kanji-item');

            items.forEach(item => {
                let match = false;
                const char = item.querySelector('.kanji-char');
                if (char && char.textContent.toLowerCase().includes(query)) match = true;
                
                const meaning = item.querySelector('.kanji-meaning');
                if (meaning && meaning.textContent.toLowerCase().includes(query)) match = true;

                if (match) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        };

        searchInput.addEventListener('input', filterItems);
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            filterItems();
            searchInput.focus();
        });
    }

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
