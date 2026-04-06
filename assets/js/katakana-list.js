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

            data.forEach((katakana, index) => {
                const katakanaItem = document.createElement('div');
                katakanaItem.classList.add('kanji-item'); // Reusing kanji-item style

                const katakanaId = document.createElement('div');
                katakanaId.classList.add('kanji-id');
                katakanaId.textContent = index + 1;

                const katakanaChar = document.createElement('div');
                katakanaChar.classList.add('kanji-char'); // Reusing kanji-char style
                katakanaChar.textContent = katakana.kana;

                const katakanaRomaji = document.createElement('div');
                katakanaRomaji.classList.add('kanji-meaning'); // Reusing kanji-meaning style
                katakanaRomaji.textContent = katakana.romaji;

                katakanaItem.appendChild(katakanaId);
                katakanaItem.appendChild(katakanaChar);
                katakanaItem.appendChild(katakanaRomaji);

                katakanaListContainer.appendChild(katakanaItem);
            });
        })
        .catch(error => {
            console.error('Error fetching or processing katakana data:', error);
            katakanaListContainer.innerHTML = '<p style="color: #ff6b6b; text-align: center;">Failed to load Katakana list. Please check the console for more details.</p>';
        });

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');

    if (searchInput && clearBtn) {
        const filterItems = () => {
            const query = searchInput.value.toLowerCase();
            clearBtn.style.display = query ? 'block' : 'none';
            const items = katakanaListContainer.querySelectorAll('.kanji-item');

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
