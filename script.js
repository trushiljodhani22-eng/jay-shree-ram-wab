const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const langSelect = document.getElementById("language-select");

const USER_NAME = I18n.USER_NAME;
let currentTitle = USER_NAME;
let awardedBadges = [];
let questionCount = 0;

const badgeDatabase = {
    "જ્ઞાન પિપાસુ": {
        names: { gu: "જ્ઞાન પિપાસુ", hi: "ज्ञान पिपासु", en: "Knowledge Seeker" },
        meanings: { gu: "જ્ઞાનની તરસ હોય તે.", hi: "ज्ञान की प्यास।", en: "Thirst for knowledge." }
    },
    "તત્વજ્ઞાની": {
        names: { gu: "તત્વજ્ઞાની", hi: "तत्त्वज्ञानी", en: "Philosopher" },
        meanings: { gu: "સત્ય શોધનાર.", hi: "सत्य खोजने वाला।", en: "Truth explorer." }
    }
};

function detectLanguage(text) {
    if (/[\u0a80-\u0aff]/.test(text)) return "gu";
    if (/[\u0900-\u097f]/.test(text)) return "hi";
    return "en";
}

function getChatResponseName(uiLang, inputLang) {
    if (uiLang === "gu" || inputLang === "gu") {
        return currentTitle === USER_NAME ? "પાર્થ" : currentTitle;
    }
    return USER_NAME;
}

function appendMessage(text, className, i18nMeta) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${className}`;
    if (i18nMeta) {
        msgDiv.setAttribute("data-i18n-dynamic", i18nMeta.key);
        msgDiv.setAttribute(
            "data-i18n-dynamic-vars",
            JSON.stringify(i18nMeta.vars || {})
        );
    }
    msgDiv.textContent = text;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return msgDiv;
}

function retranslateDynamicMessages() {
    I18n.applyToDom();
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    appendMessage(text, "user-message");
    userInput.value = "";
    questionCount++;

    const inputLang = detectLanguage(text);
    const uiLang = I18n.getLanguage();

    const loadingDiv = appendMessage(I18n.t("loadingOm"), "ai-message", {
        key: "loadingOm",
        vars: {}
    });

    setTimeout(async () => {
        loadingDiv.remove();
        const useGu = uiLang === "gu" || inputLang === "gu";
        const name = getChatResponseName(uiLang, inputLang);
        const responseLang = useGu ? "gu" : uiLang;
        await I18n.ensureLocale(responseLang);
        const responseKey = useGu ? "chatResponseGu" : "chatResponse";
        const response = I18n.t(responseKey, { name }, responseLang);

        appendMessage(response, "ai-message", {
            key: responseKey,
            vars: { name }
        });

        if (questionCount === 2 && !awardedBadges.includes("જ્ઞાન પિપાસુ")) {
            currentTitle = I18n.t("knowledgeSeekerTitle", null, uiLang);
            awardedBadges.push("જ્ઞાન પિપાસુ");
            appendMessage(I18n.t("badgeEarned", null, uiLang), "ai-message", {
                key: "badgeEarned",
                vars: {}
            });
        }
    }, 1500);
}

userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

window.addEventListener("languagechange", retranslateDynamicMessages);
