// ===============================
// MOBILE NAV MENU
// ===============================
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

if (navToggle) {
    navToggle.addEventListener("click", () => {
        navLinks.classList.toggle("open");
        navToggle.classList.toggle("active"); // X animasyonu
    });
}

// ===============================
// FILTERS (only on portfolio page)
// ===============================
const filterButtons = document.querySelectorAll('.filter-btn');
const cards = document.querySelectorAll('.card');

if (filterButtons.length > 0) {
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;

            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            cards.forEach(card => {
                const cat = card.dataset.category || '';
                card.style.display = (filter === 'all' || cat.includes(filter)) ? '' : 'none';
            });
        });
    });
}

// ===============================
// LIGHTBOX (only portfolio page)
// ===============================
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');

if (lightbox && lightboxImg && lightboxClose) {
    document.querySelectorAll('.thumb-wrapper').forEach(t => {
        t.addEventListener('click', () => {
            const full = t.dataset.full;
            if (!full) return;
            lightboxImg.src = full;
            lightbox.classList.add('open');
        });
    });

    lightboxClose.addEventListener('click', () => lightbox.classList.remove('open'));

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) lightbox.classList.remove('open');
    });
}

// ===============================
// BEFORE / AFTER SLIDER
// ===============================
document.querySelectorAll('.ba-wrapper').forEach(wrapper => {
    const after = wrapper.querySelector('.ba-after');
    const divider = wrapper.querySelector('.ba-divider');
    const handle = wrapper.querySelector('.ba-handle');

    if (!after || !divider || !handle) return;

    const setPosition = (clientX) => {
        const rect = wrapper.getBoundingClientRect();
        let x = clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const pct = (x / rect.width) * 100;

        after.style.width = pct + '%';
        divider.style.left = pct + '%';
        handle.style.left = pct + '%';
    };

    const startDrag = (e) => {
        e.preventDefault();

        const move = (ev) => {
            const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
            setPosition(clientX);
        };

        const stop = () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', stop);
            window.removeEventListener('touchmove', move);
            window.removeEventListener('touchend', stop);
        };

        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', stop);
        window.addEventListener('touchmove', move);
        window.addEventListener('touchend', stop);
    };

    wrapper.addEventListener('mousedown', startDrag);
    wrapper.addEventListener('touchstart', startDrag, { passive: true });
});

// ===============================
// CONTACT FORM SUBMIT
// ===============================
const form = document.getElementById('contactForm');
const statusBox = document.getElementById('form-status');
const submitBtn = document.getElementById('contactSubmit');

if (form && statusBox && submitBtn) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        statusBox.textContent = '';
        statusBox.style.color = '#111827';

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        try {
            const formData = new FormData(form);

            const res = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (data.success) {
                window.location.href = 'thankyou.html';
            } else {
                statusBox.style.color = '#b91c1c';
                statusBox.textContent =
                    'Your message was flagged as spam. Please add more detail and try again.';
                console.log('Web3Forms error:', data);
            }
        } catch (err) {
            statusBox.style.color = '#b91c1c';
            statusBox.textContent =
                'Unexpected error occurred. Please try again later.';
            console.error(err);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Request';
        }
    });
}

// ===============================
// SUCCESS MESSAGE ON CONTACT PAGE
// ===============================
// SUCCESS MESSAGE HANDLING ON CONTACT PAGE
const urlParams = new URLSearchParams(window.location.search);

if (urlParams.get("success") === "1") {

    // Create success message box
    const successBox = document.createElement("div");
    successBox.className = "success-box";
    successBox.textContent = "Your request has been received. We will get back to you shortly.";

    // Insert message at the top of contact-wrapper
    const wrapper = document.querySelector(".contact-wrapper");
    wrapper.prepend(successBox);

    // Disable form fields
    const formEl = document.querySelector("#contactForm");
    if (formEl) {
        formEl.classList.add("form-disabled");

        const inputs = formEl.querySelectorAll("input, textarea, button");
        inputs.forEach(i => (i.disabled = true));
    }
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, "", cleanUrl);
    /* // Hide success message after 7 seconds
    setTimeout(() => {
        successBox.style.transition = "opacity 0.6s ease-out";
        successBox.style.opacity = "0";
        setTimeout(() => successBox.remove(), 600);
    }, 7000);
    */
}

// ===============================
// US Phone Formatter (###) ###-####
// ===============================
const phoneInput = document.getElementById("phone");

if (phoneInput) {
    phoneInput.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, ""); // sadece rakam
        let formatted = "";

        // (XXX)
        if (value.length > 0) {
            formatted += "(" + value.substring(0, 3);
        }
        if (value.length >= 3) {
            formatted += ")";
        }

        // (XXX) XXX
        if (value.length > 3) {
            formatted += " " + value.substring(3, 6);
        }

        // (XXX) XXX-XXXX
        if (value.length > 6) {
            formatted += "-" + value.substring(6, 10);
        }

        e.target.value = formatted;
    });

    // Backspace davranışını düzelt – mask karakterlerini temizlesin
    phoneInput.addEventListener("keydown", (e) => {
        if (e.key === "Backspace") {
            const value = phoneInput.value.replace(/\D/g, "");
            phoneInput.value = value.substring(0, value.length - 1);
        }
    });
}


