// ==========================================
// 1. CONFIGURACIÓN
// ==========================================
const estructuraGaleria = {
    '2025': { fotos: 100, videos: 2 }
};

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

// --- ESTADO DEL ZOOM ---
let isZooming = false;
let currentScale = 1;
let startDist = 0;
let startX = 0;
let startY = 0;
let translateX = 0;
let translateY = 0;
let lastTranslateX = 0;
let lastTranslateY = 0;

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
            e.stopPropagation(); 
            indiceActual = item.index;
            updateLightboxView(false); 
        };
        reelContainer.appendChild(thumb);
    });
}

// ==========================================
// 5. MOTOR DE ZOOM (FIX: LÍMITES REALES)
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
    
    lightbox.classList.remove('zoom-active');
    lightboxImg.style.transform = `translate(0px, 0px) scale(1)`;
    
    zoomCooldown = true;
    setTimeout(() => { zoomCooldown = false; }, 300);
}

// --- GESTOS TÁCTILES ---
let touchStartX = 0;
let touchEndX = 0;

lightbox.addEventListener('touchstart', (e) => {
    if (e.target.closest('.thumbnail-reel') || e.target.closest('.nav-btn') || e.target.closest('.close-btn')) {
        touchStartX = null; 
        return;
    }

    if (e.touches.length === 2) {
        isZooming = true;
        startDist = getDistance(e.touches);
        lightbox.classList.add('zoom-active'); 
        return;
    }

    if (currentScale > 1 && e.touches.length === 1) {
        startX = e.touches[0].pageX;
        startY = e.touches[0].pageY;
        return;
    }

    if (currentScale === 1 && !zoomCooldown) {
        touchStartX = e.changedTouches[0].screenX;
    }
}, {passive: false});

lightbox.addEventListener('touchmove', (e) => {
    if (touchStartX === null) return; 
    
    // A. ZOOM (PINCH)
    if (isZooming && e.touches.length === 2) {
        e.preventDefault(); 
        const newDist = getDistance(e.touches);
        const scaleChange = newDist / startDist;
        
        let newScale = currentScale * scaleChange;
        if (newScale < 1) newScale = 1; 
        if (newScale > 4) newScale = 4; 

        lightboxImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${newScale})`;
        return; 
    }

    // B. PAN (MOVER CON CÁLCULO DE LÍMITES REALES)
    if (currentScale > 1 && e.touches.length === 1) {
        e.preventDefault(); 
        
        const x = e.touches[0].pageX;
        const y = e.touches[0].pageY;
        const deltaX = x - startX;
        const deltaY = y - startY;

        let nextX = lastTranslateX + deltaX;
        let nextY = lastTranslateY + deltaY;

        // --- AQUÍ ESTÁ LA MAGIA DE LÍMITES ---
        // 1. Calculamos dimensiones reales de la imagen renderizada
        const imgRatio = lightboxImg.naturalWidth / lightboxImg.naturalHeight;
        const winRatio = window.innerWidth / window.innerHeight;
        
        let actualW, actualH;

        // "object-fit: contain" significa que la imagen se ajusta al ancho o al alto
        if (imgRatio > winRatio) {
            // Imagen apaisada (más ancha que la pantalla relativa) -> Ancho manda
            actualW = window.innerWidth;
            actualH = actualW / imgRatio;
        } else {
            // Imagen vertical (más alta que la pantalla relativa) -> Alto manda
            actualH = window.innerHeight;
            actualW = actualH * imgRatio;
        }

        // 2. Calculamos cuánto "sobra" de imagen fuera de la pantalla al hacer zoom
        // (TamañoReal * Zoom - TamañoPantalla) / 2
        const boundsX = (actualW * currentScale - window.innerWidth) / 2;
        const boundsY = (actualH * currentScale - window.innerHeight) / 2;

        // 3. Definimos los límites (Si bounds es negativo, significa que la imagen es chica, límite = 0)
        const limitX = boundsX > 0 ? boundsX : 0;
        const limitY = boundsY > 0 ? boundsY : 0;

        // 4. Aplicamos restricción estricta
        if (nextX > limitX) nextX = limitX;
        if (nextX < -limitX) nextX = -limitX;
        
        if (nextY > limitY) nextY = limitY;
        if (nextY < -limitY) nextY = -limitY;

        translateX = nextX;
        translateY = nextY;

        lightboxImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
    }

}, {passive: false});

lightbox.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;

    // FINALIZAR PINCH
    if (isZooming && e.touches.length < 2) {
        const style = window.getComputedStyle(lightboxImg);
        const matrix = new DOMMatrix(style.transform);
        currentScale = matrix.a; 

        // Umbral para salir del zoom
        if (currentScale < 1.1) {
            resetZoom();
        } else {
            startDist = 0;
            isZooming = false;
        }
    }

    // FINALIZAR PAN
    if (currentScale > 1) {
        lastTranslateX = translateX;
        lastTranslateY = translateY;
    }

    // FINALIZAR SWIPE
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

window.addEventListener('popstate', function(event) {
    if (lightbox.classList.contains('active')) {
        lightbox.classList.remove('active');
        lightboxVideo.pause();
        resetZoom(); 
    }
});

generarBotones();