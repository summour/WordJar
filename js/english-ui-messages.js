// Jarble English UI Messages V1
// Keeps the English version free from Thai UI notifications/status text.
// Also normalizes old WordJar-facing branding to Jarble in the live UI.
// This only translates exact app/system messages, not vocabulary meanings or user content.

(function installJarbleEnglishUIMessages() {
  if (window.__wordjarEnglishUIMessagesInstalled) return;
  window.__wordjarEnglishUIMessagesInstalled = true;

  const APP_NAME = 'Jarble';
  const OLD_APP_NAME = 'WordJar';

  const MESSAGE_MAP = new Map([
    ['ยังไม่มี API Key ใน Private API Key', 'No API key found. Add your Private API Key in Settings.'],
    ['API Key ไม่ถูกต้อง ให้เช็ก Private API Key', 'The API key is invalid. Check your Private API Key.'],
    ['API Key ยังไม่มีสิทธิ์เรียก Gemini API / ถูกจำกัด referrer / ยังไม่ได้เปิด billing สำหรับโมเดลนี้', 'This API key does not have Gemini API access, has a referrer restriction, or needs billing enabled.'],
    ['โควต้า Gemini เต็มหรือโดน rate limit ลองใหม่ภายหลัง', 'Gemini quota or rate limit reached. Try again later.'],
    ['Flash model ไม่พร้อมใช้กับ key นี้ ลองเช็ก Gemini API key หรือ API restriction', 'The Flash model is not available for this key. Check your Gemini API key or API restrictions.'],
    ['เรียก Gemini ไม่ได้จาก network หรือ API key restriction', 'Could not reach Gemini. Check your network connection or API key restrictions.'],
    ['ยังไม่มีคำแปลในฐานข้อมูล', 'No translation found yet.'],
    ['ยังไม่มีคำแปลใน local dictionary', 'No translation found in local dictionary.'],
    ['ไม่มีคำแปลใน local dictionary', 'No translation found in local dictionary.'],
    ['กำลังโหลด...', 'Loading...'],
    ['กำลังบันทึก...', 'Saving...'],
    ['บันทึกแล้ว', 'Saved'],
    ['บันทึกไม่สำเร็จ', 'Save failed'],
    ['ยกเลิกแล้ว', 'Cancelled'],
    ['หยุดแล้ว', 'Stopped'],
    ['เกิดข้อผิดพลาด', 'Something went wrong'],
    ['ลองใหม่อีกครั้ง', 'Try again'],
    ['ไม่มีข้อมูล', 'No data'],
    ['ไม่พบข้อมูล', 'No data found']
  ]);

  function replaceBranding(value) {
    return String(value ?? '')
      .replaceAll(OLD_APP_NAME, APP_NAME)
      .replaceAll('wordjar', 'jarble')
      .replaceAll('Wordjar', APP_NAME);
  }

  function translateMessage(value) {
    const text = replaceBranding(value);
    const trimmed = text.trim();
    if (MESSAGE_MAP.has(trimmed)) return MESSAGE_MAP.get(trimmed);

    let output = text;
    MESSAGE_MAP.forEach((en, th) => {
      if (output.includes(th)) output = output.replaceAll(th, en);
    });
    return output;
  }

  function patchDocumentBranding() {
    document.title = replaceBranding(document.title || `${APP_NAME} - SUMMOUR`);

    const appTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appTitle) appTitle.setAttribute('content', APP_NAME);

    const images = document.querySelectorAll('img[alt]');
    images.forEach(img => {
      const nextAlt = replaceBranding(img.getAttribute('alt'));
      if (nextAlt !== img.getAttribute('alt')) img.setAttribute('alt', nextAlt);
    });

    const shareWatermark = document.getElementById('shareCardWatermark');
    if (shareWatermark) shareWatermark.textContent = 'jarble';
  }

  function patchDialogDefaults() {
    const dialog = window.WordJarDialog;
    if (!dialog || dialog.__jarbleBrandingPatched) return;

    const originalAlert = dialog.alert;
    const originalNotify = dialog.notify;

    if (typeof originalAlert === 'function') {
      dialog.alert = function jarbleAlert(options = {}) {
        if (typeof options === 'string') return originalAlert.call(this, replaceBranding(options));
        return originalAlert.call(this, {
          ...options,
          title: replaceBranding(options.title || APP_NAME),
          message: replaceBranding(options.message || '')
        });
      };
    }

    if (typeof originalNotify === 'function') {
      dialog.notify = function jarbleNotify(message, title = APP_NAME) {
        return originalNotify.call(this, replaceBranding(message), replaceBranding(title));
      };
    }

    dialog.__jarbleBrandingPatched = true;
  }

  function patchToast() {
    if (window.__wordjarEnglishToastPatched) return;
    if (typeof window.toast !== 'function') return;

    const originalToast = window.toast;
    window.__wordjarEnglishToastPatched = true;
    window.toast = function englishToast(message) {
      return originalToast.call(this, translateMessage(message));
    };
  }

  function patchAutoFillStatus() {
    if (window.__wordjarEnglishAutoFillStatusPatched) return;
    if (typeof window.setAutoFillStatus !== 'function') return;

    const originalStatus = window.setAutoFillStatus;
    window.__wordjarEnglishAutoFillStatusPatched = true;
    window.setAutoFillStatus = function englishAutoFillStatus(message, state) {
      return originalStatus.call(this, translateMessage(message), state);
    };
  }

  function normalizeTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const oldText = node.nodeValue;
    const newText = translateMessage(oldText);
    if (newText !== oldText) node.nodeValue = newText;
  }

  function normalizeElement(root) {
    if (!root) return;

    if (root.nodeType === Node.TEXT_NODE) {
      normalizeTextNode(root);
      return;
    }

    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      normalizeTextNode(node);
      node = walker.nextNode();
    }
  }

  function observeDOM() {
    if (window.__wordjarEnglishMessagesObserver) return;

    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(normalizeElement);
        if (mutation.type === 'characterData') normalizeTextNode(mutation.target);
      });
      patchDocumentBranding();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });

    window.__wordjarEnglishMessagesObserver = observer;
  }

  function boot() {
    patchDocumentBranding();
    patchDialogDefaults();
    patchToast();
    patchAutoFillStatus();
    normalizeElement(document.body);
    observeDOM();
  }

  window.WordJarEnglishUIMessages = {
    translateMessage,
    normalizeElement,
    boot
  };

  window.JarbleEnglishUIMessages = window.WordJarEnglishUIMessages;

  boot();
  setTimeout(boot, 0);
  setTimeout(boot, 500);
  setTimeout(boot, 1500);
  document.addEventListener('click', () => setTimeout(boot, 0), true);
})();
