// 3D pointer tilt for flashcards.
// The tilt is applied to the wrapper element, so it composes with the
// flip transform that lives on the card inside the wrapper.
// Disabled for touch devices and users who prefer reduced motion.
(function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const MAX_TILT_DEG = 7;
    const LERP_FACTOR = 0.14;

    document.addEventListener('DOMContentLoaded', () => {
        document
            .querySelectorAll('.flashcard-wrapper, .fc-card')
            .forEach(initTilt);
    });

    function initTilt(el) {
        const shine = el.querySelector('.card-shine');
        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;
        let rafId = null;

        function render() {
            currentX += (targetX - currentX) * LERP_FACTOR;
            currentY += (targetY - currentY) * LERP_FACTOR;

            const settled =
                Math.abs(targetX - currentX) < 0.02 &&
                Math.abs(targetY - currentY) < 0.02;

            if (settled) {
                currentX = targetX;
                currentY = targetY;
                rafId = null;
            } else {
                rafId = requestAnimationFrame(render);
            }

            el.style.transform =
                currentX === 0 && currentY === 0
                    ? ''
                    : `rotateX(${currentX.toFixed(2)}deg) rotateY(${currentY.toFixed(2)}deg)`;
        }

        function scheduleRender() {
            if (rafId === null) rafId = requestAnimationFrame(render);
        }

        el.addEventListener('pointermove', (e) => {
            const rect = el.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width - 0.5;
            const relY = (e.clientY - rect.top) / rect.height - 0.5;

            targetY = relX * MAX_TILT_DEG * 2;
            targetX = -relY * MAX_TILT_DEG * 2;

            if (shine) {
                shine.style.left = `${(relX + 0.5) * 100}%`;
                shine.style.top = `${(relY + 0.5) * 100}%`;
                shine.style.opacity = '0.8';
            }
            scheduleRender();
        });

        el.addEventListener('pointerleave', () => {
            targetX = 0;
            targetY = 0;
            if (shine) {
                shine.style.left = '';
                shine.style.top = '';
                shine.style.opacity = '';
            }
            scheduleRender();
        });
    }
})();
