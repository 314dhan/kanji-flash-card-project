document.addEventListener('DOMContentLoaded', () => {
    const kanjiListContainer = document.getElementById('kanji-list-container');

    if (!kanjiListContainer) {
        console.error('Kanji list container not found.');
        return;
    }

    fetch('assets/data/kanji-n4.json')
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

            data.forEach(kanji => {
                const kanjiItem = document.createElement('div');
                kanjiItem.classList.add('kanji-item');

                const kanjiChar = document.createElement('div');
                kanjiChar.classList.add('kanji-char');
                kanjiChar.textContent = kanji.kanji;

                const kanjiMeaning = document.createElement('div');
                kanjiMeaning.classList.add('kanji-meaning');
                kanjiMeaning.textContent = kanji.meaning;

                const onyomiReading = document.createElement('div');
                onyomiReading.classList.add('kanji-reading');
                onyomiReading.innerHTML = `<span style="font-weight: bold;">On:</span> ${kanji.onyomi || '-'}`;

                                const kunyomiReading = document.createElement('div');

                                kunyomiReading.classList.add('kanji-reading');

                                kunyomiReading.innerHTML = `<span style="font-weight: bold;">Kun:</span> ${kanji.kunyomi || '-'}`;

                                const generalReading = document.createElement('div');

                                generalReading.classList.add('kanji-reading');

                                generalReading.innerHTML = `<span style="font-weight: bold;">Reading:</span> ${kanji.reading || '-'}`;

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
});