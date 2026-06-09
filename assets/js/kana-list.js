// Config required: window.KANA_LIST_CONFIG = { containerId, dataUrl, typeName }
document.addEventListener('DOMContentLoaded', () => {
    const cfg = window.KANA_LIST_CONFIG;
    const listContainer = document.getElementById(cfg.containerId);

    if (!listContainer) {
        console.error(`${cfg.typeName} list container not found.`);
        return;
    }

    fetch(cfg.dataUrl)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data)) throw new Error('Data is not an array.');

            data.forEach((kana, index) => {
                const item = document.createElement('div');
                item.classList.add('kanji-item');

                const idEl = document.createElement('div');
                idEl.classList.add('kanji-id');
                idEl.textContent = index + 1;

                const charEl = document.createElement('div');
                charEl.classList.add('kanji-char');
                charEl.textContent = kana.kana;

                const romajiEl = document.createElement('div');
                romajiEl.classList.add('kanji-meaning');
                romajiEl.textContent = kana.romaji;

                item.appendChild(idEl);
                item.appendChild(charEl);
                item.appendChild(romajiEl);
                listContainer.appendChild(item);
            });
        })
        .catch(error => {
            console.error(`Error fetching or processing ${cfg.typeName} data:`, error);
            listContainer.innerHTML = `<p style="color: #ff6b6b; text-align: center;">Failed to load ${cfg.typeName} list. Please check the console for more details.</p>`;
        });

    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');

    if (searchInput && clearBtn) {
        const filterItems = () => {
            const query = searchInput.value.toLowerCase();
            clearBtn.style.display = query ? 'block' : 'none';
            listContainer.querySelectorAll('.kanji-item').forEach(item => {
                const char = item.querySelector('.kanji-char');
                const meaning = item.querySelector('.kanji-meaning');
                const match = (char && char.textContent.toLowerCase().includes(query)) ||
                              (meaning && meaning.textContent.toLowerCase().includes(query));
                item.style.display = match ? 'flex' : 'none';
            });
        };

        searchInput.addEventListener('input', filterItems);
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            filterItems();
            searchInput.focus();
        });
    }

    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            scrollToTopBtn.style.display =
                (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) ? 'block' : 'none';
        });
        scrollToTopBtn.addEventListener('click', () => {
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
        });
    }
});
