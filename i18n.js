/**
 * Global i18n — loads locales/*.json, updates entire DOM, localStorage persistence
 */
const I18n = (function () {
    const STORAGE_KEY = "selectedLanguage";
    const DEFAULT_LANG = "en";
    const USER_NAME = "Parth";
    const SUPPORTED_LANGS = ["en", "gu", "hi"];
    const RTL_LANGS = [];

    let currentLang = DEFAULT_LANG;
    let strings = {};
    let fallbackStrings = {};
    const localeCache = {};
    let ready = false;
    const readyQueue = [];

    function interpolate(str, vars) {
        if (!str) return "";
        return str.replace(/\{(\w+)\}/g, (_, key) =>
            vars && vars[key] !== undefined ? vars[key] : `{${key}}`
        );
    }

    function displayName(lang) {
        if (lang === "gu") return "પાર્થ";
        if (lang === "hi") return "पार्थ";
        return USER_NAME;
    }

    async function fetchLocale(lang) {
        // Return embedded strings first — no network dependency
        if (EMBEDDED[lang]) return { ...EMBEDDED[lang] };
        // Try external JSON as optional override
        try {
            const res = await fetch(`locales/${lang}.json`);
            if (res.ok) return await res.json();
        } catch (e) {
            console.warn(`[i18n] locales/${lang}.json not loaded`, e);
        }
        return null;
    }

    async function ensureLocale(lang) {
        if (localeCache[lang]) return localeCache[lang];
        const pack = await fetchLocale(lang);
        if (pack) {
            localeCache[lang] = { ...pack };
        } else {
            localeCache[lang] = { ...fallbackStrings };
        }
        return localeCache[lang];
    }

    function resolveString(pack, key) {
        if (pack && Object.prototype.hasOwnProperty.call(pack, key) && pack[key] != null) {
            return pack[key];
        }
        if (fallbackStrings && Object.prototype.hasOwnProperty.call(fallbackStrings, key)) {
            return fallbackStrings[key];
        }
        return key;
    }

    function t(key, vars, lang) {
        const l = lang || currentLang;
        const pack =
            l === currentLang
                ? strings
                : localeCache[l] || strings;
        const raw = resolveString(pack, key);
        return vars ? interpolate(raw, vars) : raw;
    }

    function applyText(el, text) {
        if (el.hasAttribute("data-i18n-placeholder")) {
            el.placeholder = text;
            return;
        }
        el.textContent = text;
    }

    function applyToDom() {
        const lang = currentLang;
        const varsName = { name: displayName(lang) };

        document.documentElement.lang = lang === DEFAULT_LANG ? "en" : lang;
        // All supported languages (en, gu, hi) are LTR
        document.documentElement.dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";
        document.body.classList.toggle("lang-rtl", RTL_LANGS.includes(lang));
        document.title = t("pageTitle");

        document.querySelectorAll("[data-i18n]").forEach((el) => {
            const key = el.getAttribute("data-i18n");
            if (!key) return;
            const vars =
                el.getAttribute("data-i18n-vars") === "name" ? varsName : undefined;
            applyText(el, t(key, vars));
        });

        // Placeholders (inputs/textareas not covered by data-i18n)
        document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
            const key = el.getAttribute("data-i18n-placeholder");
            if (key) el.placeholder = t(key);
        });

        document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
            const key = el.getAttribute("data-i18n-aria");
            if (key) el.setAttribute("aria-label", t(key));
        });

        document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
            const key = el.getAttribute("data-i18n-alt");
            if (key) el.alt = t(key);
        });

        document.querySelectorAll("[data-i18n-title]").forEach((el) => {
            const key = el.getAttribute("data-i18n-title");
            if (key) el.title = t(key);
        });

        document.querySelectorAll("[data-i18n-dynamic]").forEach((el) => {
            const key = el.getAttribute("data-i18n-dynamic");
            if (!key) return;
            let vars = {};
            try {
                vars = JSON.parse(el.getAttribute("data-i18n-dynamic-vars") || "{}");
            } catch (e) { /* ignore */ }
            applyText(el, t(key, vars));
        });

        // Sync ALL language select dropdowns (header + sidebar + profile modal)
        document.querySelectorAll("select[id$='language-select'], select[id*='language']").forEach((sel) => {
            if (sel.value !== lang && [...sel.options].some(o => o.value === lang)) {
                sel.value = lang;
            }
        });
    }

    function getStoredLang() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored && SUPPORTED_LANGS.includes(stored)) return stored;
        } catch (e) { /* ignore */ }
        return DEFAULT_LANG;
    }

    async function setLanguage(lang) {
        const target = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
        await ensureLocale(target);
        strings = localeCache[target];
        currentLang = target;

        try {
            localStorage.setItem(STORAGE_KEY, target);
        } catch (e) { /* ignore */ }

        applyToDom();
        window.dispatchEvent(
            new CustomEvent("languagechange", { detail: { lang: target } })
        );
    }

    function onReady(fn) {
        if (ready) fn();
        else readyQueue.push(fn);
    }

    const EMBEDDED_EN = {
        pageTitle: "Spiritual AI Guide",
        selectLanguageAria: "Select language",
        headerImageAlt: "Hanuman Ram Sita Pranam",
        welcome: "Jay Shree Ram! Welcome {name}, how can I help you?",
        inputPlaceholder: "Type your question here...",
        micModeOff: "🎤 Mode: Off",
        listen: "🔊 Listen",
        storyBtn: "Story 📜",
        suggestionBtn: "Suggestion 💡",
        loadingOm: "ॐ...",
        chatResponse: "Jay Shree Ram {name}! How can I help you?",
        chatResponseGu: "Jay Shree Ram {name}! How can I help you?",
        chatResponseHi: "Jay Shree Ram {name}! How can I help you?",
        badgeEarned: "🎉 New Badge: Knowledge Seeker",
        knowledgeSeekerTitle: "Knowledge Seeker Parth"
    };

    const EMBEDDED_GU = {
        pageTitle: "આધ્યાત્મિક AI માર્ગદર્શક",
        selectLanguageAria: "ભાષા પસંદ કરો",
        headerImageAlt: "હનુમાન રામ સીતા પ્રણામ",
        welcome: "જય શ્રી રામ! સ્વાગત છે {name}, હું તમારી કેવી રીતે મદદ કરી શકું?",
        inputPlaceholder: "અહીં તમારો પ્રશ્ન લખો...",
        micModeOff: "🎤 મોડ: બંધ",
        listen: "🔊 સાંભળો",
        storyBtn: "કથા 📜",
        suggestionBtn: "સૂચન 💡",
        loadingOm: "ૐ...",
        chatResponse: "જય શ્રી રામ {name}! હું તમારી કેવી રીતે સેવા કરી શકું?",
        chatResponseGu: "જય શ્રી રામ {name}! હું તમારી કેવી રીતે સેવા કરી શકું?",
        chatResponseHi: "जय श्री राम {name}! मैं आपकी कैसे सेवा कर सकता हूँ?",
        badgeEarned: "🎉 નવો બેજ: જ્ઞાન સાધક",
        knowledgeSeekerTitle: "જ્ઞાન સાધક પાર્થ"
    };

    const EMBEDDED_HI = {
        pageTitle: "आध्यात्मिक AI मार्गदर्शक",
        selectLanguageAria: "भाषा चुनें",
        headerImageAlt: "हनुमान राम सीता प्रणाम",
        welcome: "जय श्री राम! स्वागत है {name}, मैं आपकी कैसे मदद कर सकता हूँ?",
        inputPlaceholder: "यहाँ अपना प्रश्न लिखें...",
        micModeOff: "🎤 मोड: बंद",
        listen: "🔊 सुनें",
        storyBtn: "कथा 📜",
        suggestionBtn: "सुझाव 💡",
        loadingOm: "ॐ...",
        chatResponse: "जय श्री राम {name}! मैं आपकी कैसे सेवा कर सकता हूँ?",
        chatResponseGu: "જય શ્રી રામ {name}! હું તમારી કેવી રીતે સેવા કરી શકું?",
        chatResponseHi: "जय श्री राम {name}! मैं आपकी कैसे सेवा कर सकता हूँ?",
        badgeEarned: "🎉 नया बैज: ज्ञान साधक",
        knowledgeSeekerTitle: "ज्ञान साधक पार्थ"
    };

    const EMBEDDED = { en: EMBEDDED_EN, gu: EMBEDDED_GU, hi: EMBEDDED_HI };

    async function init() {
        fallbackStrings = (await fetchLocale(DEFAULT_LANG)) || EMBEDDED_EN;
        localeCache[DEFAULT_LANG] = { ...fallbackStrings };

        const initial = getStoredLang();

        // Set initial value on all language selects
        document.querySelectorAll("select[id$='language-select'], select[id*='language']").forEach(sel => {
            if ([...sel.options].some(o => o.value === initial)) sel.value = initial;
        });

        await setLanguage(initial);

        // Attach change listener to ALL language select dropdowns
        document.querySelectorAll("select[id$='language-select'], select[id*='language']").forEach(sel => {
            sel.addEventListener("change", () => setLanguage(sel.value));
        });

        ready = true;
        readyQueue.forEach((fn) => fn());
        readyQueue.length = 0;
    }

    document.addEventListener("DOMContentLoaded", () => {
        init().catch((err) => console.error("[i18n] init failed", err));
    });

    return {
        t,
        setLanguage,
        ensureLocale,
        getLanguage: () => currentLang,
        getStoredLang,
        onReady,
        applyToDom,
        displayName,
        DEFAULT_LANG,
        USER_NAME,
        SUPPORTED_LANGS
    };
})();

/* Globals used by script.js */
const I18N_DEFAULT_LANG = I18n.DEFAULT_LANG;
const I18N_USER_NAME = I18n.USER_NAME;
let selectedLanguage = I18n.DEFAULT_LANG;

function i18nT(key, lang, vars) {
    return I18n.t(key, vars, lang);
}

function i18nApplyAll(lang) {
    return I18n.setLanguage(lang);
}

function i18nGetStoredLang() {
    return I18n.getStoredLang();
}

function i18nDisplayName(lang) {
    return I18n.displayName(lang);
}

window.addEventListener("languagechange", (e) => {
    selectedLanguage = e.detail.lang;
});