/**
 * TTS Audio Player for FixIt Theme
 * Supports: play/pause, progress, speed control, prev/next article, auto-play
 */
(function () {
  'use strict';

  // DOM Elements
  const player = document.getElementById('article-audio-player');
  const audio = document.getElementById('article-audio');
  const miniPlayer = document.getElementById('audio-mini-player');

  if (!player || !audio) return;

  // Controls
  const playBtn = document.getElementById('audio-play');
  const playIcon = document.getElementById('play-icon');
  const prevBtn = document.getElementById('audio-prev');
  const nextBtn = document.getElementById('audio-next');
  const rewindBtn = document.getElementById('audio-rewind');
  const forwardBtn = document.getElementById('audio-forward');
  const closeBtn = document.getElementById('audio-player-close');

  // Progress
  const progressContainer = document.getElementById('audio-progress');
  const progressBar = document.getElementById('audio-progress-bar');
  const progressHandle = document.getElementById('audio-progress-handle');
  const currentTimeEl = document.getElementById('audio-current-time');
  const durationEl = document.getElementById('audio-duration');

  // Extra controls
  const speedSelect = document.getElementById('audio-speed-select');
  const autoplayCheckbox = document.getElementById('audio-autoplay-next');

  // Mini player
  const miniPlayBtn = document.getElementById('mini-play');
  const miniPlayIcon = document.getElementById('mini-play-icon');
  const miniProgressBar = document.getElementById('mini-progress-bar');
  const miniCurrentTime = document.getElementById('mini-current-time');
  const miniExpandBtn = document.getElementById('mini-expand');

  // State
  let isDragging = false;

  // Storage keys
  const STORAGE_KEYS = {
    speed: 'audio-player-speed',
    autoplay: 'audio-player-autoplay',
    position: 'audio-player-position-',
  };

  // Initialize
  function init() {
    loadSettings();
    checkAutoPlay();
    bindEvents();
    observePlayerVisibility();
  }

  // Load saved settings
  function loadSettings() {
    // Load speed
    const savedSpeed = localStorage.getItem(STORAGE_KEYS.speed);
    if (savedSpeed) {
      speedSelect.value = savedSpeed;
      audio.playbackRate = parseFloat(savedSpeed);
    }

    // Load autoplay preference
    const savedAutoplay = localStorage.getItem(STORAGE_KEYS.autoplay);
    if (savedAutoplay !== null) {
      autoplayCheckbox.checked = savedAutoplay === 'true';
    }

    // Load position for this article
    const pageKey = window.location.pathname;
    const savedPosition = localStorage.getItem(STORAGE_KEYS.position + pageKey);
    if (savedPosition) {
      audio.currentTime = parseFloat(savedPosition);
    }
  }

  // Check if we should auto-play (coming from previous article)
  function checkAutoPlay() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autoplay') === '1') {
      // Clean up URL
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);

      // Auto-play after a short delay
      setTimeout(() => {
        audio.play().catch(() => {
          // Autoplay might be blocked by browser
          console.log('Autoplay was prevented by browser');
        });
      }, 500);
    }
  }

  // Bind all events
  function bindEvents() {
    // Play/Pause
    playBtn.addEventListener('click', togglePlay);
    miniPlayBtn.addEventListener('click', togglePlay);

    // Audio events
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('error', onError);

    // Navigation
    prevBtn.addEventListener('click', goToPrev);
    nextBtn.addEventListener('click', goToNext);
    rewindBtn.addEventListener('click', () => seek(-10));
    forwardBtn.addEventListener('click', () => seek(10));

    // Progress bar interaction
    progressContainer.addEventListener('click', onProgressClick);
    progressContainer.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);

    // Touch events for mobile
    progressContainer.addEventListener('touchstart', startDrag, { passive: true });
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', endDrag);

    // Speed control
    speedSelect.addEventListener('change', onSpeedChange);

    // Autoplay checkbox
    autoplayCheckbox.addEventListener('change', onAutoplayChange);

    // Close button
    closeBtn.addEventListener('click', hidePlayer);

    // Mini player expand
    miniExpandBtn.addEventListener('click', scrollToPlayer);

    // Save position before leaving
    window.addEventListener('beforeunload', savePosition);

    // Keyboard shortcuts
    document.addEventListener('keydown', onKeydown);
  }

  // Toggle play/pause
  function togglePlay() {
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  }

  // On play
  function onPlay() {
    playIcon.classList.remove('fa-play');
    playIcon.classList.add('fa-pause');
    miniPlayIcon.classList.remove('fa-play');
    miniPlayIcon.classList.add('fa-pause');
    player.classList.add('is-playing');
  }

  // On pause
  function onPause() {
    playIcon.classList.remove('fa-pause');
    playIcon.classList.add('fa-play');
    miniPlayIcon.classList.remove('fa-pause');
    miniPlayIcon.classList.add('fa-play');
    player.classList.remove('is-playing');
    savePosition();
  }

  // On ended - handle auto-play next
  function onEnded() {
    onPause();

    // Clear saved position for this article
    const pageKey = window.location.pathname;
    localStorage.removeItem(STORAGE_KEYS.position + pageKey);

    // Auto-play next if enabled
    if (autoplayCheckbox.checked && !nextBtn.disabled) {
      goToNext();
    }
  }

  // On time update
  function onTimeUpdate() {
    if (isDragging) return;

    const current = audio.currentTime;
    const duration = audio.duration || 0;
    const percent = duration ? (current / duration) * 100 : 0;

    progressBar.style.width = percent + '%';
    progressHandle.style.left = percent + '%';
    miniProgressBar.style.width = percent + '%';

    currentTimeEl.textContent = formatTime(current);
    miniCurrentTime.textContent = formatTime(current);
  }

  // On metadata loaded
  function onLoadedMetadata() {
    durationEl.textContent = formatTime(audio.duration);
  }

  // On error
  function onError() {
    console.error('Audio failed to load');
    player.classList.add('has-error');
  }

  // Format time (seconds to mm:ss or hh:mm:ss)
  function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // Seek relative
  function seek(delta) {
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + delta));
  }

  // Progress click
  function onProgressClick(e) {
    const rect = progressContainer.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  }

  // Drag start
  function startDrag(e) {
    isDragging = true;
    progressContainer.classList.add('is-dragging');
    onDrag(e);
  }

  // Drag move
  function onDrag(e) {
    if (!isDragging) return;

    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const rect = progressContainer.getBoundingClientRect();
    let percent = (clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent));

    progressBar.style.width = (percent * 100) + '%';
    progressHandle.style.left = (percent * 100) + '%';
    currentTimeEl.textContent = formatTime(percent * audio.duration);
  }

  // Drag end
  function endDrag(e) {
    if (!isDragging) return;

    isDragging = false;
    progressContainer.classList.remove('is-dragging');

    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const rect = progressContainer.getBoundingClientRect();
    let percent = (clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent));

    audio.currentTime = percent * audio.duration;
  }

  // Speed change
  function onSpeedChange() {
    const speed = parseFloat(speedSelect.value);
    audio.playbackRate = speed;
    localStorage.setItem(STORAGE_KEYS.speed, speed);
  }

  // Autoplay change
  function onAutoplayChange() {
    localStorage.setItem(STORAGE_KEYS.autoplay, autoplayCheckbox.checked);
  }

  // Navigate to previous article
  function goToPrev() {
    const prevUrl = prevBtn.dataset.prevUrl;
    if (prevUrl) {
      savePosition();
      window.location.href = prevUrl + '?autoplay=1';
    }
  }

  // Navigate to next article
  function goToNext() {
    const nextUrl = nextBtn.dataset.nextUrl;
    if (nextUrl) {
      savePosition();
      window.location.href = nextUrl + '?autoplay=1';
    }
  }

  // Save current position
  function savePosition() {
    const pageKey = window.location.pathname;
    if (audio.currentTime > 0 && audio.currentTime < audio.duration) {
      localStorage.setItem(STORAGE_KEYS.position + pageKey, audio.currentTime);
    }
  }

  // Hide player
  function hidePlayer() {
    player.classList.add('is-hidden');
    miniPlayer.classList.add('is-hidden');
    audio.pause();
  }

  // Scroll to main player
  function scrollToPlayer() {
    player.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Observe player visibility for mini player
  function observePlayerVisibility() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          miniPlayer.classList.remove('is-visible');
        } else if (!audio.paused || audio.currentTime > 0) {
          miniPlayer.classList.add('is-visible');
        }
      });
    }, { threshold: 0 });

    observer.observe(player);
  }

  // Keyboard shortcuts
  function onKeydown(e) {
    // Only handle if not in input/textarea
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

    switch (e.key) {
      case ' ':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowLeft':
        if (e.shiftKey) {
          goToPrev();
        } else {
          seek(-10);
        }
        break;
      case 'ArrowRight':
        if (e.shiftKey) {
          goToNext();
        } else {
          seek(10);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        audio.volume = Math.min(1, audio.volume + 0.1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        audio.volume = Math.max(0, audio.volume - 0.1);
        break;
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
