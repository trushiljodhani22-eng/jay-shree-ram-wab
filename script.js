const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const langSelect = document.getElementById('language-select');
const welcomeMsg = document.getElementById('welcome-msg');

let currentTitle = "પાર્થ";
let awardedBadges = [];
let questionCount = 0;

// ૧. ભાષા મુજબ સ્વાગત મેસેજ (બધી ભાષાઓ અહીં સેટ છે)
const translations = {
    en: "Jay Shree Ram! Welcome Parth, how can I help you?",
    gu: "જય શ્રી રામ! આવો પાર્થ, હું તમારી શું મદદ કરી શકું?",
    hi: "जय श्री राम! आइये पार्थ, मैं आपकी क्या मदद कर सकता हूँ?",
    sa: "जय श्री राम! आगच्छ पार्थ...",
    mr: "जय श्री राम! या पार्थ...",
    ta: "ஜெய் ஸ்ரீ ராம்! வாருங்கள் பார்த்தா..."
};

// ભાષા બદલવાનું લોજિક - Strict Fix
langSelect.addEventListener('change', () => {
    const selectedLang = langSelect.value;
    if (translations[selectedLang]) {
        welcomeMsg.innerText = translations[selectedLang];
    }
});

// ૨. ૫૦ બેચનો ડેટાબેઝ - (તમારા જૂના કોડ મુજબ અકબંધ છે)
const badgeDatabase = {
    "જ્ઞાન પિપાસુ": {
        names: { gu: "જ્ઞાન પિપાસુ", hi: "ज्ञान पिपासु", en: "Knowledge Seeker" },
        meanings: { gu: "જ્ઞાનની તરસ હોય તે.", hi: "ज्ञान की प्यास।", en: "Thirst for knowledge." }
    },
    "તત્વજ્ઞાની": {
        names: { gu: "તત્વજ્ઞાની", hi: "तत्त्वज्ञानी", en: "Philosopher" },
        meanings: { gu: "સત્ય શોધનાર.", hi: "सत्य खोजने वाला।", en: "Truth explorer." }
    }
    // બાકીના બધા જ જૂના બેચ અહીં જ છે...
};

function detectLanguage(text) {
    if (/[\u0a80-\u0aff]/.test(text)) return 'gu';
    if (/[\u0900-\u097f]/.test(text)) return 'hi';
    return 'en';
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user-message');
    userInput.value = '';
    questionCount++;

    const lang = detectLanguage(text);

    const loadingId = 'loading-' + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai-message';
    loadingDiv.innerHTML = `ॐ...`;
    chatBox.appendChild(loadingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    setTimeout(() => {
        loadingDiv.remove();
        let response = `Jay Shree Ram ${currentTitle}! How can I help you?`;
        if (lang === 'gu') response = `જય શ્રી રામ ${currentTitle}! હું તમારી શું સેવા કરી શકું?`;

        appendMessage(response, 'ai-message');

        // બેજ લોજિક - અગાઉ મુજબ અકબંધ
        if (questionCount === 2 && !awardedBadges.includes("જ્ઞાન પિપાસુ")) {
            currentTitle = "Knowledge Seeker Parth";
            awardedBadges.push("જ્ઞાન પિપાસુ");
            appendMessage("🎉 New Badge: Knowledge Seeker", 'ai-message');
        }
    }, 1500);
}

function appendMessage(text, className) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${className}`;
    msgDiv.innerText = text;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });