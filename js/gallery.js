// ==========================================
// 1. CONFIGURACIÓN
// ==========================================
const estructuraGaleria = {
    '2027': { fotos: 2, videos: 1 },
    '2026': { fotos: 3, videos: 0 },
    '2025': { fotos: 14, videos: 3 }
};

// RUTA AJUSTADA: Como estamos en /pages/, subir a la raíz (..) y entrar a images
const RUTA_BASE = '../images/gallery/'; 








// ==========================================
// 2. REFERENCIAS DOM & ESTADO
// ==========================================
const galleryContainer = document.getElementById('gallery-container');
const filterContainer = document.getElementById('filter-container');

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxVideo = document.getElementById('lightbox-video');
const reelContainer = document.getElementById('thumbnail-reel');

let mediaListActual = []; 
let indiceActual = 0; 








// ==========================================
// 3. GENERACIÓN DE CONTENIDO
// ==========================================

function generarBotones() {
    const anios = Object.keys(estructuraGaleria).sort((a, b) => b - a);
    
    anios.forEach((anio, index) => {
        const btn = document.createElement('button');
        btn.textContent = anio;
        btn.className = 'filter-btn';
        
        if (index === 0) {
            btn.classList.add('active');
            cargarContenido(anio);
        }

        btn.onclick = () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            cargarContenido(anio);
        };
        filterContainer.appendChild(btn);
    });
}

function cargarContenido(anio) {
    galleryContainer.innerHTML = ''; 
    mediaListActual = []; 
    const datos = estructuraGaleria[anio];
    let globalIndex = 0; 




    // ------------------------------------------------------
    // 1. VIDEOS (Con Posters .jpg para velocidad)
    // ------------------------------------------------------
    for (let j = 1; j <= datos.videos; j++) {
        const num = j.toString().padStart(3, '0');
        
        const srcVideo = `${RUTA_BASE}${anio}/vid_${num}.mp4`;
        const srcPoster = `${RUTA_BASE}${anio}/vid_${num}_poster.jpg`; 
        
        mediaListActual.push({ 
            type: 'video', 
            src: srcVideo, 
            poster: srcPoster, 
            index: globalIndex 
        });

        const wrapper = document.createElement('div');
        wrapper.className = 'video-wrapper';

        const imgPoster = document.createElement('img');
        imgPoster.src = srcPoster;
        imgPoster.loading = 'lazy'; 
        imgPoster.alt = `Video ${anio}`;

        // Fallback visual si falta el poster
        imgPoster.onerror = function() { 
            this.style.backgroundColor = '#000';
            this.style.opacity = '0.5';
        };
        
        const overlay = document.createElement('div');
        overlay.className = 'play-icon-overlay';

        wrapper.appendChild(imgPoster);
        wrapper.appendChild(overlay);

        const currentIndex = globalIndex;
        wrapper.onclick = () => openLightbox(currentIndex);

        galleryContainer.appendChild(wrapper);
        globalIndex++; 
    }




    // ------------------------------------------------------
    // 2. FOTOS
    // ------------------------------------------------------
    for (let i = 1; i <= datos.fotos; i++) {
        const num = i.toString().padStart(3, '0');
        const src = `${RUTA_BASE}${anio}/img_${num}.jpg`;
        
        mediaListActual.push({ type: 'image', src: src, index: globalIndex });

        const img = document.createElement('img');
        img.src = src;
        img.className = 'gallery-item';
        img.loading = 'lazy'; 
        
        img.onerror = function() { this.style.display = 'none'; };

        const currentIndex = globalIndex;
        img.onclick = () => openLightbox(currentIndex);
        
        galleryContainer.appendChild(img);
        globalIndex++; 
    }
}








// ==========================================
// 4. LÓGICA LIGHTBOX & REEL
// ==========================================

function openLightbox(index) {
    // --- GESTIÓN DEL HISTORIAL (ANDROID BACK BUTTON) ---
    // Agregamos un estado al historial. Esto no recarga la página.
    // Permite que al dar "Atrás", se cierre el modal en lugar de salir de la web.
    history.pushState({ modalActive: true }, "", "#view");

    indiceActual = index;
    lightbox.classList.add('active');
    generarReel(); 
    updateLightboxView(true); 
}

function updateLightboxView(autoScrollReel) {
    const media = mediaListActual[indiceActual];
    
    lightboxImg.style.display = 'none';
    lightboxVideo.style.display = 'none';
    lightboxVideo.pause(); 

    if (media.type === 'image') {
        lightboxImg.src = media.src;
        lightboxImg.style.display = 'block';
    } else {
        lightboxVideo.src = media.src;
        lightboxVideo.style.display = 'block';
        lightboxVideo.play(); 
    }

    document.querySelectorAll('.reel-thumb').forEach(t => t.classList.remove('active'));
    const activeThumb = document.getElementById(`thumb-${indiceActual}`);
    
    if (activeThumb) {
        activeThumb.classList.add('active');
        if (autoScrollReel) {
            activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
}

function generarReel() {
    reelContainer.innerHTML = ''; 
    mediaListActual.forEach((item) => {
        const thumb = document.createElement('img');
        
        if (item.type === 'image') {
            thumb.src = item.src;
        } else {
            thumb.src = item.poster;
        }
        
        thumb.className = 'reel-thumb';
        thumb.id = `thumb-${item.index}`;
        
        thumb.onclick = () => {
            indiceActual = item.index;
            updateLightboxView(false); 
        };

        reelContainer.appendChild(thumb);
    });
}








// ==========================================
// 5. NAVEGACIÓN & SWIPE
// ==========================================

function nextSlide() {
    indiceActual++;
    if (indiceActual >= mediaListActual.length) indiceActual = 0; 
    updateLightboxView(true); 
}

function prevSlide() {
    indiceActual--;
    if (indiceActual < 0) indiceActual = mediaListActual.length - 1; 
    updateLightboxView(true); 
}

document.getElementById('next-btn').onclick = nextSlide;
document.getElementById('prev-btn').onclick = prevSlide;

// --- CIERRE UNIFICADO (X) ---
document.querySelector('.close-btn').onclick = () => {
    // Simulamos el botón "Atrás" del navegador.
    // Esto dispara el evento 'popstate' que se encarga de cerrar el modal.
    // Mantiene el filtro y el scroll intactos.
    history.back();
};

// --- TECLADO ---
document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
    if (e.key === 'Escape') {
        // La tecla Escape también debe retroceder en el historial
        history.back();
    }
});

// --- SWIPE TÁCTIL ---
let touchStartX = 0;
let touchEndX = 0;

lightbox.addEventListener('touchstart', (e) => {
    if (e.target.closest('.thumbnail-reel')) {
        touchStartX = null; 
        return;
    }
    touchStartX = e.changedTouches[0].screenX;
}, {passive: true});

lightbox.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, {passive: true});

function handleSwipe() {
    if (touchEndX < touchStartX - 50) nextSlide(); 
    if (touchEndX > touchStartX + 50) prevSlide(); 
}








// ==========================================
// 6. DETECCIÓN DE NAVEGACIÓN "ATRÁS"
// ==========================================
window.addEventListener('popstate', function(event) {
    // Este evento se dispara cuando el usuario presiona "Atrás" (Celular o PC)
    // O cuando ejecutamos history.back()
    if (lightbox.classList.contains('active')) {
        // 1. Ocultamos visualmente
        lightbox.classList.remove('active');
        // 2. Pausamos video
        lightboxVideo.pause();
        // NOTA: No tocamos el DOM de la grilla, así que el filtro y scroll se mantienen.
    }
});




// INICIAR
generarBotones();