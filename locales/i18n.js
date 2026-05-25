/**
 * Global i18n — loads locales/*.json, updates entire DOM, localStorage persistence
 */
const I18n = (function () {
    const STORAGE_KEY = "selectedLanguage";
    const DEFAULT_LANG = "en";
    const USER_NAME = "Parth";
    const SUPPORTED_LANGS = [
        "en", "gu", "hi", "mr", "ta", "sa", "pa", "bn", "te", "kn", "ml", "or",
        "as", "ur", "gom", "ks", "mni", "ne", "sd", "doi", "mai", "brx", "sat"
    ];
    const RTL_LANGS = ["ur", "sd", "ks"];

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
        return lang === "gu" ? "પાર્થ" : USER_NAME;
    }

    async function fetchLocale(lang) {
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
        document.documentElement.dir = RTL_LANGS.includes(lang)
            ? "rtl"
            : lang === DEFAULT_LANG
              ? "ltr"
              : "auto";
        document.body.classList.toggle("lang-rtl", RTL_LANGS.includes(lang));
        document.title = t("pageTitle");

        document.querySelectorAll("[data-i18n]").forEach((el) => {
            const key = el.getAttribute("data-i18n");
            if (!key) return;
            const vars =
                el.getAttribute("data-i18n-vars") === "name" ? varsName : undefined;
            applyText(el, t(key, vars));
        });

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
    }

    function getStoredLang() {
        try {
            let stored = localStorage.getItem(STORAGE_KEY);
            if (stored === "kok") {
                stored = "gom";
                localStorage.setItem(STORAGE_KEY, "gom");
            }
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
        badgeEarned: "🎉 New Badge: Knowledge Seeker",
        knowledgeSeekerTitle: "Knowledge Seeker Parth"
    };

    async function init() {
        fallbackStrings = (await fetchLocale(DEFAULT_LANG)) || EMBEDDED_EN;
        localeCache[DEFAULT_LANG] = { ...fallbackStrings };

        const select = document.getElementById("language-select");
        const initial = getStoredLang();
        if (select) select.value = initial;

        await setLanguage(initial);

        if (select) {
            select.addEventListener("change", () => setLanguage(select.value));
        }

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
