/* ==========================================================================
   VNS SECURE VAULT - ISOLATED MOBILE CARDS ARCHITECTURE (m-card.js)
   ========================================================================== */
var mContextMenuCardId = null;
var mLongPressTimeout = null;
var mIsLongPressAction = false;
var mPressStartTime = 0; 

var mTouchStartX = 0;
var mTouchStartY = 0;
var mIsScrollingDetected = false;

var mPaymentCards = JSON.parse(localStorage.getItem('vns_cards') || '[]');
var mActiveCardId = null;
var mCurrentlyRevealedCardId = null;
var mRevealTimeout = null;
var selectedCardIds = new Set();

const M_BANK_REGISTRY = {
    "3": { name: "AMEX", logo: "", theme: "card-amex" },
    "4": { name: "VISA", logo: "", theme: "card-visa" },
    "5": { name: "MasterCard", logo: "", theme: "card-mastercard" },
    "62": { name: "UnionPay", logo: "", theme: "card-unionpay" },

    // ????????? ?????
    "603769": { name: "Saderat Bank", logo: "saderat.svg", theme: "card-saderat" },
    "603799": { name: "Melli Bank", logo: "melli.svg", theme: "card-melli" },
    "589910": { name: "Sepah Bank", logo: "sepah.svg", theme: "card-sepah" },
    "628023": { name: "Maskan Bank", logo: "maskan.svg", theme: "card-maskan" },
    "627353": { name: "Tejarat Bank", logo: "tejarat.svg", theme: "card-tejarat" },
    "603770": { name: "Keshavarzi Bank", logo: "keshavarzi.svg", theme: "card-keshavarzi" },
    "610433": { name: "Mellat Bank", logo: "mellat.svg", theme: "card-mellat" },
    "589463": { name: "Refah Bank", logo: "refah.svg", theme: "card-refah" },
    "502229": { name: "Pasargad Bank", logo: "pasargad.svg", theme: "card-pasargad" },
    "622106": { name: "Parsian Bank", logo: "parsian.svg", theme: "card-parsian" },
    "627412": { name: "Eghtesad Novin Bank", logo: "enbank.svg", theme: "card-enbank" },
    "621986": { name: "Saman Bank", logo: "saman.svg", theme: "card-saman" },
    "502938": { name: "Day Bank", logo: "day.svg", theme: "card-day" },
    "639607": { name: "Sarmayeh Bank", logo: "sarmayeh.svg", theme: "card-sarmayeh" },
    "627381": { name: "Ansar Bank", logo: "ansar.svg", theme: "card-ansar" },
    "639346": { name: "Sina Bank", logo: "sina.svg", theme: "card-sina" },
    "627961": { name: "Sanat o Madan Bank", logo: "sanatvamadan.svg", theme: "card-sanatmadan" },
    "502806": { name: "Shahr Bank", logo: "shahr.svg", theme: "card-shahr" },
    "627488": { name: "Karafarin Bank", logo: "karafarin.svg", theme: "card-karafarin" },
    "505416": { name: "Gardeshgari Bank", logo: "gardeshgari.svg", theme: "card-gardeshgari" },
    "505785": { name: "Iran Zamin Bank", logo: "iranzamin.svg", theme: "card-iranzamin" },
    "502908": { name: "Tose'e Ta'avon Bank", logo: "tosee_taavon.svg", theme: "card-taavon" },
    "627648": { name: "Tose'e Saderat Bank", logo: "tosee_saderat.svg", theme: "card-toseesaderat" },

    // ????
    "491020": { name: "Agricultural Bank", logo: "abc.svg", theme: "card-abc" },
    "518262": { name: "Agricultural Bank", logo: "abc.svg", theme: "card-abc" },
    "622848": { name: "Agricultural Bank", logo: "abc.svg", theme: "card-abc" },
    "409666": { name: "Bank of china", logo: "boc.svg", theme: "card-boc" },
    "524865": { name: "Bank of china", logo: "boc.svg", theme: "card-boc" },
    "469380": { name: "Bank of china", logo: "boc.svg", theme: "card-boc" },
    "621661": { name: "Bank of china", logo: "boc.svg", theme: "card-boc" },
    "621785": { name: "Bank of china", logo: "boc.svg", theme: "card-boc" },
    "400360": { name: "China Citic Bank", logo: "ccob.svg", theme: "card-citic" },
    "403393": { name: "China Citic Bank", logo: "ccob.svg", theme: "card-citic" },
    "404174": { name: "China Citic Bank", logo: "ccob.svg", theme: "card-citic" },
    "406758": { name: "China Citic Bank", logo: "ccob.svg", theme: "card-citic" },
    "379922": { name: "China Citic Bank", logo: "ccob.svg", theme: "card-citic" },
    "356966": { name: "China Citic Bank", logo: "ccob.svg", theme: "card-citic" },
    "436748": { name: "China Construction Bank", logo: "ccb.svg", theme: "card-cons" },
    "544887": { name: "China Construction Bank", logo: "ccb.svg", theme: "card-cons" },
    "479229": { name: "China Merchants Bank", logo: "cmb.svg", theme: "card-merch" },
    "518710": { name: "China Merchants Bank", logo: "cmb.svg", theme: "card-merch" },
    "517631": { name: "China Minsheng Bank", logo: "cmib.svg", theme: "card-cmi" },
    "488888": { name: "China Minsheng Bank", logo: "cmib.svg", theme: "card-cmi" },
    "402791": { name: "ICBC", logo: "icbc.svg", theme: "card-icbc" },
    "402792": { name: "ICBC", logo: "icbc.svg", theme: "card-icbc" },
    "413519": { name: "ICBC", logo: "icbc.svg", theme: "card-icbc" },
    "413520": { name: "ICBC", logo: "icbc.svg", theme: "card-icbc" },
    "413521": { name: "ICBC", logo: "icbc.svg", theme: "card-icbc" },
    "415026": { name: "ICBC", logo: "icbc.svg", theme: "card-icbc" },
    "415027": { name: "ICBC", logo: "icbc.svg", theme: "card-icbc" },
    "427010": { name: "ICBC", logo: "icbc.svg", theme: "card-icbc" },
    "427020": { name: "ICBC", logo: "icbc.svg", theme: "card-icbc" },
    "427019": { name: "ICBC", logo: "icbc.svg", theme: "card-icbc" },
    "427028": { name: "ICBC", logo: "icbc.svg", theme: "card-icbc" },
    "427029": { name: "ICBC", logo: "icbc.svg", theme: "card-icbc" },
    "427030": { name: "ICBC", logo: "icbc.svg", theme: "card-icbc" },
    "427038": { name: "ICBC", logo: "icbc.svg", theme: "card-icbc" },
    "427039": { name: "ICBC", logo: "icbc.svg", theme: "card-icbc" },
    "438125": { name: "ICBC", logo: "icbc.svg", theme: "card-icbc" },
    "438126": { name: "ICBC", logo: "icbc.svg", theme: "card-icbc" },
    "450547": { name: "ICBC", logo: "icbc.svg", theme: "card-icbc" },
    "450548": { name: "ICBC", logo: "icbc.svg", theme: "card-icbc" },
    "525998": { name: "SPD Bank", logo: "spd.svg", theme: "card-spd" },

    // ???????
    "406394": { name: "Mashreq Bank", logo: "mashreq.svg", theme: "card-mashreq" },
    "421422": { name: "Mashreq Bank", logo: "mashreq.svg", theme: "card-mashreq" },
    "455641": { name: "Mashreq Bank", logo: "mashreq.svg", theme: "card-mashreq" },
    "428801": { name: "FAB", logo: "fab.svg", theme: "card-fab" },
    "485573": { name: "FAB", logo: "fab.svg", theme: "card-fab" },
    "452485": { name: "FAB", logo: "fab.svg", theme: "card-fab" },
    "520448": { name: "FAB", logo: "fab.svg", theme: "card-fab" },
    "462587": { name: "ADCB", logo: "adcb.svg", theme: "card-adcb" },
    "423837": { name: "ADCB", logo: "adcb.svg", theme: "card-adcb" },
    "403390": { name: "ADCB", logo: "adcb.svg", theme: "card-adcb" },
    "432427": { name: "DIB", logo: "dib.svg", theme: "card-dib" },
    "406145": { name: "DIB", logo: "dib.svg", theme: "card-dib" },
    "452445": { name: "DIB", logo: "dib.svg", theme: "card-dib" },
    "422247": { name: "ADIB", logo: "adib.svg", theme: "card-adib" },
    "469147": { name: "ADIB", logo: "adib.svg", theme: "card-adib" },
    "403541": { name: "ADIB", logo: "adib.svg", theme: "card-adib" },
    "533256": { name: "Reem Bank", logo: "reem.svg", theme: "card-reem" },
    "401124": { name: "Reem Bank", logo: "reem.svg", theme: "card-reem" },

    // ??????
    "484718": { name: "Vanilla Visa", logo: "", theme: "card-visa" },
    "491277": { name: "Vanilla Visa Gift", logo: "", theme: "card-visa" },
    "411574": { name: "Vanilla Visa", logo: "", theme: "card-visa" },
    "403152": { name: "Vanilla Visa", logo: "", theme: "card-visa" },
    "435880": { name: "Vanilla Visa Premium", logo: "", theme: "card-visa" },
    "511322": { name: "Vanilla Master Gift", logo: "", theme: "card-mastercard" },
    "515554": { name: "Vanilla Master", logo: "", theme: "card-mastercard" },
    "545564": { name: "Vanilla Master", logo: "", theme: "card-mastercard" },
    "545318": { name: "Vanilla Master Gift", logo: "", theme: "card-mastercard" },
    "414398": { name: "GreenDot Visa", logo: "", theme: "card-visa" },
    "529124": { name: "GreenDot Master", logo: "", theme: "card-mastercard" },
    "426422": { name: "Walmart MoneyCard", logo: "", theme: "card-visa" },
    "532836": { name: "Walmart MoneyCard", logo: "", theme: "card-mastercard" },
    "478641": { name: "Netspend Visa", logo: "", theme: "card-visa" },
    "400000": { name: "CHASE VISA", logo: "", theme: "card-visa" },
    "440066": { name: "BOA VISA", logo: "", theme: "card-visa" },
    "454347": { name: "HSBC VISA", logo: "", theme: "card-visa" },
    "543211": { name: "CITIBANK MASTER", logo: "", theme: "card-mastercard" }
};

function mOrderDetectBank(cardNumber) {
    const clean = (cardNumber || '').replace(/\s/g, '');
    
    if (clean.length >= 6 && M_BANK_REGISTRY[clean.substring(0, 6)]) {
        const bank = M_BANK_REGISTRY[clean.substring(0, 6)];
        return { name: bank.name, logo: bank.logo ? 'logos/' + bank.logo : '', theme: bank.theme };
    }
    if (clean.length >= 2 && M_BANK_REGISTRY[clean.substring(0, 2)]) {
        const bank = M_BANK_REGISTRY[clean.substring(0, 2)];
        return { name: bank.name, logo: bank.logo ? 'logos/' + bank.logo : '', theme: bank.theme };
    }
    if (clean.length >= 1 && M_BANK_REGISTRY[clean.substring(0, 1)]) {
        const bank = M_BANK_REGISTRY[clean.substring(0, 1)];
        return { name: bank.name, logo: bank.logo ? 'logos/' + bank.logo : '', theme: bank.theme };
    }
    
    if (clean.startsWith('4')) {
        return { name: "VISA", logo: "", theme: "card-visa" };
    }
    if (clean.startsWith('5')) {
        return { name: "MasterCard", logo: "", theme: "card-mastercard" };
    }
    if (clean.startsWith('62') || clean.startsWith('81')) {
        return { name: "UnionPay", logo: "", theme: "card-unionpay" };
    }
    if (clean.startsWith('3')) {
        return { name: "AMEX", logo: "", theme: "card-amex" };
    }

    const defaultName = typeof t === 'function' ? t("card_generic_name") : "BANK CARD";
    return { name: defaultName, logo: "logos/generic.svg", theme: "card-generic" };
}


/* ==========================================================================
   CUSTOM CARD APPEARANCE (logo + solid/gradient colors)
   ========================================================================== */
function mGetCardStyleObject(card, bankThemeClass) {
    const mode = (card && card.colorMode) ? card.colorMode : 'auto';
    if (mode === 'auto' || !card || !card.color1) {
        return { className: bankThemeClass || 'card-generic', style: '' };
    }
    const c1 = card.color1 || '#0D9488';
    const c2 = card.color2 || c1;
    const ratio = Math.max(0, Math.min(100, parseInt(card.colorRatio != null ? card.colorRatio : 50, 10) || 50));
    const dirMap = {
        'to-bottom': 'to bottom',
        'to-top': 'to top',
        'to-right': 'to right',
        'to-left': 'to left',
        'to-bottom-right': 'to bottom right',
        'to-bottom-left': 'to bottom left'
    };
    const dirKey = card.gradientDir || 'to-bottom';
    const dir = dirMap[dirKey] || 'to bottom';
    if (mode === 'solid') {
        return { className: 'card-custom-user', style: 'background: ' + c1 + ' !important;' };
    }
    // Soft blend around the ratio stop (no hard parallel line)
    var blend = 18;
    var stopA = Math.max(0, ratio - blend);
    var stopB = Math.min(100, ratio + blend);
    return {
        className: 'card-custom-user',
        style: 'background: linear-gradient(' + dir + ', ' + c1 + ' 0%, ' + c1 + ' ' + stopA + '%, ' + c2 + ' ' + stopB + '%, ' + c2 + ' 100%) !important;'
    };
}

function mBuildLogoMarkup(card, bankInfo) {
    if (card && card.customLogo) {
        return '<img src="' + card.customLogo + '" alt="Logo" class="m-bank-logo object-contain drop-shadow-md" style="max-height:48px;max-width:96px;">';
    }
    const themeLower = ((bankInfo && bankInfo.theme) || '').toLowerCase();
    const nameLower = ((bankInfo && bankInfo.name) || '').toLowerCase();
    if (themeLower.includes('visa') || nameLower.includes('visa')) {
        return '<div class="visa-logo-text">VISA</div>';
    }
    if (themeLower.includes('master') || nameLower.includes('master')) {
        return '<div class="mastercard-logo-box"><div class="mastercard-circles"><div class="mastercard-circle red-1"></div><div class="mastercard-circle yellow"></div><div class="mastercard-circle red-2"></div></div><div class="mastercard-logo-text">mastercard</div></div>';
    }
    if (themeLower.includes('union') || nameLower.includes('union') || themeLower.includes('cup')) {
        return '<div class="unionpay-logo-box"><div class="up-shape up-red"></div><div class="up-shape up-blue"></div><div class="up-shape up-teal"></div><div class="unionpay-logo-text">UnionPay</div></div>';
    }
    if (bankInfo && bankInfo.logo) {
        const isChineseBank = themeLower.includes('abc') || themeLower.includes('boc') ||
            themeLower.includes('citic') || themeLower.includes('cons') ||
            themeLower.includes('merch') || themeLower.includes('icbc') ||
            themeLower.includes('spd') || themeLower.includes('cmi');
        const logoClass = isChineseBank ? 'm-bank-logo-chinese object-contain drop-shadow-md' : 'm-bank-logo object-contain drop-shadow-md';
        return '<img src="' + bankInfo.logo + '" alt="' + (bankInfo.name || '') + '" class="' + logoClass + '" onerror="this.style.display=\'none\'">';
    }
    return '';
}

function mToggleAppearanceFields() {
    const modeEl = document.getElementById('m-input-color-mode');
    const panel = document.getElementById('m-appearance-custom-panel');
    if (!modeEl || !panel) return;
    const mode = modeEl.value;
    if (mode === 'auto') {
        panel.classList.add('hidden');
    } else {
        panel.classList.remove('hidden');
        const gradOnly = document.getElementById('m-appearance-gradient-only');
        if (gradOnly) {
            if (mode === 'gradient') gradOnly.classList.remove('hidden');
            else gradOnly.classList.add('hidden');
        }
    }
}

function mPreviewCustomLogo(input) {
    const file = input && input.files && input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        if (typeof showVnsAlert === 'function') showVnsAlert('Error', 'Please select an image file', 'warning');
        return;
    }
    const apply = function (dataUrl) {
        if (!dataUrl) {
            if (typeof showVnsAlert === 'function') showVnsAlert('Error', 'Could not process image', 'warning');
            return;
        }
        const hid = document.getElementById('m-input-custom-logo');
        const prev = document.getElementById('m-custom-logo-preview');
        if (hid) hid.value = dataUrl;
        if (prev) {
            prev.src = dataUrl;
            prev.classList.remove('hidden');
        }
    };
    if (typeof vnsCompressImageToDataUrl === 'function') {
        vnsCompressImageToDataUrl(file, { maxEdge: 128, maxBytes: 70000, quality: 0.85 }, apply);
        return;
    }
    // fallback
    const reader = new FileReader();
    reader.onload = function () {
        const img = new Image();
        img.onload = function () {
            const max = 96;
            let w = img.width, h = img.height;
            const scale = Math.min(1, max / Math.max(w, h));
            w = Math.max(1, Math.round(w * scale));
            h = Math.max(1, Math.round(h * scale));
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            apply(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
}

function mClearCustomLogo() {
    const hid = document.getElementById('m-input-custom-logo');
    const prev = document.getElementById('m-custom-logo-preview');
    const file = document.getElementById('m-input-custom-logo-file');
    if (hid) hid.value = '';
    if (file) file.value = '';
    if (prev) {
        prev.removeAttribute('src');
        prev.classList.add('hidden');
    }
}

function mReadAppearanceFromForm() {
    const modeEl = document.getElementById('m-input-color-mode');
    const mode = modeEl ? modeEl.value : 'auto';
    const logo = ((document.getElementById('m-input-custom-logo') || {}).value || '') || null;
    if (mode === 'auto') {
        return {
            colorMode: 'auto',
            color1: null,
            color2: null,
            colorRatio: 50,
            gradientDir: 'to-bottom',
            customLogo: logo
        };
    }
    const c1 = ((document.getElementById('m-input-color1') || {}).value || '#0D9488');
    const c2 = ((document.getElementById('m-input-color2') || {}).value || c1);
    const ratio = parseInt(((document.getElementById('m-input-color-ratio') || {}).value || '50'), 10);
    const dir = ((document.getElementById('m-input-gradient-dir') || {}).value || 'to-bottom');
    return {
        colorMode: mode,
        color1: c1,
        color2: mode === 'solid' ? c1 : c2,
        colorRatio: isNaN(ratio) ? 50 : Math.max(0, Math.min(100, ratio)),
        gradientDir: dir,
        customLogo: logo
    };
}

function mFillAppearanceForm(card) {
    const mode = (card && card.colorMode) ? card.colorMode : 'auto';
    const modeEl = document.getElementById('m-input-color-mode');
    if (modeEl) modeEl.value = mode;
    const c1 = document.getElementById('m-input-color1');
    const c2 = document.getElementById('m-input-color2');
    const ratio = document.getElementById('m-input-color-ratio');
    const ratioLabel = document.getElementById('m-input-color-ratio-label');
    const dir = document.getElementById('m-input-gradient-dir');
    if (c1) c1.value = (card && card.color1) ? card.color1 : '#0D9488';
    if (c2) c2.value = (card && card.color2) ? card.color2 : '#134e4a';
    if (ratio) ratio.value = (card && card.colorRatio != null) ? card.colorRatio : 50;
    if (ratioLabel) ratioLabel.textContent = ((card && card.colorRatio != null) ? card.colorRatio : 50) + '%';
    if (dir) dir.value = (card && card.gradientDir) ? card.gradientDir : 'to-bottom';
    const hid = document.getElementById('m-input-custom-logo');
    const prev = document.getElementById('m-custom-logo-preview');
    if (hid) hid.value = (card && card.customLogo) ? card.customLogo : '';
    if (prev) {
        if (card && card.customLogo) {
            prev.src = card.customLogo;
            prev.classList.remove('hidden');
        } else {
            prev.removeAttribute('src');
            prev.classList.add('hidden');
        }
    }
    mToggleAppearanceFields();
}

window.mToggleAppearanceFields = mToggleAppearanceFields;
window.mPreviewCustomLogo = mPreviewCustomLogo;
window.mClearCustomLogo = mClearCustomLogo;

function mSetMobileCardsCategory(element) {
    if (!window.VNS_FEATURES || !VNS_FEATURES.cards) {
        return;
    }
    const listSec = document.getElementById('list-section');
    if (listSec) listSec.style.setProperty('display', 'none', 'important');
    
    const mainSec = document.getElementById('main-section');
    if (mainSec) mainSec.style.setProperty('display', 'none', 'important');

    const idsRoot = document.getElementById('m-ids-main-container');
    if (idsRoot) {
        idsRoot.classList.add('hidden');
        idsRoot.style.setProperty('display', 'none', 'important');
    }
    
    const root = document.getElementById('m-cards-main-container');
    if (root) {
        root.classList.remove('hidden');
        root.style.setProperty('display', 'flex', 'important');
        root.style.setProperty('flex-direction', 'column', 'important');
        root.style.setProperty('visibility', 'visible', 'important');
        root.style.setProperty('opacity', '1', 'important');
        root.style.setProperty('z-index', '200', 'important');
    }
    const listView = document.getElementById('m-cards-list-view');
    if (listView) {
        listView.classList.remove('hidden');
        listView.style.setProperty('display', 'flex', 'important');
        listView.style.setProperty('flex', '1', 'important');
        listView.style.setProperty('min-height', '0', 'important');
    }
    const scroller = document.getElementById('m-card-items-container');
    if (scroller) {
        scroller.style.setProperty('display', 'block', 'important');
        scroller.style.setProperty('flex', '1', 'important');
        scroller.style.setProperty('overflow-y', 'auto', 'important');
        scroller.style.setProperty('min-height', '200px', 'important');
    }
    document.querySelectorAll('.sidebar-item, .folder-sub-item').forEach(i => i.classList.remove('active'));
    if (element) element.classList.add('active');
    
    const titleEl = document.getElementById('active-category-title');
    if (titleEl) {
        titleEl.innerText = (typeof t === 'function' ? t("menu_cards_title") : "BANK CARDS").toUpperCase();
    }
    mRenderCardsContainer();
    if (window.innerWidth < 1024 && typeof closeMobileSidebar === 'function') {
        closeMobileSidebar();
    }
}

var mVnsIsExiting = false;

function mExitCardsModuleMatrix() {
    if (mVnsIsExiting) return;
    mVnsIsExiting = true;

    const root = document.getElementById('m-cards-main-container');
    if (root) {
        root.classList.add('hidden');
        root.style.setProperty('display', 'none', 'important');
    }

    const listSec = document.getElementById('list-section');
    if (listSec) {
        listSec.style.removeProperty('display');
        listSec.style.display = ''; 
    }
    const mainSec = document.getElementById('main-section');
    if (mainSec) {
        mainSec.style.removeProperty('display');
        mainSec.style.display = ''; 
    }

    if (mCurrentlyRevealedCardId) {
        mHideRevealedCard(mCurrentlyRevealedCardId);
    }
    mCloseCardScreens();

    if (typeof setCategory === 'function') {
        const allItemsMenuElement = document.querySelector('.sidebar-item[cat="home"]') || null;
        setCategory('home', allItemsMenuElement);
    }

    mVnsIsExiting = false;
}


function mRenderCardsContainer() {
    const scroller = document.getElementById('m-card-items-container');
    if (!scroller) return;
    
    scroller.innerHTML = '';

    mIsLongPressAction = false;
    mContextMenuCardId = null;

    const txtEmpty = typeof t === 'function' ? t("cards_empty_msg") : 'No secure payment cards found. Click "Add New" above.';
    const lblHolder = typeof t === 'function' ? t("cards_lbl_holder") : 'Card Holder';
    const lblExpires = typeof t === 'function' ? t("cards_lbl_expires") : 'Expires';
    const lblUnknown = typeof t === 'function' ? t("cards_lbl_unknown") : 'UNKNOWN';
    const msgCopyNum = typeof t === 'function' ? t("cards_msg_copy_num") : 'Card Number';

    if (mPaymentCards.length === 0) {
        scroller.innerHTML = `
            <div class="p-8 text-center text-xs text-slate-400 font-bold border border-dashed border-slate-200 rounded-2xl mx-2 bg-white">
                ${txtEmpty}
            </div>
        `;
        return;
    }

    const sorted = [...mPaymentCards].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    sorted.forEach(card => {
        const numClean = String((card && card.number) || '').replace(/\s/g, '');
        const last4 = numClean.slice(-4) || '';
        const masked = `**** **** **** ${last4}`;
        const bankInfo = mOrderDetectBank(numClean);
        const styleObj = mGetCardStyleObject(card, bankInfo.theme);
        const cardLogoMarkup = mBuildLogoMarkup(card, bankInfo);

        const cardItem = document.createElement('div');
        cardItem.className = 'm-card-outer w-full block select-none mb-3 shadow-lg rounded-[18px] overflow-hidden relative';
        cardItem.setAttribute('data-card-id', String(card.id));

        const pinIndicator = card.pinned ? `
            <div class="m-card-pin-indicator z-20">
                <svg class="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
            </div>` : '';

        const headerHTML = `
            <div class="flex justify-between items-start" style="flex-direction: row !important;">
                <div class="w-10 h-7 flex items-center justify-center overflow-hidden">
                    <img src="logos/chip.svg" alt="EMV Smart Chip" class="m-card-emv-chip">
                </div>
                <div class="flex items-center">
                    ${cardLogoMarkup}
                </div>
            </div>
        `;

        cardItem.innerHTML = `
            <div dir="ltr"
                 onmousedown="mStartLongPress(event, '${card.id}')" 
                 onmouseup="mEndLongPress()" 
                 onmouseleave="mEndLongPress()"
                 ontouchstart="mStartLongPress(event, '${card.id}')" 
                 ontouchend="mEndLongPress()"
                 class="m-card-node relative w-full aspect-[1.58/1] p-5 text-white flex flex-col justify-between cursor-pointer z-10 ${styleObj.className}"
                 style="${styleObj.style} direction: ltr !important; text-align: left !important;">
                
                ${pinIndicator}

                <!-- ??? ???? -->
                ${headerHTML}
                
                <!-- ????? ???? -->
                <div class="text-center py-1">
                    <div id="m-card-num-view-${card.id}" data-masked="${masked}" data-real="${card.number}" class="text-base font-mono tracking-widest drop-shadow-sm" style="direction: ltr !important; unicode-bidi: isolate !important;">${masked}</div>
                </div>
                
                <!-- ???? ???? -->
                <div class="flex items-end text-[9px] uppercase tracking-wider opacity-90" style="flex-direction: row !important;">
                    <div class="truncate w-1/3 text-left">
                        <div class="opacity-60 text-[7px] mb-0.5">${lblHolder}</div>
                        <div class="font-bold truncate">${card.name || lblUnknown}</div>
                    </div>
                    <div class="flex justify-center gap-5 w-1/3 text-center" style="flex-direction: row !important;">
                        <div class="text-center">
                            <div class="opacity-60 text-[7px] mb-0.5">${lblExpires}</div>
                            <div class="font-bold font-mono" style="direction: ltr !important; unicode-bidi: isolate !important;">${card.exp || '**/**'}</div>
                        </div>
                        <div class="text-center">
                            <div class="opacity-60 text-[7px] mb-0.5">CVV2</div>
                            <div id="m-card-cvv-view-${card.id}" data-real="${card.cvv || '***'}" class="font-bold font-mono" style="direction: ltr !important; unicode-bidi: isolate !important;">***</div>
                        </div>
                    </div>
                    <div class="w-1/3"></div>
                </div>
            </div>
            <div class="m-card-action-bar">
                <button id="m-btn-reveal-trigger-${card.id}" data-revealed="false" onclick="event.stopPropagation(); mSecureAction(() => mToggleCardReveal('${card.id}'));" class="m-card-btn m-btn-reveal">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                </button>
                <button onclick="event.stopPropagation(); mCopyValueDirect('${card.number}', '${msgCopyNum}');" class="m-card-btn m-btn-copy">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
                <button onclick="event.stopPropagation(); mSecureAction(() => mOpenEditCardForm('${card.id}'));" class="m-card-btn m-btn-edit">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button onclick="event.stopPropagation(); mSecureAction(() => mDeleteCardNode('${card.id}'));" class="m-card-btn m-btn-delete">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1,1 0 00-1-1h-4a1,1 0 00-1 1v3M4 7h16"/></svg>
                </button>
            </div>
        `;
        scroller.appendChild(cardItem);
    });
}

function mToggleCardReveal(id) {
    if (mCurrentlyRevealedCardId && mCurrentlyRevealedCardId !== id) {
        mHideRevealedCard(mCurrentlyRevealedCardId);
    }
    const triggerBtn = document.getElementById(`m-btn-reveal-trigger-${id}`);
    if (!triggerBtn) return;
    const isRevealed = triggerBtn.getAttribute('data-revealed') === 'true';
    const msgAction = typeof t === 'function' ? t("cards_msg_reveal") : "Card Data Revealed";

    if (!isRevealed) {
        mCurrentlyRevealedCardId = id;
        triggerBtn.setAttribute('data-revealed', 'true');
        triggerBtn.classList.add('text-teal-400');

        const numDisp = document.getElementById(`m-card-num-view-${id}`);
        const cvvDisp = document.getElementById(`m-card-cvv-view-${id}`);
        const rail = document.getElementById('m-card-security-rail');
        const bar = document.getElementById('m-card-security-bar');

        if (numDisp) numDisp.innerText = numDisp.getAttribute('data-real');
        if (cvvDisp) cvvDisp.innerText = cvvDisp.getAttribute('data-real');

        if (rail && bar) {
            rail.classList.remove('hidden');
            bar.style.transition = 'none';
            bar.style.transform = 'scaleX(1)';
            void bar.offsetWidth; 
            bar.style.transition = 'transform 15s linear';
            bar.style.transform = 'scaleX(0)';
        }

        if (mRevealTimeout) clearTimeout(mRevealTimeout);
        mRevealTimeout = setTimeout(() => { mHideRevealedCard(id); }, 15000);
        console.log(msgAction); 
    } else {
        mHideRevealedCard(id);
    }
}

function mHideRevealedCard(id) {
    const triggerBtn = document.getElementById(`m-btn-reveal-trigger-${id}`);
    const numDisp = document.getElementById(`m-card-num-view-${id}`);
    const cvvDisp = document.getElementById(`m-card-cvv-view-${id}`);
    const rail = document.getElementById('m-card-security-rail');

    const cvvMask = typeof t === 'function' ? t("cards_cvv_mask") : '***';

    if (triggerBtn) {
        triggerBtn.setAttribute('data-revealed', 'false');
        triggerBtn.classList.remove('text-teal-400');
    }
    if (numDisp) numDisp.innerText = numDisp.getAttribute('data-masked');
    if (cvvDisp) cvvDisp.innerText = cvvMask;
    if (rail) rail.classList.add('hidden');
    
    if (mRevealTimeout) clearTimeout(mRevealTimeout);
    if (mCurrentlyRevealedCardId === id) mCurrentlyRevealedCardId = null;
}

function mOpenNewCardForm() {
    mActiveCardId = null;
    
    const formTitle = document.getElementById('m-form-header-title');
    if (formTitle) {
        formTitle.innerText = typeof t === 'function' ? t("cards_form_title_add") : "Append Payment Card";
    }
    
    ['m-input-bank', 'm-input-holder', 'm-input-number', 'm-input-account', 'm-input-iban', 'm-input-cvv', 'm-input-date'].forEach(id => {
        const inputField = document.getElementById(id);
        if (inputField) {
            inputField.value = '';
            inputField.removeAttribute('readonly');
        }
    });
    
    const trashBtn = document.getElementById('m-btn-form-trash');
    if (trashBtn) trashBtn.classList.add('hidden');
    
    const listArea = document.getElementById('m-cards-list-view');
    if (listArea) listArea.style.setProperty('display', 'none', 'important');

    const formScreen = document.getElementById('m-card-form-screen');
    if (formScreen) {
        formScreen.classList.remove('hidden');
        formScreen.style.setProperty('display', 'flex', 'important');
    }
    
    mBindCardFormatters();
}

function mOpenEditCardForm(id) {
    mActiveCardId = id;
    const card = mPaymentCards.find(c => String(c.id) === String(id));
    if (!card) return;

    const formTitle = document.getElementById('m-form-header-title');
    if (formTitle) {
        formTitle.innerText = typeof t === 'function' ? t("cards_form_title_edit") : "Modify Secure Card";
    }
    
    const bankInp = document.getElementById('m-input-bank'); if (bankInp) bankInp.value = card.label || '';
    const holdInp = document.getElementById('m-input-holder'); if (holdInp) holdInp.value = card.name || '';
    const numInp = document.getElementById('m-input-number'); if (numInp) numInp.value = card.number || '';
    const accInp = document.getElementById('m-input-account'); if (accInp) accInp.value = card.account || '';
    const ibanInp = document.getElementById('m-input-iban'); if (ibanInp) ibanInp.value = card.iban || '';
    const cvvInp = document.getElementById('m-input-cvv'); if (cvvInp) cvvInp.value = card.cvv || '';
    const expInp = document.getElementById('m-input-date'); if (expInp) expInp.value = card.exp || '';
    mFillAppearanceForm(card);

    document.querySelectorAll('.m-card-field-input').forEach(inp => inp.removeAttribute('readonly'));
    
    const trashBtn = document.getElementById('m-btn-form-trash');
    if (trashBtn) trashBtn.classList.remove('hidden');
    
    const listArea = document.getElementById('m-cards-list-view');
    if (listArea) listArea.style.setProperty('display', 'none', 'important');

    const formScreen = document.getElementById('m-card-form-screen');
    if (formScreen) {
        formScreen.classList.remove('hidden');
        formScreen.style.setProperty('display', 'flex', 'important');
    }
    
    mBindCardFormatters();
}

function mOpenCardDetailsScreen(id) {
    try {
        mActiveCardId = id;
        const card = mPaymentCards.find(c => String(c.id) === String(id));
        if (!card) {
            console.error("VNS Error: Card with ID " + id + " not found!");
            return;
        }
        const cvvMask = typeof t === 'function' ? t("cards_cvv_mask") : '***';
        const btnEditText = typeof t === 'function' ? t("cards_btn_edit_item") : "Edit Item";
        const vBank = document.getElementById('m-view-bank'); 
        if (vBank) vBank.value = card.bank || card.label || ''; 
        
        const vHolder = document.getElementById('m-view-holder'); 
        if (vHolder) vHolder.value = card.name || card.holder || '';
        
        const vNum = document.getElementById('m-view-number'); 
        if (vNum) vNum.value = card.number || '';
        
        const vAcc = document.getElementById('m-view-account'); 
        if (vAcc) vAcc.value = card.account || '';
        
        const vIban = document.getElementById('m-view-iban'); 
        if (vIban) vIban.value = card.iban || '';
        
        const vCvv = document.getElementById('m-view-cvv'); 
        if (vCvv) vCvv.value = card.cvv || cvvMask;
        
        const vDate = document.getElementById('m-view-date'); 
        if (vDate) vDate.value = card.exp || card.date || '';

        const btnDual = document.getElementById('m-btn-view-dual');
        if (btnDual) btnDual.innerText = btnEditText;

        document.querySelectorAll('#m-card-view-screen input').forEach(f => {
            f.setAttribute('readonly', 'true');
        });
        
        const listArea = document.getElementById('m-cards-list-view');
        if (listArea) listArea.style.setProperty('display', 'none', 'important');

        const viewScreen = document.getElementById('m-card-view-screen');
        if (viewScreen) {
            viewScreen.classList.remove('hidden');
            viewScreen.style.setProperty('display', 'flex', 'important');
        }
        
    } catch (error) {
        console.error("VNS Secure Vault System Error during details render: ", error);
    }
}

function mCloseCardScreens() {
    const formScreen = document.getElementById('m-card-form-screen');
    if (formScreen) {
        formScreen.classList.add('hidden');
        formScreen.style.setProperty('display', 'none', 'important');
    }
    
    const viewScreen = document.getElementById('m-card-view-screen');
    if (viewScreen) {
        viewScreen.classList.add('hidden');
        viewScreen.style.setProperty('display', 'none', 'important');
    }
    
    const listArea = document.getElementById('m-cards-list-view');
    if (listArea) {
        listArea.classList.remove('hidden');
        listArea.style.setProperty('display', 'flex', 'important');
    }
    
    const titleEl = document.getElementById('active-category-title');
    if (titleEl) {
        titleEl.innerText = (typeof t === 'function' ? t("menu_cards_title") : "BANK CARDS").toUpperCase();
    }
    
    mActiveCardId = null;
}

function mTransformViewToEdit() {
    const fields = document.querySelectorAll('#m-card-view-screen input');
    const btnDual = document.getElementById('m-btn-view-dual');
    if (!fields.length || !btnDual) return;
    
    const isLocked = fields[0].hasAttribute('readonly');
    
    if (isLocked) {
        mSecureAction(() => {
            fields.forEach(f => {
                f.removeAttribute('readonly');
                f.classList.remove('bg-slate-100', 'cursor-not-allowed');
                f.classList.add('bg-white');
            });
            
            btnDual.innerText = typeof t === 'function' ? t("cards_btn_save_changes") : "Save Matrix";
            
            mBindCustomFormattersForView();
        });
    } else {
        mCommitSaveCardFromViewScreen();
    }
}

function mCommitSaveCard() {
    const defLabel = typeof t === 'function' ? t("cards_generic_name") : 'Payment Card';
    const defName = typeof t === 'function' ? t("cards_lbl_unknown") : 'UNKNOWN';

    const label = document.getElementById('m-input-bank').value.trim() || defLabel;
    const name = document.getElementById('m-input-holder').value.trim() || defName;
    const number = document.getElementById('m-input-number').value.trim();
    const account = document.getElementById('m-input-account').value.trim();
    const iban = document.getElementById('m-input-iban').value.trim();
    const cvv = document.getElementById('m-input-cvv').value.trim();
    const exp = document.getElementById('m-input-date').value.trim();

    if (!number || number.replace(/\s/g, '').length < 16) {
        if(typeof showVnsAlert === 'function') {
            const errTitle = typeof t === 'function' ? t("cards_alert_val_error") : "Validation Error";
            const errMsg = typeof t === 'function' ? t("cards_alert_invalid_num") : "Invalid Card Number Structure.";
            showVnsAlert(errTitle, errMsg, "warning");
        }
        return;
    }

    const appearance = mReadAppearanceFromForm();
    const oldForPin = mActiveCardId ? mPaymentCards.find(c => String(c.id) === String(mActiveCardId)) : null;
    const pinned = oldForPin ? !!oldForPin.pinned : false;
    const payload = {
        id: mActiveCardId || 'card_' + Date.now(),
        label, name, number, exp, cvv, account, iban, pinned,
        colorMode: appearance.colorMode,
        color1: appearance.color1,
        color2: appearance.color2,
        colorRatio: appearance.colorRatio,
        gradientDir: appearance.gradientDir,
        customLogo: appearance.customLogo
    };

    if (mActiveCardId) {
        const idx = mPaymentCards.findIndex(c => String(c.id) === String(mActiveCardId));
        if (idx !== -1) mPaymentCards[idx] = payload;
    } else {
        mPaymentCards.push(payload);
    }

    mSaveDataToLocalStorage();
}

function mCommitSaveCardFromViewScreen() {
    const defLabel = typeof t === 'function' ? t("cards_generic_name") : 'Payment Card';
    const defName = typeof t === 'function' ? t("cards_lbl_unknown") : 'UNKNOWN';

    const label = document.getElementById('m-view-bank').value.trim() || defLabel;
    const name = document.getElementById('m-view-holder').value.trim() || defName;
    const number = document.getElementById('m-view-number').value.trim();
    const account = document.getElementById('m-view-account').value.trim();
    const iban = document.getElementById('m-view-iban').value.trim();
    const cvv = document.getElementById('m-view-cvv').value.trim();
    const exp = document.getElementById('m-view-date').value.trim();

    if (!number || number.replace(/\s/g, '').length < 16) {
        if(typeof showVnsAlert === 'function') {
            const errTitle = typeof t === 'function' ? t("cards_alert_val_error") : "Validation Error";
            const errMsg = typeof t === 'function' ? t("cards_alert_invalid_num") : "Invalid Card Number Structure.";
            showVnsAlert(errTitle, errMsg, "warning");
        }
        return;
    }

    const oldCard = mPaymentCards.find(c => String(c.id) === String(mActiveCardId));
    const pinned = oldCard ? !!oldCard.pinned : false;
    const payload = {
        id: mActiveCardId, label, name, number, exp, cvv, account, iban, pinned,
        colorMode: oldCard ? (oldCard.colorMode || 'auto') : 'auto',
        color1: oldCard ? (oldCard.color1 || null) : null,
        color2: oldCard ? (oldCard.color2 || null) : null,
        colorRatio: oldCard && oldCard.colorRatio != null ? oldCard.colorRatio : 50,
        gradientDir: oldCard ? (oldCard.gradientDir || 'to-bottom') : 'to-bottom',
        customLogo: oldCard ? (oldCard.customLogo || null) : null
    };
    
    const idx = mPaymentCards.findIndex(c => String(c.id) === String(mActiveCardId));
    if (idx !== -1) mPaymentCards[idx] = payload;

    mSaveDataToLocalStorage();

    document.querySelectorAll('#m-card-view-screen input').forEach(f => {
        f.setAttribute('readonly', 'true');
    });
    const btnDual = document.getElementById('m-btn-view-dual');
    if (btnDual) {
        btnDual.innerText = typeof t === 'function' ? t("cards_btn_edit_item") : "Edit Item";
    }
}

function mSaveDataToLocalStorage() {
    localStorage.setItem('vns_cards', JSON.stringify(mPaymentCards));
    
    if (typeof showVnsAlert === 'function') {
        const msgSuccess = typeof t === 'function' ? t("cards_msg_save_success") : "Card details saved successfully";
        const titleSuccess = typeof t === 'function' ? t("cards_alert_success_title") : "Success";
        showVnsAlert(titleSuccess, msgSuccess, "success");
    }

    mRenderCardsContainer();
    mCloseCardScreens();
}

function mDeleteCardNode(id) {
    if (!id) return;
    
    const executeDeletion = () => {
        mPaymentCards = mPaymentCards.filter(c => String(c.id) !== String(id));
        localStorage.setItem('vns_cards', JSON.stringify(mPaymentCards));
        mRenderCardsContainer();
        mCloseCardScreens();
        
        if (typeof showVnsAlert === 'function') {
            const alertTitle = typeof t === 'function' ? t("cards_alert_delete_title") : "Deleted";
            const alertMsg = typeof t === 'function' ? t("cards_alert_delete_msg") : "Card removed from storage.";
            showVnsAlert(alertTitle, alertMsg, "success");
        }
    };

    const confirmMessage = typeof t === 'function' ? t("cards_delete_confirm") : "Permanently destroy this secure card matrix?";

    try {
        if (confirm(confirmMessage)) { 
            executeDeletion(); 
        }
    } catch (e) {
        executeDeletion();
    }
}

function mTrashCurrentViewCard() {
    mSecureAction(() => {
        const id = document.getElementById('m-card-view-screen').getAttribute('data-view-id');
        if (id) {
            mDeleteCardNode(id);
            mCloseCardScreens();
        }
    });
}

function mTrashCurrentFormCard() {
    mSecureAction(() => {
        const id = document.getElementById('m-card-form-screen').getAttribute('data-edit-id');
        if (id) {
            mDeleteCardNode(id);
            mCloseCardScreens();
        }
    });
}

function mCopyValueDirect(text, labelName = "Data") {
    if (!text) return;
    navigator.clipboard.writeText(text.replace(/\s/g, '')).then(() => {
        if (typeof showVnsAlert === 'function') {
            const alertTitle = typeof t === 'function' ? t("cards_alert_copy_title") : "Copied";
            let alertMsg = typeof t === 'function' ? t("cards_alert_copy_msg") : "Information copied safely";
            
            if (typeof t === 'function') {
                if (labelName === "Card Number") alertMsg = t("cards_msg_num_copied");
                if (labelName === "CVV2 Code" || labelName === "CVV2") alertMsg = t("cards_msg_cvv_copied");
            }

            showVnsAlert(alertTitle, alertMsg, "success");
        }
    });
}

function mBindCardFormatters() {
    const convertToStandardDigits = (str) => {
        return str.replace(/[?-?]/g, d => d.charCodeAt(0) - 1776)
                  .replace(/[?-?]/g, d => d.charCodeAt(0) - 1632);
    };

    const num = document.getElementById('m-input-number');
    const date = document.getElementById('m-input-date');
    const iban = document.getElementById('m-input-iban');
    const cvv = document.getElementById('m-input-cvv');
    const acc = document.getElementById('m-input-account');

    [num, date, iban, cvv, acc].forEach(el => {
        if (el) {
            el.style.setProperty('direction', 'ltr', 'important');
            el.style.setProperty('text-align', 'left', 'important');
        }
    });

    const formatNum = (e) => {
        let val = convertToStandardDigits(e.target.value).replace(/\s/g, '').replace(/[^0-9]/g, '');
        e.target.value = val.match(/.{1,4}/g)?.join(' ') || val;
    };

    const formatDate = (e) => {
        let val = convertToStandardDigits(e.target.value).replace(/\D/g, '');
        e.target.value = val.length >= 2 ? val.substring(0, 2) + '/' + val.substring(2, 4) : val;
    };

    const formatIban = (e) => {
        let val = convertToStandardDigits(e.target.value).replace(/\s/g, '').toUpperCase();
        let validChars = "";
        for (let i = 0; i < val.length; i++) {
            if (i < 2) {
                if (/[A-Z]/.test(val[i])) validChars += val[i];
            } else {
                if (/[0-9]/.test(val[i])) validChars += val[i];
            }
        }
        e.target.value = validChars.match(/.{1,4}/g)?.join(' ') || validChars;
    };

    const formatStrictNumber = (e) => {
        e.target.value = convertToStandardDigits(e.target.value).replace(/[^0-9]/g, '');
    };

    if (num) num.oninput = formatNum;
    if (date) date.oninput = formatDate;
    if (iban) iban.oninput = formatIban;
    if (cvv) cvv.oninput = formatStrictNumber;
    if (acc) acc.oninput = formatStrictNumber;
}

function mBindCustomFormattersForView() {
    const convertToStandardDigits = (str) => {
        return str.replace(/[?-?]/g, d => d.charCodeAt(0) - 1776)
                  .replace(/[?-?]/g, d => d.charCodeAt(0) - 1632);
    };

    const num = document.getElementById('m-view-number');
    const date = document.getElementById('m-view-date');
    const iban = document.getElementById('m-view-iban');
    const cvv = document.getElementById('m-view-cvv');
    const acc = document.getElementById('m-view-account');

    [num, date, iban, cvv, acc].forEach(el => {
        if (el) {
            el.style.setProperty('direction', 'ltr', 'important');
            el.style.setProperty('text-align', 'left', 'important');
        }
    });

    const formatNum = (e) => {
        let val = convertToStandardDigits(e.target.value).replace(/\s/g, '').replace(/[^0-9]/g, '');
        e.target.value = val.match(/.{1,4}/g)?.join(' ') || val;
    };

    const formatDate = (e) => {
        let val = convertToStandardDigits(e.target.value).replace(/\D/g, '');
        e.target.value = val.length >= 2 ? val.substring(0, 2) + '/' + val.substring(2, 4) : val;
    };

    const formatIban = (e) => {
        let val = convertToStandardDigits(e.target.value).replace(/\s/g, '').toUpperCase();
        let validChars = "";
        for (let i = 0; i < val.length; i++) {
            if (i < 2) {
                if (/[A-Z]/.test(val[i])) validChars += val[i];
            } else {
                if (/[0-9]/.test(val[i])) validChars += val[i];
            }
        }
        e.target.value = validChars.match(/.{1,4}/g)?.join(' ') || validChars;
    };

    const formatStrictNumber = (e) => {
        e.target.value = convertToStandardDigits(e.target.value).replace(/[^0-9]/g, '');
    };

    if (num) num.oninput = formatNum;
    if (date) date.oninput = formatDate;
    if (iban) iban.oninput = formatIban;
    if (cvv) cvv.oninput = formatStrictNumber;
    if (acc) acc.oninput = formatStrictNumber;
}

function mStartLongPress(event, cardId) {
    mContextMenuCardId = cardId; 
    mIsLongPressAction = false;
    mIsScrollingDetected = false;
    mPressStartTime = Date.now(); 

    if (event.touches && event.touches.length > 0) {
        mTouchStartX = event.touches[0].clientX;
        mTouchStartY = event.touches[0].clientY;
    } else {
        mTouchStartX = event.clientX;
        mTouchStartY = event.clientY;
    }

    if (mLongPressTimeout) clearTimeout(mLongPressTimeout);
    
    mLongPressTimeout = setTimeout(() => {
        if (mIsScrollingDetected) return;

        mIsLongPressAction = true;
        if (navigator.vibrate) navigator.vibrate(50);
        mShowCardContextMenu(mTouchStartX, mTouchStartY, cardId);
    }, 500);
}

function mEndLongPress() {
    if (mLongPressTimeout) {
        clearTimeout(mLongPressTimeout);
    }
    
    const pressDuration = Date.now() - mPressStartTime;
    
    if (pressDuration < 500 && !mIsLongPressAction && !mIsScrollingDetected && mContextMenuCardId) {
        mOpenCardDetailsScreen(mContextMenuCardId);
        mContextMenuCardId = null;
    }
    
    mIsLongPressAction = false;
    mIsScrollingDetected = false;
}

function mShowCardContextMenu(x, y, cardId) {
    const menu = document.getElementById('m-card-context-menu');
    if (!menu) return;

    const card = mPaymentCards.find(c => String(c.id) === String(cardId));
    const pinText = document.getElementById('m-ctx-pin-text');
    if (card && pinText) {
        if (card.pinned) {
            pinText.innerText = typeof t === 'function' ? t("cards_menu_unpin") : "Unpin Card";
        } else {
            pinText.innerText = typeof t === 'function' ? t("cards_menu_pin") : "Pin to Top";
        }
    }

    menu.style.left = `${Math.min(x, window.innerWidth - 220)}px`;
    menu.style.top = `${Math.min(y, window.innerHeight - 285)}px`;
    
    menu.classList.remove('hidden');
    void menu.offsetWidth;
    menu.classList.add('m-menu-active');

    document.addEventListener('click', mCloseCardContextMenuOutside);
}

function mCloseCardContextMenu() {
    const menu = document.getElementById('m-card-context-menu');
    if (menu) {
        menu.classList.remove('m-menu-active');
        setTimeout(() => menu.classList.add('hidden'), 200);
    }
    document.removeEventListener('click', mCloseCardContextMenuOutside);
    mContextMenuCardId = null;
}

function mCloseCardContextMenuOutside(e) {
    const menu = document.getElementById('m-card-context-menu');
    if (!menu || menu.classList.contains('hidden')) return;

    if (!e.target.closest('#m-card-context-menu') && !e.target.closest('.m-card-node')) {
        mCloseCardContextMenu();
    }
}

function mMenuAction(actionType) {
    const id = mContextMenuCardId;
    
    if (!id) {
        mCloseCardContextMenu();
        console.error("VNS Context Menu Error: No Card ID inherited!");
        return;
    }

    const card = mPaymentCards.find(c => String(c.id) === String(id));
    if (!card) {
        mCloseCardContextMenu();
        return;
    }
    
    mCloseCardContextMenu();

    const txtEmptyTitle = typeof t === 'function' ? t("cards_alert_empty_title") : "Empty";
    const txtSuccessTitle = typeof t === 'function' ? t("cards_alert_success_title") : "Success";

    switch (actionType) {
        case 'share':
            mShareCardData(id);
            break;

        case 'edit':
            mSecureAction(() => {
                mOpenEditCardForm(id);
            });
            break;
            
        case 'copy_account':
            if (card.account) {
                mCopyValueDirect(card.account, 'Account Number');
            } else if (typeof showVnsAlert === 'function') {
                const msgNoAcc = typeof t === 'function' ? t("cards_err_no_account") : "No Account Number saved for this card.";
                showVnsAlert(txtEmptyTitle, msgNoAcc, "warning");
            }
            break;
            
        case 'copy_iban':
            if (card.iban) {
                mCopyValueDirect(card.iban, 'IBAN Number');
            } else if (typeof showVnsAlert === 'function') {
                const msgNoIban = typeof t === 'function' ? t("cards_err_no_iban") : "No IBAN Number saved for this card.";
                showVnsAlert(txtEmptyTitle, msgNoIban, "warning");
            }
            break;
            
        case 'copy_card':
            if (card.number) {
                mCopyValueDirect(card.number, 'Card Number');
            }
            break;
            
        case 'pin':
            card.pinned = !card.pinned;
            mSaveDataToLocalStorage(); 
            mRenderCardsContainer();    
            
            if (typeof showVnsAlert === 'function') {
                const msgPin = typeof t === 'function' ? t("cards_msg_pinned") : "Card pinned to apex top.";
                const msgUnpin = typeof t === 'function' ? t("cards_msg_unpinned") : "Card unpinned from top.";
                showVnsAlert(txtSuccessTitle, card.pinned ? msgPin : msgUnpin, "success");
            }
            break;
            
        case 'trash':
            mSecureAction(() => {
                mDeleteCardNode(id);
            });
            break;
    }
}

async function mSecureAction(onSuccess) {
    const authReason = typeof t === 'function' ? t("cards_auth_reason") : "Please verify your identity to continue.";
    const authFailed = typeof t === 'function' ? t("cards_auth_failed") : "Authentication canceled or failed.";

    const masterStr = localStorage.getItem('vns_master_user');
    const master = masterStr ? JSON.parse(masterStr) : null;
    
    if (master && master.biometricCredentialId && window.Capacitor && window.Capacitor.Plugins.NativeBiometric) {
        try {
            await window.Capacitor.Plugins.NativeBiometric.verifyIdentity({
                reason: authReason,
                title: typeof t === 'function' ? t("bio_title_unlock_vault") : "Security Check",
                subtitle: typeof t === 'function' ? t("bio_subtitle_vns_vault") : "Secure Vault",
                description: typeof t === 'function' ? t("bio_desc_scan_finger_face") : "Scan your fingerprint or face",
                useFallback: true,
                negativeButtonText: typeof t === 'function' ? t("btn_cancel") : "Cancel",
                confirmationRequired: false
            });

            onSuccess();
            
        } catch (error) {
            console.warn("Card Biometric Action Cancelled/Failed:", error);
            if (typeof showVnsAlert === 'function') {
                showVnsAlert("Security Alert", authFailed, "warning");
            }
        }
    } else {
        onSuccess();
    }
}  

document.addEventListener('touchmove', function(event) {
    if (!mContextMenuCardId) return;

    let currentX = event.touches[0].clientX;
    let currentY = event.touches[0].clientY;

    let deltaX = Math.abs(currentX - mTouchStartX);
    let deltaY = Math.abs(currentY - mTouchStartY);

    if (deltaY > 10 || deltaX > 10) {
        mIsScrollingDetected = true;
        if (mLongPressTimeout) clearTimeout(mLongPressTimeout);
    }
}, { passive: true });

document.addEventListener('mousemove', function(event) {
    if (!mContextMenuCardId) return;

    let currentX = event.clientX;
    let currentY = event.clientY;

    let deltaX = Math.abs(currentX - mTouchStartX);
    let deltaY = Math.abs(currentY - mTouchStartY);

    if (deltaY > 10 || deltaX > 10) {
        mIsScrollingDetected = true;
        if (mLongPressTimeout) clearTimeout(mLongPressTimeout);
    }
});

async function mShareCardData(forceId) {
    const targetId = forceId || mContextMenuCardId || mActiveCardId;
    if (!targetId) return;

    const card = mPaymentCards.find(c => String(c.id) === String(targetId));
    if (!card) return;

    const getLabel = (key, fallback) => {
        if (typeof t === 'function') {
            const res = t(key);
            if (res && res !== key) return res;
        }
        return fallback;
    };

    const lblBank = getLabel("cards_lbl_bank_name", "Bank Name");
    const lblHolder = getLabel("cards_lbl_holder_name", "Holder Name");
    const lblCardNumber = getLabel("cards_lbl_card_no", "Card No");
    const lblAccount = getLabel("cards_lbl_account_no", "Account No");
    const lblIban = getLabel("cards_lbl_iban", "IBAN");

    const bankName = card.label || card.bank || "";
    const holderName = card.name || card.holder || "";
    const cardNumber = card.number || "";
    const accountNo = card.account || "";
    const ibanNo = card.iban || "";

    let lines = [];
    if (bankName) lines.push(`${lblBank}: ${bankName}`);
    if (holderName) lines.push(`${lblHolder}: ${holderName}`);
    if (cardNumber) lines.push(`${lblCardNumber}: ${cardNumber}`);
    if (accountNo) lines.push(`${lblAccount}: ${accountNo}`);
    if (ibanNo) lines.push(`${lblIban}: ${ibanNo}`);

    const shareText = lines.join('\n');
    if (!shareText) return;

    let shareSuccess = false;
    if (navigator.share) {
        try {
            await navigator.share({
                title: bankName || "Card Details",
                text: shareText
            });
            shareSuccess = true;
        } catch (e) {
            console.log("Native share bypassed, falling back to copy.");
        }
    }

    if (!shareSuccess) {
        let copied = false;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(shareText);
                copied = true;
            } catch (err) {}
        }
        
        if (!copied) {
            try {
                const textarea = document.createElement('textarea');
                textarea.value = shareText;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                copied = document.execCommand('copy');
                document.body.removeChild(textarea);
            } catch (err) {}
        }

        if (copied) {
            const msg = (typeof t === 'function' && t("copied_to_clipboard") !== "copied_to_clipboard") 
                ? t("copied_to_clipboard") 
                : "Card details copied to clipboard!";
                
            if (typeof showVnsAlert === 'function') {
                showVnsAlert("Success", msg, "success");
            } else if (typeof showAlert === 'function') {
                showAlert(msg);
            }
        }
    }
}
window.mShareCardData = mShareCardData;