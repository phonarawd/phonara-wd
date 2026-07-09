// Static offline fallback — outside the app bundle (no i18n catalog).
// Locale: phonara.locale → navigator.language → ko default.
// Keep COPY in sync with packages/i18n offline strings when they change.
var COPY = {
  ko: {
    title: '네트워크 연결 없음',
    body: '인터넷 연결을 확인하고 다시 시도해 주세요. 연결이 복구되면 자동으로 재연결됩니다.',
    retry: '다시 시도',
    docTitle: 'PHONARA — 오프라인',
  },
  en: {
    title: 'No network connection',
    body: 'Check your internet connection and try again. You will be reconnected automatically once the connection is restored.',
    retry: 'Retry',
    docTitle: 'PHONARA — Offline',
  },
};

function resolveLocale() {
  try {
    var stored = window.localStorage.getItem('phonara.locale');
    if (stored === 'ko' || stored === 'en') return stored;
  } catch {
    /* localStorage may be unavailable */
  }
  var nav = (navigator.language || 'ko').toLowerCase();
  return nav.indexOf('en') === 0 ? 'en' : 'ko';
}

var locale = resolveLocale();
var c = COPY[locale];
document.documentElement.lang = locale;
document.title = c.docTitle;
document.getElementById('title').textContent = c.title;
document.getElementById('body').textContent = c.body;
document.getElementById('retry').textContent = c.retry;
document.getElementById('retry').addEventListener('click', function () {
  location.reload();
});
window.addEventListener('online', function () {
  location.reload();
});
