// WordJar Study Calendar V4
// Real inline monthly calendar for Dashboard + Calendar Settings.

(function installWordJarStudyCalendar() {
  if (window.__wordjarStudyCalendarInstalledV4) return;
  window.__wordjarStudyCalendarInstalledV4 = true;

  const STYLE_ID = 'wordjarStudyCalendarStyle';
  const SETTINGS_MODAL_ID = 'wordjarCalendarSettingsModal';
  const SETTINGS_ROW_ID = 'wordjarCalendarSettingsRow';
  const DEFAULT_COLOR = '#0b5f08';
  const PRESET_COLORS = ['#0b5f08', '#09090b', '#f59e0b', '#3b82f6', '#ef4444', '#a855f7'];
  const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  let calendarKey = '';
  let selectedDate = new Date();
  let monthCursor = new Date();

  function ensureCalendarSettings() {
    window.D = window.D || {};
    D.settings = D.settings || {};
    if (!D.settings.calendarAccentColor) D.settings.calendarAccentColor = DEFAULT_COLOR;
    if (!['sun', 'mon'].includes(D.settings.calendarWeekStart)) D.settings.calendarWeekStart = 'sun';
    applyCalendarColor();
  }

  function applyCalendarColor() {
    const color = D.settings?.calendarAccentColor || DEFAULT_COLOR;
    document.documentElement.style.setProperty('--wordjar-calendar-accent', color);
  }

  function getCalendarColor() {
    ensureCalendarSettings();
    return D.settings.calendarAccentColor || DEFAULT_COLOR;
  }

  function getWeekStartMode() {
    ensureCalendarSettings();
    return D.settings.calendarWeekStart || 'sun';
  }

  function getWeekStartIndex() {
    return getWeekStartMode() === 'mon' ? 1 : 0;
  }

  function getOrderedDayNames() {
    const start = getWeekStartIndex();
    return Array.from({ length: 7 }, (_, index) => DAY_NAMES[(start + index) % 7]);
  }

  function dateKey(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toDateString();
  }

  function sameDay(a, b) {
    return dateKey(a) === dateKey(b);
  }

  function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  function getMonthDates(cursor) {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    const diff = (first.getDay() - getWeekStartIndex() + 7) % 7;
    start.setDate(first.getDate() - diff);
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  }

  function isStudiedDate(date) {
    if (sameDay(date, new Date())) return Number(D.todayDone || 0) > 0 || !!(D.studyDays || {})[dateKey(date)];
    return !!(D.studyDays || {})[dateKey(date)];
  }

  function getSelectedReviewedCount() {
    return sameDay(selectedDate, new Date()) ? Number(D.todayDone || 0) : null;
  }

  function getMonthStudyCount(cursor) {
    return getMonthDates(cursor).filter(date => date.getMonth() === cursor.getMonth() && isStudiedDate(date)).length;
  }

  function getDueNowCount() {
    if (window.WordJarDashboardStats?.calcStats) {
      try { return Number(WordJarDashboardStats.calcStats().dueTotal || 0); }
      catch { return 0; }
    }

    return (D.words || []).filter(word => {
      if (window.WordJarFSRS?.isDueCard) return WordJarFSRS.isDueCard(word);
      if (typeof isDue === 'function') return isDue(word);
      return true;
    }).length;
  }

  function getCalendarStateKey() {
    return [
      dateKey(monthCursor),
      dateKey(selectedDate),
      Number(D.todayDone || 0),
      JSON.stringify(D.studyDays || {}),
      (D.words || []).length,
      getCalendarColor(),
      getWeekStartMode()
    ].join('::');
  }

  function saveCalendarSettings() {
    if (typeof save === 'function') save();
    clearCalendarCache();
    renderCalendar(true);
    syncSettingsUI();
    if (window.WordJarSettingsOrder?.orderSettingsRows) WordJarSettingsOrder.orderSettingsRows();
  }

  function saveCalendarColor(color) {
    ensureCalendarSettings();
    D.settings.calendarAccentColor = color || DEFAULT_COLOR;
    applyCalendarColor();
    saveCalendarSettings();
  }

  function saveWeekStart(value) {
    ensureCalendarSettings();
    D.settings.calendarWeekStart = value === 'mon' ? 'mon' : 'sun';
    saveCalendarSettings();
  }

  function selectDate(dateText) {
    const next = new Date(dateText);
    if (Number.isNaN(next.getTime())) return;
    selectedDate = next;
    monthCursor = new Date(next.getFullYear(), next.getMonth(), 1);
    clearCalendarCache();
    renderCalendar(true);
  }

  function moveMonth(delta) {
    monthCursor = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + delta, 1);
    selectedDate = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), Math.min(selectedDate.getDate(), 28));
    clearCalendarCache();
    renderCalendar(true);
  }

  function goToday() {
    selectedDate = new Date();
    monthCursor = new Date();
    clearCalendarCache();
    renderCalendar(true);
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .calendar-strip.wordjar-study-calendar-shell{
        display:block;
        overflow:visible;
        padding:12px 20px 18px;
        margin:0 -20px;
        cursor:default;
      }

      .wordjar-study-calendar-card{
        border:1px solid var(--bdr);
        border-radius:28px;
        background:var(--sur);
        box-shadow:0 10px 28px rgba(0,0,0,.04);
        padding:16px;
      }

      .wordjar-study-calendar-top{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        margin-bottom:14px;
      }

      .wordjar-study-calendar-title{
        color:var(--ink);
        font-size:22px;
        font-weight:950;
        letter-spacing:-.04em;
        line-height:1.05;
      }

      .wordjar-study-calendar-subtitle{
        color:var(--ink2);
        font-size:12px;
        font-weight:800;
        margin-top:4px;
      }

      .wordjar-study-calendar-actions{
        display:flex;
        align-items:center;
        gap:8px;
      }

      .wordjar-study-calendar-nav,
      .wordjar-study-calendar-today{
        height:38px;
        border:1px solid var(--bdr);
        border-radius:14px;
        background:#fff;
        color:var(--ink);
        font:inherit;
        font-size:13px;
        font-weight:950;
        cursor:pointer;
      }

      .wordjar-study-calendar-nav{
        width:38px;
        display:grid;
        place-items:center;
      }

      .wordjar-study-calendar-nav svg{
        width:18px;
        height:18px;
        stroke-width:2.6;
      }

      .wordjar-study-calendar-today{
        padding:0 12px;
      }

      .wordjar-study-calendar-weekdays,
      .wordjar-study-calendar-grid{
        display:grid;
        grid-template-columns:repeat(7, minmax(0, 1fr));
        gap:7px;
      }

      .wordjar-study-calendar-weekday{
        text-align:center;
        color:var(--ink2);
        font-size:12px;
        font-weight:950;
        padding:4px 0 6px;
      }

      .wordjar-study-calendar-day{
        position:relative;
        aspect-ratio:1;
        border:1px solid var(--bdr);
        border-radius:999px;
        background:#fff;
        color:var(--ink);
        display:grid;
        place-items:center;
        font:inherit;
        font-size:15px;
        font-weight:950;
        cursor:pointer;
        box-shadow:none;
      }

      .wordjar-study-calendar-day.is-muted{
        opacity:.34;
      }

      .wordjar-study-calendar-day.is-studied{
        background:var(--wordjar-calendar-accent, #0b5f08);
        border-color:var(--wordjar-calendar-accent, #0b5f08);
        color:#fff;
        box-shadow:0 8px 18px color-mix(in srgb, var(--wordjar-calendar-accent, #0b5f08) 22%, transparent);
      }

      .wordjar-study-calendar-day.is-today{
        outline:3px solid color-mix(in srgb, var(--wordjar-calendar-accent, #0b5f08) 18%, transparent);
        outline-offset:3px;
      }

      .wordjar-study-calendar-day.is-selected::after{
        content:'';
        position:absolute;
        inset:-6px;
        border:2px solid color-mix(in srgb, var(--wordjar-calendar-accent, #0b5f08) 34%, transparent);
        border-radius:999px;
        pointer-events:none;
      }

      .wordjar-study-calendar-day-dot{
        position:absolute;
        bottom:6px;
        left:50%;
        width:4px;
        height:4px;
        border-radius:999px;
        background:currentColor;
        transform:translateX(-50%);
        opacity:.72;
        pointer-events:none;
      }

      .wordjar-study-calendar-summary{
        display:grid;
        grid-template-columns:1fr 1fr 1fr;
        gap:8px;
        margin-top:14px;
      }

      .wordjar-study-calendar-stat{
        border:1px solid var(--bdr);
        border-radius:18px;
        background:#fff;
        padding:10px;
        min-width:0;
      }

      .wordjar-study-calendar-stat-label{
        color:var(--ink2);
        font-size:11px;
        font-weight:850;
        line-height:1.2;
      }

      .wordjar-study-calendar-stat-value{
        color:var(--ink);
        font-size:19px;
        font-weight:950;
        letter-spacing:-.03em;
        margin-top:3px;
      }

      .wordjar-calendar-settings-card{
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

      .wordjar-calendar-close-btn svg{
        width:20px;
        height:20px;
        stroke-width:2.4;
      }

      .wordjar-calendar-settings-section{
        padding:14px 0;
        border-top:1px solid var(--bdr);
      }

      .wordjar-calendar-settings-section:first-of-type{
        padding-top:0;
        border-top:0;
      }

      .wordjar-calendar-settings-title{
        color:var(--ink);
        font-size:14px;
        font-weight:950;
        margin-bottom:6px;
      }

      .wordjar-calendar-settings-desc{
        color:var(--ink2);
        font-size:12px;
        font-weight:750;
        line-height:1.4;
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

      .wordjar-calendar-week-start-grid{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:10px;
        margin-top:12px;
      }

      .wordjar-calendar-option-btn{
        height:46px;
        border:1px solid var(--bdr);
        border-radius:16px;
        background:var(--sur);
        color:var(--ink);
        font:inherit;
        font-size:13px;
        font-weight:900;
        cursor:pointer;
      }

      .wordjar-calendar-option-btn.is-selected{
        background:var(--ink);
        border-color:var(--ink);
        color:var(--sur);
      }

      @media (max-width:390px){
        .wordjar-study-calendar-card{padding:14px;border-radius:24px}
        .wordjar-study-calendar-grid,.wordjar-study-calendar-weekdays{gap:5px}
        .wordjar-study-calendar-day{font-size:14px}
        .wordjar-study-calendar-summary{grid-template-columns:1fr}
      }
    `;
    document.head.appendChild(style);
  }

  function buildCalendarHtml() {
    const cursor = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const dates = getMonthDates(cursor);
    const reviewed = getSelectedReviewedCount();
    const selectedStudied = isStudiedDate(selectedDate);
    const selectedLabel = sameDay(selectedDate, new Date()) ? 'Today' : selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    return `
      <div class="wordjar-study-calendar-card">
        <div class="wordjar-study-calendar-top">
          <div>
            <div class="wordjar-study-calendar-title">${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}</div>
            <div class="wordjar-study-calendar-subtitle">Tap a date to view study status</div>
          </div>
          <div class="wordjar-study-calendar-actions">
            <button class="wordjar-study-calendar-nav" type="button" data-action="prev" aria-label="Previous month">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button class="wordjar-study-calendar-today" type="button" data-action="today">Today</button>
            <button class="wordjar-study-calendar-nav" type="button" data-action="next" aria-label="Next month">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>

        <div class="wordjar-study-calendar-weekdays">
          ${getOrderedDayNames().map(day => `<div class="wordjar-study-calendar-weekday">${day}</div>`).join('')}
        </div>

        <div class="wordjar-study-calendar-grid">
          ${dates.map(date => {
            const mutedClass = date.getMonth() === cursor.getMonth() ? '' : ' is-muted';
            const todayClass = sameDay(date, new Date()) ? ' is-today' : '';
            const studiedClass = isStudiedDate(date) ? ' is-studied' : '';
            const selectedClass = sameDay(date, selectedDate) ? ' is-selected' : '';
            const dot = isStudiedDate(date) ? '<span class="wordjar-study-calendar-day-dot"></span>' : '';
            return `
              <button class="wordjar-study-calendar-day${mutedClass}${todayClass}${studiedClass}${selectedClass}" type="button" data-date="${dateKey(date)}" aria-label="Select ${dateKey(date)}">
                <span>${date.getDate()}</span>${dot}
              </button>
            `;
          }).join('')}
        </div>

        <div class="wordjar-study-calendar-summary">
          <div class="wordjar-study-calendar-stat">
            <div class="wordjar-study-calendar-stat-label">Selected</div>
            <div class="wordjar-study-calendar-stat-value">${selectedLabel}</div>
          </div>
          <div class="wordjar-study-calendar-stat">
            <div class="wordjar-study-calendar-stat-label">Status</div>
            <div class="wordjar-study-calendar-stat-value">${selectedStudied ? 'Studied' : 'Rest'}</div>
          </div>
          <div class="wordjar-study-calendar-stat">
            <div class="wordjar-study-calendar-stat-label">Reviewed</div>
            <div class="wordjar-study-calendar-stat-value">${reviewed === null ? '—' : reviewed}</div>
          </div>
        </div>
      </div>
    `;
  }

  function bindCalendarEvents(el) {
    el.querySelector('[data-action="prev"]')?.addEventListener('click', () => moveMonth(-1));
    el.querySelector('[data-action="next"]')?.addEventListener('click', () => moveMonth(1));
    el.querySelector('[data-action="today"]')?.addEventListener('click', goToday);

    el.querySelectorAll('[data-date]').forEach(button => {
      button.addEventListener('click', () => selectDate(button.dataset.date));
    });
  }

  function renderCalendar(force = false) {
    ensureCalendarSettings();
    injectStyles();

    const el = document.getElementById('weekCalendar');
    if (!el) return;

    const nextKey = getCalendarStateKey();
    if (!force && nextKey === calendarKey) return;

    calendarKey = nextKey;
    el.classList.add('wordjar-study-calendar-shell');
    el.innerHTML = buildCalendarHtml();
    bindCalendarEvents(el);
  }

  function ensureCalendarSettingsModal() {
    let modal = document.getElementById(SETTINGS_MODAL_ID);
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = SETTINGS_MODAL_ID;
    modal.className = 'overlay';
    modal.innerHTML = `
      <div class="modal-card wordjar-calendar-settings-card" onclick="event.stopPropagation()">
        <div class="wordjar-calendar-modal-top">
          <div class="wordjar-calendar-title-wrap">
            <div class="wordjar-calendar-modal-title">Calendar Settings</div>
            <div class="wordjar-calendar-modal-subtitle">Customize Dashboard calendar color and week layout.</div>
          </div>
          <button class="wordjar-calendar-close-btn" type="button" id="wordjarCalendarSettingsCloseBtn" aria-label="Close calendar settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="wordjar-calendar-settings-section">
          <div class="wordjar-calendar-settings-title">Calendar Color</div>
          <div class="wordjar-calendar-settings-desc">Choose a template color or use your own custom color.</div>
          <div class="wordjar-calendar-settings-presets" id="wordjarCalendarColorPresets"></div>
          <input class="wordjar-calendar-color-input" id="wordjarCalendarColorInput" type="color" aria-label="Custom calendar color">
        </div>

        <div class="wordjar-calendar-settings-section">
          <div class="wordjar-calendar-settings-title">Week Starts On</div>
          <div class="wordjar-calendar-settings-desc">Choose how the Dashboard calendar is arranged.</div>
          <div class="wordjar-calendar-week-start-grid">
            <button class="wordjar-calendar-option-btn" type="button" data-week-start="sun">Sunday</button>
            <button class="wordjar-calendar-option-btn" type="button" data-week-start="mon">Monday</button>
          </div>
        </div>
      </div>
    `;

    modal.onclick = event => {
      if (event.target === modal) closeCalendarSettingsModal();
    };

    document.body.appendChild(modal);
    document.getElementById('wordjarCalendarSettingsCloseBtn').onclick = closeCalendarSettingsModal;
    return modal;
  }

  function openCalendarSettingsModal() {
    ensureCalendarSettingsModal().classList.add('open');
    syncSettingsUI();
  }

  function closeCalendarSettingsModal() {
    document.getElementById(SETTINGS_MODAL_ID)?.classList.remove('open');
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

  function syncSettingsUI() {
    const input = document.getElementById('wordjarCalendarColorInput');
    if (input) {
      input.value = getCalendarColor();
      input.oninput = () => saveCalendarColor(input.value);
    }

    renderColorPresets();

    document.querySelectorAll('[data-week-start]').forEach(button => {
      const isSelected = button.dataset.weekStart === getWeekStartMode();
      button.classList.toggle('is-selected', isSelected);
      button.onclick = () => saveWeekStart(button.dataset.weekStart);
    });
  }

  function injectCalendarSettingsRow() {
    ensureCalendarSettings();
    injectStyles();

    const account = document.getElementById('pg-account');
    const menu = account?.querySelector('.menu-sec');
    if (!menu) return;

    document.getElementById('wordjarCalendarSettingsCard')?.remove();

    let row = document.getElementById(SETTINGS_ROW_ID);
    if (!row) {
      row = document.createElement('div');
      row.className = 'mr';
      row.id = SETTINGS_ROW_ID;
      row.onclick = openCalendarSettingsModal;
      row.innerHTML = `<div class="ml">Calendar Settings</div><div class="ma"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 18l6-6-6-6"/></svg></div>`;
      menu.appendChild(row);
    }
  }

  function clearCalendarCache() {
    calendarKey = '';
  }

  const originalUpdateAccount = window.updateAccount;
  window.updateAccount = function updateAccountWithCalendarSettings() {
    if (typeof originalUpdateAccount === 'function') originalUpdateAccount();
    injectCalendarSettingsRow();
  };

  window.renderCalendar = renderCalendar;
  window.openWordJarCalendarModal = () => renderCalendar(true);
  window.openWordJarCalendarSettingsModal = openCalendarSettingsModal;
  window.WordJarCalendarPerformance = {
    clearCache: clearCalendarCache,
    open: () => renderCalendar(true),
    openSettings: openCalendarSettingsModal,
    setColor: saveCalendarColor,
    setWeekStart: saveWeekStart,
    injectSettings: injectCalendarSettingsRow,
    getDueNowCount
  };

  ensureCalendarSettings();
  injectStyles();
  setTimeout(() => renderCalendar(true), 0);
  setTimeout(injectCalendarSettingsRow, 0);
})();
