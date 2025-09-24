// Countdown Timer
function updateCountdown() {
    const eventDate = new Date('November 7, 2025 08:00:00').getTime();
    const now = new Date().getTime();
    const distance = eventDate - now;
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    document.getElementById("days").innerHTML = days.toString().padStart(2, '0');
    document.getElementById("hours").innerHTML = hours.toString().padStart(2, '0');
    document.getElementById("minutes").innerHTML = minutes.toString().padStart(2, '0');
    document.getElementById("seconds").innerHTML = seconds.toString().padStart(2, '0');
}

setInterval(updateCountdown, 1000);
updateCountdown();

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    document.querySelectorAll('.modal').forEach(modal => {
        if (event.target === modal) {
            closeModal(modal.id);
        }
    });

});





// ===== MENÚ HAMBURGUESA =====
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

function toggleMenu() {
    navMenu.classList.toggle('active');
}

// Evento para hamburguesa
hamburger.addEventListener('click', function(e) {
    e.stopPropagation();
    toggleMenu();
});

// Cerrar menú al hacer clic en enlaces
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// Cerrar menú al hacer clic fuera
document.addEventListener('click', function(e) {
    if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
        navMenu.classList.remove('active');
    }
});





// ===== CAROUSEL FUNCTIONALITY =====
document.addEventListener('DOMContentLoaded', function() {
    const carouselSlides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    let currentSlide = 0;
    let autoSlideInterval;

    function showSlide(n) {
        carouselSlides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        currentSlide = (n + carouselSlides.length) % carouselSlides.length;
        carouselSlides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }

    function nextSlide() {
        showSlide(currentSlide + 1);
    }

    // Auto slide cada 3 segundos
    function startAutoSlide() {
        stopAutoSlide();
        autoSlideInterval = setInterval(nextSlide, 3000);
    }

    function stopAutoSlide() {
        if (autoSlideInterval) {
            clearInterval(autoSlideInterval);
        }
    }

    // Event listeners para los dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            stopAutoSlide();
            showSlide(index);
            startAutoSlide();
        });
    });

    // Pausar auto slide cuando el mouse está sobre el carousel
    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', stopAutoSlide);
        carouselContainer.addEventListener('mouseleave', startAutoSlide);
        
        carouselContainer.addEventListener('touchstart', stopAutoSlide);
        carouselContainer.addEventListener('touchend', startAutoSlide);
    }

    // Iniciar carousel
    startAutoSlide();
});
