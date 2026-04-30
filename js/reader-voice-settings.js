// WordJar Reader Voice Settings
// Voice Style Selector: accent + tone profile + speed + pitch.

(function installWordJarReaderVoiceSettings() {
  if (window.__wordjarReaderVoiceSettingsInstalledV4) return;
  window.__wordjarReaderVoiceSettingsInstalledV4 = true;

  const STYLE_ID = 'wordjarReaderVoiceSettingsStyle';
  const GENERAL_PANEL_ID = 'wordjarGeneralVoiceSpeedPanel';
  const READER_PANEL_ID = 'wordjarReaderVoiceSettingsPanel';

  const ACCENTS = [
    { value: 'en-US', label: 'American (US)', keywords: /\b(us|united states|american|samantha|alex|ava|allison|victoria)\b/i },
    { value: 'en-GB', label: 'British (UK)', keywords: /\b(uk|british|england|daniel|serena|kate|arthur|oliver)\b/i },
    { value: 'en-AU', label: 'Australian (AU)', keywords: /\b(australia|australian|karen|lee)\b/i },
    { value: 'en-CA', label: 'Canadian (CA)', keywords: /\b(canada|canadian)\b/i },
    { value: 'en-IE', label: 'Irish (IE)', keywords: /\b(ireland|irish)\b/i },
    { value: 'en-IN', label: 'Indian (IN)', keywords: /\b(india|indian|rishi)\b/i }
  ];

  const VOICE_STYLES = [
    {
      id: 'us_neutral',
      name: 'US Neutral',
      accent: 'en-US',
      speed: 1,
      pitch: 1,
      tone: 'Clear, balanced, and standard American pronunciation.',
      description: 'A clean everyday American voice for vocabulary review and general listening practice.',
      keywords: /\b(samantha|alex|ava|allison|victoria|american|us)\b/i
    },
    {
      id: 'us_soft_pop',
      name: 'Soft Pop American',
      accent: 'en-US',
      speed: 0.95,
      pitch: 1.04,
      tone: 'Warm, relaxed, casual, and easy to shadow.',
      description: 'A soft American pop-style voice for learners who want a friendly role-model sound without imitating a real person.',
      keywords: /\b(ava|samantha|victoria|allison|american|us)\b/i
    },
    {
      id: 'us_clear_teacher',
      name: 'American Clear Teacher',
      accent: 'en-US',
      speed: 0.82,
      pitch: 1,
      tone: 'Patient, slow, precise, and learner-friendly.',
      description: 'A classroom-style American voice for difficult words, IPA practice, and careful sentence repetition.',
      keywords: /\b(samantha|alex|american|us)\b/i
    },
    {
      id: 'uk_clear',
      name: 'British Clear',
      accent: 'en-GB',
      speed: 0.9,
      pitch: 1,
      tone: 'Crisp, polite, and clearly articulated British pronunciation.',
      description: 'A clear British voice for IELTS-style listening, academic vocabulary, and formal reading practice.',
      keywords: /\b(daniel|serena|kate|arthur|oliver|british|uk)\b/i
    },
    {
      id: 'aus_casual',
      name: 'Australian Casual',
      accent: 'en-AU',
      speed: 1,
      pitch: 1,
      tone: 'Natural, casual, and conversational Australian pronunciation.',
      description: 'A relaxed Australian voice for training your ear to understand different English accents.',
      keywords: /\b(karen|lee|australian|australia)\b/i
    },
    {
      id: 'learner_slow',
      name: 'Slow Learner Mode',
      accent: 'en-US',
      speed: 0.72,
      pitch: 1,
      tone: 'Very slow, clear, and pronunciation-focused.',
      description: 'A slow learner-friendly voice for beginners, long example sentences, and repeat-after-me practice.',
      keywords: /\b(samantha|alex|ava|american|us)\b/i
    },
    {
      id: 'custom',
      name: 'Custom Voice Style',
      accent: 'en-US',
      speed: 1,
      pitch: 1,
      tone: 'User-defined voice settings.',
      description: 'Create your own voice profile by choosing accent, speed, and pitch.',
      keywords: /\b(english|american|british|australian|us|uk)\b/i
    }
  ];

  function clamp(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(min, Math.min(max, number));
  }

  function getStyle(id) {
    return VOICE_STYLES.find(style => style.id === id) || VOICE_STYLES[0];
  }

  function getAccentItem(value) {
    return ACCENTS.find(item => item.value === value) || ACCENTS[0];
  }

  function ensureReaderVoiceSettings() {
    window.D = window.D || {};
    D.profile = D.profile || {};

    if (!D.profile.voiceStyleId) D.profile.voiceStyleId = 'us_neutral';
    if (!D.profile.readerVoiceStyleId) D.profile.readerVoiceStyleId = 'uk_clear';
    if (!D.profile.customVoiceAccent) D.profile.customVoiceAccent = 'en-US';
    if (!D.profile.customVoiceSpeed) D.profile.customVoiceSpeed = 1;
    if (!D.profile.customVoicePitch) D.profile.customVoicePitch = 1;
    if (!D.profile.customReaderVoiceAccent) D.profile.customReaderVoiceAccent = 'en-GB';
    if (!D.profile.customReaderVoiceSpeed) D.profile.customReaderVoiceSpeed = 0.8;
    if (!D.profile.customReaderVoicePitch) D.profile.customReaderVoicePitch = 1;

    const generalStyle = getResolvedStyle('general');
    const readerStyle = getResolvedStyle('reader');

    D.profile.voice = generalStyle.accent;
    D.profile.voiceSpeed = generalStyle.speed;
    D.profile.voicePitch = generalStyle.pitch;
    D.profile.readerVoiceAccent = readerStyle.accent;
    D.profile.readerVoiceSpeed = readerStyle.speed;
    D.profile.readerVoicePitch = readerStyle.pitch;
  }

  function getResolvedStyle(scope = 'reader') {
    const isReader = scope === 'reader';
    const styleId = isReader ? D.profile?.readerVoiceStyleId : D.profile?.voiceStyleId;
    const style = { ...getStyle(styleId) };

    if (style.id === 'custom') {
      style.accent = isReader ? D.profile.customReaderVoiceAccent : D.profile.customVoiceAccent;
      style.speed = isReader ? D.profile.customReaderVoiceSpeed : D.profile.customVoiceSpeed;
      style.pitch = isReader ? D.profile.customReaderVoicePitch : D.profile.customVoicePitch;
    }

    style.accent = getAccentItem(style.accent).value;
    style.speed = clamp(style.speed, 0.5, 1.5, 1);
    style.pitch = clamp(style.pitch, 0.7, 1.3, 1);
    return style;
  }

  function saveSettings() {
    ensureReaderVoiceSettings();
    if (typeof save === 'function') save();
  }

  function speedLabel(value) {
    return `${Number(value).toFixed(2)}×`;
  }

  function pitchLabel(value) {
    return `${Number(value).toFixed(2)}`;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .wordjar-voice-clean-section{margin-top:18px;padding-top:18px;border-top:1px solid var(--bdr)}
      .wordjar-voice-clean-title{color:var(--ink);font-size:17px;font-weight:950;letter-spacing:-.03em;line-height:1.2;margin-bottom:6px}
      .wordjar-voice-clean-subtitle{color:var(--ink2);font-size:12px;font-weight:750;line-height:1.45;margin-bottom:14px}
      .wordjar-voice-clean-field{display:flex;flex-direction:column;gap:8px;margin-bottom:14px}
      .wordjar-voice-clean-label-row{display:flex;align-items:center;justify-content:space-between;gap:12px}
      .wordjar-voice-clean-label{color:var(--ink);font-size:13px;font-weight:900;letter-spacing:-.01em}
      .wordjar-voice-clean-value{color:var(--ink2);font-size:13px;font-weight:900;white-space:nowrap}
      .wordjar-voice-clean-select{width:100%;height:48px;border:1px solid var(--bdr);border-radius:18px;background:var(--sur);color:var(--ink);font:inherit;font-size:15px;font-weight:850;padding:0 14px;outline:none}
      .wordjar-voice-style-card{border:1px solid var(--bdr);border-radius:18px;background:var(--sur);padding:13px 14px;margin-top:-4px;margin-bottom:14px}
      .wordjar-voice-style-name{font-size:14px;font-weight:950;color:var(--ink);margin-bottom:4px}
      .wordjar-voice-style-desc{font-size:12px;font-weight:750;line-height:1.45;color:var(--ink2)}
      .wordjar-voice-custom-grid{display:grid;grid-template-columns:1fr;gap:12px;margin-top:2px}
      .wordjar-voice-custom-grid.is-hidden{display:none}
      .wordjar-voice-tube-wrap{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:10px}
      .wordjar-voice-tube-mark{color:var(--ink2);font-size:11px;font-weight:850;min-width:38px}.wordjar-voice-tube-mark:last-child{text-align:right}
      .wordjar-voice-tube-range{--wordjar-range-fill:50%;width:100%;height:28px;appearance:none;-webkit-appearance:none;background:transparent;outline:none}
      .wordjar-voice-tube-range::-webkit-slider-runnable-track{height:8px;border-radius:999px;background:linear-gradient(to right,var(--ink) 0%,var(--ink) var(--wordjar-range-fill),var(--bdr) var(--wordjar-range-fill),var(--bdr) 100%)}
      .wordjar-voice-tube-range::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:30px;height:30px;border-radius:999px;border:1px solid rgba(0,0,0,.08);background:var(--sur);box-shadow:0 4px 14px rgba(0,0,0,.18);margin-top:-11px;cursor:pointer}
      .wordjar-reader-voice-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
      .wordjar-reader-voice-btn{height:46px;border:1px solid var(--bdr);border-radius:17px;background:var(--sur);color:var(--ink);font:inherit;font-size:14px;font-weight:900;cursor:pointer}
      .wordjar-reader-voice-btn.primary{background:var(--ink);border-color:var(--ink);color:var(--sur)}
      .wordjar-voice-hidden-speed-field,.wordjar-voice-original-actions-hidden{display:none!important}
    `;
    document.head.appendChild(style);
  }

  function setRangeFill(input) {
    if (!input) return;
    const min = Number(input.min || 0);
    const max = Number(input.max || 1);
    const value = Number(input.value || min);
    const percent = ((value - min) / (max - min)) * 100;
    input.style.setProperty('--wordjar-range-fill', `${Math.max(0, Math.min(100, percent))}%`);
  }

  function styleOptions(selectedId) {
    return VOICE_STYLES.map(style => `<option value="${style.id}"${style.id === selectedId ? ' selected' : ''}>${style.name}</option>`).join('');
  }

  function accentOptions(selectedValue) {
    return ACCENTS.map(item => `<option value="${item.value}"${item.value === selectedValue ? ' selected' : ''}>${item.label}</option>`).join('');
  }

  function findVoiceModalCard() {
    const explicitModal = document.getElementById('voiceModal') || document.getElementById('voiceSettingsModal');
    if (explicitModal) return explicitModal.querySelector('.modal-card') || explicitModal;
    const openCards = Array.from(document.querySelectorAll('.overlay.open .modal-card'));
    return openCards.find(card => /voice|เสียง|accent|speed|auto play/i.test(card.textContent || '')) || openCards.at(-1) || null;
  }

  function findBlockByLabel(card, labelText) {
    const lower = labelText.toLowerCase();
    const labels = Array.from(card.querySelectorAll('label,.fl,div,span'));
    const label = labels.find(el => String(el.textContent || '').trim().toLowerCase() === lower);
    if (!label) return null;
    let node = label;
    for (let i = 0; i < 5 && node && node !== card; i++) {
      if (node.querySelector?.('select,input[type="range"],input[type="checkbox"]')) return node;
      node = node.parentElement;
    }
    return label.parentElement;
  }

  function hideOriginalFields(card) {
    ['Reading Speed', 'Voice Accent'].forEach(label => findBlockByLabel(card, label)?.classList.add('wordjar-voice-hidden-speed-field'));
    const candidates = Array.from(card.querySelectorAll('.form-row,.action-row,.modal-actions,div'));
    const actionRow = candidates.find(row => {
      if (row.id === GENERAL_PANEL_ID || row.id === READER_PANEL_ID || row.closest(`#${GENERAL_PANEL_ID},#${READER_PANEL_ID}`)) return false;
      const text = String(row.textContent || '').replace(/\s+/g, ' ').trim();
      return row.querySelectorAll('button').length >= 2 && /cancel/i.test(text) && /save settings/i.test(text);
    });
    if (actionRow) actionRow.classList.add('wordjar-voice-original-actions-hidden');
  }

  function chooseVoice(accent = getAccent(), scope = 'reader') {
    const voices = window.speechSynthesis?.getVoices?.() || [];
    const style = getResolvedStyle(scope);
    const accentItem = getAccentItem(accent || style.accent);

    return voices.find(voice => voice.lang === accentItem.value && style.keywords?.test(voice.name || '')) ||
      voices.find(voice => voice.lang === accentItem.value) ||
      voices.find(voice => String(voice.lang || '').toLowerCase().startsWith(accentItem.value.toLowerCase())) ||
      voices.find(voice => accentItem.keywords.test(voice.name || '') && /^en/i.test(voice.lang || '')) ||
      voices.find(voice => /^en/i.test(voice.lang || '')) ||
      null;
  }

  function stopPreview() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (typeof window.stopWordJarReaderTTS === 'function') window.stopWordJarReaderTTS();
  }

  function previewVoice(text, scope) {
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      if (typeof toast === 'function') toast('Text to speech is not supported in this browser');
      return;
    }
    const style = getResolvedStyle(scope);
    stopPreview();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = style.accent;
    utterance.rate = style.speed;
    utterance.pitch = style.pitch;
    const voice = chooseVoice(style.accent, scope);
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }

  function mountVoicePanel(card, scope) {
    const isReader = scope === 'reader';
    const panelId = isReader ? READER_PANEL_ID : GENERAL_PANEL_ID;
    if (!card || document.getElementById(panelId)) return;

    const selectedStyleId = isReader ? D.profile.readerVoiceStyleId : D.profile.voiceStyleId;
    const style = getResolvedStyle(scope);
    const panel = document.createElement('div');
    panel.id = panelId;
    panel.className = 'wordjar-voice-clean-section';
    panel.innerHTML = `
      <div class="wordjar-voice-clean-title">${isReader ? 'Reader Voice Style' : 'General / Flashcard Voice Style'}</div>
      <div class="wordjar-voice-clean-subtitle">${isReader ? 'Used for Reader View story listening.' : 'Used for Listen buttons, Flashcards, and Study Mode.'}</div>
      <div class="wordjar-voice-clean-field">
        <label class="wordjar-voice-clean-label" for="${panelId}Style">Voice style</label>
        <select id="${panelId}Style" class="wordjar-voice-clean-select">${styleOptions(selectedStyleId)}</select>
      </div>
      <div class="wordjar-voice-style-card" id="${panelId}Info">
        <div class="wordjar-voice-style-name">${style.name}</div>
        <div class="wordjar-voice-style-desc">${style.description}</div>
      </div>
      <div class="wordjar-voice-custom-grid${style.id === 'custom' ? '' : ' is-hidden'}" id="${panelId}Custom">
        <div class="wordjar-voice-clean-field">
          <label class="wordjar-voice-clean-label" for="${panelId}Accent">Custom accent</label>
          <select id="${panelId}Accent" class="wordjar-voice-clean-select">${accentOptions(style.accent)}</select>
        </div>
        <div class="wordjar-voice-clean-field">
          <div class="wordjar-voice-clean-label-row"><label class="wordjar-voice-clean-label" for="${panelId}Speed">Custom speed</label><span id="${panelId}SpeedValue" class="wordjar-voice-clean-value">${speedLabel(style.speed)}</span></div>
          <div class="wordjar-voice-tube-wrap"><span class="wordjar-voice-tube-mark">Slow</span><input id="${panelId}Speed" class="wordjar-voice-tube-range" type="range" min="0.5" max="1.5" step="0.05" value="${style.speed}"><span class="wordjar-voice-tube-mark">Fast</span></div>
        </div>
        <div class="wordjar-voice-clean-field">
          <div class="wordjar-voice-clean-label-row"><label class="wordjar-voice-clean-label" for="${panelId}Pitch">Custom pitch</label><span id="${panelId}PitchValue" class="wordjar-voice-clean-value">${pitchLabel(style.pitch)}</span></div>
          <div class="wordjar-voice-tube-wrap"><span class="wordjar-voice-tube-mark">Low</span><input id="${panelId}Pitch" class="wordjar-voice-tube-range" type="range" min="0.7" max="1.3" step="0.05" value="${style.pitch}"><span class="wordjar-voice-tube-mark">High</span></div>
        </div>
      </div>
      <div class="wordjar-reader-voice-actions">
        <button type="button" class="wordjar-reader-voice-btn" id="${panelId}PreviewBtn">Preview</button>
        <button type="button" class="wordjar-reader-voice-btn primary" id="${panelId}DefaultBtn">Default</button>
      </div>
    `;

    card.appendChild(panel);

    const styleSelect = document.getElementById(`${panelId}Style`);
    const info = document.getElementById(`${panelId}Info`);
    const custom = document.getElementById(`${panelId}Custom`);
    const accent = document.getElementById(`${panelId}Accent`);
    const speed = document.getElementById(`${panelId}Speed`);
    const pitch = document.getElementById(`${panelId}Pitch`);
    const speedValue = document.getElementById(`${panelId}SpeedValue`);
    const pitchValue = document.getElementById(`${panelId}PitchValue`);

    [speed, pitch].forEach(setRangeFill);

    function persistCustom() {
      if (isReader) {
        D.profile.customReaderVoiceAccent = accent.value;
        D.profile.customReaderVoiceSpeed = Number(speed.value);
        D.profile.customReaderVoicePitch = Number(pitch.value);
      } else {
        D.profile.customVoiceAccent = accent.value;
        D.profile.customVoiceSpeed = Number(speed.value);
        D.profile.customVoicePitch = Number(pitch.value);
      }
      saveSettings();
    }

    function refreshInfo() {
      const active = getResolvedStyle(scope);
      info.innerHTML = `<div class="wordjar-voice-style-name">${active.name}</div><div class="wordjar-voice-style-desc">${active.description}</div>`;
      custom.classList.toggle('is-hidden', active.id !== 'custom');
      accent.value = active.accent;
      speed.value = active.speed;
      pitch.value = active.pitch;
      speedValue.textContent = speedLabel(active.speed);
      pitchValue.textContent = pitchLabel(active.pitch);
      [speed, pitch].forEach(setRangeFill);
    }

    styleSelect.onchange = () => {
      if (isReader) D.profile.readerVoiceStyleId = styleSelect.value;
      else D.profile.voiceStyleId = styleSelect.value;
      saveSettings();
      refreshInfo();
      if (typeof toast === 'function') toast('Voice style saved');
    };

    accent.onchange = persistCustom;
    speed.oninput = () => { speedValue.textContent = speedLabel(speed.value); setRangeFill(speed); };
    pitch.oninput = () => { pitchValue.textContent = pitchLabel(pitch.value); setRangeFill(pitch); };
    speed.onchange = persistCustom;
    pitch.onchange = persistCustom;

    document.getElementById(`${panelId}PreviewBtn`).onclick = () => previewVoice(isReader ? 'Where is Papa going with that axe?' : 'This is your WordJar study voice.', scope);
    document.getElementById(`${panelId}DefaultBtn`).onclick = () => {
      if (isReader) D.profile.readerVoiceStyleId = 'uk_clear';
      else D.profile.voiceStyleId = 'us_neutral';
      saveSettings();
      styleSelect.value = isReader ? 'uk_clear' : 'us_neutral';
      refreshInfo();
      previewVoice(isReader ? 'Where is Papa going with that axe?' : 'This is your WordJar study voice.', scope);
    };
  }

  function mountSettings() {
    ensureReaderVoiceSettings();
    injectStyles();
    const card = findVoiceModalCard();
    if (!card) return;
    hideOriginalFields(card);
    mountVoicePanel(card, 'general');
    mountVoicePanel(card, 'reader');
  }

  function patchOpenVoiceModal() {
    if (window.__wordjarReaderVoiceOpenModalPatchedV4) return;
    const original = window.openVoiceModal;
    if (typeof original !== 'function') return;
    window.__wordjarReaderVoiceOpenModalPatchedV4 = true;
    window.openVoiceModal = function openVoiceModalWithVoiceStyles() {
      const result = original.apply(this, arguments);
      setTimeout(mountSettings, 0);
      setTimeout(mountSettings, 120);
      setTimeout(mountSettings, 360);
      return result;
    };
  }

  function getAccent() { ensureReaderVoiceSettings(); return getResolvedStyle('reader').accent; }
  function getGeneralAccent() { ensureReaderVoiceSettings(); return getResolvedStyle('general').accent; }
  function getReaderSpeed() { ensureReaderVoiceSettings(); return getResolvedStyle('reader').speed; }
  function getGeneralSpeed() { ensureReaderVoiceSettings(); return getResolvedStyle('general').speed; }
  function getReaderPitch() { ensureReaderVoiceSettings(); return getResolvedStyle('reader').pitch; }
  function getGeneralPitch() { ensureReaderVoiceSettings(); return getResolvedStyle('general').pitch; }

  function boot() {
    ensureReaderVoiceSettings();
    injectStyles();
    patchOpenVoiceModal();
    mountSettings();
  }

  window.WordJarReaderVoiceSettings = {
    accents: ACCENTS,
    voiceStyles: VOICE_STYLES,
    ensure: ensureReaderVoiceSettings,
    getAccent,
    getGeneralAccent,
    getSpeed: getReaderSpeed,
    getReaderSpeed,
    getGeneralSpeed,
    getReaderPitch,
    getGeneralPitch,
    getResolvedStyle,
    chooseVoice,
    mountSettings,
    preview: () => previewVoice('Where is Papa going with that axe?', 'reader'),
    stopPreview
  };

  boot();
  setTimeout(boot, 0);
  setTimeout(boot, 350);

  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => chooseVoice(getAccent(), 'reader');
  }
})();
