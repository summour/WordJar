// WordJar Study UI V2
// Adds Skip controls and makes Flashcard action buttons reliable on mobile Safari/WebView.
// Keeps card tap-to-reveal separate from bottom controls so rating/skip taps are not swallowed by the card layer.

(function installWordJarStudyUI() {
  if (window.__wordjarStudyUIInstalled) return;
  window.__wordjarStudyUIInstalled = true;

  let fcTapLock = false;

  function injectStyles() {
    if (document.getElementById('studySkipStyle')) return;
    const style = document.createElement('style');
    style.id = 'studySkipStyle';
    style.textContent = `
      #pg-fc #fcMain {
        position: relative !important;
        isolation: isolate !important;
      }

      #pg-fc .fc-scene {
        position: relative !important;
        z-index: 1 !important;
        pointer-events: auto !important;
      }

      #pg-fc .fc-action-area {
        position: relative !important;
        z-index: 30 !important;
        pointer-events: auto !important;
        touch-action: manipulation !important;
        -webkit-user-select: none !important;
        user-select: none !important;
      }

      #pg-fc .fc-action-area button,
      #pg-fc .rb,
      #pg-fc .fc-skip-btn {
        position: relative !important;
        z-index: 31 !important;
        pointer-events: auto !important;
        touch-action: manipulation !important;
        -webkit-tap-highlight-color: transparent !important;
      }

      .study-action-split {
        display: grid !important;
        grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr) !important;
        gap: 10px !important;
        width: 100% !important;
      }
      .study-action-split .btn {
        width: 100% !important;
        min-width: 0 !important;
        padding: 14px 10px !important;
        font-size: 15px !important;
        border-radius: 14px !important;
      }
      .fc-skip-row {
        display: flex !important;
        justify-content: center !important;
        margin-bottom: 10px !important;
        position: relative !important;
        z-index: 31 !important;
        pointer-events: auto !important;
      }
      .fc-skip-btn {
        min-width: 96px !important;
        height: 38px !important;
        border-radius: 999px !important;
        font-size: 13px !important;
        font-weight: 800 !important;
      }
    `;
    document.head.appendChild(style);
  }

  function stopControlEvent(event) {
    if (!event) return;
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
  }

  function runOncePerTap(fn) {
    if (fcTapLock) return;
    fcTapLock = true;
    try { fn(); }
    finally { setTimeout(() => { fcTapLock = false; }, 180); }
  }

  window.skipLearn = function skipLearn() {
    if (!Array.isArray(lList) || !lList.length) return;
    lI++;
    renderLearn();
  };

  window.skipFC = function skipFC() {
    if (!Array.isArray(fcQ) || !fcQ.length) return;
    fcI++;
    renderFC();
  };

  function safeRateFC(q) {
    if (typeof window.rateFC === 'function') {
      window.rateFC(q);
      return;
    }
    if (typeof rateFC === 'function') rateFC(q);
  }

  function handleControlTap(event, fn) {
    stopControlEvent(event);
    runOncePerTap(fn);
  }

  function ensureLearnSkipButton() {
    injectStyles();
    const area = document.querySelector('#pg-learn #lMain .fc-action-area');
    if (!area) return;
    if (area.querySelector('#btnSkipLearn')) return;

    area.innerHTML = `
      <div class="study-action-split">
        <button id="btnSkipLearn" class="btn btn-s" type="button">Skip</button>
        <button id="btnMarkLearned" class="btn btn-p" type="button">Mark as Learned</button>
      </div>
    `;

    const skip = document.getElementById('btnSkipLearn');
    const learned = document.getElementById('btnMarkLearned');
    if (skip) bindControl(skip, () => skipLearn());
    if (learned) bindControl(learned, () => nextLearn());
  }

  function ensureFCSkipButton() {
    injectStyles();
    const actionArea = document.querySelector('#pg-fc #fcMain .fc-action-area');
    const ratingMode = document.getElementById('fcRatingMode');
    if (!actionArea || !ratingMode) return;
    if (!document.getElementById('btnSkipFC')) {
      const row = document.createElement('div');
      row.className = 'fc-skip-row';
      row.innerHTML = `<button id="btnSkipFC" class="btn btn-s fc-skip-btn" type="button">Skip</button>`;
      actionArea.insertBefore(row, ratingMode);
    }

    const skip = document.getElementById('btnSkipFC');
    if (skip) bindControl(skip, () => skipFC());
  }

  function bindControl(button, fn) {
    if (!button || button.dataset.wordjarTouchBound === 'true') return;
    button.dataset.wordjarTouchBound = 'true';

    button.addEventListener('pointerup', event => handleControlTap(event, fn), { passive: false });
    button.addEventListener('touchend', event => handleControlTap(event, fn), { passive: false });
    button.addEventListener('click', event => handleControlTap(event, fn), { passive: false });
  }

  function bindFlashcardRatingButtons() {
    const pairs = [
      ['.rb-a', 0],
      ['.rb-h', 3],
      ['.rb-g', 4],
      ['.rb-e', 5]
    ];

    pairs.forEach(([selector, rating]) => {
      const btn = document.querySelector(`#pg-fc ${selector}`);
      if (!btn) return;
      btn.removeAttribute('onclick');
      bindControl(btn, () => safeRateFC(rating));
    });
  }

  function hardenFlashcardControls() {
    injectStyles();
    ensureFCSkipButton();
    bindFlashcardRatingButtons();

    const actionArea = document.querySelector('#pg-fc #fcMain .fc-action-area');
    if (!actionArea || actionArea.dataset.wordjarStopBound === 'true') return;
    actionArea.dataset.wordjarStopBound = 'true';
    ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'click'].forEach(type => {
      actionArea.addEventListener(type, event => {
        if (event.target?.closest?.('button')) event.stopPropagation();
      }, { passive: true });
    });
  }

  const originalRenderLearn = window.renderLearn;
  window.renderLearn = function renderLearnWithSkip() {
    if (typeof originalRenderLearn === 'function') originalRenderLearn();
    ensureLearnSkipButton();
  };

  const originalRenderFC = window.renderFC;
  window.renderFC = function renderFCWithMobileSafeControls() {
    if (typeof originalRenderFC === 'function') originalRenderFC();
    hardenFlashcardControls();
  };

  document.addEventListener('DOMContentLoaded', () => {
    ensureLearnSkipButton();
    hardenFlashcardControls();
  }, { once: true });

  setTimeout(() => {
    ensureLearnSkipButton();
    hardenFlashcardControls();
  }, 0);
})();
