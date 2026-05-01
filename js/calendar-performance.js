// WordJar Study Calendar V5
// Centered weekly calendar for Dashboard + Calendar Settings.

(function installWordJarStudyCalendar() {
  if (window.__wordjarStudyCalendarInstalledV5) return;
  window.__wordjarStudyCalendarInstalledV5 = true;

  const STYLE_ID = 'wordjarStudyCalendarStyle';
  const SETTINGS_MODAL_ID = 'wordjarCalendarSettingsModal';
  const SETTINGS_ROW_ID = 'wordjarCalendarSettingsRow';
  const DEFAULT_COLOR = '#0b5f08';
  const PRESET_COLORS = ['#0b5f08', '#09090b', '#f59e0b', '#3b82f6', '#ef4444', '#a855f7'];
  const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  let calendarKey = '';
  let selectedDate = new Date();
  let weekCursor = new Date();

  function ensureCalendarSettings() {
    window.D = window.D || {};
    D.settings = D.settings || {};
    if (!D.settings.calendarAccentColor) D.settings.calendarAccentColor = DEFAULT_COLOR;
    if (!['sun', 'mon'].includes(D.settings.calendarWeekStart)) D.settings.calendarWeekStart = 'mon';
    applyCalendarColor();
  }

  function applyCalendarColor() {
    document.documentElement.style.setProperty('--wordjar-calendar-accent', D.settings?.calendarAccentColor || DEFAULT_COLOR);
  }

  function getCalendarColor() {
    ensureCalendarSettings();
    return D.settings.calendarAccentColor || DEFAULT_COLOR;
  }

  function getWeekStartMode() {
    ensureCalendarSettings();
    return D.settings.calendarWeekStart || 'mon';
  }

  function getWeekStartIndex() {
    return getWeekStartMode() === 'sun' ? 0 : 1;
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

  function startOfWeek(date) {
    const start = new Date(date);
    start.setHours(12, 0, 0, 0);
    const diff = (start.getDay() - getWeekStartIndex() + 7) % 7;
    start.setDate(start.getDate() - diff);
    return start;
  }

  function getWeekDates(date) {
    const start = startOfWeek(date);
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }

  function getWeekTitle(dates) {
    const first = dates[0];
    const last = dates[6];
    if (sameDay(new Date(), selectedDate) && sameDay(startOfWeek(new Date()), startOfWeek(weekCursor))) return 'This Week';
    if (first.getMonth() === last.getMonth()) return `${MONTH_NAMES[first.getMonth()]} ${first.getFullYear()}`;
    return `${MONTH_NAMES[first.getMonth()]} – ${MONTH_NAMES[last.getMonth()]}`;
  }

  function getShortDate(date) {
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function isStudiedDate(date) {
    if (sameDay(date, new Date())) return Number(D.todayDone || 0) > 0 || !!(D.studyDays || {})[dateKey(date)];
    return !!(D.studyDays || {})[dateKey(date)];
  }

  function getSelectedReviewedCount() {
    return sameDay(selectedDate, new Date()) ? Number(D.todayDone || 0) : null;
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
      dateKey(startOfWeek(weekCursor)),
      dateKey(selectedDate),
      Number(D.todayDone || 0),
      JSON.stringify(D.studyDays || {}),
      (D.words || []).length,
      getCalendarColor(),
      getWeekStartMode()
    ].join('::');
  }

  function clearCalendarCache() {
    calendarKey = '';
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
    D.settings.calendarWeekStart = value === 'sun' ? 'sun' : 'mon';
    saveCalendarSettings();
  }

  function selectDate(dateText) {
    const next = new Date(dateText);
    if (Number.isNaN(next.getTime())) return;
    selectedDate = next;
    weekCursor = next;
    clearCalendarCache();
    renderCalendar(true);
  }

  function moveWeek(delta) {
    weekCursor = addDays(weekCursor, delta * 7);
    selectedDate = addDays(selectedDate, delta * 7);
    clearCalendarCache();
    renderCalendar(true);
  }

  function goToday() {
    selectedDate = new Date();
    weekCursor = new Date();
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
        width:100%;
        max-width:100%;
        overflow:visible;
        padding:14px 0 18px;
        margin:0;
        cursor:default;
      }

      .wordjar-study-calendar-card{
        width:100%;
        box-sizing:border-box;
        border:0;
        background:transparent;
        box-shadow:none;
        padding:0;
      }

      .wordjar-study-calendar-top{
        display:grid;
        grid-template-columns:44px minmax(0, 1fr) 44px;
        align-items:center;
        gap:10px;
        margin:4px 0 12px;
      }

      .wordjar-study-calendar-title-wrap{
        text-align:center;
        min-width:0;
      }

      .wordjar-study-calendar-title{
        color:var(--ink);
        font-size:17px;
        font-weight:950;
        letter-spacing:-.03em;
        line-height:1.1;
      }

      .wordjar-study-calendar-subtitle{
        color:var(--ink2);
        font-size:11px;
        font-weight:800;
        margin-top:3px;
      }

      .wordjar-study-calendar-nav{
        width:44px;
        height:44px;
        border:1px solid var(--bdr);
        border-radius:16px;
        background:#fff;
        color:var(--ink);
        display:grid;
        place-items:center;
        cursor:pointer;
      }

      .wordjar-study-calendar-nav svg{
        width:20px;
        height:20px;
        stroke-width:2.7;
      }

      .wordjar-study-calendar-week{
        display:grid;
        grid-template-columns:repeat(7, minmax(0, 1fr));
        gap:7px;
        width:100%;
        box-sizing:border-box;
      }

      .wordjar-study-calendar-day{
        min-width:0;
        min-height:104px;
        border:1px solid var(--bdr);
        border-radius:18px;
        background:#fff;
        color:var(--ink);
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:flex-start;
        gap:8px;
        padding:12px 4px 10px;
        font:inherit;
        cursor:pointer;
        box-sizing:border-box;
        position:relative;
      }

      .wordjar-study-calendar-day-name{
        color:var(--ink2);
        font-size:10px;
        font-weight:950;
        letter-spacing:.02em;
      }

      .wordjar-study-calendar-day-number{
        color:var(--ink);
        font-size:20px;
        font-weight:950;
        line-height:1;
      }

      .wordjar-study-calendar-state{
        width:28px;
        height:28px;
        border-radius:999px;
        border:2px solid var(--bdr);
        display:grid;
        place-items:center;
        color:transparent;
        background:#fff;
        margin-top:auto;
      }

      .wordjar-study-calendar-day.is-studied .wordjar-study-calendar-state{
        border-color:var(--wordjar-calendar-accent, #0b5f08);
        background:var(--wordjar-calendar-accent, #0b5f08);
        color:#fff;
        box-shadow:0 8px 18px color-mix(in srgb, var(--wordjar-calendar-accent, #0b5f08) 22%, transparent);
      }

      .wordjar-study-calendar-state svg{
        width:17px;
        height:17px;
        stroke-width:3;
      }

      .wordjar-study-calendar-day.is-today{
        background:color-mix(in srgb, var(--wordjar-calendar-accent, #0b5f08) 7%, #fff);
      }

      .wordjar-study-calendar-day.is-today .wordjar-study-calendar-state{
        border-color:color-mix(in srgb, var(--wordjar-calendar-accent, #0b5f08) 52%, #fff);
      }

      .wordjar-study-calendar-day.is-selected{
        border-color:color-mix(in srgb, var(--wordjar-calendar-accent, #0b5f08) 38%, var(--bdr));
        box-shadow:0 0 0 3px color-mix(in srgb, var(--wordjar-calendar-accent, #0b5f08) 10%, transparent);
      }

      .wordjar-study-calendar-due-dot{
        width:6px;
        height:6px;
        border-radius:999px;
        background:var(--wordjar-calendar-accent, #0b5f08);
        margin-top:2px;
        opacity:.9;
      }

      .wordjar-study-calendar-legend{
        display:flex;
        align-items:center;
        justify-content:center;
        flex-wrap:wrap;
        gap:14px;
        color:var(--ink2);
        font-size:12px;
        font-weight:800;
        margin:12px 0 0;
      }

      .wordjar-study-calendar-legend-item{
        display:flex;
        align-items:center;
        gap:6px;
      }

      .wordjar-study-calendar-legend-mark{
        width:10px;
        height:10px;
        border-radius:999px;
        border:2px solid var(--bdr);
        box-sizing:border-box;
      }

      .wordjar-study-calendar-legend-mark.is-studied{
        border-color:var(--wordjar-calendar-accent, #0b5f08);
        background:var(--wordjar-calendar-accent, #0b5f08);
      }

      .wordjar-study-calendar-legend-mark.is-today{
        border-color:var(--wordjar-calendar-accent, #0b5f08);
        background:#fff;
      }

      .wordjar-study-calendar-legend-mark.is-due{
        width:7px;
        height:7px;
        border:0;
        background:var(--wordjar-calendar-accent, #0b5f08);
      }

      .wordjar-study-calendar-summary{
        display:grid;
        grid-template-columns:repeat(3, minmax(0, 1fr));
        gap:8px;
        border:1px solid var(--bdr);
        border-radius:24px;
        background:var(--sur);
        padding:14px;
        margin-top:14px;
        box-sizing:border-box;
      }

      .wordjar-study-calendar-stat{
        min-width:0;
      }

      .wordjar-study-calendar-stat-label{
        color:var(--ink2);
        font-size:12px;
        font-weight:850;
        line-height:1.2;
      }

      .wordjar-study-calendar-stat-value{
        color:var(--ink);
        font-size:18px;
        font-weight:950;
        letter-spacing:-.03em;
        margin-top:8px;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
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
        .wordjar-study-calendar-week{gap:5px}
        .wordjar-study-calendar-day{min-height:92px;border-radius:16px;padding:10px 2px 8px}
        .wordjar-study-calendar-day-name{font-size:9px}
        .wordjar-study-calendar-day-number{font-size:18px}
        .wordjar-study-calendar-state{width:24px;height:24px}
        .wordjar-study-calendar-summary{padding:12px;border-radius:22px}
        .wordjar-study-calendar-stat-value{font-size:16px}
      }
    `;
    document.head.appendChild(style);
  }

  function buildCalendarHtml() {
    const dates = getWeekDates(weekCursor);
    const reviewed = getSelectedReviewedCount();
    const selectedStudied = isStudiedDate(selectedDate);
    const selectedLabel = sameDay(selectedDate, new Date()) ? 'Today' : getShortDate(selectedDate);

    return `
      <div class="wordjar-study-calendar-card">
        <div class="wordjar-study-calendar-top">
          <button class="wordjar-study-calendar-nav" type="button" data-action="prev" aria-label="Previous week">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div class="wordjar-study-calendar-title-wrap">
            <div class="wordjar-study-calendar-title">${getWeekTitle(dates)}</div>
            <div class="wordjar-study-calendar-subtitle">Tap a date to view study status</div>
          </div>
          <button class="wordjar-study-calendar-nav" type="button" data-action="next" aria-label="Next week">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        <div class="wordjar-study-calendar-week">
          ${dates.map(date => {
            const studiedClass = isStudiedDate(date) ? ' is-studied' : '';
            const todayClass = sameDay(date, new Date()) ? ' is-today' : '';
            const selectedClass = sameDay(date, selectedDate) ? ' is-selected' : '';
            const checkIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 13l4 4L19 7"/></svg>';
            return `
              <button class="wordjar-study-calendar-day${studiedClass}${todayClass}${selectedClass}" type="button" data-date="${dateKey(date)}" aria-label="Select ${dateKey(date)}">
                <span class="wordjar-study-calendar-day-name">${DAY_NAMES[date.getDay()]}</span>
                <span class="wordjar-study-calendar-day-number">${date.getDate()}</span>
                <span class="wordjar-study-calendar-state">${isStudiedDate(date) ? checkIcon : ''}</span>
                ${isStudiedDate(date) ? '<span class="wordjar-study-calendar-due-dot"></span>' : ''}
              </button>
            `;
          }).join('')}
        </div>

        <div class="wordjar-study-calendar-legend">
          <span class="wordjar-study-calendar-legend-item"><span class="wordjar-study-calendar-legend-mark is-studied"></span>Studied</span>
          <span class="wordjar-study-calendar-legend-item"><span class="wordjar-study-calendar-legend-mark is-today"></span>Today</span>
          <span class="wordjar-study-calendar-legend-item"><span class="wordjar-study-calendar-legend-mark"></span>Rest</span>
          <span class="wordjar-study-calendar-legend-item"><span class="wordjar-study-calendar-legend-mark is-due"></span>Due</span>
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
    el.querySelector('[data-action="prev"]')?.addEventListener('click', () => moveWeek(-1));
    el.querySelector('[data-action="next"]')?.addEventListener('click', () => moveWeek(1));

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
          <div class="wordjar-calendar-settings-desc">Choose how the Dashboard week calendar is arranged.</div>
          <div class="wordjar-calendar-week-start-grid">
            <button class="wordjar-calendar-option-btn" type="button" data-week-start="mon">Monday</button>
            <button class="wordjar-calendar-option-btn" type="button" data-week-start="sun">Sunday</button>
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
    getDueNowCount,
    goToday
  };

  ensureCalendarSettings();
  injectStyles();
  setTimeout(() => renderCalendar(true), 0);
  setTimeout(injectCalendarSettingsRow, 0);
})();
