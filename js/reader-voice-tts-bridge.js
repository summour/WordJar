// WordJar Reader Voice TTS Bridge V2
// Applies Reader Voice Settings to Reader storytelling TTS right before speech starts.

(function installWordJarReaderVoiceTTSBridge() {
  if (window.__wordjarReaderVoiceTTSBridgeInstalledV2) return;
  window.__wordjarReaderVoiceTTSBridgeInstalledV2 = true;

  const DEFAULT_ACCENT = 'en-GB';
  const DEFAULT_SPEED = 0.8;
  const DEFAULT_PITCH = 1;

  function clamp(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(min, Math.min(max, number));
  }

  function isReaderPage() {
    return window.curPage === 'reader' || document.body?.dataset?.page === 'reader';
  }

  function isReaderTTSUtterance(utterance) {
    const btn = document.getElementById('wordjarReaderTTSButton');
    const hasReaderButton = !!btn;
    const isReaderReading = !!btn?.classList.contains('is-reading') ||
      !!btn?.classList.contains('is-paused');

    return !!utterance && isReaderPage() && (hasReaderButton || isReaderReading);
  }

  function ensureSettings() {
    if (window.WordJarReaderVoiceSettings?.ensure) {
      window.WordJarReaderVoiceSettings.ensure();
      return;
    }

    window.D = window.D || {};
    D.profile = D.profile || {};

    if (!D.profile.readerVoiceAccent) D.profile.readerVoiceAccent = DEFAULT_ACCENT;

    const speed = Number(D.profile.readerVoiceSpeed);
    if (!Number.isFinite(speed) || speed < 0.5 || speed > 1.5) {
      D.profile.readerVoiceSpeed = DEFAULT_SPEED;
    }

    const pitch = Number(D.profile.readerVoicePitch);
    if (!Number.isFinite(pitch) || pitch < 0.7 || pitch > 1.3) {
      D.profile.readerVoicePitch = DEFAULT_PITCH;
    }
  }

  function getResolvedStyle() {
    ensureSettings();

    const resolved = window.WordJarReaderVoiceSettings
      ?.getResolvedStyle?.('reader');

    return {
      accent: resolved?.accent || D.profile?.readerVoiceAccent || DEFAULT_ACCENT,
      speed: clamp(
        resolved?.speed ?? D.profile?.readerVoiceSpeed,
        0.5,
        1.5,
        DEFAULT_SPEED
      ),
      pitch: clamp(
        resolved?.pitch ?? D.profile?.readerVoicePitch,
        0.7,
        1.3,
        DEFAULT_PITCH
      )
    };
  }

  function chooseVoice(accent) {
    if (window.WordJarReaderVoiceSettings?.chooseVoice) {
      return window.WordJarReaderVoiceSettings.chooseVoice(accent, 'reader');
    }

    const voices = window.speechSynthesis?.getVoices?.() || [];
    const normalizedAccent = String(accent || DEFAULT_ACCENT).toLowerCase();

    return voices.find(voice =>
      String(voice.lang || '').toLowerCase() === normalizedAccent
    ) ||
      voices.find(voice =>
        String(voice.lang || '').toLowerCase().startsWith(normalizedAccent)
      ) ||
      voices.find(voice => /^en/i.test(voice.lang || '')) ||
      null;
  }

  function applyReaderVoiceSettings(utterance) {
    if (!isReaderTTSUtterance(utterance)) return utterance;

    const style = getResolvedStyle();
    utterance.lang = style.accent;
    utterance.rate = style.speed;
    utterance.pitch = style.pitch;

    const voice = chooseVoice(style.accent);
    if (voice) utterance.voice = voice;

    return utterance;
  }

  function patchSpeak() {
    if (!window.speechSynthesis) return;
    if (window.speechSynthesis.__wordjarReaderVoiceSpeakPatchedV2) return;

    const originalSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
    window.speechSynthesis.__wordjarReaderVoiceSpeakPatchedV2 = true;

    window.speechSynthesis.speak = function speakWithReaderVoiceSettings(utterance) {
      return originalSpeak(applyReaderVoiceSettings(utterance));
    };
  }

  function boot() {
    ensureSettings();
    patchSpeak();
  }

  boot();
  setTimeout(boot, 0);
  setTimeout(boot, 300);

  if (window.speechSynthesis?.addEventListener) {
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      chooseVoice(getResolvedStyle().accent);
    });
  }
})();
