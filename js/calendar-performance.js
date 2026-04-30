// WordJar Calendar Performance V2
// Scrollable week strip + centered monthly popup + calendar color setting.

(function installCalendarPerformance() {
  if (window.__wordjarCalendarPerformanceInstalledV2) return;
  window.__wordjarCalendarPerformanceInstalledV2 = true;

  const STYLE_ID = 'wordjarCalendarStyle';
  const MODAL_ID = 'wordjarCalendarModal';
  const SETTINGS_ID = 'wordjarCalendarSettingsCard';
  const DEFAULT_COLOR = '#f59e0b';
  const PRESET_COLORS = ['#09090b', '#f59e0b', '#3b82f6', '#ef4444', '#10b981', '#a855f7'];
  const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  let stripKey = '';
  let monthCursor = new Date();

  function ensureCalendarSettings() {
    window.D = window.D || {};
    D.settings = D.settings || {};
    if (!D.settings.calendarAccentColor) D.settings.calendarAccentColor = DEFAULT_COLOR;
    applyCalendarColor();
  }

  function getCalendarColor() {
    ensureCalendarSettings();
    return D.settings.calendarAccentColor || DEFAULT_COLOR;
  }

  function applyCalendarColor() {
    const color = D.settings?.calendarAccentColor || DEFAULT_COLOR;
    document.documentElement.style.setProperty('--wordjar-calendar-accent', color);
  }

  function saveCalendarColor(color) {
    ensureCalendarSettings();
    D.settings.calendarAccentColor = color || DEFAULT_COLOR;
    applyCalendarColor();
    if (typeof save === 'function') save();
    renderCalendar(true);
    renderMonthCalendar();
    syncSettingsColorUI();
  }

  function dateKey(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toDateString();
  }

  function sameDay(a, b) {
    return dateKey(a) === dateKey(b);
  }

  function isStudiedDate(date) {
    const today = new Date();
    return sameDay(date, today) ? Number(D.todayDone || 0) > 0 : !!(D.studyDays || {})[dateKey(date)];
  }

  function stripStateKey() {
    return [
      new Date().toDateString(),
      Number(D.todayDone || 0),
      JSON.stringify(D.studyDays || {}),
      getCalendarColor()
    ].join('::');
  }

  function makeDate(offset) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    return date;
  }

  function buildStripHtml() {
    const days = [];
    for (let offset = -21; offset <= 14; offset++) days.push(makeDate(offset));

    return days.map(date => {
      const todayClass = sameDay(date, new Date()) ? ' is-today' : '';
      const studiedClass = isStudiedDate(date) ? ' is-studied' : '';
      return `
        <button class="wordjar-calendar-strip-day${todayClass}${studiedClass}" type="button" data-date="${dateKey(date)}" aria-label="Open calendar for ${dateKey(date)}">
          <span class="wordjar-calendar-strip-label">${DAY_NAMES[date.getDay()]}</span>
          <span class="wordjar-calendar-strip-circle">${date.getDate()}</span>
        </button>
      `;
    }).join('');
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .calendar-strip{
        display:flex;
        align-items:center;
        gap:18px;
        overflow-x:auto;
        overscroll-behavior-x:contain;
        scroll-snap-type:x mandatory;
        -webkit-overflow-scrolling:touch;
        padding:14px 20px 18px;
        margin:0 -20px;
        cursor:grab;
      }

      .calendar-strip::-webkit-scrollbar{display:none}

      .wordjar-calendar-strip-day{
        flex:0 0 58px;
        display:flex;
        flex-direction:column;
        align-items:center;
        gap:12px;
        border:0;
        background:transparent;
        color:var(--ink);
        font:inherit;
        padding:0;
        scroll-snap-align:center;
        cursor:pointer;
        touch-action:pan-x;
      }

      .wordjar-calendar-strip-label{
        color:var(--ink2);
        font-size:13px;
        font-weight:950;
        letter-spacing:.05em;
      }

      .wordjar-calendar-strip-circle{
        width:48px;
        height:48px;
        border-radius:999px;
        display:grid;
        place-items:center;
        background:var(--wordjar-calendar-accent, #f59e0b);
        color:#fff;
        font-size:20px;
        font-weight:950;
        box-shadow:0 8px 18px color-mix(in srgb, var(--wordjar-calendar-accent, #f59e0b) 32%, transparent);
      }

      .wordjar-calendar-strip-day:not(.is-studied) .wordjar-calendar-strip-circle{
        background:var(--sur);
        color:var(--ink);
        border:1px solid var(--bdr);
        box-shadow:none;
      }

      .wordjar-calendar-strip-day.is-today .wordjar-calendar-strip-circle{
        outline:3px solid color-mix(in srgb, var(--wordjar-calendar-accent, #f59e0b) 18%, transparent);
        outline-offset:3px;
      }

      .wordjar-calendar-modal-card{
        width:min(92vw, 390px);
        max-height:82vh;
        overflow:auto;
        position:relative;
        z-index:1;
      }

      .wordjar-calendar-modal-top{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        margin-bottom:16px;
      }

      .wordjar-calendar-title-wrap{min-width:0}

      .wordjar-calendar-modal-title{
        color:var(--ink);
        font-size:20px;
        font-weight:950;
        letter-spacing:-.04em;
        line-height:1.1;
      }

      .wordjar-calendar-modal-subtitle{
        color:var(--ink2);
        font-size:12px;
        font-weight:750;
        line-height:1.35;
        margin-top:5px;
      }

      .wordjar-calendar-nav-row{
        display:grid;
        grid-template-columns:44px minmax(0, 1fr) 44px;
        align-items:center;
        gap:10px;
        margin-bottom:14px;
      }

      .wordjar-calendar-nav-btn,
      .wordjar-calendar-close-btn{
        width:44px;
        height:44px;
        border:1px solid var(--bdr);
        border-radius:16px;
        background:var(--sur);
        color:var(--ink);
        display:grid;
        place-items:center;
        cursor:pointer;
      }

      .wordjar-calendar-nav-btn svg,
      .wordjar-calendar-close-btn svg{
        width:20px;
        height:20px;
        stroke-width:2.4;
      }

      .wordjar-calendar-month-label{
        text-align:center;
        font-size:16px;
        font-weight:950;
        color:var(--ink);
      }

      .wordjar-calendar-weekdays,
      .wordjar-calendar-month-grid{
        display:grid;
        grid-template-columns:repeat(7, 1fr);
        gap:7px;
      }

      .wordjar-calendar-weekday{
        text-align:center;
        color:var(--ink2);
        font-size:12px;
        font-weight:950;
        padding:4px 0;
      }

      .wordjar-calendar-date{
        aspect-ratio:1;
        border:1px solid var(--bdr);
        border-radius:15px;
        background:var(--sur);
        color:var(--ink);
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        gap:4px;
        font-size:15px;
        font-weight:900;
      }

      .wordjar-calendar-date.is-muted{
        opacity:.35;
      }

      .wordjar-calendar-date.is-studied{
        background:var(--wordjar-calendar-accent, #f59e0b);
        border-color:var(--wordjar-calendar-accent, #f59e0b);
        color:#fff;
        box-shadow:0 8px 18px color-mix(in srgb, var(--wordjar-calendar-accent, #f59e0b) 24%, transparent);
      }

      .wordjar-calendar-date.is-today{
        outline:3px solid color-mix(in srgb, var(--wordjar-calendar-accent, #f59e0b) 18%, transparent);
        outline-offset:2px;
      }

      .wordjar-calendar-dot{
        width:5px;
        height:5px;
        border-radius:999px;
        background:currentColor;
        opacity:.7;
      }

      .wordjar-calendar-summary{
        margin-top:14px;
        padding:12px 14px;
        border:1px solid var(--bdr);
        border-radius:18px;
        background:var(--sur);
        color:var(--ink2);
        font-size:12px;
        font-weight:750;
        line-height:1.45;
      }

      .wordjar-calendar-settings-presets{
        display:flex;
        flex-wrap:wrap;
        gap:10px;
        margin-top:12px;
      }

      .wordjar-calendar-color-btn{
        width:34px;
        height:34px;
        border-radius:999px;
        border:2px solid var(--bdr);
        background:var(--wordjar-calendar-swatch);
        cursor:pointer;
      }

      .wordjar-calendar-color-btn.is-selected{
        box-shadow:0 0 0 4px color-mix(in srgb, var(--wordjar-calendar-swatch) 18%, transparent);
        border-color:var(--ink);
      }

      .wordjar-calendar-color-input{
        width:100%;
        height:46px;
        border:1px solid var(--bdr);
        border-radius:16px;
        background:var(--sur);
        padding:8px;
        margin-top:12px;
        cursor:pointer;
      }
    `;
    document.head.appendChild(style);
  }

  function renderCalendar(force = false) {
    ensureCalendarSettings();
    injectStyles();

    const el = document.getElementById('weekCalendar');
    if (!el) return;

    const nextKey = stripStateKey();
    if (force || nextKey !== stripKey) {
      stripKey = nextKey;
      el.innerHTML = buildStripHtml();
      bindStripEvents(el);
      centerToday(el);
    }
  }

  function bindStripEvents(el) {
    el.querySelectorAll('.wordjar-calendar-strip-day').forEach(button => {
      button.onclick = event => {
        event.preventDefault();
        openCalendarModal(button.dataset.date);
      };
    });
  }

  function centerToday(el) {
    requestAnimationFrame(() => {
      const todayButton = el.querySelector('.wordjar-calendar-strip-day.is-today');
      if (!todayButton) return;
      todayButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
  }

  function ensureCalendarModal() {
    let modal = document.getElementById(MODAL_ID);
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.className = 'overlay';
    modal.innerHTML = `
      <div class="modal-card wordjar-calendar-modal-card" onclick="event.stopPropagation()">
        <div class="wordjar-calendar-modal-top">
          <div class="wordjar-calendar-title-wrap">
            <div class="wordjar-calendar-modal-title">Study Calendar</div>
            <div class="wordjar-calendar-modal-subtitle">Tap the weekly strip to open this monthly view.</div>
          </div>
          <button class="wordjar-calendar-close-btn" type="button" id="wordjarCalendarCloseBtn" aria-label="Close calendar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="wordjar-calendar-nav-row">
          <button class="wordjar-calendar-nav-btn" type="button" id="wordjarCalendarPrevBtn" aria-label="Previous month">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div class="wordjar-calendar-month-label" id="wordjarCalendarMonthLabel"></div>
          <button class="wordjar-calendar-nav-btn" type="button" id="wordjarCalendarNextBtn" aria-label="Next month">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        <div class="wordjar-calendar-weekdays">
          ${DAY_NAMES.map(day => `<div class="wordjar-calendar-weekday">${day}</div>`).join('')}
        </div>
        <div class="wordjar-calendar-month-grid" id="wordjarCalendarMonthGrid"></div>
        <div class="wordjar-calendar-summary" id="wordjarCalendarSummary"></div>
      </div>
    `;

    modal.onclick = event => {
      if (event.target === modal) closeCalendarModal();
    };

    document.body.appendChild(modal);
    document.getElementById('wordjarCalendarCloseBtn').onclick = closeCalendarModal;
    document.getElementById('wordjarCalendarPrevBtn').onclick = () => moveMonth(-1);
    document.getElementById('wordjarCalendarNextBtn').onclick = () => moveMonth(1);
    return modal;
  }

  function openCalendarModal(dateText) {
    const selected = dateText ? new Date(dateText) : new Date();
    monthCursor = Number.isNaN(selected.getTime()) ? new Date() : selected;
    ensureCalendarModal().classList.add('open');
    renderMonthCalendar();
  }

  function closeCalendarModal() {
    const modal = document.getElementById(MODAL_ID);
    if (modal) modal.classList.remove('open');
  }

  function moveMonth(delta) {
    monthCursor = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + delta, 1);
    renderMonthCalendar();
  }

  function getMonthDates(cursor) {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }

  function renderMonthCalendar() {
    const label = document.getElementById('wordjarCalendarMonthLabel');
    const grid = document.getElementById('wordjarCalendarMonthGrid');
    const summary = document.getElementById('wordjarCalendarSummary');
    if (!label || !grid || !summary) return;

    const cursor = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const dates = getMonthDates(cursor);
    const studiedInMonth = dates.filter(date => date.getMonth() === cursor.getMonth() && isStudiedDate(date)).length;

    label.textContent = `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`;
    grid.innerHTML = dates.map(date => {
      const mutedClass = date.getMonth() === cursor.getMonth() ? '' : ' is-muted';
      const todayClass = sameDay(date, new Date()) ? ' is-today' : '';
      const studiedClass = isStudiedDate(date) ? ' is-studied' : '';
      const dot = isStudiedDate(date) ? '<span class="wordjar-calendar-dot"></span>' : '';
      return `<div class="wordjar-calendar-date${mutedClass}${todayClass}${studiedClass}"><span>${date.getDate()}</span>${dot}</div>`;
    }).join('');

    summary.textContent = `${studiedInMonth} study day${studiedInMonth === 1 ? '' : 's'} in this month. Today reviewed: ${Number(D.todayDone || 0)} word${Number(D.todayDone || 0) === 1 ? '' : 's'}.`;
  }

  function ensureCalendarSettingsCard() {
    ensureCalendarSettings();
    injectStyles();

    const accountPage = document.getElementById('pg-account');
    if (!accountPage || document.getElementById(SETTINGS_ID)) return;

    const cloudPanel = document.getElementById('cloudSyncPanel');
    const card = document.createElement('div');
    card.className = 'settings-card';
    card.id = SETTINGS_ID;
    card.innerHTML = `
      <div class="settings-card-title">Calendar Color</div>
      <div class="format-label">Customize the study calendar highlight color.</div>
      <div class="wordjar-calendar-settings-presets" id="wordjarCalendarColorPresets"></div>
      <input class="wordjar-calendar-color-input" id="wordjarCalendarColorInput" type="color" aria-label="Custom calendar color">
    `;

    if (cloudPanel) accountPage.insertBefore(card, cloudPanel);
    else accountPage.appendChild(card);

    renderColorPresets();
    const input = document.getElementById('wordjarCalendarColorInput');
    input.value = getCalendarColor();
    input.oninput = () => saveCalendarColor(input.value);
  }

  function renderColorPresets() {
    const wrap = document.getElementById('wordjarCalendarColorPresets');
    if (!wrap) return;

    const selected = getCalendarColor().toLowerCase();
    wrap.innerHTML = PRESET_COLORS.map(color => `
      <button class="wordjar-calendar-color-btn${selected === color.toLowerCase() ? ' is-selected' : ''}" type="button" data-color="${color}" aria-label="Set calendar color ${color}"></button>
    `).join('');

    wrap.querySelectorAll('.wordjar-calendar-color-btn').forEach(button => {
      button.style.setProperty('--wordjar-calendar-swatch', button.dataset.color);
      button.onclick = () => saveCalendarColor(button.dataset.color);
    });
  }

  function syncSettingsColorUI() {
    const input = document.getElementById('wordjarCalendarColorInput');
    if (input) input.value = getCalendarColor();
    renderColorPresets();
  }

  const originalUpdateAccount = window.updateAccount;
  window.updateAccount = function updateAccountWithCalendarSettings() {
    if (typeof originalUpdateAccount === 'function') originalUpdateAccount();
    ensureCalendarSettingsCard();
  };

  window.renderCalendar = renderCalendar;
  window.openWordJarCalendarModal = openCalendarModal;
  window.WordJarCalendarPerformance = {
    clearCache() { stripKey = ''; },
    open: openCalendarModal,
    setColor: saveCalendarColor
  };

  ensureCalendarSettings();
  injectStyles();
  setTimeout(() => renderCalendar(true), 0);
})();
