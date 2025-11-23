// ==========================================
// 1. CONFIGURACIÓN
// ==========================================
const estructuraGaleria = {
    '2025': { fotos: 14, videos: 3 }
};

// RUTA AJUSTADA: pages -> raiz -> images
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

// --- ESTADO DEL ZOOM Y GESTOS ---
let isZooming = false;
let currentScale = 1;
let startDist = 0;
let startX = 0;
let startY = 0;
let translateX = 0;
let translateY = 0;
let lastTranslateX = 0;
let lastTranslateY = 0;

// Variable crítica para evitar el salto de foto al salir del zoom
let zoomCooldown = false; 

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

    // 1. VIDEOS
    for (let j = 1; j <= datos.videos; j++) {
        const num = j.toString().padStart(3, '0');
        const srcVideo = `${RUTA_BASE}${anio}/vid_${num}.mp4`;
        const srcPoster = `${RUTA_BASE}${anio}/vid_${num}_poster.jpg`; 
        
        mediaListActual.push({ type: 'video', src: srcVideo, poster: srcPoster, index: globalIndex });

        const wrapper = document.createElement('div');
        wrapper.className = 'video-wrapper';

        const imgPoster = document.createElement('img');
        imgPoster.src = srcPoster;
        imgPoster.loading = 'lazy'; 
        imgPoster.alt = `Video ${anio}`;
        imgPoster.onerror = function() { this.style.backgroundColor = '#000'; this.style.opacity = '0.5'; };
        
        const overlay = document.createElement('div');
        overlay.className = 'play-icon-overlay';

        wrapper.appendChild(imgPoster);
        wrapper.appendChild(overlay);
        const currentIndex = globalIndex;
        wrapper.onclick = () => openLightbox(currentIndex);
        galleryContainer.appendChild(wrapper);
        globalIndex++; 
    }

    // 2. FOTOS
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
    history.pushState({ modalActive: true }, "", "#view");
    indiceActual = index;
    lightbox.classList.add('active');
    
    resetZoom(); 
    generarReel(); 
    updateLightboxView(true); 
}

function updateLightboxView(autoScrollReel) {
    const media = mediaListActual[indiceActual];
    
    lightboxImg.style.display = 'none';
    lightboxVideo.style.display = 'none';
    lightboxVideo.pause(); 
    resetZoom(); 

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
        if (item.type === 'image') thumb.src = item.src;
        else thumb.src = item.poster;
        
        thumb.className = 'reel-thumb';
        thumb.id = `thumb-${item.index}`;
        thumb.onclick = (e) => {
            e.stopPropagation(); // Detener propagación para proteger el reel
            indiceActual = item.index;
            updateLightboxView(false); 
        };
        reelContainer.appendChild(thumb);
    });
}

// ==========================================
// 5. MOTOR DE ZOOM & GESTOS (CORREGIDO)
// ==========================================

function getDistance(touches) {
    return Math.hypot(
        touches[0].pageX - touches[1].pageX,
        touches[0].pageY - touches[1].pageY
    );
}

function resetZoom() {
    currentScale = 1;
    translateX = 0;
    translateY = 0;
    lastTranslateX = 0;
    lastTranslateY = 0;
    isZooming = false;
    
    // Quitamos el modo inmersivo para que vuelvan los controles
    lightbox.classList.remove('zoom-active');
    lightboxImg.style.transform = `translate(0px, 0px) scale(1)`;
    
    // PROTECCIÓN: Activamos un escudo por 300ms
    // Esto evita que el "soltar el zoom" se interprete como "cambiar foto"
    zoomCooldown = true;
    setTimeout(() => { zoomCooldown = false; }, 300);
}

// --- GESTOS TÁCTILES ---
let touchStartX = 0;
let touchEndX = 0;

// 1. TOUCH START
lightbox.addEventListener('touchstart', (e) => {
    // PROTECCIÓN DEL REEL: Si tocas el reel, anulamos todo el sistema de gestos global
    if (e.target.closest('.thumbnail-reel') || e.target.closest('.nav-btn') || e.target.closest('.close-btn')) {
        touchStartX = null; // Anulamos swipe
        return;
    }

    // A. PINCH (ZOOM) DETECTADO
    if (e.touches.length === 2) {
        isZooming = true;
        startDist = getDistance(e.touches);
        lightbox.classList.add('zoom-active'); // Entrar en modo inmersivo
        return;
    }

    // B. PAN (MOVER FOTO CON ZOOM)
    if (currentScale > 1 && e.touches.length === 1) {
        startX = e.touches[0].pageX;
        startY = e.touches[0].pageY;
        return;
    }

    // C. SWIPE NORMAL (SOLO SI NO HAY ZOOM Y NO ESTAMOS EN COOLDOWN)
    if (currentScale === 1 && !zoomCooldown) {
        touchStartX = e.changedTouches[0].screenX;
    }
}, {passive: false});

// 2. TOUCH MOVE
lightbox.addEventListener('touchmove', (e) => {
    if (touchStartX === null) return; // Si anulamos en start, ignoramos move
    
    // A. LOGICA DE ZOOM (PINCH)
    if (isZooming && e.touches.length === 2) {
        e.preventDefault();
        const newDist = getDistance(e.touches);
        const scaleChange = newDist / startDist;
        
        let newScale = currentScale * scaleChange;
        if (newScale < 1) newScale = 1; // No permitir achicar menos del original
        if (newScale > 4) newScale = 4; // Límite máximo

        lightboxImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${newScale})`;
        return; 
    }

    // B. LOGICA DE PAN (MOVERSE DENTRO DEL ZOOM)
    if (currentScale > 1 && e.touches.length === 1) {
        e.preventDefault();
        const x = e.touches[0].pageX;
        const y = e.touches[0].pageY;
        const deltaX = x - startX;
        const deltaY = y - startY;

        translateX = lastTranslateX + deltaX;
        translateY = lastTranslateY + deltaY;

        lightboxImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
    }

}, {passive: false});

// 3. TOUCH END
lightbox.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;

    // FINALIZAR ZOOM (PINCH)
    if (isZooming && e.touches.length < 2) {
        // Calculamos la escala final aproximada
        const style = window.getComputedStyle(lightboxImg);
        const matrix = new DOMMatrix(style.transform);
        currentScale = matrix.a;

        // LOGICA CRÍTICA: ¿Nos quedamos con zoom o salimos?
        // Si el usuario soltó y la escala es casi 1 (o menos), RESTAURAMOS.
        if (currentScale < 1.1) {
            resetZoom(); // Esto activa el zoomCooldown
        } else {
            // Si sigue con zoom, guardamos el estado actual
            startDist = 0;
        }
        // No ponemos isZooming = false aquí para permitir el Pan posterior si quedó con zoom
    }

    // FINALIZAR PAN
    if (currentScale > 1) {
        lastTranslateX = translateX;
        lastTranslateY = translateY;
    }

    // FINALIZAR SWIPE (SOLO SI NO HAY ZOOM Y NO ESTAMOS EN COOLDOWN)
    if (currentScale === 1 && !isZooming && !zoomCooldown) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }
});

// ==========================================
// 6. NAVEGACIÓN
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

function handleSwipe() {
    if (!touchStartX || !touchEndX) return;
    if (touchEndX < touchStartX - 50) nextSlide(); 
    if (touchEndX > touchStartX + 50) prevSlide(); 
}

document.getElementById('next-btn').onclick = nextSlide;
document.getElementById('prev-btn').onclick = prevSlide;

document.querySelector('.close-btn').onclick = () => {
    history.back();
};

document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
    if (e.key === 'Escape') history.back();
});

// MANEJO DEL GESTO ATRÁS (ANDROID)
window.addEventListener('popstate', function(event) {
    if (lightbox.classList.contains('active')) {
        lightbox.classList.remove('active');
        lightboxVideo.pause();
        resetZoom(); 
    }
});

generarBotones();