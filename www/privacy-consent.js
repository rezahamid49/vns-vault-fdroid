/* ==========================================
   VNS Vault — Privacy Policy Consent Gate
   Mobile only. Load AFTER lang-*.js, BEFORE app.js.
   ========================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'vns_privacy_accepted';
  var POLICY_URL = 'https://vnsminer.com/privacy-policy/';
  var OVERLAY_ID = 'vns-privacy-consent-overlay';

  var I18N = {
    en: {
      privacy_title: 'Privacy Policy',
      privacy_text: 'Before using VNS Vault, please read and accept our Privacy Policy. The app works fully offline; no account data is sent to our servers. The camera is used only for QR code scanning and for syncing with the Windows application.',
      privacy_zero: 'VNS GROUP LIMITED operates under a strict Zero-Telemetry policy. The VNS Vault mobile and desktop applications do not collect, track, store, or transmit any personal metrics, device identifiers, IP addresses, or password vault data to external servers. All encryption and decryption processes run entirely offline on your local device CPU.',
      privacy_accept: 'I Agree / Accept',
      privacy_decline: 'Decline & Exit',
      privacy_note: 'If you decline, the app will close. Opening the app again will show this screen until you accept.',
      privacy_declined_title: 'Privacy policy declined.',
      privacy_declined_body: 'Please close the app and open again to accept.'
    },
    fa: {
      privacy_title: 'سیاست حریم خصوصی',
      privacy_text: 'قبل از استفاده از VNS Vault، لطفاً سیاست حریم خصوصی را مطالعه و قبول کنید. این برنامه کاملاً آفلاین کار می‌کند و هیچ داده حسابی به سرورهای ما ارسال نمی‌شود. دوربین فقط برای اسکن کد QR و همگام‌سازی با برنامه ویندوز استفاده می‌شود.',
      privacy_zero: 'شرکت VNS GROUP LIMITED تحت سیاست سخت‌گیرانه عدم جمع‌آوری داده (Zero-Telemetry) فعالیت می‌کند. اپلیکیشن موبایل و دسکتاپ VNS Vault هیچ متریک شخصی، شناسه دستگاه، آدرس IP یا گاوصندوق رمز عبوری را جمع‌آوری، ردیابی، ذخیره یا به سرورهای خارجی ارسال نمی‌کند. تمام فرآیندهای رمزنگاری و رمزگشایی کاملاً آفلاین و روی CPU دستگاه محلی شما اجرا می‌شوند.',
      privacy_accept: 'موافقم / قبول می‌کنم',
      privacy_decline: 'رد و خروج',
      privacy_note: 'در صورت رد، برنامه بسته می‌شود. با باز کردن مجدد، تا زمان قبول، همین صفحه نمایش داده می‌شود.',
      privacy_declined_title: 'سیاست حریم خصوصی رد شد.',
      privacy_declined_body: 'لطفاً برنامه را ببندید و دوباره باز کنید تا قبول کنید.'
    },
    ar: {
      privacy_title: 'سياسة الخصوصية',
      privacy_text: 'قبل استخدام VNS Vault، يُرجى قراءة سياسة الخصوصية والموافقة عليها. يعمل التطبيق دون اتصال بالإنترنت بالكامل ولا تُرسل أي بيانات حساب إلى خوادمنا. تُستخدم الكاميرا فقط لمسح رمز QR والمزامنة مع تطبيق ويندوز.',
      privacy_zero: 'تعمل شركة VNS GROUP LIMITED وفق سياسة صارمة لعدم جمع البيانات (Zero-Telemetry). لا تجمع تطبيقات VNS Vault للهاتف وسطح المكتب ولا تتتبع ولا تخزن ولا ترسل أي مقاييس شخصية أو معرّفات جهاز أو عناوين IP أو بيانات خزنة كلمات المرور إلى خوادم خارجية. تتم جميع عمليات التشفير وفك التشفير دون اتصال بالكامل على وحدة المعالجة المركزية لجهازك المحلي.',
      privacy_accept: 'أوافق / قبول',
      privacy_decline: 'رفض والخروج',
      privacy_note: 'في حال الرفض سيُغلق التطبيق. عند فتحه مرة أخرى ستظهر هذه الشاشة حتى الموافقة.',
      privacy_declined_title: 'تم رفض سياسة الخصوصية.',
      privacy_declined_body: 'يرجى إغلاق التطبيق وفتحه مرة أخرى للموافقة.'
    },
    zh: {
      privacy_title: '隐私政策',
      privacy_text: '使用 VNS Vault 前，请阅读并同意我们的隐私政策。本应用完全离线运行，不会将任何账户数据发送至我们的服务器。摄像头仅用于扫描二维码以及与 Windows 应用同步。',
      privacy_zero: 'VNS GROUP LIMITED 实行严格的零遥测（Zero-Telemetry）政策。VNS Vault 手机与桌面应用不会收集、追踪、存储或向外部服务器传输任何个人指标、设备标识符、IP 地址或密码库数据。所有加密与解密过程均在您本地设备的 CPU 上完全离线执行。',
      privacy_accept: '同意 / 接受',
      privacy_decline: '拒绝并退出',
      privacy_note: '若拒绝，应用将关闭。再次打开时，在您同意之前将继续显示此界面。',
      privacy_declined_title: '已拒绝隐私政策。',
      privacy_declined_body: '请关闭应用并重新打开以接受。'
    }
  };

  function detectLang() {
    try {
      var saved =
        localStorage.getItem('vns_lang') ||
        localStorage.getItem('app_lang') ||
        localStorage.getItem('language') ||
        localStorage.getItem('currentLang') ||
        '';
      saved = String(saved).toLowerCase();
      if (saved.indexOf('fa') === 0 || saved === 'persian' || saved === 'farsi') return 'fa';
      if (saved.indexOf('ar') === 0 || saved === 'arabic') return 'ar';
      if (saved.indexOf('zh') === 0 || saved.indexOf('cn') === 0 || saved === 'chinese') return 'zh';
      if (saved.indexOf('en') === 0) return 'en';
    } catch (e) {}
    try {
      if (typeof window.currentLang === 'string') {
        var cl = window.currentLang.toLowerCase();
        if (cl.indexOf('fa') === 0) return 'fa';
        if (cl.indexOf('ar') === 0) return 'ar';
        if (cl.indexOf('zh') === 0 || cl.indexOf('cn') === 0) return 'zh';
        if (cl.indexOf('en') === 0) return 'en';
      }
    } catch (e1) {}
    try {
      var nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
      if (nav.indexOf('fa') === 0) return 'fa';
      if (nav.indexOf('ar') === 0) return 'ar';
      if (nav.indexOf('zh') === 0) return 'zh';
    } catch (e2) {}
    return 'en';
  }

  function tr(key) {
    try {
      if (typeof window.t === 'function') {
        var v = window.t(key);
        if (v && v !== key) return v;
      }
    } catch (e) {}
    var lang = detectLang();
    var pack = I18N[lang] || I18N.en;
    return pack[key] || I18N.en[key] || key;
  }

  function isRtl() {
    var lang = detectLang();
    return lang === 'fa' || lang === 'ar';
  }

  function hasAccepted() {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function markAccepted() {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch (e) {}
  }

  function exitApp() {
    try {
      if (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.App && typeof Capacitor.Plugins.App.exitApp === 'function') {
        Capacitor.Plugins.App.exitApp();
        return;
      }
    } catch (e) {}
    try { window.close(); } catch (e3) {}
    try {
      document.documentElement.innerHTML =
        '<body style="margin:0;background:#0f172a;color:#94a3b8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;padding:24px;direction:' +
        (isRtl() ? 'rtl' : 'ltr') +
        ';"><div><p style="font-weight:800;font-size:14px;">' +
        tr('privacy_declined_title') +
        '</p><p style="font-size:12px;margin-top:8px;">' +
        tr('privacy_declined_body') +
        '</p></div></body>';
    } catch (e4) {}
  }

  function injectStyles() {
    var old = document.getElementById('vns-privacy-consent-css');
    if (old) old.remove();

    var style = document.createElement('style');
    style.id = 'vns-privacy-consent-css';
    style.textContent = [
      '#' + OVERLAY_ID + ' {',
      '  position: fixed !important;',
      '  top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;',
      '  width: 100vw !important; height: 100vh !important;',
      '  z-index: 2147483000 !important;',
      '  display: flex !important;',
      '  flex-direction: column !important;',
      '  align-items: center !important;',
      '  justify-content: center !important;',
      '  background: rgba(15, 23, 42, 0.92) !important;',
      '  backdrop-filter: blur(10px) !important;',
      '  -webkit-backdrop-filter: blur(10px) !important;',
      '  padding: 16px !important;',
      '  box-sizing: border-box !important;',
      '  margin: 0 !important;',
      '  overflow-y: auto !important;',
      '  -webkit-overflow-scrolling: touch !important;',
      '  font-family: Inter, system-ui, sans-serif !important;',
      '}',
      '#' + OVERLAY_ID + '.vns-privacy-hidden { display: none !important; }',
      '#' + OVERLAY_ID + ' .vns-privacy-card {',
      '  display: flex !important;',
      '  flex-direction: column !important;',
      '  align-items: center !important;',
      '  width: 100% !important;',
      '  max-width: 340px !important;',
      '  max-height: min(88vh, 640px) !important;',
      '  overflow-y: auto !important;',
      '  -webkit-overflow-scrolling: touch !important;',
      '  background: #ffffff !important;',
      '  border-radius: 28px !important;',
      '  border: 2px solid #99f6e4 !important;',
      '  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.35) !important;',
      '  padding: 24px 20px 20px !important;',
      '  text-align: center !important;',
      '  box-sizing: border-box !important;',
      '  margin: auto !important;',
      '}',
      '#' + OVERLAY_ID + ' .vns-privacy-icon {',
      '  width: 56px !important; height: 56px !important;',
      '  margin: 0 auto 12px !important;',
      '  border-radius: 16px !important;',
      '  background: #f0fdfa !important;',
      '  border: 1px solid #99f6e4 !important;',
      '  display: flex !important;',
      '  align-items: center !important;',
      '  justify-content: center !important;',
      '  flex-shrink: 0 !important;',
      '}',
      '#' + OVERLAY_ID + ' .vns-privacy-icon img {',
      '  width: 36px !important; height: 36px !important;',
      '  object-fit: contain !important; display: block !important;',
      '}',
      '#' + OVERLAY_ID + ' .vns-privacy-lang {',
      '  display: flex !important; flex-direction: row !important;',
      '  flex-wrap: wrap !important; justify-content: center !important;',
      '  gap: 6px !important; margin: 0 0 14px !important; width: 100% !important;',
      '  flex-shrink: 0 !important;',
      '}',
      '#' + OVERLAY_ID + ' .vns-privacy-lang button {',
      '  border: 1px solid #e2e8f0 !important; background: #f8fafc !important;',
      '  color: #475569 !important; border-radius: 9999px !important;',
      '  padding: 6px 10px !important; font-size: 10px !important;',
      '  font-weight: 800 !important; cursor: pointer !important; margin: 0 !important;',
      '}',
      '#' + OVERLAY_ID + ' .vns-privacy-lang button.active {',
      '  background: #0D9488 !important; color: #fff !important; border-color: #0D9488 !important;',
      '}',
      '#' + OVERLAY_ID + ' .vns-privacy-title {',
      '  display: block !important; font-size: 15px !important; font-weight: 900 !important;',
      '  color: #0f766e !important; text-transform: uppercase !important;',
      '  margin: 0 0 10px !important; width: 100% !important; text-align: center !important;',
      '  flex-shrink: 0 !important;',
      '}',
      '#' + OVERLAY_ID + ' .vns-privacy-text {',
      '  display: block !important; font-size: 12px !important; font-weight: 600 !important;',
      '  color: #475569 !important; line-height: 1.6 !important;',
      '  margin: 0 0 12px !important; width: 100% !important; text-align: center !important;',
      '}',
      '#' + OVERLAY_ID + ' .vns-privacy-zero {',
      '  display: block !important; font-size: 11px !important; font-weight: 600 !important;',
      '  color: #334155 !important; line-height: 1.55 !important;',
      '  margin: 0 0 14px !important; width: 100% !important; text-align: center !important;',
      '  background: #f0fdfa !important; border: 1px solid #ccfbf1 !important;',
      '  border-radius: 14px !important; padding: 12px 10px !important;',
      '  box-sizing: border-box !important;',
      '}',
      '#' + OVERLAY_ID + ' .vns-privacy-link {',
      '  display: block !important; font-size: 11px !important; font-weight: 800 !important;',
      '  color: #0D9488 !important; text-decoration: underline !important;',
      '  margin: 0 0 16px !important; word-break: break-all !important;',
      '  width: 100% !important; text-align: center !important;',
      '  flex-shrink: 0 !important;',
      '}',
      '#' + OVERLAY_ID + ' .vns-privacy-btns {',
      '  display: flex !important; flex-direction: column !important;',
      '  gap: 10px !important; width: 100% !important;',
      '  flex-shrink: 0 !important;',
      '}',
      '#' + OVERLAY_ID + ' .vns-privacy-btn {',
      '  display: block !important; width: 100% !important; border: none !important;',
      '  border-radius: 9999px !important; padding: 12px 16px !important;',
      '  font-size: 12px !important; font-weight: 900 !important;',
      '  text-transform: uppercase !important; cursor: pointer !important;',
      '  box-sizing: border-box !important;',
      '}',
      '#' + OVERLAY_ID + ' .vns-privacy-accept {',
      '  background: #0D9488 !important; color: #fff !important;',
      '  box-shadow: 0 8px 20px rgba(13,148,136,0.35) !important;',
      '}',
      '#' + OVERLAY_ID + ' .vns-privacy-decline {',
      '  background: #f1f5f9 !important; color: #64748b !important;',
      '  border: 1px solid #e2e8f0 !important;',
      '}',
      '#' + OVERLAY_ID + ' .vns-privacy-note {',
      '  display: block !important; margin-top: 12px !important;',
      '  font-size: 10px !important; font-weight: 600 !important;',
      '  color: #94a3b8 !important; line-height: 1.4 !important;',
      '  width: 100% !important; text-align: center !important;',
      '  flex-shrink: 0 !important;',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function openPolicyLink(e) {
    if (e) e.preventDefault();
    try {
      if (window.Capacitor && Capacitor.Plugins) {
        var Browser = Capacitor.Plugins.Browser;
        if (Browser && typeof Browser.open === 'function') {
          Browser.open({ url: POLICY_URL }).catch(function () { window.open(POLICY_URL, '_blank'); });
          return;
        }
        var AppPlugin = Capacitor.Plugins.App;
        if (AppPlugin && typeof AppPlugin.openUrl === 'function') {
          AppPlugin.openUrl({ url: POLICY_URL }).catch(function () { window.open(POLICY_URL, '_blank'); });
          return;
        }
      }
    } catch (err) {}
    window.open(POLICY_URL, '_blank');
  }

  function setLang(lang) {
    lang = String(lang || 'en').toLowerCase();
    if (lang === 'cn') lang = 'zh';
    if (!I18N[lang]) lang = 'en';
    try {
      localStorage.setItem('vns_lang', lang === 'zh' ? 'zh' : lang);
      localStorage.setItem('app_lang', lang === 'zh' ? 'cn' : lang);
    } catch (e) {}
    try {
      if (typeof window.changeLanguage === 'function') {
        window.changeLanguage(lang === 'zh' ? 'zh' : lang);
      }
    } catch (e2) {}
    var existing = document.getElementById(OVERLAY_ID);
    if (existing) existing.remove();
    showOverlay();
  }

  function buildOverlay() {
    var old = document.getElementById(OVERLAY_ID);
    if (old) old.remove();

    var lang = detectLang();
    var rtl = isRtl();

    var overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('dir', rtl ? 'rtl' : 'ltr');

    var card = document.createElement('div');
    card.className = 'vns-privacy-card';

    var iconWrap = document.createElement('div');
    iconWrap.className = 'vns-privacy-icon';
    var logo = document.createElement('img');
    logo.src = 'vnsgroup.ico';
    logo.alt = 'VNS';
    logo.onerror = function () { this.onerror = null; this.src = 'vnsgroup.png'; };
    iconWrap.appendChild(logo);
    card.appendChild(iconWrap);

    var langBar = document.createElement('div');
    langBar.className = 'vns-privacy-lang';
    langBar.id = 'vns-privacy-lang-bar';
    [['en', 'EN'], ['fa', 'FA'], ['ar', 'AR'], ['zh', '中文']].forEach(function (pair) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('data-lang', pair[0]);
      btn.textContent = pair[1];
      if (lang === pair[0]) btn.className = 'active';
      langBar.appendChild(btn);
    });
    card.appendChild(langBar);

    var title = document.createElement('h2');
    title.className = 'vns-privacy-title';
    title.setAttribute('data-i18n', 'privacy_title');
    title.textContent = tr('privacy_title');
    card.appendChild(title);

    var text = document.createElement('p');
    text.className = 'vns-privacy-text';
    text.setAttribute('data-i18n', 'privacy_text');
    text.textContent = tr('privacy_text');
    card.appendChild(text);

    var zero = document.createElement('p');
    zero.className = 'vns-privacy-zero';
    zero.setAttribute('data-i18n', 'privacy_zero');
    zero.textContent = tr('privacy_zero');
    card.appendChild(zero);

    var link = document.createElement('a');
    link.className = 'vns-privacy-link';
    link.href = POLICY_URL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.id = 'vns-privacy-policy-link';
    link.textContent = POLICY_URL;
    card.appendChild(link);

    var btns = document.createElement('div');
    btns.className = 'vns-privacy-btns';

    var acceptBtn = document.createElement('button');
    acceptBtn.type = 'button';
    acceptBtn.className = 'vns-privacy-btn vns-privacy-accept';
    acceptBtn.id = 'vns-privacy-accept-btn';
    acceptBtn.setAttribute('data-i18n', 'privacy_accept');
    acceptBtn.textContent = tr('privacy_accept');
    btns.appendChild(acceptBtn);

    var declineBtn = document.createElement('button');
    declineBtn.type = 'button';
    declineBtn.className = 'vns-privacy-btn vns-privacy-decline';
    declineBtn.id = 'vns-privacy-decline-btn';
    declineBtn.setAttribute('data-i18n', 'privacy_decline');
    declineBtn.textContent = tr('privacy_decline');
    btns.appendChild(declineBtn);

    card.appendChild(btns);

    var note = document.createElement('p');
    note.className = 'vns-privacy-note';
    note.setAttribute('data-i18n', 'privacy_note');
    note.textContent = tr('privacy_note');
    card.appendChild(note);

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    link.addEventListener('click', openPolicyLink);
    acceptBtn.addEventListener('click', function () {
      markAccepted();
      hideOverlay();
    });
    declineBtn.addEventListener('click', function () {
      exitApp();
    });
    langBar.addEventListener('click', function (ev) {
      var b = ev.target && ev.target.closest ? ev.target.closest('button[data-lang]') : null;
      if (!b) return;
      setLang(b.getAttribute('data-lang'));
    });

    return overlay;
  }

  function showOverlay() {
    injectStyles();
    var el = buildOverlay();
    el.classList.remove('vns-privacy-hidden');
    document.body.style.overflow = 'hidden';
  }

  function hideOverlay() {
    var el = document.getElementById(OVERLAY_ID);
    if (el) el.classList.add('vns-privacy-hidden');
    document.body.style.overflow = '';
  }

  function runGate() {
    if (hasAccepted()) return;
    showOverlay();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runGate);
  } else {
    runGate();
  }

  try {
    if (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.App) {
      Capacitor.Plugins.App.addListener('appStateChange', function (state) {
        if (state && state.isActive && !hasAccepted()) {
          showOverlay();
        }
      });
    }
  } catch (e) {}

  window.VnsPrivacyConsent = {
    hasAccepted: hasAccepted,
    show: showOverlay,
    setLang: setLang,
    reset: function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      showOverlay();
    }
  };
})();