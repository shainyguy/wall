/**
 * ========================================
 * INSTAGRAM FOLLOWERS WALL - MAIN SCRIPT
 * Interactive Living Wall Experience
 * ========================================
 */

// === CONFIGURATION ===
const CONFIG = {
    INSTAGRAM_URL: 'https://instagram.com/medvedev.tech', // Change to your Instagram
    PARTICLE_COUNT: 50,
    HIGHLIGHT_INTERVAL: 5000,
    SEARCH_DEBOUNCE: 300,
    INTRO_DURATION: 2500,
    GAME_DURATION: 3000,
    MIN_ZOOM: 0.5,
    MAX_ZOOM: 2,
    ZOOM_STEP: 0.1,
    INERTIA_FRICTION: 0.92,
    FLY_IN_ANIMATION: true
};

// === STATE ===
const state = {
    followers: [],
    meta: {},
    zoom: 1,
    panX: 0,
    panY: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    velocityX: 0,
    velocityY: 0,
    isGameActive: false,
    gameTarget: null,
    gameTimer: null,
    searchTimeout: null,
    highlightInterval: null,
    visibleCards: new Set(),
    observer: null
};

// === DOM ELEMENTS ===
let elements = {};

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', init);

async function init() {
    cacheElements();
    await loadFollowers();
    initParticleCanvas();
    renderWall();
    setupEventListeners();
    startHighlightRotation();
    
    // Show intro animation then hide
    setTimeout(() => {
        elements.introOverlay.classList.add('hidden');
        if (CONFIG.FLY_IN_ANIMATION) {
            triggerFlyInAnimation();
        }
    }, CONFIG.INTRO_DURATION);
}

/**
 * Cache DOM elements for performance
 */
function cacheElements() {
    elements = {
        particleCanvas: document.getElementById('particleCanvas'),
        followerCount: document.getElementById('followerCount'),
        todayCount: document.getElementById('todayCount'),
        searchInput: document.getElementById('searchInput'),
        searchClear: document.getElementById('searchClear'),
        searchMessage: document.getElementById('searchMessage'),
        wallWrapper: document.getElementById('wallWrapper'),
        followersWall: document.getElementById('followersWall'),
        gameModeBtn: document.getElementById('gameModeBtn'),
        gameOverlay: document.getElementById('gameOverlay'),
        gameTitle: document.getElementById('gameTitle'),
        gameTarget: document.getElementById('gameTarget'),
        gameTimer: document.getElementById('gameTimer'),
        gameResult: document.getElementById('gameResult'),
        gameCloseBtn: document.getElementById('gameCloseBtn'),
        zoomIn: document.getElementById('zoomIn'),
        zoomOut: document.getElementById('zoomOut'),
        zoomLevel: document.getElementById('zoomLevel'),
        ctaButton: document.getElementById('ctaButton'),
        introOverlay: document.getElementById('introOverlay')
    };
}

/**
 * Load followers from JSON file or fallback data
 */
async function loadFollowers() {
    try {
        const response = await fetch('followers.json');
        const data = await response.json();
        state.followers = data.followers || [];
        state.meta = data.meta || {};
    } catch (error) {
        console.warn('Could not load followers.json, using fallback data');
        state.followers = generateFallbackFollowers(100);
        state.meta = {
            username: 'medvedev.tech',
            todayAdded: 12,
            lastUpdated: new Date().toISOString()
        };
    }
    
    updateStats();
}

/**
 * Update statistics display
 */
function updateStats() {
    elements.followerCount.textContent = state.followers.length.toLocaleString();
    elements.todayCount.textContent = state.meta.todayAdded || state.followers.filter(f => f.isNew).length;
}

// === PARTICLE CANVAS SYSTEM ===
let particles = [];
let particleCtx = null;
let particleAnimationId = null;

function initParticleCanvas() {
    const canvas = elements.particleCanvas;
    particleCtx = canvas.getContext('2d');
    
    resizeCanvas();
    createParticles();
    animateParticles();
    
    window.addEventListener('resize', debounce(resizeCanvas, 200));
}

function resizeCanvas() {
    const canvas = elements.particleCanvas;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function createParticles() {
    particles = [];
    const count = window.innerWidth < 768 ? CONFIG.PARTICLE_COUNT / 2 : CONFIG.PARTICLE_COUNT;
    
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            radius: Math.random() * 2 + 1,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
            opacity: Math.random() * 0.5 + 0.2,
            color: getRandomNeonColor()
        });
    }
}

function getRandomNeonColor() {
    const colors = [
        'rgba(168, 85, 247, ', // purple
        'rgba(236, 72, 153, ', // pink
        'rgba(59, 130, 246, ', // blue
        'rgba(34, 211, 238, '  // cyan
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function animateParticles() {
    particleCtx.clearRect(0, 0, elements.particleCanvas.width, elements.particleCanvas.height);
    
    particles.forEach(particle => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Wrap around screen
        if (particle.x < 0) particle.x = window.innerWidth;
        if (particle.x > window.innerWidth) particle.x = 0;
        if (particle.y < 0) particle.y = window.innerHeight;
        if (particle.y > window.innerHeight) particle.y = 0;
        
        // Draw particle
        particleCtx.beginPath();
        particleCtx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        particleCtx.fillStyle = particle.color + particle.opacity + ')';
        particleCtx.fill();
    });
    
    // Draw connections
    drawParticleConnections();
    
    particleAnimationId = requestAnimationFrame(animateParticles);
}

function drawParticleConnections() {
    const maxDistance = 150;
    
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < maxDistance) {
                const opacity = (1 - distance / maxDistance) * 0.15;
                particleCtx.beginPath();
                particleCtx.moveTo(particles[i].x, particles[i].y);
                particleCtx.lineTo(particles[j].x, particles[j].y);
                particleCtx.strokeStyle = `rgba(168, 85, 247, ${opacity})`;
                particleCtx.lineWidth = 1;
                particleCtx.stroke();
            }
        }
    }
}

// === RENDER WALL ===
function renderWall() {
    elements.followersWall.innerHTML = '';
    
    state.followers.forEach((follower, index) => {
        const card = createFollowerCard(follower, index);
        elements.followersWall.appendChild(card);
    });
    
    // Setup intersection observer for lazy rendering
    setupIntersectionObserver();
}

function createFollowerCard(follower, index) {
    const card = document.createElement('div');
    card.className = 'follower-card';
    card.dataset.username = follower.username.toLowerCase();
    card.dataset.index = index;
    
    if (follower.isNew) {
        card.classList.add('new-badge');
    }
    
    // Avatar with first letter
    const avatar = document.createElement('div');
    avatar.className = 'follower-avatar';
    avatar.textContent = follower.username.charAt(0).toUpperCase();
    
    // Username
    const username = document.createElement('div');
    username.className = 'follower-username';
    username.textContent = `@${follower.username}`;
    
    card.appendChild(avatar);
    card.appendChild(username);
    
    // 3D tilt effect on hover
    card.addEventListener('mousemove', handleCardTilt);
    card.addEventListener('mouseleave', resetCardTilt);
    
    // Click to open Instagram profile
    card.addEventListener('click', () => {
        if (state.isGameActive) {
            checkGameAnswer(follower.username);
        } else {
            window.open(`https://instagram.com/${follower.username}`, '_blank');
        }
    });
    
    return card;
}

function handleCardTilt(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    
    card.style.transform = `perspective(500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
}

function resetCardTilt(e) {
    e.currentTarget.style.transform = '';
}

function setupIntersectionObserver() {
    const options = {
        root: elements.wallWrapper,
        rootMargin: '100px',
        threshold: 0.1
    };
    
    state.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                state.visibleCards.add(entry.target);
            }
        });
    }, options);
    
    document.querySelectorAll('.follower-card').forEach(card => {
        state.observer.observe(card);
    });
}

// === FLY-IN ANIMATION ===
function triggerFlyInAnimation() {
    const cards = document.querySelectorAll('.follower-card');
    
    cards.forEach((card, index) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 500 + 300;
        const flyX = Math.cos(angle) * distance;
        const flyY = Math.sin(angle) * distance;
        const flyRotate = (Math.random() - 0.5) * 180;
        
        card.style.setProperty('--fly-x', `${flyX}px`);
        card.style.setProperty('--fly-y', `${flyY}px`);
        card.style.setProperty('--fly-rotate', `${flyRotate}deg`);
        card.style.animation = `flyIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 20}ms forwards`;
    });
}

// === EVENT LISTENERS ===
function setupEventListeners() {
    // Search
    elements.searchInput.addEventListener('input', handleSearchInput);
    elements.searchClear.addEventListener('click', clearSearch);
    
    // Zoom controls
    elements.zoomIn.addEventListener('click', () => handleZoom(CONFIG.ZOOM_STEP));
    elements.zoomOut.addEventListener('click', () => handleZoom(-CONFIG.ZOOM_STEP));
    elements.wallWrapper.addEventListener('wheel', handleWheelZoom, { passive: false });
    
    // Drag/Pan
    elements.wallWrapper.addEventListener('mousedown', startDrag);
    elements.wallWrapper.addEventListener('mousemove', drag);
    elements.wallWrapper.addEventListener('mouseup', endDrag);
    elements.wallWrapper.addEventListener('mouseleave', endDrag);
    
    // Touch events
    elements.wallWrapper.addEventListener('touchstart', handleTouchStart, { passive: false });
    elements.wallWrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
    elements.wallWrapper.addEventListener('touchend', handleTouchEnd);
    
    // Game mode
    elements.gameModeBtn.addEventListener('click', startGame);
    elements.gameCloseBtn.addEventListener('click', closeGame);
    
    // CTA button
    elements.ctaButton.addEventListener('click', () => {
        window.open(CONFIG.INSTAGRAM_URL, '_blank');
    });
    
    // Keyboard
    document.addEventListener('keydown', handleKeyboard);
}

// === SEARCH FUNCTIONALITY ===
function handleSearchInput(e) {
    const query = e.target.value.trim();
    
    // Show/hide clear button
    elements.searchClear.classList.toggle('visible', query.length > 0);
    
    // Debounce search
    clearTimeout(state.searchTimeout);
    state.searchTimeout = setTimeout(() => performSearch(query), CONFIG.SEARCH_DEBOUNCE);
}

function performSearch(query) {
    if (!query) {
        hideSearchMessage();
        resetAllCards();
        return;
    }
    
    const lowerQuery = query.toLowerCase();
    const cards = document.querySelectorAll('.follower-card');
    let foundCard = null;
    
    cards.forEach(card => {
        const username = card.dataset.username;
        if (username.includes(lowerQuery)) {
            if (!foundCard) foundCard = card;
        }
    });
    
    if (foundCard) {
        showFoundMessage(foundCard.dataset.username);
        scrollToCard(foundCard);
        highlightFoundCard(foundCard);
    } else {
        showNotFoundMessage(query);
    }
}

function scrollToCard(card) {
    const rect = card.getBoundingClientRect();
    const wallRect = elements.wallWrapper.getBoundingClientRect();
    
    const targetX = -(card.offsetLeft - wallRect.width / 2 + card.offsetWidth / 2);
    const targetY = -(card.offsetTop - wallRect.height / 2 + card.offsetHeight / 2);
    
    // Animate to card
    state.zoom = 1.5;
    state.panX = targetX * state.zoom;
    state.panY = targetY * state.zoom;
    
    updateWallTransform();
}

function highlightFoundCard(card) {
    resetAllCards();
    card.classList.add('found');
    
    setTimeout(() => {
        card.classList.remove('found');
    }, 3000);
}

function resetAllCards() {
    document.querySelectorAll('.follower-card').forEach(card => {
        card.classList.remove('found', 'highlighted');
    });
}

function showFoundMessage(username) {
    const content = elements.searchMessage.querySelector('.search-message-content');
    content.innerHTML = `
        <span class="search-message-text">
            <span class="emoji">✨</span>
            <strong>@${username}</strong> найден на стене!
        </span>
    `;
    elements.searchMessage.className = 'search-result-message visible found';
}

function showNotFoundMessage(query) {
    const content = elements.searchMessage.querySelector('.search-message-content');
    content.innerHTML = `
        <span class="search-message-text">
            <span class="emoji">👀</span>
            <strong>@${query}</strong> ещё нет на стене
        </span>
        <button class="cta-button" onclick="window.open('${CONFIG.INSTAGRAM_URL}', '_blank')">
            Подписаться
        </button>
    `;
    elements.searchMessage.className = 'search-result-message visible not-found';
}

function hideSearchMessage() {
    elements.searchMessage.classList.remove('visible');
}

function clearSearch() {
    elements.searchInput.value = '';
    elements.searchClear.classList.remove('visible');
    hideSearchMessage();
    resetAllCards();
    
    // Reset view
    state.zoom = 1;
    state.panX = 0;
    state.panY = 0;
    updateWallTransform();
}

// === ZOOM FUNCTIONALITY ===
function handleZoom(delta) {
    state.zoom = Math.max(CONFIG.MIN_ZOOM, Math.min(CONFIG.MAX_ZOOM, state.zoom + delta));
    updateWallTransform();
    updateZoomLevel();
}

function handleWheelZoom(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -CONFIG.ZOOM_STEP : CONFIG.ZOOM_STEP;
    handleZoom(delta);
}

function updateZoomLevel() {
    elements.zoomLevel.textContent = `${Math.round(state.zoom * 100)}%`;
}

function updateWallTransform() {
    elements.followersWall.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;
    updateZoomLevel();
}

// === DRAG/PAN FUNCTIONALITY ===
function startDrag(e) {
    if (e.target.closest('.follower-card')) return;
    
    state.isDragging = true;
    state.startX = e.clientX - state.panX;
    state.startY = e.clientY - state.panY;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    elements.wallWrapper.style.cursor = 'grabbing';
}

function drag(e) {
    if (!state.isDragging) return;
    
    e.preventDefault();
    
    const x = e.clientX - state.startX;
    const y = e.clientY - state.startY;
    
    state.velocityX = e.clientX - state.lastX;
    state.velocityY = e.clientY - state.lastY;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    
    state.panX = x;
    state.panY = y;
    
    updateWallTransform();
}

function endDrag() {
    if (!state.isDragging) return;
    
    state.isDragging = false;
    elements.wallWrapper.style.cursor = 'grab';
    
    // Apply inertia
    applyInertia();
}

function applyInertia() {
    if (Math.abs(state.velocityX) < 0.5 && Math.abs(state.velocityY) < 0.5) return;
    
    state.velocityX *= CONFIG.INERTIA_FRICTION;
    state.velocityY *= CONFIG.INERTIA_FRICTION;
    
    state.panX += state.velocityX;
    state.panY += state.velocityY;
    
    updateWallTransform();
    
    requestAnimationFrame(applyInertia);
}

// === TOUCH EVENTS ===
let lastTouchDistance = 0;

function handleTouchStart(e) {
    if (e.touches.length === 1) {
        state.isDragging = true;
        state.startX = e.touches[0].clientX - state.panX;
        state.startY = e.touches[0].clientY - state.panY;
        state.lastX = e.touches[0].clientX;
        state.lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
        lastTouchDistance = getTouchDistance(e.touches);
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    
    if (e.touches.length === 1 && state.isDragging) {
        const x = e.touches[0].clientX - state.startX;
        const y = e.touches[0].clientY - state.startY;
        
        state.velocityX = e.touches[0].clientX - state.lastX;
        state.velocityY = e.touches[0].clientY - state.lastY;
        state.lastX = e.touches[0].clientX;
        state.lastY = e.touches[0].clientY;
        
        state.panX = x;
        state.panY = y;
        
        updateWallTransform();
    } else if (e.touches.length === 2) {
        // Pinch zoom
        const distance = getTouchDistance(e.touches);
        const delta = (distance - lastTouchDistance) * 0.01;
        
        handleZoom(delta);
        lastTouchDistance = distance;
    }
}

function handleTouchEnd(e) {
    if (e.touches.length === 0) {
        state.isDragging = false;
        applyInertia();
    }
}

function getTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

// === KEYBOARD CONTROLS ===
function handleKeyboard(e) {
    if (e.key === 'Escape') {
        clearSearch();
        if (state.isGameActive) closeGame();
    }
    
    // Arrow keys for panning
    const step = 50;
    switch (e.key) {
        case 'ArrowUp':
            state.panY += step;
            updateWallTransform();
            break;
        case 'ArrowDown':
            state.panY -= step;
            updateWallTransform();
            break;
        case 'ArrowLeft':
            state.panX += step;
            updateWallTransform();
            break;
        case 'ArrowRight':
            state.panX -= step;
            updateWallTransform();
            break;
        case '+':
        case '=':
            handleZoom(CONFIG.ZOOM_STEP);
            break;
        case '-':
            handleZoom(-CONFIG.ZOOM_STEP);
            break;
    }
}

// === RANDOM HIGHLIGHT ===
function startHighlightRotation() {
    highlightRandomFollower();
    state.highlightInterval = setInterval(highlightRandomFollower, CONFIG.HIGHLIGHT_INTERVAL);
}

function highlightRandomFollower() {
    // Remove previous highlight
    document.querySelectorAll('.follower-card.highlighted').forEach(card => {
        card.classList.remove('highlighted');
    });
    
    // Highlight random card
    const cards = document.querySelectorAll('.follower-card');
    const randomCard = cards[Math.floor(Math.random() * cards.length)];
    randomCard.classList.add('highlighted');
}

// === GAME MODE ===
function startGame() {
    state.isGameActive = true;
    elements.gameModeBtn.classList.add('active');
    
    // Pick random target
    const randomFollower = state.followers[Math.floor(Math.random() * state.followers.length)];
    state.gameTarget = randomFollower.username;
    
    // Setup game UI
    elements.gameTarget.textContent = `@${state.gameTarget}`;
    elements.gameTitle.textContent = '🎮 Найди за 3 секунды!';
    elements.gameResult.classList.add('hidden');
    elements.gameTimer.classList.remove('warning');
    elements.gameOverlay.classList.add('active');
    
    // Start countdown
    let timeLeft = CONFIG.GAME_DURATION;
    elements.gameTimer.textContent = (timeLeft / 1000).toFixed(1);
    
    state.gameTimer = setInterval(() => {
        timeLeft -= 100;
        elements.gameTimer.textContent = (timeLeft / 1000).toFixed(1);
        
        if (timeLeft <= 1000) {
            elements.gameTimer.classList.add('warning');
        }
        
        if (timeLeft <= 0) {
            endGame(false);
        }
    }, 100);
    
    // Close overlay after short delay to let user see target
    setTimeout(() => {
        elements.gameOverlay.classList.remove('active');
    }, 1500);
}

function checkGameAnswer(username) {
    if (username.toLowerCase() === state.gameTarget.toLowerCase()) {
        endGame(true);
    }
}

function endGame(won) {
    clearInterval(state.gameTimer);
    state.isGameActive = false;
    elements.gameModeBtn.classList.remove('active');
    
    elements.gameOverlay.classList.add('active');
    elements.gameTitle.textContent = won ? '🎉 Победа!' : '😢 Время вышло!';
    elements.gameTimer.textContent = '';
    elements.gameResult.classList.remove('hidden');
    elements.gameResult.className = `game-result ${won ? 'win' : 'lose'}`;
    elements.gameResult.innerHTML = `
        <h3>${won ? 'Отлично! Ты нашёл!' : 'Попробуй ещё раз!'}</h3>
        <p>Искали: @${state.gameTarget}</p>
    `;
    
    // Highlight the target
    const targetCard = document.querySelector(`[data-username="${state.gameTarget.toLowerCase()}"]`);
    if (targetCard) {
        targetCard.classList.add('found');
        setTimeout(() => targetCard.classList.remove('found'), 3000);
    }
}

function closeGame() {
    clearInterval(state.gameTimer);
    state.isGameActive = false;
    elements.gameModeBtn.classList.remove('active');
    elements.gameOverlay.classList.remove('active');
}

// === UTILITY FUNCTIONS ===
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// === CLEANUP ===
window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(particleAnimationId);
    clearInterval(state.highlightInterval);
    clearInterval(state.gameTimer);
    if (state.observer) state.observer.disconnect();
});

// === EXPORT FOR TESTING ===
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { state, CONFIG };
}
