const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const langSelect = document.getElementById("language-select");

const USER_NAME = I18n.USER_NAME;
let currentTitle = USER_NAME;
let questionCount = 0;

// ============================================================
// BADGE SYSTEM — 100 Spiritual Badges
// localStorage keys: "spiritualBadges", "totalQuestionCount", "highestUnlockedBadge"
// ============================================================

// Multilingual popup labels for selected website language.
// Badge names are custom in Gujarati/Hindi/English. Other languages show translated popup labels
// and safely fallback to English badge title/meaning when custom translation is not available.
const BADGE_LANG_MAP = {
    en: { badge: "Badge", congrats: "🎉 Congratulations! You have earned a new spiritual badge!" },
    gu: { badge: "બેઝ", congrats: "🎉 અભિનંદન! તમે નવો આધ્યાત્મિક બેઝ અર્જિત કર્યો!" },
    hi: { badge: "बैज", congrats: "🎉 बधाई! आपने एक नया आध्यात्मिक बैज अर्जित किया!" }
};

function getLangPack(lang) {
    return BADGE_LANG_MAP[lang] || BADGE_LANG_MAP.en;
}

function getRequiredQuestionsForBadge(badgeNumber) {
    if (badgeNumber === 1) return 5;
    if (badgeNumber === 2) return 50;
    return 50 + ((badgeNumber - 2) * 25);
}

function isMeaningfulMessage(text) {
    if (!text) return false;

    const clean = text.trim().toLowerCase();

    // Minimum 20 characters required, so "hi", "hello", "ok" etc. cannot farm badges.
    if (clean.length < 20) return false;

    // Ignore messages made only of numbers/symbols/spaces.
    if (/^[0-9\s!@#$%^&*()_+=\-{}\[\]:;"'<>,.?/\\|`~]+$/.test(clean)) {
        return false;
    }

    // Ignore repeated same-character spam like "aaaaaaaaaaaaaaaaaaaa".
    if (/^(.)\1+$/.test(clean)) {
        return false;
    }

    return true;
}

// Load persisted state from localStorage safely
function loadBadgeState() {
    try {
        const b = localStorage.getItem("spiritualBadges");
        const q = localStorage.getItem("totalQuestionCount");
        const h = localStorage.getItem("highestUnlockedBadge");

        const awarded = b ? JSON.parse(b) : [];
        const total = q ? parseInt(q, 10) : 0;
        const highest = h ? parseInt(h, 10) : 0;

        return {
            awardedBadges: Array.isArray(awarded) ? awarded : [],
            totalQuestionCount: Number.isNaN(total) ? 0 : total,
            highestUnlockedBadge: Number.isNaN(highest) ? 0 : highest
        };
    } catch (e) {
        return {
            awardedBadges: [],
            totalQuestionCount: 0,
            highestUnlockedBadge: 0
        };
    }
}

function saveBadgeState() {
    try {
        localStorage.setItem("spiritualBadges", JSON.stringify(awardedBadges));
        localStorage.setItem("totalQuestionCount", String(totalQuestionCount));
        localStorage.setItem("highestUnlockedBadge", String(highestUnlockedBadge));
    } catch (e) { /* ignore */ }
}

let totalQuestionCount = 0;
let highestUnlockedBadge = 0;
let badgeState = loadBadgeState();
let awardedBadges = badgeState.awardedBadges;
totalQuestionCount = badgeState.totalQuestionCount;
highestUnlockedBadge = badgeState.highestUnlockedBadge;

// Full 50-badge database
// Each entry: { num, key, en, gu, hi, meaning_en, meaning_gu, meaning_hi, requiredDepth }
const BADGE_DB = [
    { num:1,  key:"badge_01", en:"Knowledge Seeker",      gu:"જ્ઞાન પિપાસુ",      hi:"ज्ञान पिपासु",
      meaning_en:"One whose intense desire to gain knowledge has just begun.",
      meaning_gu:"જેની જ્ઞાન મેળવવાની તીવ્ર ઈચ્છા શરૂ થઈ છે.",
      meaning_hi:"जिसकी ज्ञान प्राप्त करने की तीव्र इच्छा शुरू हुई है।", requiredDepth:1 },

    { num:2,  key:"badge_02", en:"Curious Parth",          gu:"જિજ્ઞાસુ પાર્થ",    hi:"जिज्ञासु पार्थ",
      meaning_en:"A seeker who asks serious questions to know the truth.",
      meaning_gu:"સત્યને જાણવા માટે ગંભીર પ્રશ્નો પૂછનાર સાધક.",
      meaning_hi:"सत्य को जानने के लिए गंभीर प्रश्न पूछने वाला साधक।", requiredDepth:3 },

    { num:3,  key:"badge_03", en:"Dharma Protector",       gu:"ધર્મ રક્ષક",         hi:"धर्म रक्षक",
      meaning_en:"One who stands firmly on the side of justice, ethics, and truth.",
      meaning_gu:"જે ન્યાય, નીતિ અને સત્યના પક્ષે મક્કમતાથી ઊભો રહે છે.",
      meaning_hi:"जो न्याय, नीति और सत्य के पक्ष में दृढ़ता से खड़ा रहता है।", requiredDepth:5 },

    { num:4,  key:"badge_04", en:"Karma Yogi",             gu:"કર્મ યોગી",          hi:"कर्म योगी",
      meaning_en:"One who does their best karma without expecting results.",
      meaning_gu:"જે ફળની આશા રાખ્યા વગર પોતાનું શ્રેષ્ઠ કર્મ કરે છે.",
      meaning_hi:"जो फल की आशा रखे बिना अपना श्रेष्ठ कर्म करता है।", requiredDepth:7 },

    { num:5,  key:"badge_05", en:"Peace Messenger",        gu:"શાંતિ દૂત",          hi:"शांति दूत",
      meaning_en:"One who maintains peace of mind even in difficult situations.",
      meaning_gu:"જે મુશ્કેલ પરિસ્થિતિમાં પણ મનની શાંતિ જાળવી રાખે છે.",
      meaning_hi:"जो कठिन परिस्थिति में भी मन की शांति बनाए रखता है।", requiredDepth:10 },

    { num:6,  key:"badge_06", en:"Truth Speaker",          gu:"સત્ય વક્તા",         hi:"सत्य वक्ता",
      meaning_en:"One who always speaks clearly, truthfully and sweetly.",
      meaning_gu:"જે હંમેશા સ્પષ્ટ, સાચું અને મધુર બોલે છે.",
      meaning_hi:"जो हमेशा स्पष्ट, सच्चा और मधुर बोलता है।", requiredDepth:13 },

    { num:7,  key:"badge_07", en:"Humble Disciple",        gu:"ગુરુ શિષ્ય",         hi:"गुरु शिष्य",
      meaning_en:"One who is ready to humbly receive knowledge.",
      meaning_gu:"જે નમ્રતાપૂર્વક જ્ઞાન ગ્રહણ કરવા માટે તત્પર છે.",
      meaning_hi:"जो विनम्रतापूर्वक ज्ञान ग्रहण करने के लिए तत्पर है।", requiredDepth:16 },

    { num:8,  key:"badge_08", en:"Philosopher",            gu:"તત્વજ્ઞાની",         hi:"तत्त्वज्ञानी",
      meaning_en:"One who understands the deep elements behind material things.",
      meaning_gu:"જે ભૌતિક વસ્તુઓની પાછળ રહેલા ગૂઢ તત્વોને સમજે છે.",
      meaning_hi:"जो भौतिक वस्तुओं के पीछे के गहरे तत्वों को समझता है।", requiredDepth:20 },

    { num:9,  key:"badge_09", en:"Devotee",                gu:"ભક્તિ માર્ગી",       hi:"भक्ति मार्गी",
      meaning_en:"One who has unwavering faith in the Supreme Being.",
      meaning_gu:"જેની પરમ તત્વ ઈશ્વરમાં અટલ શ્રદ્ધા છે.",
      meaning_hi:"जिसकी परम तत्व ईश्वर में अटल श्रद्धा है।", requiredDepth:24 },

    { num:10, key:"badge_10", en:"God-Realized",           gu:"બ્રહ્મજ્ઞાની",       hi:"ब्रह्मज्ञानी",
      meaning_en:"One who has experienced the ultimate and supreme truth of life.",
      meaning_gu:"જેણે જીવનના અંતિમ અને પરમ સત્યનો અનુભવ કર્યો છે.",
      meaning_hi:"जिसने जीवन के अंतिम और परम सत्य का अनुभव किया है।", requiredDepth:28 },

    { num:11, key:"badge_11", en:"Self-Controlled",        gu:"મનસ્વી",             hi:"मनस्वी",
      meaning_en:"One who has gained control over their restless mind and senses.",
      meaning_gu:"જેણે પોતાના ચંચળ મન અને ઇન્દ્રિયો પર કાબૂ મેળવ્યો છે.",
      meaning_hi:"जिसने अपने चंचल मन और इंद्रियों पर नियंत्रण पाया है।", requiredDepth:32 },

    { num:12, key:"badge_12", en:"Discerning",             gu:"વિવેકી",             hi:"विवेकी",
      meaning_en:"One who understands the difference between right and wrong.",
      meaning_gu:"જે સાચું અને ખોટું શું છે તેનો તફાવત સમજે છે.",
      meaning_hi:"जो सही और गलत का अंतर समझता है।", requiredDepth:36 },

    { num:13, key:"badge_13", en:"Dedicated",              gu:"નિષ્ઠાવાન",          hi:"निष्ठावान",
      meaning_en:"One who is loyal to their goal or spiritual practice.",
      meaning_gu:"જે પોતાના લક્ષ્ય કે સાધના પ્રત્યે વફાદાર છે.",
      meaning_hi:"जो अपने लक्ष्य या साधना के प्रति वफादार है।", requiredDepth:40 },

    { num:14, key:"badge_14", en:"Compassionate",          gu:"કરુણામય",            hi:"करुणामय",
      meaning_en:"One whose heart has compassion and love for every living being.",
      meaning_gu:"જેના હૃદયમાં દરેક જીવ માટે દયા અને પ્રેમ છે.",
      meaning_hi:"जिसके हृदय में हर जीव के लिए दया और प्रेम है।", requiredDepth:44 },

    { num:15, key:"badge_15", en:"Patient",                gu:"ધીરજવાન",            hi:"धैर्यवान",
      meaning_en:"One who maintains patience in success and failure alike.",
      meaning_gu:"જે સફળતા કે નિષ્ફળતામાં ધીરજ રાખે છે.",
      meaning_hi:"जो सफलता या विफलता में धैर्य रखता है।", requiredDepth:48 },

    { num:16, key:"badge_16", en:"Contented",              gu:"સંતોષી",             hi:"संतोषी",
      meaning_en:"One who finds joy in what they have.",
      meaning_gu:"જે પોતાની પાસે જે છે તેમાં આનંદ અનુભવે છે.",
      meaning_hi:"जो अपने पास जो है उसमें आनंद अनुभव करता है।", requiredDepth:52 },

    { num:17, key:"badge_17", en:"Introspective",          gu:"અંતર્મુખી",          hi:"अंतर्मुखी",
      meaning_en:"One who has learned to look within themselves.",
      meaning_gu:"જે પોતાની અંદર જોતા શીખ્યો છે.",
      meaning_hi:"जो अपने भीतर देखना सीख गया है।", requiredDepth:56 },

    { num:18, key:"badge_18", en:"Altruist",               gu:"પરમાર્થી",           hi:"परमार्थी",
      meaning_en:"One who thinks for the welfare of others.",
      meaning_gu:"જે બીજાના ભલા માટે વિચારે છે.",
      meaning_hi:"जो दूसरों के भले के लिए सोचता है।", requiredDepth:60 },

    { num:19, key:"badge_19", en:"Knowledge Aspirant",     gu:"જ્ઞાન સાધક",        hi:"ज्ञान साधक",
      meaning_en:"One who is constantly in pursuit of new knowledge.",
      meaning_gu:"જે સતત નવા જ્ઞાનની સાધનામાં રહે છે.",
      meaning_hi:"जो निरंतर नए ज्ञान की साधना में रहता है।", requiredDepth:65 },

    { num:20, key:"badge_20", en:"Non-violent",            gu:"અહિંસક",             hi:"अहिंसक",
      meaning_en:"One who does not cause pain to anyone through mind, word, or deed.",
      meaning_gu:"જે મન, વચન કે કર્મથી કોઈને દુઃખ પહોંચાડતો નથી.",
      meaning_hi:"जो मन, वचन या कर्म से किसी को दुख नहीं पहुंचाता।", requiredDepth:70 },

    { num:21, key:"badge_21", en:"Self-Learner",           gu:"સ્વાધ્યાયી",         hi:"स्वाध्यायी",
      meaning_en:"One who contemplates good thoughts and scriptures on their own.",
      meaning_gu:"જે જાતે જ સારા વિચારો અને શાસ્ત્રોનું મનન કરે છે.",
      meaning_hi:"जो स्वयं ही अच्छे विचारों और शास्त्रों का मनन करता है।", requiredDepth:75 },

    { num:22, key:"badge_22", en:"Austere",                gu:"તપોનિષ્ઠ",           hi:"तपोनिष्ठ",
      meaning_en:"One who believes in a disciplined and simple life.",
      meaning_gu:"જે શિસ્તબદ્ધ અને સાદગીપૂર્ણ જીવનમાં માને છે.",
      meaning_hi:"जो अनुशासित और सादगीपूर्ण जीवन में विश्वास करता है।", requiredDepth:80 },

    { num:23, key:"badge_23", en:"Practitioner",           gu:"યોગી",               hi:"योगी",
      meaning_en:"One who achieves stability through balance of mind and body.",
      meaning_gu:"જે મન અને શરીરના સંતુલનથી સ્થિરતા મેળવે છે.",
      meaning_hi:"जो मन और शरीर के संतुलन से स्थिरता प्राप्त करता है।", requiredDepth:86 },

    { num:24, key:"badge_24", en:"Equal-minded",           gu:"સમદ્રષ્ટા",          hi:"समदृष्टा",
      meaning_en:"One who sees every situation with an equal perspective.",
      meaning_gu:"જે દરેક પરિસ્થિતિને સમાન દ્રષ્ટિએ જુએ છે.",
      meaning_hi:"जो हर परिस्थिति को समान दृष्टि से देखता है।", requiredDepth:92 },

    { num:25, key:"badge_25", en:"Selfless Seeker",        gu:"નિષ્કામ સાધક",      hi:"निष्काम साधक",
      meaning_en:"One whose spiritual practice is not for personal gain.",
      meaning_gu:"જેની સાધના અંગત સ્વાર્થ માટે નથી.",
      meaning_hi:"जिसकी साधना व्यक्तिगत स्वार्थ के लिए नहीं है।", requiredDepth:98 },

    { num:26, key:"badge_26", en:"Pure Hearted",           gu:"ચિત્તશુદ્ધ",         hi:"चित्तशुद्ध",
      meaning_en:"One whose thoughts are pure and holy.",
      meaning_gu:"જેના વિચારો પવિત્ર છે.",
      meaning_hi:"जिसके विचार पवित्र हैं।", requiredDepth:105 },

    { num:27, key:"badge_27", en:"Vedantic",               gu:"વેદાંતી",            hi:"वेदांती",
      meaning_en:"One who takes interest in the knowledge of the Vedas and Upanishads.",
      meaning_gu:"જે વેદો અને ઉપનિષદોના જ્ઞાનમાં રુચિ ધરાવે છે.",
      meaning_hi:"जो वेदों और उपनिषदों के ज्ञान में रुचि रखता है।", requiredDepth:112 },

    { num:28, key:"badge_28", en:"Sattvic",                gu:"સાત્વિક",            hi:"सात्विक",
      meaning_en:"One whose nature has purity, light, and knowledge.",
      meaning_gu:"જેની પ્રકૃતિમાં શુદ્ધતા, પ્રકાશ અને જ્ઞાન છે.",
      meaning_hi:"जिसकी प्रकृति में शुद्धता, प्रकाश और ज्ञान है।", requiredDepth:120 },

    { num:29, key:"badge_29", en:"Minimalist",             gu:"અપરિગ્રહી",          hi:"अपरिग्रही",
      meaning_en:"One who does not accumulate unnecessary things or thoughts.",
      meaning_gu:"જે બિનજરૂરી વસ્તુઓ કે વિચારોનો સંગ્રહ કરતો નથી.",
      meaning_hi:"जो अनावश्यक वस्तुओं या विचारों का संग्रह नहीं करता।", requiredDepth:128 },

    { num:30, key:"badge_30", en:"Fearless",               gu:"નિર્ભય",             hi:"निर्भय",
      meaning_en:"One who is not afraid to walk on the path of truth.",
      meaning_gu:"જે સત્યના પથ પર ચાલતા ડરતો નથી.",
      meaning_hi:"जो सत्य के मार्ग पर चलते हुए डरता नहीं।", requiredDepth:136 },

    { num:31, key:"badge_31", en:"Wise",                   gu:"પ્રજ્ઞાવાન",         hi:"प्रज्ञावान",
      meaning_en:"One whose intelligence is stable and appropriate.",
      meaning_gu:"જેની બુદ્ધિ સ્થિર અને યોગ્ય છે.",
      meaning_hi:"जिसकी बुद्धि स्थिर और उचित है।", requiredDepth:145 },

    { num:32, key:"badge_32", en:"Faultless",              gu:"નિર્મળ",             hi:"निर्मल",
      meaning_en:"One who is free from hatred, jealousy, and deceit.",
      meaning_gu:"જે દ્વેષ, ઈર્ષ્યા અને કપટથી મુક્ત છે.",
      meaning_hi:"जो द्वेष, ईर्ष्या और कपट से मुक्त है।", requiredDepth:154 },

    { num:33, key:"badge_33", en:"Public Benefactor",      gu:"લોક કલ્યાણક",       hi:"लोक कल्याणक",
      meaning_en:"One who works for the welfare of society.",
      meaning_gu:"જે સમાજના કલ્યાણ માટે કાર્ય કરે છે.",
      meaning_hi:"जो समाज के कल्याण के लिए कार्य करता है।", requiredDepth:163 },

    { num:34, key:"badge_34", en:"Absolute Devotee",       gu:"અનન્ય ભક્ત",        hi:"अनन्य भक्त",
      meaning_en:"One whose mind is absorbed only in the Supreme Being.",
      meaning_gu:"જેનું મન માત્ર પરમ તત્વમાં લીન છે.",
      meaning_hi:"जिसका मन केवल परम तत्व में लीन है।", requiredDepth:172 },

    { num:35, key:"badge_35", en:"Salvation Seeker",       gu:"મુમુક્ષુ",           hi:"मुमुक्षु",
      meaning_en:"One who desires to attain moksha.",
      meaning_gu:"જે મોક્ષ મેળવવા ઈચ્છે છે.",
      meaning_hi:"जो मोक्ष प्राप्त करना चाहता है।", requiredDepth:182 },

    { num:36, key:"badge_36", en:"Self-Absorbed",          gu:"આત્મનિષ્ઠ",          hi:"आत्मनिष्ठ",
      meaning_en:"One who is immersed in the supreme bliss of the soul.",
      meaning_gu:"જે આત્માના પરમ આનંદમાં મગ્ન રહે છે.",
      meaning_hi:"जो आत्मा के परम आनंद में मग्न रहता है।", requiredDepth:192 },

    { num:37, key:"badge_37", en:"Scriptural Expert",      gu:"શાસ્ત્રાર્થ કુશળ",  hi:"शास्त्रार्थ कुशल",
      meaning_en:"One who is skilled in scriptural knowledge and discussion.",
      meaning_gu:"જે શાસ્ત્રોના જ્ઞાન અને ચર્ચામાં નિપુણ છે.",
      meaning_hi:"जो शास्त्रों के ज्ञान और चर्चा में निपुण है।", requiredDepth:202 },

    { num:38, key:"badge_38", en:"Surrendered",            gu:"સમર્પિત",            hi:"समर्पित",
      meaning_en:"One who has offered their duty and ego to God.",
      meaning_gu:"જેણે પોતાનું કર્તવ્ય અને અહંકાર ઈશ્વરને અર્પણ કર્યા છે.",
      meaning_hi:"जिसने अपना कर्तव्य और अहंकार ईश्वर को अर्पित किया है।", requiredDepth:213 },

    { num:39, key:"badge_39", en:"Deep Thinker",           gu:"તત્વચિંતક",          hi:"तत्वचिंतक",
      meaning_en:"One who meditates deeply on the hidden truths of life.",
      meaning_gu:"જે જીવનના ગૂઢ સત્યો પર ઊંડું મનન કરે છે.",
      meaning_hi:"जो जीवन के गूढ़ सत्यों पर गहरा मनन करता है।", requiredDepth:224 },

    { num:40, key:"badge_40", en:"Unattached",             gu:"અનાસક્ત",            hi:"अनासक्त",
      meaning_en:"One who remains detached from worldly attachments while living in the world.",
      meaning_gu:"જે સંસારમાં રહીને પણ મોહથી અલિપ્ત રહે છે.",
      meaning_hi:"जो संसार में रहते हुए भी मोह से अलिप्त रहता है।", requiredDepth:236 },

    { num:41, key:"badge_41", en:"Meditator",              gu:"ધ્યાની",             hi:"ध्यानी",
      meaning_en:"One who attains the state of meditation.",
      meaning_gu:"જે ધ્યાનની અવસ્થા પ્રાપ્ત કરે છે.",
      meaning_hi:"जो ध्यान की अवस्था प्राप्त करता है।", requiredDepth:248 },

    { num:42, key:"badge_42", en:"Pure Soul",              gu:"શુદ્ધાત્મા",          hi:"शुद्धात्मा",
      meaning_en:"One whose soul is innocent and pure.",
      meaning_gu:"જેનો આત્મા નિર્દોષ અને પવિત્ર છે.",
      meaning_hi:"जिसकी आत्मा निर्दोष और पवित्र है।", requiredDepth:260 },

    { num:43, key:"badge_43", en:"Conscious One",          gu:"ચૈતન્ય",             hi:"चैतन्य",
      meaning_en:"One who is connected with the supreme consciousness.",
      meaning_gu:"જે પરમ ચેતના સાથે જોડાયેલ છે.",
      meaning_hi:"जो परम चेतना से जुड़ा हुआ है।", requiredDepth:273 },

    { num:44, key:"badge_44", en:"Observer",               gu:"સાક્ષીભાવ",          hi:"साक्षीभाव",
      meaning_en:"One who sees the events of life as a witness.",
      meaning_gu:"જે જીવનની ઘટનાઓને દ્રષ્ટા તરીકે જુએ છે.",
      meaning_hi:"जो जीवन की घटनाओं को द्रष्टा के रूप में देखता है।", requiredDepth:286 },

    { num:45, key:"badge_45", en:"Beyond Attributes",      gu:"નિર્ગુણ",            hi:"निर्गुण",
      meaning_en:"One who has risen above the three qualities of nature.",
      meaning_gu:"જે પ્રકૃતિના ત્રણ ગુણોથી ઉપર ઉઠ્યો છે.",
      meaning_hi:"जो प्रकृति के तीन गुणों से ऊपर उठा है।", requiredDepth:300 },

    { num:46, key:"badge_46", en:"Equanimous",             gu:"સ્થિતપ્રજ્ઞ",        hi:"स्थितप्रज्ञ",
      meaning_en:"One who remains the same in happiness and sorrow.",
      meaning_gu:"જે સુખ અને દુઃખમાં સમાન રહે છે.",
      meaning_hi:"जो सुख और दुख में समान रहता है।", requiredDepth:315 },

    { num:47, key:"badge_47", en:"Sage-like",              gu:"ઋષિ તુલ્ય",          hi:"ऋषि तुल्य",
      meaning_en:"One whose knowledge and conduct is like that of a sage.",
      meaning_gu:"જેનું જ્ઞાન અને આચરણ ઋષિ જેવું છે.",
      meaning_hi:"जिसका ज्ञान और आचरण ऋषि जैसा है।", requiredDepth:330 },

    { num:48, key:"badge_48", en:"Self-Blissful",          gu:"આત્માનંદી",          hi:"आत्मानंदी",
      meaning_en:"One who is not dependent on the outside world for joy.",
      meaning_gu:"જે આનંદ માટે બહારની દુનિયા પર નિર્ભર નથી.",
      meaning_hi:"जो आनंद के लिए बाहरी दुनिया पर निर्भर नहीं है।", requiredDepth:346 },

    { num:49, key:"badge_49", en:"Ultimate Swan",          gu:"પરમહંસ",             hi:"परमहंस",
      meaning_en:"One who discerns the difference between ignorance and knowledge.",
      meaning_gu:"જે અજ્ઞાન અને જ્ઞાન વચ્ચેનો ભેદ પારખે છે.",
      meaning_hi:"जो अज्ञान और ज्ञान के बीच का भेद पहचानता है।", requiredDepth:363 },

    { num:50, key:"badge_50", en:"Great Soul",             gu:"પૂર્ણ પુરૂષ / મહાત્મા", hi:"महात्मा",
      meaning_en:"The highest pinnacle of spiritual practice and knowledge.",
      meaning_gu:"સાધના અને જ્ઞાનનું સર્વોચ્ચ શિખર.",
      meaning_hi:"साधना और ज्ञान का सर्वोच्च शिखर।", requiredDepth:380 }
,

    { num:51, key:"badge_51", en:"Generous Mind", gu:"ઉદાર મન", hi:"Generous Mind",
      meaning_en:"Generous Mind: જેનું હૃદય બીજાની ભૂલો માફ કરવા અને મદદ કરવા માટે વિશાળ છે.",
      meaning_gu:"જેનું હૃદય બીજાની ભૂલો માફ કરવા અને મદદ કરવા માટે વિશાળ છે.",
      meaning_hi:"Generous Mind: જેનું હૃદય બીજાની ભૂલો માફ કરવા અને મદદ કરવા માટે વિશાળ છે." },

    { num:52, key:"badge_52", en:"Forgiving", gu:"ક્ષમાશીલ", hi:"Forgiving",
      meaning_en:"Forgiving: જે ક્રોધને તજીને બીજાને સાચા દિલથી માફ કરી શકે છે.",
      meaning_gu:"જે ક્રોધને તજીને બીજાને સાચા દિલથી માફ કરી શકે છે.",
      meaning_hi:"Forgiving: જે ક્રોધને તજીને બીજાને સાચા દિલથી માફ કરી શકે છે." },

    { num:53, key:"badge_53", en:"Humble Seeker", gu:"નમ્ર સાધક", hi:"Humble Seeker",
      meaning_en:"Humble Seeker: સફળતા મળ્યા પછી પણ જેની નમ્રતા અકબંધ રહે છે.",
      meaning_gu:"સફળતા મળ્યા પછી પણ જેની નમ્રતા અકબંધ રહે છે.",
      meaning_hi:"Humble Seeker: સફળતા મળ્યા પછી પણ જેની નમ્રતા અકબંધ રહે છે." },

    { num:54, key:"badge_54", en:"Philanthropist", gu:"પરોપકારી", hi:"Philanthropist",
      meaning_en:"Philanthropist: જે હંમેશા સમાજ અને જરૂરિયાતમંદોના ભલા માટે કાર્ય કરે છે.",
      meaning_gu:"જે હંમેશા સમાજ અને જરૂરિયાતમંદોના ભલા માટે કાર્ય કરે છે.",
      meaning_hi:"Philanthropist: જે હંમેશા સમાજ અને જરૂરિયાતમંદોના ભલા માટે કાર્ય કરે છે." },

    { num:55, key:"badge_55", en:"Determined", gu:"દ્રઢ નિશ્ચયી", hi:"Determined",
      meaning_en:"Determined: જે એકવાર સંકલ્પ કર્યા પછી ગમે તેવા અવરોધોમાં પણ પાછો પડતો નથી.",
      meaning_gu:"જે એકવાર સંકલ્પ કર્યા પછી ગમે તેવા અવરોધોમાં પણ પાછો પડતો નથી.",
      meaning_hi:"Determined: જે એકવાર સંકલ્પ કર્યા પછી ગમે તેવા અવરોધોમાં પણ પાછો પડતો નથી." },

    { num:56, key:"badge_56", en:"Soft Spoken", gu:"મિતભાષી", hi:"Soft Spoken",
      meaning_en:"Soft Spoken: જે બહુ ઓછું પણ માપસર અને મીઠું બોલે છે.",
      meaning_gu:"જે બહુ ઓછું પણ માપસર અને મીઠું બોલે છે.",
      meaning_hi:"Soft Spoken: જે બહુ ઓછું પણ માપસર અને મીઠું બોલે છે." },

    { num:57, key:"badge_57", en:"Nature Lover", gu:"પર્યાવરણ પ્રેમી", hi:"Nature Lover",
      meaning_en:"Nature Lover: જે કુદરત, વૃક્ષો અને પશુ-પક્ષીઓનું જતન કરે છે.",
      meaning_gu:"જે કુદરત, વૃક્ષો અને પશુ-પક્ષીઓનું જતન કરે છે.",
      meaning_hi:"Nature Lover: જે કુદરત, વૃક્ષો અને પશુ-પક્ષીઓનું જતન કરે છે." },

    { num:58, key:"badge_58", en:"Devoted Son", gu:"માતૃ-પિતૃ ભક્ત", hi:"Devoted Son",
      meaning_en:"Devoted Son: જે પોતાના માતા-પિતાની સેવાને સર્વોપરી ધર્મ માને છે.",
      meaning_gu:"જે પોતાના માતા-પિતાની સેવાને સર્વોપરી ધર્મ માને છે.",
      meaning_hi:"Devoted Son: જે પોતાના માતા-પિતાની સેવાને સર્વોપરી ધર્મ માને છે." },

    { num:59, key:"badge_59", en:"Virtuous", gu:"સદ્ગુણી", hi:"Virtuous",
      meaning_en:"Virtuous: જેના જીવનમાં સારા વિચારો અને સંસ્કારોનું સિંચન થયેલું છે.",
      meaning_gu:"જેના જીવનમાં સારા વિચારો અને સંસ્કારોનું સિંચન થયેલું છે.",
      meaning_hi:"Virtuous: જેના જીવનમાં સારા વિચારો અને સંસ્કારોનું સિંચન થયેલું છે." },

    { num:60, key:"badge_60", en:"Service Oriented", gu:"સેવાધારી", hi:"Service Oriented",
      meaning_en:"Service Oriented: જે કોઈ પણ અપેક્ષા વગર નિઃસ્વાર્થ ભાવે સેવા કરે છે.",
      meaning_gu:"જે કોઈ પણ અપેક્ષા વગર નિઃસ્વાર્થ ભાવે સેવા કરે છે.",
      meaning_hi:"Service Oriented: જે કોઈ પણ અપેક્ષા વગર નિઃસ્વાર્થ ભાવે સેવા કરે છે." },

    { num:61, key:"badge_61", en:"Justice Lover", gu:"ન્યાયપ્રિય", hi:"Justice Lover",
      meaning_en:"Justice Lover: જે હંમેશા સત્ય અને ન્યાયના પક્ષે મક્કમતાથી ઊભો રહે છે.",
      meaning_gu:"જે હંમેશા સત્ય અને ન્યાયના પક્ષે મક્કમતાથી ઊભો રહે છે.",
      meaning_hi:"Justice Lover: જે હંમેશા સત્ય અને ન્યાયના પક્ષે મક્કમતાથી ઊભો રહે છે." },

    { num:62, key:"badge_62", en:"Faithful", gu:"શ્રદ્ધાવાન", hi:"Faithful",
      meaning_en:"Faithful: જેની પોતાના ઇષ્ટદેવ અને ગુરુમાં અતૂટ શ્રદ્ધા છે.",
      meaning_gu:"જેની પોતાના ઇષ્ટદેવ અને ગુરુમાં અતૂટ શ્રદ્ધા છે.",
      meaning_hi:"Faithful: જેની પોતાના ઇષ્ટદેવ અને ગુરુમાં અતૂટ શ્રદ્ધા છે." },

    { num:63, key:"badge_63", en:"Punctual", gu:"સમય પાલક", hi:"Punctual",
      meaning_en:"Punctual: જે સમયની કિંમત સમજે છે અને દરેક કાર્ય સમયસર પૂરું કરે છે.",
      meaning_gu:"જે સમયની કિંમત સમજે છે અને દરેક કાર્ય સમયસર પૂરું કરે છે.",
      meaning_hi:"Punctual: જે સમયની કિંમત સમજે છે અને દરેક કાર્ય સમયસર પૂરું કરે છે." },

    { num:64, key:"badge_64", en:"Inquisitive Soul", gu:"જિજ્ઞાસુ આત્મા", hi:"Inquisitive Soul",
      meaning_en:"Inquisitive Soul: જે દરેક નાની વસ્તુમાંથી પણ કંઈક નવું શીખવાની વૃત્તિ રાખે છે.",
      meaning_gu:"જે દરેક નાની વસ્તુમાંથી પણ કંઈક નવું શીખવાની વૃત્તિ રાખે છે.",
      meaning_hi:"Inquisitive Soul: જે દરેક નાની વસ્તુમાંથી પણ કંઈક નવું શીખવાની વૃત્તિ રાખે છે." },

    { num:65, key:"badge_65", en:"Self-Confident", gu:"આત્મવિશ્વાસુ", hi:"Self-Confident",
      meaning_en:"Self-Confident: જેને પોતાની શક્તિઓ અને મહેનત પર પૂરો ભરોસો છે.",
      meaning_gu:"જેને પોતાની શક્તિઓ અને મહેનત પર પૂરો ભરોસો છે.",
      meaning_hi:"Self-Confident: જેને પોતાની શક્તિઓ અને મહેનત પર પૂરો ભરોસો છે." },

    { num:66, key:"badge_66", en:"Tolerant", gu:"સહિષ્ણુ", hi:"Tolerant",
      meaning_en:"Tolerant: જે બીજાના વિચારો અને મતો પ્રત્યે આદર અને સહનશીલતા રાખે છે.",
      meaning_gu:"જે બીજાના વિચારો અને મતો પ્રત્યે આદર અને સહનશીલતા રાખે છે.",
      meaning_hi:"Tolerant: જે બીજાના વિચારો અને મતો પ્રત્યે આદર અને સહનશીલતા રાખે છે." },

    { num:67, key:"badge_67", en:"Simple Liver", gu:"સાદગીપૂર્ણ", hi:"Simple Liver",
      meaning_en:"Simple Liver: જે દેખાડા વગર સાદું જીવન અને ઉચ્ચ વિચારોમાં માને છે.",
      meaning_gu:"જે દેખાડા વગર સાદું જીવન અને ઉચ્ચ વિચારોમાં માને છે.",
      meaning_hi:"Simple Liver: જે દેખાડા વગર સાદું જીવન અને ઉચ્ચ વિચારોમાં માને છે." },

    { num:68, key:"badge_68", en:"Non-Greedy", gu:"નિર્લોભી", hi:"Non-Greedy",
      meaning_en:"Non-Greedy: જેને ધન કે લાલચ ક્યારેય પોતાના માર્ગ પરથી વિચલિત કરી શકતી નથી.",
      meaning_gu:"જેને ધન કે લાલચ ક્યારેય પોતાના માર્ગ પરથી વિચલિત કરી શકતી નથી.",
      meaning_hi:"Non-Greedy: જેને ધન કે લાલચ ક્યારેય પોતાના માર્ગ પરથી વિચલિત કરી શકતી નથી." },

    { num:69, key:"badge_69", en:"Hardworking", gu:"પરિશ્રમી", hi:"Hardworking",
      meaning_en:"Hardworking: જે સફળતા માટે માત્ર નસીબ પર નહીં પણ મહેનત પર વિશ્વાસ રાખે છે.",
      meaning_gu:"જે સફળતા માટે માત્ર નસીબ પર નહીં પણ મહેનત પર વિશ્વાસ રાખે છે.",
      meaning_hi:"Hardworking: જે સફળતા માટે માત્ર નસીબ પર નહીં પણ મહેનત પર વિશ્વાસ રાખે છે." },

    { num:70, key:"badge_70", en:"Disciplined", gu:"સંયમિત", hi:"Disciplined",
      meaning_en:"Disciplined: જેણે પોતાના આહાર, વિહાર અને વિચારમાં શિસ્ત કેળવી છે.",
      meaning_gu:"જેણે પોતાના આહાર, વિહાર અને વિચારમાં શિસ્ત કેળવી છે.",
      meaning_hi:"Disciplined: જેણે પોતાના આહાર, વિહાર અને વિચારમાં શિસ્ત કેળવી છે." },

    { num:71, key:"badge_71", en:"Optimistic", gu:"આશાવાદી", hi:"Optimistic",
      meaning_en:"Optimistic: જે ગમે તેવી નિરાશામાં પણ આશાનું કિરણ શોધી લે છે.",
      meaning_gu:"જે ગમે તેવી નિરાશામાં પણ આશાનું કિરણ શોધી લે છે.",
      meaning_hi:"Optimistic: જે ગમે તેવી નિરાશામાં પણ આશાનું કિરણ શોધી લે છે." },

    { num:72, key:"badge_72", en:"True Friend", gu:"મિત્રતા પ્રેમી", hi:"True Friend",
      meaning_en:"True Friend: જે મિત્રતાના ધર્મને નિભાવે છે અને સંકટમાં સાથ આપે છે.",
      meaning_gu:"જે મિત્રતાના ધર્મને નિભાવે છે અને સંકટમાં સાથ આપે છે.",
      meaning_hi:"True Friend: જે મિત્રતાના ધર્મને નિભાવે છે અને સંકટમાં સાથ આપે છે." },

    { num:73, key:"badge_73", en:"Serious Thinker", gu:"ગંભીર ચિંતક", hi:"Serious Thinker",
      meaning_en:"Serious Thinker: જે જીવનની સમસ્યાઓ પર ગંભીરતાથી મનન કરી ઉકેલ લાવે છે.",
      meaning_gu:"જે જીવનની સમસ્યાઓ પર ગંભીરતાથી મનન કરી ઉકેલ લાવે છે.",
      meaning_hi:"Serious Thinker: જે જીવનની સમસ્યાઓ પર ગંભીરતાથી મનન કરી ઉકેલ લાવે છે." },

    { num:74, key:"badge_74", en:"Pure Heart", gu:"નિર્મળ હૃદય", hi:"Pure Heart",
      meaning_en:"Pure Heart: જેના મનમાં કોઈના માટે કપટ કે વેરઝેરની ભાવના નથી.",
      meaning_gu:"જેના મનમાં કોઈના માટે કપટ કે વેરઝેરની ભાવના નથી.",
      meaning_hi:"Pure Heart: જેના મનમાં કોઈના માટે કપટ કે વેરઝેરની ભાવના નથી." },

    { num:75, key:"badge_75", en:"Gentleman", gu:"સજ્જન", hi:"Gentleman",
      meaning_en:"Gentleman: જેનું વર્તન સમાજમાં સૌ માટે આદરણીય અને અનુકરણીય છે.",
      meaning_gu:"જેનું વર્તન સમાજમાં સૌ માટે આદરણીય અને અનુકરણીય છે.",
      meaning_hi:"Gentleman: જેનું વર્તન સમાજમાં સૌ માટે આદરણીય અને અનુકરણીય છે." },

    { num:76, key:"badge_76", en:"Religious Wisdom", gu:"ધાર્મિક પ્રજ્ઞા", hi:"Religious Wisdom",
      meaning_en:"Religious Wisdom: જે ધર્મના સાચા મર્મને સમજે છે, અંધશ્રદ્ધાને નહીં.",
      meaning_gu:"જે ધર્મના સાચા મર્મને સમજે છે, અંધશ્રદ્ધાને નહીં.",
      meaning_hi:"Religious Wisdom: જે ધર્મના સાચા મર્મને સમજે છે, અંધશ્રદ્ધાને નહીં." },

    { num:77, key:"badge_77", en:"Unselfish", gu:"નિઃસ્વાર્થ", hi:"Unselfish",
      meaning_en:"Unselfish: જે પોતાના ફાયદા કરતા બીજાના સુખને વધુ મહત્વ આપે છે.",
      meaning_gu:"જે પોતાના ફાયદા કરતા બીજાના સુખને વધુ મહત્વ આપે છે.",
      meaning_hi:"Unselfish: જે પોતાના ફાયદા કરતા બીજાના સુખને વધુ મહત્વ આપે છે." },

    { num:78, key:"badge_78", en:"Aware Seeker", gu:"સજાગ સાધક", hi:"Aware Seeker",
      meaning_en:"Aware Seeker: જે પોતાની દરેક પ્રવૃત્તિ પ્રત્યે સભાન અને જાગૃત છે.",
      meaning_gu:"જે પોતાની દરેક પ્રવૃત્તિ પ્રત્યે સભાન અને જાગૃત છે.",
      meaning_hi:"Aware Seeker: જે પોતાની દરેક પ્રવૃત્તિ પ્રત્યે સભાન અને જાગૃત છે." },

    { num:79, key:"badge_79", en:"Grateful", gu:"કૃતજ્ઞ", hi:"Grateful",
      meaning_en:"Grateful: જે નાની મદદ કરનારનો પણ હંમેશા આભાર માને છે.",
      meaning_gu:"જે નાની મદદ કરનારનો પણ હંમેશા આભાર માને છે.",
      meaning_hi:"Grateful: જે નાની મદદ કરનારનો પણ હંમેશા આભાર માને છે." },

    { num:80, key:"badge_80", en:"Steadfast Faith", gu:"અચલ શ્રદ્ધા", hi:"Steadfast Faith",
      meaning_en:"Steadfast Faith: જેની શ્રદ્ધા પથ્થરની લકીર જેવી મજબૂત છે.",
      meaning_gu:"જેની શ્રદ્ધા પથ્થરની લકીર જેવી મજબૂત છે.",
      meaning_hi:"Steadfast Faith: જેની શ્રદ્ધા પથ્થરની લકીર જેવી મજબૂત છે." },

    { num:81, key:"badge_81", en:"Ocean of Mercy", gu:"કરુણા નિધાન", hi:"Ocean of Mercy",
      meaning_en:"Ocean of Mercy: જેનામાં દયાનો અખૂટ ભંડાર ભર્યો છે.",
      meaning_gu:"જેનામાં દયાનો અખૂટ ભંડાર ભર્યો છે.",
      meaning_hi:"Ocean of Mercy: જેનામાં દયાનો અખૂટ ભંડાર ભર્યો છે." },

    { num:82, key:"badge_82", en:"Logical Mind", gu:"તાર્કિક બુદ્ધિ", hi:"Logical Mind",
      meaning_en:"Logical Mind: જે દરેક વાતને તર્ક અને વિજ્ઞાનની દ્રષ્ટિએ પણ ચકાસે છે.",
      meaning_gu:"જે દરેક વાતને તર્ક અને વિજ્ઞાનની દ્રષ્ટિએ પણ ચકાસે છે.",
      meaning_hi:"Logical Mind: જે દરેક વાતને તર્ક અને વિજ્ઞાનની દ્રષ્ટિએ પણ ચકાસે છે." },

    { num:83, key:"badge_83", en:"Self-Disciplined", gu:"આત્માનુશાસિત", hi:"Self-Disciplined",
      meaning_en:"Self-Disciplined: જે કોઈના કહેવા વગર પોતે જ પોતાની શિસ્ત નક્કી કરે છે.",
      meaning_gu:"જે કોઈના કહેવા વગર પોતે જ પોતાની શિસ્ત નક્કી કરે છે.",
      meaning_hi:"Self-Disciplined: જે કોઈના કહેવા વગર પોતે જ પોતાની શિસ્ત નક્કી કરે છે." },

    { num:84, key:"badge_84", en:"Humanitarian", gu:"માનવતાવાદી", hi:"Humanitarian",
      meaning_en:"Humanitarian: જે માણસાઈને જ સૌથી મોટો ધર્મ માને છે.",
      meaning_gu:"જે માણસાઈને જ સૌથી મોટો ધર્મ માને છે.",
      meaning_hi:"Humanitarian: જે માણસાઈને જ સૌથી મોટો ધર્મ માને છે." },

    { num:85, key:"badge_85", en:"Lover of Peace", gu:"અહિંસા પ્રેમી", hi:"Lover of Peace",
      meaning_en:"Lover of Peace: જે ઝઘડા કે હિંસાથી દૂર રહી શાંતિનો માર્ગ અપનાવે છે.",
      meaning_gu:"જે ઝઘડા કે હિંસાથી દૂર રહી શાંતિનો માર્ગ અપનાવે છે.",
      meaning_hi:"Lover of Peace: જે ઝઘડા કે હિંસાથી દૂર રહી શાંતિનો માર્ગ અપનાવે છે." },

    { num:86, key:"badge_86", en:"Right Conduct", gu:"શુદ્ધ આચરણ", hi:"Right Conduct",
      meaning_en:"Right Conduct: જેનું ચારિત્ર્ય પવિત્ર અને આચરણ શુદ્ધ છે.",
      meaning_gu:"જેનું ચારિત્ર્ય પવિત્ર અને આચરણ શુદ્ધ છે.",
      meaning_hi:"Right Conduct: જેનું ચારિત્ર્ય પવિત્ર અને આચરણ શુદ્ધ છે." },

    { num:87, key:"badge_87", en:"Lover of Traditions", gu:"સનાતન પ્રેમી", hi:"Lover of Traditions",
      meaning_en:"Lover of Traditions: જે પોતાની પ્રાચીન સંસ્કૃતિ અને મૂલ્યોનું સન્માન કરે છે.",
      meaning_gu:"જે પોતાની પ્રાચીન સંસ્કૃતિ અને મૂલ્યોનું સન્માન કરે છે.",
      meaning_hi:"Lover of Traditions: જે પોતાની પ્રાચીન સંસ્કૃતિ અને મૂલ્યોનું સન્માન કરે છે." },

    { num:88, key:"badge_88", en:"Expert", gu:"ધુરંધર", hi:"Expert",
      meaning_en:"Expert: જે પોતાના કાર્યક્ષેત્ર કે જ્ઞાનમાં અત્યંત નિપુણ છે.",
      meaning_gu:"જે પોતાના કાર્યક્ષેત્ર કે જ્ઞાનમાં અત્યંત નિપુણ છે.",
      meaning_hi:"Expert: જે પોતાના કાર્યક્ષેત્ર કે જ્ઞાનમાં અત્યંત નિપુણ છે." },

    { num:89, key:"badge_89", en:"Seeker of Truth", gu:"સત્યાર્થી", hi:"Seeker of Truth",
      meaning_en:"Seeker of Truth: જે આખું જીવન માત્ર પરમ સત્યની શોધમાં વિતાવે છે.",
      meaning_gu:"જે આખું જીવન માત્ર પરમ સત્યની શોધમાં વિતાવે છે.",
      meaning_hi:"Seeker of Truth: જે આખું જીવન માત્ર પરમ સત્યની શોધમાં વિતાવે છે." },

    { num:90, key:"badge_90", en:"Pride-less", gu:"નિરાભિમાની", hi:"Pride-less",
      meaning_en:"Pride-less: જેની પાસે જ્ઞાન અને સત્તા હોવા છતાં અભિમાનનો અંશ નથી.",
      meaning_gu:"જેની પાસે જ્ઞાન અને સત્તા હોવા છતાં અભિમાનનો અંશ નથી.",
      meaning_hi:"Pride-less: જેની પાસે જ્ઞાન અને સત્તા હોવા છતાં અભિમાનનો અંશ નથી." },

    { num:91, key:"badge_91", en:"People's Servant", gu:"લોકસેવક", hi:"People's Servant",
      meaning_en:"People's Servant: જે પોતાનું જીવન જનતાની સેવા માટે અર્પણ કરે છે.",
      meaning_gu:"જે પોતાનું જીવન જનતાની સેવા માટે અર્પણ કરે છે.",
      meaning_hi:"People's Servant: જે પોતાનું જીવન જનતાની સેવા માટે અર્પણ કરે છે." },

    { num:92, key:"badge_92", en:"Scripture Lover", gu:"શાસ્ત્ર અનુરાગી", hi:"Scripture Lover",
      meaning_en:"Scripture Lover: જે પવિત્ર ગ્રંથો વાંચવાનો અને સમજવાનો શોખીન છે.",
      meaning_gu:"જે પવિત્ર ગ્રંથો વાંચવાનો અને સમજવાનો શોખીન છે.",
      meaning_hi:"Scripture Lover: જે પવિત્ર ગ્રંથો વાંચવાનો અને સમજવાનો શોખીન છે." },

    { num:93, key:"badge_93", en:"Adventurous", gu:"સાહસિક", hi:"Adventurous",
      meaning_en:"Adventurous: જે સત્યના માર્ગ પર આવતા જોખમો ખેડવા તૈયાર રહે છે.",
      meaning_gu:"જે સત્યના માર્ગ પર આવતા જોખમો ખેડવા તૈયાર રહે છે.",
      meaning_hi:"Adventurous: જે સત્યના માર્ગ પર આવતા જોખમો ખેડવા તૈયાર રહે છે." },

    { num:94, key:"badge_94", en:"Unbiased", gu:"નિષ્પક્ષ", hi:"Unbiased",
      meaning_en:"Unbiased: જે પક્ષપાત વગર હંમેશા તટસ્થ રહી નિર્ણય લે છે.",
      meaning_gu:"જે પક્ષપાત વગર હંમેશા તટસ્થ રહી નિર્ણય લે છે.",
      meaning_hi:"Unbiased: જે પક્ષપાત વગર હંમેશા તટસ્થ રહી નિર્ણય લે છે." },

    { num:95, key:"badge_95", en:"Inner Peace", gu:"પરમ શાંતિ", hi:"Inner Peace",
      meaning_en:"Inner Peace: જેણે પોતાની અંદર પરમ શાંતિનો અનુભવ કર્યો છે.",
      meaning_gu:"જેણે પોતાની અંદર પરમ શાંતિનો અનુભવ કર્યો છે.",
      meaning_hi:"Inner Peace: જેણે પોતાની અંદર પરમ શાંતિનો અનુભવ કર્યો છે." },

    { num:96, key:"badge_96", en:"Hero of Action", gu:"કર્મવીર", hi:"Hero of Action",
      meaning_en:"Hero of Action: જે બોલવા કરતા કરીને બતાવવામાં વધુ માને છે.",
      meaning_gu:"જે બોલવા કરતા કરીને બતાવવામાં વધુ માને છે.",
      meaning_hi:"Hero of Action: જે બોલવા કરતા કરીને બતાવવામાં વધુ માને છે." },

    { num:97, key:"badge_97", en:"Focused Mind", gu:"ચિત્ત એકાગ્ર", hi:"Focused Mind",
      meaning_en:"Focused Mind: જેનું મન અર્જુનના લક્ષ્યની જેમ એકાગ્ર છે.",
      meaning_gu:"જેનું મન અર્જુનના લક્ષ્યની જેમ એકાગ્ર છે.",
      meaning_hi:"Focused Mind: જેનું મન અર્જુનના લક્ષ્યની જેમ એકાગ્ર છે." },

    { num:98, key:"badge_98", en:"Knower of Dharma", gu:"ધર્મજ્ઞ", hi:"Knower of Dharma",
      meaning_en:"Knower of Dharma: જે ધર્મના તમામ નિયમો અને મર્યાદાઓને જાણે છે.",
      meaning_gu:"જે ધર્મના તમામ નિયમો અને મર્યાદાઓને જાણે છે.",
      meaning_hi:"Knower of Dharma: જે ધર્મના તમામ નિયમો અને મર્યાદાઓને જાણે છે." },

    { num:99, key:"badge_99", en:"Yoga Devotee", gu:"યોગનિષ્ઠ", hi:"Yoga Devotee",
      meaning_en:"Yoga Devotee: જેણે યોગ અને પ્રાણાયામ દ્વારા ઉર્જા મેળવી છે.",
      meaning_gu:"જેણે યોગ અને પ્રાણાયામ દ્વારા ઉર્જા મેળવી છે.",
      meaning_hi:"Yoga Devotee: જેણે યોગ અને પ્રાણાયામ દ્વારા ઉર્જા મેળવી છે." },

    { num:100, key:"badge_100", en:"Zero to Hero", gu:"શૂન્યથી શિખર", hi:"Zero to Hero",
      meaning_en:"Zero to Hero: જેણે શૂન્યમાંથી સર્જન કરીને જ્ઞાનનું શિખર સર કર્યું છે.",
      meaning_gu:"જેણે શૂન્યમાંથી સર્જન કરીને જ્ઞાનનું શિખર સર કર્યું છે.",
      meaning_hi:"Zero to Hero: જેણે શૂન્યમાંથી સર્જન કરીને જ્ઞાનનું શિખર સર કર્યું છે." }
];

// Keywords that score depth points when found in user message
const DEPTH_KEYWORDS = [
    // Spiritual / dharma
    "dharma","karma","moksha","bhakti","yoga","atma","brahma","soul","god","divine",
    "spirit","sacred","holy","prayer","worship","devotion","faith","temple","mantra",
    "meditation","vedas","gita","upanishad","scripture","liberation","consciousness",
    // Self-reflection
    "purpose","meaning","truth","life","death","rebirth","suffering","peace","inner",
    "mind","heart","wisdom","knowledge","understand","realize","aware","exist",
    "question","why","how","what is","help me","guide","path","way",
    // Gujarati spiritual
    "ધર્મ","કર્મ","મોક્ષ","ભક્તિ","આત્મા","ઈશ્વર","જ્ઞાન","સત્ય","શાંતિ","ધ્યાન",
    "ગીતા","વેદ","ઉપનિષદ","ભગવાન","સેવા","પ્રેમ","ચેતના","મુક્તિ","સાધના",
    // Hindi spiritual
    "धर्म","कर्म","मोक्ष","भक्ति","आत्मा","ईश्वर","ज्ञान","सत्य","शांति","ध्यान",
    "गीता","वेद","भगवान","सेवा","प्रेम","चेतना","मुक्ति","साधना","योग"
];

/**
 * Analyze message depth and return score to add.
 * Simple, deterministic, no external API.
 */
function analyzeDepth(text) {
    const lower = text.toLowerCase();
    let score = 1; // base point per message
    // Length bonus — longer thoughtful messages score more
    if (text.length > 60)  score += 1;
    if (text.length > 120) score += 1;
    // Keyword bonus
    DEPTH_KEYWORDS.forEach(kw => {
        if (lower.includes(kw.toLowerCase())) score += 2;
    });
    // Question mark = seeking = bonus
    if (text.includes("?") || text.includes("?")) score += 1;
    return Math.min(score, 12); // cap per message to avoid gaming
}

// Popup queue — show one at a time, not overlapping
let popupQueue = [];
let popupActive = false;

function getPopupText(lang) {
    return getLangPack(lang).congrats;
}

function getBadgeLabel(lang, num) {
    return `${getLangPack(lang).badge} #${num}`;
}


function getBadgeTitleByLang(badge, lang) {
    // Badge titles are available in Gujarati, Hindi, and English.
    // Fallback to English for unsupported languages.
    if (lang === "gu" && badge.gu) return badge.gu;
    if (lang === "hi" && badge.hi) return badge.hi;
    return badge.en;
}

function getBadgeMeaningByLang(badge, lang) {
    // Badge meanings are available in Gujarati, Hindi, and English.
    // Fallback to English for unsupported languages.
    if (lang === "gu" && badge.meaning_gu) return badge.meaning_gu;
    if (lang === "hi" && badge.meaning_hi) return badge.meaning_hi;
    return badge.meaning_en;
}

function getHighestBadgeTitle(lang) {
    if (!highestUnlockedBadge) return "";

    const badge = BADGE_DB.find(b => b.num === highestUnlockedBadge);
    if (!badge) return "";

    return getBadgeTitleByLang(badge, lang);
}

function shouldUseBadgeTitle() {
    return highestUnlockedBadge > 0 && totalQuestionCount > 0 && totalQuestionCount % 7 === 0;
}

function showNextPopup() {
    if (popupActive || popupQueue.length === 0) return;
    popupActive = true;

    const badge   = popupQueue.shift();
    const lang    = I18n.getLanguage();
    const overlay = document.getElementById("badge-overlay");

    // Determine display language — fallback to English for badge title/meaning when needed
    const title = getBadgeTitleByLang(badge, lang);
    const meaning = getBadgeMeaningByLang(badge, lang);

    document.getElementById("badge-popup-number").textContent  = getBadgeLabel(lang, badge.num);
    document.getElementById("badge-popup-title").textContent   = title;
    document.getElementById("badge-popup-english").textContent = (lang !== "en") ? badge.en : "";
    document.getElementById("badge-popup-meaning").textContent = meaning;
    document.getElementById("badge-popup-congrats").textContent = getPopupText(lang);

    overlay.style.display = "flex";

    document.getElementById("badge-popup-ok").onclick = function () {
        overlay.style.display = "none";
        popupActive = false;
        // Small delay before next popup so it feels natural
        setTimeout(showNextPopup, 400);
    };
}

function checkAndAwardBadges(msgText) {
    if (!isMeaningfulMessage(msgText)) return;

    totalQuestionCount += 1;

    while (highestUnlockedBadge < BADGE_DB.length) {
        const nextBadgeNumber = highestUnlockedBadge + 1;
        const requiredQuestions = getRequiredQuestionsForBadge(nextBadgeNumber);

        if (totalQuestionCount < requiredQuestions) break;

        const badge = BADGE_DB.find(b => b.num === nextBadgeNumber);
        if (!badge) break;

        if (!awardedBadges.includes(badge.key)) {
            awardedBadges.push(badge.key);
            popupQueue.push(badge);
        }

        highestUnlockedBadge = nextBadgeNumber;
    }

    saveBadgeState();

    // Show popup after slight delay so chat response appears first
    setTimeout(showNextPopup, 800);
}
// ============================================================
// END BADGE SYSTEM SETUP
// ============================================================

// ============================================================
// CHAT HISTORY SYSTEM — localStorage
// ============================================================

const CHAT_STORAGE_KEY = "spiritualChatHistory";
const MAX_CHATS = 50;
const MAX_MESSAGES_PER_CHAT = 200;
let currentChatId = null;

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text || typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Validate message before saving
function isValidMessage(text) {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    if (trimmed.length === 0) return false;
    if (trimmed.length < 2) return false;
    return true;
}

// Generate unique chat ID with collision prevention
function generateUniqueId() {
    let id = Date.now().toString();
    const existingChats = getStoredChats();
    const existingIds = new Set(existingChats.map(c => c.id));
    while (existingIds.has(id)) {
        id = (Date.now() + Math.random()).toString();
    }
    return id;
}

function getStoredChats() {
    try {
        const data = localStorage.getItem(CHAT_STORAGE_KEY);
        if (!data) return [];
        
        const chats = JSON.parse(data);
        
        // Validate data structure
        if (!Array.isArray(chats)) {
            console.error("Chat history corrupted: not an array, resetting");
            localStorage.removeItem(CHAT_STORAGE_KEY);
            return [];
        }
        
        // Filter out invalid chats
        const validChats = chats.filter(chat => {
            if (!chat || typeof chat !== 'object') return false;
            if (!chat.id || typeof chat.id !== 'string') return false;
            if (!chat.title || typeof chat.title !== 'string') return false;
            if (!Array.isArray(chat.messages)) return false;
            return true;
        });
        
        // Remove duplicate chat IDs
        const seenIds = new Set();
        const uniqueChats = validChats.filter(chat => {
            if (seenIds.has(chat.id)) {
                console.warn(`Duplicate chat ID found: ${chat.id}, removing`);
                return false;
            }
            seenIds.add(chat.id);
            return true;
        });
        
        // If we filtered out bad data, save the cleaned version
        if (uniqueChats.length !== chats.length) {
            console.warn("Cleaned corrupted chat history data");
            try {
                localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(uniqueChats));
            } catch (e) {
                console.error("Failed to save cleaned chat history:", e);
            }
        }
        
        return uniqueChats;
    } catch (e) {
        console.error("Failed to parse chat history, resetting:", e);
        localStorage.removeItem(CHAT_STORAGE_KEY);
        return [];
    }
}

function saveStoredChats(chats) {
    try {
        if (!Array.isArray(chats)) {
            console.error("Invalid chats data: not an array");
            return;
        }
        
        // Limit to maximum chats
        if (chats.length > MAX_CHATS) {
            console.warn(`Chat count exceeds ${MAX_CHATS}, truncating`);
            chats = chats.slice(0, MAX_CHATS);
        }
        
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chats));
    } catch (e) {
        console.error("Failed to save chat history:", e);
    }
}

function generateChatTitle(firstMessage) {
    if (!firstMessage) return "New Chat";
    const trimmed = firstMessage.trim().replace(/\s+/g, " ");
    if (trimmed.length === 0) return "New Chat";
    return trimmed.length > 35 ? trimmed.substring(0, 35) + "..." : trimmed;
}

function createNewChat() {
    try {
        const chats = getStoredChats();
        if (!Array.isArray(chats)) {
            console.error("Failed to get chats: invalid data");
            return null;
        }

        const newChat = {
            id: generateUniqueId(),
            title: "New Chat",
            messages: [],
            createdAt: new Date().toISOString()
        };
        chats.unshift(newChat);
        saveStoredChats(chats);
        currentChatId = newChat.id;
        // Persist current chat ID
        localStorage.setItem("currentChatId", currentChatId);
        renderChatHistory();
        return newChat;
    } catch (e) {
        console.error("Failed to create new chat:", e);
        return null;
    }
}

function saveChatMessage(text, isUser = true) {
    try {
        const clean = text.trim();

        // Prevent saving loading placeholders and invalid messages
        if (
            clean.includes("ૐ...") ||
            clean === "ૐ..." ||
            clean.length < 2 ||
            clean.includes("...") ||
            clean.includes("Loading") ||
            clean.includes("loading") ||
            clean.includes("Thinking") ||
            clean.includes("thinking") ||
            clean.includes("Typing") ||
            clean.includes("typing") ||
            clean.includes("Generating") ||
            clean.includes("generating")
        ) {
            return;
        }

        // Validate message
        if (!isValidMessage(text)) {
            console.warn("Invalid message, not saving");
            return;
        }

        // Don't save empty AI responses
        if (!isUser && (!text || text.trim().length === 0)) {
            console.warn("Empty AI response, not saving");
            return;
        }

        const chats = getStoredChats();
        if (!Array.isArray(chats)) {
            console.error("Failed to get chats: invalid data");
            return;
        }

        let chat = chats.find(c => c.id === currentChatId);

        // Only create a new chat when user sends a message
        if (!chat && isUser) {
            chat = createNewChat();
            if (!chat) {
                console.error("Failed to create new chat");
                return;
            }
            // Refresh chats after creating new one
            const updatedChats = getStoredChats();
            chat = updatedChats.find(c => c.id === currentChatId);
            if (!chat) return;
        }

        // If no chat exists and this is an AI response, don't save
        if (!chat) {
            console.warn("No active chat, not saving message");
            return;
        }

        // Prevent duplicate messages
        const lastMessage = chat.messages[chat.messages.length - 1];
        if (lastMessage && 
            lastMessage.text === clean && 
            lastMessage.sender === (isUser ? "user" : "ai")) {
            return;
        }

        // Limit messages per chat
        if (chat.messages.length >= MAX_MESSAGES_PER_CHAT) {
            console.warn(`Chat has reached maximum ${MAX_MESSAGES_PER_CHAT} messages`);
            chat.messages.shift(); // Remove oldest message
        }

        chat.messages.push({
            text: text.trim(),
            sender: isUser ? "user" : "ai",
            timestamp: new Date().toISOString()
        });

        // Update title from first user message
        if (isUser && chat.messages.filter(m => m.sender === "user").length === 1) {
            chat.title = generateChatTitle(text);
        }

        // Move chat to top
        const chatIndex = chats.findIndex(c => c.id === chat.id);
        if (chatIndex > 0) {
            chats.splice(chatIndex, 1);
            chats.unshift(chat);
        }

        saveStoredChats(chats);
        renderChatHistory();
    } catch (e) {
        console.error("Failed to save chat message:", e);
    }
}

// History menu close timer - global scope for accessibility
let historyMenuCloseTimer = null;

// Start 15-second close timer when mouse leaves sidebar and all menus
function startHistoryMenuCloseTimer() {
    if (historyMenuCloseTimer) {
        clearTimeout(historyMenuCloseTimer);
    }
    historyMenuCloseTimer = setTimeout(() => {
        closeAllHistoryMenusGlobal();
    }, 15000);
}

// Cancel close timer when mouse enters sidebar or menu
function cancelHistoryMenuCloseTimer() {
    if (historyMenuCloseTimer) {
        clearTimeout(historyMenuCloseTimer);
        historyMenuCloseTimer = null;
    }
}

// Global function to close all history menus
function closeAllHistoryMenusGlobal() {
    if (historyMenuCloseTimer) {
        clearTimeout(historyMenuCloseTimer);
        historyMenuCloseTimer = null;
    }
    document.querySelectorAll(".history-action-menu").forEach(menu => {
        menu.classList.remove("history-menu-open");
        menu.style.top = "";
        menu.style.left = "";
    });
}

function renderChatHistory(searchQuery = "") {
    try {
        const historyList = document.getElementById("history-list");
        if (!historyList) return;

        let chats = getStoredChats();
        if (!Array.isArray(chats)) {
            console.error("Invalid chats data in renderChatHistory");
            return;
        }

        // Filter chats based on search query
        if (searchQuery && searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            chats = chats.filter(chat => {
                if (!chat || !chat.title) return false;
                // Search in title
                if (chat.title.toLowerCase().includes(query)) return true;
                // Search in message content
                if (chat.messages && Array.isArray(chat.messages)) {
                    return chat.messages.some(msg =>
                        msg && msg.text && msg.text.toLowerCase().includes(query)
                    );
                }
                return false;
            });
        }

        historyList.innerHTML = "";

        // Show "no results" message if no chats match
        if (searchQuery && searchQuery.trim() && chats.length === 0) {
            const noResults = document.createElement("div");
            noResults.className = "chat-search-no-results";
            noResults.textContent = "No chats found";
            historyList.appendChild(noResults);
            return;
        }

        chats.forEach(chat => {
            if (!chat || !chat.id) return;
            
            const historyItem = document.createElement("div");
            historyItem.className = "history-item";
            historyItem.dataset.chatId = chat.id;
            
            const titleSpan = document.createElement("span");
            titleSpan.className = "history-title";
            titleSpan.textContent = escapeHtml(chat.title);
            
            const menuBtn = document.createElement("button");
        menuBtn.className = "history-menu-btn";
        menuBtn.innerHTML = "⋮";
        menuBtn.setAttribute("aria-label", "Chat options");

        // Action menu appended to BODY so sidebar overflow:hidden never clips it
        const actionMenu = document.createElement("div");
        actionMenu.className = "history-action-menu";
        // Note: display:none and all styles are in CSS. Only top is set dynamically on open.

        const shareBtn = document.createElement("button");
        shareBtn.className = "history-action-btn";
        shareBtn.textContent = "🔗 Share";
        shareBtn.onclick = (e) => {
            e.stopPropagation();
            shareChat(chat.id);
            // Close menu after share completes
            actionMenu.classList.remove("history-menu-open");
            actionMenu.style.top = "";
            actionMenu.style.left = "";
        };

        const renameBtn = document.createElement("button");
        renameBtn.className = "history-action-btn";
        renameBtn.textContent = "✏️ Rename";
        renameBtn.onclick = (e) => {
            e.stopPropagation();
            renameChat(chat.id);
            // Close menu after rename completes
            actionMenu.classList.remove("history-menu-open");
            actionMenu.style.top = "";
            actionMenu.style.left = "";
        };

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "history-action-btn delete-btn";
        deleteBtn.textContent = "🗑️ Delete";
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteChat(chat.id);
            // Close menu after delete completes
            actionMenu.classList.remove("history-menu-open");
            actionMenu.style.top = "";
            actionMenu.style.left = "";
        };

        actionMenu.appendChild(shareBtn);
        actionMenu.appendChild(renameBtn);
        actionMenu.appendChild(deleteBtn);

        // Append menu to body so sidebar overflow never clips it
        document.body.appendChild(actionMenu);

        // Add mouseleave handler to action menu
        actionMenu.addEventListener("mouseleave", () => {
            startHistoryMenuCloseTimer();
        });

        // Add mouseenter handler to action menu
        actionMenu.addEventListener("mouseenter", () => {
            cancelHistoryMenuCloseTimer();
        });

        // --- STABLE CLOSE LOGIC ---
        // Menu stays open while cursor is inside sidebar OR inside menu box.
        // Uses document mousemove to check real-time cursor position.
        // 12px buffer handles sub-pixel gaps between sidebar edge and menu.
        let moveWatcher = null;

        function startMoveWatcher() {
            if (moveWatcher) return;
            moveWatcher = function(e) {
                const sidebar = document.getElementById("sidebar");
                const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : null;
                const menuRect    = actionMenu.getBoundingClientRect();

                // 12px buffer — covers any pixel gap between sidebar right edge and menu left edge
                const BUFFER = 12;

                const inSidebar = sidebarRect &&
                    e.clientX >= sidebarRect.left - BUFFER &&
                    e.clientX <= sidebarRect.right + BUFFER &&
                    e.clientY >= sidebarRect.top - BUFFER &&
                    e.clientY <= sidebarRect.bottom + BUFFER;

                const inMenu =
                    e.clientX >= menuRect.left - BUFFER &&
                    e.clientX <= menuRect.right + BUFFER &&
                    e.clientY >= menuRect.top - BUFFER &&
                    e.clientY <= menuRect.bottom + BUFFER;

                if (!inSidebar && !inMenu) {
                    actionMenu.classList.remove("history-menu-open");
                    actionMenu.style.top  = "";
                    actionMenu.style.left = "";
                    document.removeEventListener("mousemove", moveWatcher);
                    moveWatcher = null;
                }
            };
            document.addEventListener("mousemove", moveWatcher);
        }

        // Open/close menu on ⋮ click
        menuBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            e.preventDefault();

            const isOpen = actionMenu.classList.contains("history-menu-open");

            // Close ALL open menus first using the global function
            closeAllHistoryMenusGlobal();

            if (!isOpen) {
                // Cancel any pending close timer
                cancelHistoryMenuCloseTimer();

                const rect = menuBtn.getBoundingClientRect();
                const sidebarEl = document.getElementById("sidebar");
                const sidebarRight = sidebarEl ? sidebarEl.getBoundingClientRect().right : 260;

                // Add class first so browser renders it and offsetWidth is readable
                actionMenu.classList.add("history-menu-open");

                // Half inside sidebar, half outside — center on sidebar right edge
                const menuHalfWidth = actionMenu.offsetWidth / 2;
                actionMenu.style.top = rect.top + "px";
                actionMenu.style.left = (sidebarRight - menuHalfWidth) + "px";
                startMoveWatcher();
            } else {
                if (moveWatcher) {
                    document.removeEventListener("mousemove", moveWatcher);
                    moveWatcher = null;
                }
            }
        });

        historyItem.appendChild(titleSpan);
        historyItem.appendChild(menuBtn);

        // Add click handler to load chat (menuBtn click won't bubble here due to stopPropagation)
        historyItem.addEventListener("click", () => {
            loadChat(chat.id);
        });

        historyList.appendChild(historyItem);
    });
    } catch (e) {
        console.error("Failed to render chat history:", e);
    }
}

function loadChat(chatId) {
    try {
        if (!chatId) {
            console.error("No chat ID provided to loadChat");
            return;
        }
        
        const chats = getStoredChats();
        if (!Array.isArray(chats)) {
            console.error("Invalid chats data in loadChat");
            return;
        }
        
        const chat = chats.find(c => c.id === chatId);
        if (!chat) {
            console.error(`Chat not found: ${chatId}`);
            return;
        }
        
        currentChatId = chatId;
        // Persist current chat ID
        localStorage.setItem("currentChatId", currentChatId);
        
        const chatBox = document.getElementById("chat-box");
        if (!chatBox) {
            console.error("Chat box element not found");
            return;
        }
        
        chatBox.innerHTML = "";

        // Render all messages from the chat
        chat.messages.forEach(msg => {
            if (!msg || !msg.text) return;
            const className = msg.sender === "user" ? "user-message" : "ai-message";
            appendMessage(escapeHtml(msg.text), className);
        });
    } catch (e) {
        console.error("Failed to load chat:", e);
    }
}

function deleteChat(chatId) {
    try {
        if (!chatId) {
            console.error("No chat ID provided to deleteChat");
            return;
        }
        
        const chats = getStoredChats();
        if (!Array.isArray(chats)) {
            console.error("Invalid chats data in deleteChat");
            return;
        }
        
        const filteredChats = chats.filter(c => c.id !== chatId);
        saveStoredChats(filteredChats);
        
        if (currentChatId === chatId) {
            currentChatId = null;
            // Clear persisted chat ID
            localStorage.removeItem("currentChatId");
            // Clear chat box
            const chatBox = document.getElementById("chat-box");
            if (chatBox) {
                chatBox.innerHTML = "";
            }
        }
        
        renderChatHistory();
    } catch (e) {
        console.error("Failed to delete chat:", e);
    }
}

function renameChat(chatId) {
    try {
        if (!chatId) {
            console.error("No chat ID provided to renameChat");
            return;
        }
        
        const chats = getStoredChats();
        if (!Array.isArray(chats)) {
            console.error("Invalid chats data in renameChat");
            return;
        }
        
        const chat = chats.find(c => c.id === chatId);
        if (!chat) {
            console.error(`Chat not found for rename: ${chatId}`);
            return;
        }
        
        const newTitle = prompt("Enter new title:", chat.title);
        if (newTitle !== null && newTitle.trim()) {
            chat.title = escapeHtml(newTitle.trim());
            saveStoredChats(chats);
            renderChatHistory();
        }
    } catch (e) {
        console.error("Failed to rename chat:", e);
    }
}

function shareChat(chatId) {
    try {
        if (!chatId) {
            console.error("No chat ID provided to shareChat");
            return;
        }
        
        const chats = getStoredChats();
        if (!Array.isArray(chats)) {
            console.error("Invalid chats data in shareChat");
            return;
        }
        
        const chat = chats.find(c => c.id === chatId);
        if (!chat) {
            console.error(`Chat not found for share: ${chatId}`);
            return;
        }
        
        const chatText = chat.messages.map(m => {
            if (!m || !m.text) return '';
            return `${m.sender === "user" ? "You" : "AI"}: ${escapeHtml(m.text)}`;
        }).filter(m => m).join("\n\n");
        const shareContent = `${escapeHtml(chat.title)}\n\n${chatText}`;
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareContent)
                .then(() => alert("Chat copied to clipboard!"))
                .catch(() => alert(shareContent));
        } else {
            alert(shareContent);
        }
    } catch (e) {
        console.error("Failed to share chat:", e);
    }
}

// Initialize chat history on page load
function initializeChatHistory() {
    try {
        // Clean up old broken history systems
        localStorage.removeItem("spiritual_chat_history");
        localStorage.removeItem("spiritual_active_chat_id");
        localStorage.removeItem("spiritual_chats_v1");

        // Restore current chat ID from localStorage if available
        const savedChatId = localStorage.getItem("currentChatId");
        if (savedChatId) {
            const chats = getStoredChats();
            const chatExists = chats.find(c => c.id === savedChatId);
            if (chatExists) {
                currentChatId = savedChatId;
                console.log("Restored current chat:", currentChatId);
            } else {
                // Saved chat no longer exists, clear it
                localStorage.removeItem("currentChatId");
                currentChatId = null;
            }
        } else {
            currentChatId = null;
        }

        // Clear chat box on load
        const chatBox = document.getElementById("chat-box");
        if (chatBox) {
            chatBox.innerHTML = "";
        }

        renderChatHistory();
    } catch (e) {
        console.error("Failed to initialize chat history:", e);
        currentChatId = null;
        renderChatHistory();
    }
}

// ============================================================
// END CHAT HISTORY SYSTEM
// ============================================================

function detectLanguage(text) {
    if (/[\u0a80-\u0aff]/.test(text)) return "gu";
    if (/[\u0900-\u097f]/.test(text)) return "hi";
    return "en";
}

function getChatResponseName(uiLang, inputLang) {
    const lang = uiLang !== "en" ? uiLang : inputLang;
    if (lang === "gu") return currentTitle === USER_NAME ? "પાર્થ" : currentTitle;
    if (lang === "hi") return currentTitle === USER_NAME ? "पार्थ" : currentTitle;
    return currentTitle || USER_NAME;
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

    // Save user message to chat history
    saveChatMessage(text, true);

    // If history menu close timer is running (menu was opened), reset it to 15s
    // so the menu stays visible for another 15 seconds after each new command
    if (historyMenuCloseTimer) {
        startHistoryMenuCloseTimer();
    }

    const inputLang = detectLanguage(text);
    const uiLang = I18n.getLanguage();

    const loadingDiv = appendMessage(I18n.t("loadingOm"), "ai-message", {
        key: "loadingOm",
        vars: {}
    });

    setTimeout(async () => {
        loadingDiv.remove();
        const useGu = uiLang === "gu" || inputLang === "gu";
        const useHi = uiLang === "hi" || inputLang === "hi";
        const name = getChatResponseName(uiLang, inputLang);
        const responseLang = useGu ? "gu" : (useHi ? "hi" : uiLang);
        const localePack = await I18n.ensureLocale(responseLang);
        const responseKey = useGu ? "chatResponseGu" : (useHi ? "chatResponseHi" : "chatResponse");
        const rawResponse = localePack[responseKey] || localePack["chatResponse"] || "Jay Shree Ram {name}!";
        let response = rawResponse.replace(/\{name\}/g, name);

        if (shouldUseBadgeTitle()) {
            const badgeTitle = getHighestBadgeTitle(responseLang);
            if (badgeTitle) {
                response = `${badgeTitle}, ${response}`;
            }
        }

        appendMessage(response, "ai-message");
        saveChatMessage(response, false);

        // ✅ Badge system — count only 20+ character meaningful user messages
        checkAndAwardBadges(text);
    }, 1500);
}

userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

// ── Send Button ──────────────────────────────────────────────
const sendBtn = document.getElementById("send-btn");
if (sendBtn) {
    sendBtn.addEventListener("click", () => sendMessage());
}

// ── Story Button: toggle mode AND auto-send if input has text ─
(function patchStoryBtn() {
    const storyBtn = document.getElementById("send-story-btn");
    if (!storyBtn) return;
    storyBtn.addEventListener("click", () => {
        const input = document.getElementById("user-input");
        if (input && input.value.trim()) {
            // If user typed something, send it in story mode
            window.voiceStoryMode = true;
            sendMessage();
        } else {
            // No text — just show hint
            if (input) {
                input.placeholder = "Type your question and press Story again...";
                setTimeout(() => { input.placeholder = "Type your question here..."; }, 3000);
            }
        }
    });
})();

// ── Suggestion Button: toggle mode AND auto-send if input has text ─
(function patchSuggestionBtn() {
    const suggBtn = document.getElementById("send-suggestion-btn");
    if (!suggBtn) return;
    suggBtn.addEventListener("click", () => {
        const input = document.getElementById("user-input");
        if (input && input.value.trim()) {
            window.voiceSuggestionMode = true;
            sendMessage();
        } else {
            if (input) {
                input.placeholder = "Type your question and press Suggestion again...";
                setTimeout(() => { input.placeholder = "Type your question here..."; }, 3000);
            }
        }
    });
})();

window.addEventListener("languagechange", retranslateDynamicMessages);

// ============================================================
// KRISHNA FLUTE — Continuous Background Music
// File: krishana_flute.mp3
// Rules:
//   - Start ONLY after successful login (spiritual-auth-success event)
//   - Loop nonstop, volume 0.28
//   - Only ONE instance — no duplicate playback
//   - Never restart if already playing
// ============================================================
const fluteAudio = new Audio("krishna_flute.mp3");
fluteAudio.loop   = true;
fluteAudio.volume = 0.28;

// Track whether music has started — prevents duplicate starts
let fluteStarted = false;

/**
 * Tries to play the flute. Safe — swallows autoplay errors.
 * Once started, removes all first-interaction listeners.
 */
function startFlute() {
    // Guard: do not restart if already playing
    if (fluteStarted) return;

    fluteAudio.play().then(() => {
        fluteStarted = true;
        removeInteractionListeners();
    }).catch(() => {
        // Browser blocked autoplay — will retry on first interaction
    });
}

/**
 * Called on first user interaction if autoplay was blocked.
 * Starts music once and removes itself from all event types.
 */
function onFirstInteraction() {
    if (fluteStarted) {
        removeInteractionListeners();
        return;
    }
    fluteAudio.play().then(() => {
        fluteStarted = true;
        removeInteractionListeners();
    }).catch(() => {
        // Still blocked — do nothing, try again next interaction
    });
}

// One-time interaction listeners (removed as soon as music starts)
const INTERACTION_EVENTS = ["click", "touchstart", "keypress"];

function removeInteractionListeners() {
    INTERACTION_EVENTS.forEach((evt) => {
        document.removeEventListener(evt, onFirstInteraction);
    });
}

function addInteractionListeners() {
    INTERACTION_EVENTS.forEach((evt) => {
        document.addEventListener(evt, onFirstInteraction, { once: false });
    });
}

// Start flute ONLY after successful login/auth.
window.addEventListener("spiritual-auth-success", () => {
    startFlute();
    addInteractionListeners();
});
// ============================================================
// =========================================
// SIDEBAR INTERACTION LOGIC
// =========================================

// Flag to prevent duplicate event listener initialization
let sidebarInitialized = false;

document.addEventListener("DOMContentLoaded", () => {
    // Prevent duplicate initialization
    if (sidebarInitialized) {
        console.warn("Sidebar already initialized, skipping");
        return;
    }
    sidebarInitialized = true;

    // Initialize chat history system
    initializeChatHistory();

    // =========================
    // CHAT SEARCH FUNCTIONALITY
    // =========================

    const sidebarSearchInput = document.getElementById("sidebar-search-input");
    const mobileSearchInput = document.getElementById("mobile-search-input");

    // Debounce function for search
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Search handler
    function handleSearch(query, source = "desktop") {
        // Filter the chat history
        renderChatHistory(query);

        // Sync mobile history if search originated from desktop sidebar
        if (source === "desktop") {
            syncMobileSearch(query);
        } else if (source === "mobile") {
            syncDesktopSearch(query);
        }
    }

    // Sync functions to keep both search inputs in sync
    function syncMobileSearch(query) {
        if (mobileSearchInput && mobileSearchInput.value !== query) {
            mobileSearchInput.value = query;
        }
        // Update mobile history list
        const mobileHistoryList = document.getElementById("mobile-history-list");
        const desktopHistoryList = document.getElementById("history-list");
        if (mobileHistoryList && desktopHistoryList) {
            mobileHistoryList.innerHTML = desktopHistoryList.innerHTML;
            attachMobileHistoryClickHandlers();
        }
    }

    function syncDesktopSearch(query) {
        if (sidebarSearchInput && sidebarSearchInput.value !== query) {
            sidebarSearchInput.value = query;
        }
        // Desktop history is already updated via renderChatHistory
    }

    // Attach click handlers to mobile history items
    function attachMobileHistoryClickHandlers() {
        const mobileHistoryList = document.getElementById("mobile-history-list");
        if (mobileHistoryList) {
            mobileHistoryList.querySelectorAll(".history-item").forEach(item => {
                item.addEventListener("click", () => {
                    // Close mobile drawer
                    const drawer = document.getElementById("mobile-drawer");
                    const drawerOverlay = document.getElementById("mobile-drawer-overlay");
                    if (drawer) drawer.classList.remove("drawer-open");
                    if (drawerOverlay) drawerOverlay.classList.remove("drawer-open");
                    document.body.style.overflow = "";
                });
            });
        }
    }

    // Debounced search handlers
    const debouncedSidebarSearch = debounce((e) => {
        handleSearch(e.target.value, "desktop");
    }, 150);

    const debouncedMobileSearch = debounce((e) => {
        handleSearch(e.target.value, "mobile");
    }, 150);

    // Attach event listeners to search inputs
    if (sidebarSearchInput) {
        sidebarSearchInput.addEventListener("input", debouncedSidebarSearch);
        // Prevent search input from triggering sidebar collapse
        sidebarSearchInput.addEventListener("click", (e) => e.stopPropagation());
        sidebarSearchInput.addEventListener("focus", (e) => e.stopPropagation());
    }

    if (mobileSearchInput) {
        mobileSearchInput.addEventListener("input", debouncedMobileSearch);
        // Prevent search input from closing drawer
        mobileSearchInput.addEventListener("click", (e) => e.stopPropagation());
    }

    // Clear search when new chat is created
    function clearSearchInputs() {
        if (sidebarSearchInput) sidebarSearchInput.value = "";
        if (mobileSearchInput) mobileSearchInput.value = "";
        renderChatHistory("");
    }

    // =========================
    // ELEMENTS
    // =========================

    const sidebar = document.getElementById("sidebar");
    const sidebarToggle = document.getElementById("sidebar-toggle");

    const userMenuBtn = document.getElementById("user-menu-btn");
    const userMenuPanel = document.getElementById("user-menu-panel");

    const newChatBtn = document.getElementById("new-chat-btn");
    const buyBookBtn = document.getElementById("buy-book-btn");
    const booksBtn = document.getElementById("books-btn");

    const chatBox = document.getElementById("chat-box");
    const userInput = document.getElementById("user-input");

    // =========================================
    // SIDEBAR TOGGLE
    // =========================================

    if (sidebarToggle && sidebar) {

        sidebarToggle.addEventListener("click", (e) => {

            e.stopPropagation();

            sidebar.classList.toggle("sidebar-open");

        });

    }

    // =========================================
    // SIDEBAR HOVER EXPAND
    // =========================================

    // Timer for delayed sidebar collapse (10 seconds after mouse leaves)
    let sidebarCollapseTimer = null;

    if (sidebar) {
        sidebar.addEventListener("mouseenter", () => {
            // Cancel any pending collapse timer when mouse re-enters
            if (sidebarCollapseTimer) {
                clearTimeout(sidebarCollapseTimer);
                sidebarCollapseTimer = null;
            }
            sidebar.classList.add("sidebar-open");
        });

        sidebar.addEventListener("mouseleave", () => {
            // Only collapse on hover-out if it was opened by hover (not by click-toggle)
            if (!sidebar.dataset.clickOpened) {
                // Wait 10 seconds before collapsing sidebar
                if (sidebarCollapseTimer) clearTimeout(sidebarCollapseTimer);
                sidebarCollapseTimer = setTimeout(() => {
                    sidebar.classList.remove("sidebar-open");
                    sidebarCollapseTimer = null;
                }, 10000);
            }
        });

        if (sidebarToggle) {
            sidebarToggle.addEventListener("click", (e) => {
                e.stopPropagation();
                if (sidebar.classList.contains("sidebar-open") && sidebar.dataset.clickOpened) {
                    // User is clicking to close
                    delete sidebar.dataset.clickOpened;
                    sidebar.classList.remove("sidebar-open");
                } else {
                    // User is clicking to pin open
                    sidebar.dataset.clickOpened = "true";
                    sidebar.classList.add("sidebar-open");
                }
            }, { capture: true });
        }
    }

    // =========================================
    // HISTORY MENU
    // =========================================

    // Add mouseleave handler to sidebar
    if (sidebar) {
        sidebar.addEventListener("mouseleave", () => {
            // Start timer when leaving sidebar (will be cancelled if mouse enters menu)
            startHistoryMenuCloseTimer();
        });

        sidebar.addEventListener("mouseenter", () => {
            cancelHistoryMenuCloseTimer();
        });
    }

    // =========================================
    // USER MENU
    // =========================================

    if (userMenuBtn && userMenuPanel) {

        // Panel ને body માં move કરો જેથી sidebar overflow:hidden ક્યારેય clip ન કરે
        if (userMenuPanel.parentElement !== document.body) {
            document.body.appendChild(userMenuPanel);
        }

        // Panel ને button ની position ઉપર fixed/absolute રીતે set કરો
        function positionUserMenuPanel() {
            const rect = userMenuBtn.getBoundingClientRect();
            userMenuPanel.style.position = "fixed";
            userMenuPanel.style.zIndex   = "99999";
            userMenuPanel.style.bottom   = (window.innerHeight - rect.top) + "px";
            userMenuPanel.style.left     = rect.left + "px";
            userMenuPanel.style.top      = "";
            userMenuPanel.style.right    = "";
        }

        userMenuBtn.addEventListener("click", (e) => {

            e.stopPropagation();

            const isVisible =
                userMenuPanel.style.display === "block";

            if (!isVisible) {
                positionUserMenuPanel();
                userMenuPanel.style.display = "block";
            } else {
                userMenuPanel.style.display = "none";
            }

        });

    }

    // =========================================
    // CLOSE MENUS WHEN CLICKING OUTSIDE
    // =========================================

    document.addEventListener("click", (e) => {
        // History menus are handled by their own outside-click listener above
        if (userMenuPanel &&
            !e.target.closest("#user-menu-panel") &&
            e.target !== userMenuPanel) {
            userMenuPanel.style.display = "none";
        }
    });

    // =========================================
    // PREVENT MENU CLOSE ON INSIDE CLICK
    // =========================================

    // Event delegation for dynamically created history action menus
    document.addEventListener("click", (e) => {
        if (e.target.closest(".history-action-menu")) {
            e.stopPropagation();
        }
    });

    if (userMenuPanel) {

        userMenuPanel.addEventListener("click", (e) => {

            e.stopPropagation();

        });

    }

    // =========================================
    // NEW CHAT BUTTON
    // =========================================

    if (newChatBtn && chatBox) {

        newChatBtn.addEventListener("click", () => {

            // Clear search inputs when creating new chat
            clearSearchInputs();

            // Use proper createNewChat() to generate unique ID and register in history
            const newChat = createNewChat();
            if (!newChat) {
                console.error("Failed to create new chat session");
                return;
            }

            // Clear chat box
            chatBox.innerHTML = "";

            // Show welcome message using current language (UI-only, not saved)
            const welcomeDiv = document.createElement("div");
            welcomeDiv.className = "message ai-message";
            const lang = I18n.getLanguage();
            const welcomeName = I18n.displayName(lang);
            welcomeDiv.textContent = I18n.t("welcome", { name: welcomeName }, lang);
            chatBox.appendChild(welcomeDiv);

            console.log("New chat started with ID:", currentChatId);

        });

    }

    // =========================================
    // BUY BOOK BUTTON
    // =========================================

    if (buyBookBtn) {

        buyBookBtn.addEventListener("click", () => {

            alert("Book Store Coming Soon 📚");

        });

    }

    // =========================================
    // BOOKS BUTTON
    // =========================================

    if (booksBtn) {

        booksBtn.addEventListener("click", () => {

            console.log("Books clicked");

        });

    }

});
// =========================================
// USER MENU DROPDOWN LOGIC
// =========================================

document.addEventListener("DOMContentLoaded", () => {

    const userMenuBtn =
        document.getElementById("user-menu-btn");

    const userMenuPanel =
        document.getElementById("user-menu-panel");

    // =========================================
    // TOGGLE USER MENU
    // =========================================

    if (userMenuBtn && userMenuPanel) {

        userMenuBtn.addEventListener("click", (e) => {

            e.stopPropagation();

            const isVisible =
                userMenuPanel.style.display === "block";

            userMenuPanel.style.display =
                isVisible ? "none" : "block";

        });

    }

    // =========================================
    // CLOSE WHEN CLICKING OUTSIDE
    // =========================================

    document.addEventListener("click", () => {

        if (userMenuPanel) {

            userMenuPanel.style.display = "none";

        }

    });

    // =========================================
    // PREVENT CLOSE ON INSIDE CLICK
    // =========================================

    if (userMenuPanel) {

        userMenuPanel.addEventListener("click", (e) => {

            e.stopPropagation();

        });

    }

});
// =========================================
// FINAL SAFETY CHECK HELPER
// =========================================

document.addEventListener("DOMContentLoaded", () => {
    const requiredIds = [
        "sidebar",
        "sidebar-toggle",
        "user-menu-btn",
        "user-menu-panel",
        "logout-btn",
        "language-select",
        "main-content",
        "login-screen",
        "chat-box",
        "user-input"
    ];

    requiredIds.forEach((id) => {
        const element = document.getElementById(id);

        if (!element) {
            console.warn(`Missing required element: #${id}`);
        }
    });

    console.log("Final safety check completed.");
});
// =========================================
// POWERFUL USER MENU DROPDOWN
// =========================================
document.addEventListener("DOMContentLoaded", () => {
    const userMenuBtn = document.getElementById("user-menu-btn");
    const userMenuPanel = document.getElementById("user-menu-panel");
    if (!userMenuBtn || !userMenuPanel) return;
    if (userMenuBtn.dataset.menuInit) return;
    userMenuBtn.dataset.menuInit = "true";
    userMenuBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        userMenuPanel.classList.toggle("user-menu-open");
    });
    userMenuPanel.addEventListener("click", (event) => {
        event.stopPropagation();
    });
    document.addEventListener("click", () => {
        userMenuPanel.classList.remove("user-menu-open");
    });
    const upgradeBtn = document.getElementById("upgrade-plan-btn");
    const profileBtn = document.getElementById("profile-btn");
    if (upgradeBtn) {
        upgradeBtn.addEventListener("click", () => {
            alert("Upgrade Plan feature will be added soon.");
        });
    }
});

// =========================================
// FINAL USER MENU + PROFILE MODAL SYSTEM
// =========================================

document.addEventListener("DOMContentLoaded", () => {

    // =====================================
    // ELEMENTS
    // =====================================

    const userMenuBtn =
        document.getElementById("user-menu-btn");

    const userMenuPanel =
        document.getElementById("user-menu-panel");

    const profileBtn =
        document.getElementById("profile-btn");

    const profileModal =
        document.getElementById("profile-modal");

    const profileCloseBtn =
        document.getElementById("profile-close-btn");

    const profilePhotoInput =
        document.getElementById("profile-photo-input");

    const profileAvatar =
        document.getElementById("profile-avatar");

    const sidebarInitial =
        document.getElementById("sidebar-user-initial");

    // =====================================
    // USER MENU OPEN
    // =====================================

    if (userMenuBtn && userMenuPanel) {

        userMenuBtn.addEventListener("click", (e) => {

            e.stopPropagation();

            userMenuPanel.classList.toggle(
                "user-menu-open"
            );

        });

    }

    // =====================================
    // PROFILE MODAL OPEN
    // =====================================

    if (profileBtn && profileModal) {

        profileBtn.addEventListener("click", (e) => {

            e.preventDefault();

            e.stopPropagation();

            profileModal.classList.add(
                "profile-open"
            );

            // close small dropdown

            if (userMenuPanel) {

                userMenuPanel.classList.remove(
                    "user-menu-open"
                );

            }

        });

    }

    // =====================================
    // CLOSE PROFILE MODAL
    // =====================================

    if (profileCloseBtn && profileModal) {

        profileCloseBtn.addEventListener("click", () => {

            profileModal.classList.remove(
                "profile-open"
            );

        });

    }

    // =====================================
    // OUTSIDE CLICK CLOSE
    // =====================================

    document.addEventListener("click", () => {

        if (userMenuPanel) {

            userMenuPanel.classList.remove(
                "user-menu-open"
            );

        }

    });

    // =====================================
    // PREVENT INSIDE CLOSE
    // =====================================

    if (userMenuPanel) {

        userMenuPanel.addEventListener("click", (e) => {

            e.stopPropagation();

        });

    }

    if (profileModal) {

        profileModal.addEventListener("click", (e) => {

            if (e.target === profileModal) {

                profileModal.classList.remove(
                    "profile-open"
                );

            }

        });

    }

    // =====================================
    // PROFILE PHOTO SYSTEM
    // =====================================

    const savedPhoto =
        localStorage.getItem("profilePhoto");

    if (savedPhoto) {

        if (profileAvatar) {

            profileAvatar.innerHTML =
                `<img src="${savedPhoto}" 
                style="
                width:100%;
                height:100%;
                object-fit:cover;
                border-radius:50%;
                ">`;

        }

        if (sidebarInitial) {

            sidebarInitial.innerHTML =
                `<img src="${savedPhoto}" 
                style="
                width:100%;
                height:100%;
                object-fit:cover;
                border-radius:50%;
                ">`;

        }

    }

    // =====================================
    // PHOTO UPLOAD
    // =====================================

    if (profilePhotoInput) {

        profilePhotoInput.addEventListener("change", () => {

            const file =
                profilePhotoInput.files[0];

            if (!file) return;

            const reader =
                new FileReader();

            reader.onload = () => {

                const imageData =
                    reader.result;

                localStorage.setItem(
                    "profilePhoto",
                    imageData
                );

                if (profileAvatar) {

                    profileAvatar.innerHTML =
                        `<img src="${imageData}" 
                        style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                        border-radius:50%;
                        ">`;

                }

                if (sidebarInitial) {

                    sidebarInitial.innerHTML =
                        `<img src="${imageData}" 
                        style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                        border-radius:50%;
                        ">`;

                }

            };

            reader.readAsDataURL(file);

        });

    }

});
// =========================================
// MOVE LANGUAGE SELECT INTO USER MENU
// =========================================

window.addEventListener("load", function () {

    const languageSelect =
        document.getElementById("language-select");

    const sidebarLanguageHolder =
        document.getElementById("sidebar-language-holder");

    if (
        languageSelect &&
        sidebarLanguageHolder &&
        !sidebarLanguageHolder.contains(languageSelect)
    ) {

        sidebarLanguageHolder.appendChild(
            languageSelect
        );

    }

});
// =========================================
// CLOSE HISTORY MENUS WHEN SIDEBAR CLOSES
// =========================================

(function () {
    const sidebar = document.getElementById("sidebar");

    if (!sidebar) return;

    // Instant-close all menus when sidebar is toggled closed via button
    const observer = new MutationObserver(() => {
        if (!sidebar.classList.contains("sidebar-open")) {
            closeAllHistoryMenusGlobal();
        }
    });

    observer.observe(sidebar, {
        attributes: true,
        attributeFilter: ["class"]
    });
})();
// =====================================================
// VOICE FEATURES
// 1. Mic Mode     — speech-to-text into input box
// 2. Listen       — female voice reads last AI message
// 3. Story Mode   — toggles story-style answer prompt
// 4. Suggestion   — toggles deep moral explanation mode
// =====================================================

(function () {
    // ---------- STATE ----------
    let micActive        = false;
    let storyModeOn      = false;
    let suggestionModeOn = false;
    let recognition      = null;
    let synth            = window.speechSynthesis;

    // ---------- HELPERS ----------

    function getFemaleVoice() {
        const voices = synth.getVoices();
        // Prefer a named female English voice
        const preferred = voices.find(v =>
            /female|woman|zira|susan|samantha|victoria|karen|moira|veena/i.test(v.name)
        );
        if (preferred) return preferred;
        // Fallback: first en voice
        return voices.find(v => v.lang.startsWith("en")) || voices[0] || null;
    }

    function speak(text) {
        if (!synth) return;
        synth.cancel();
        const utter  = new SpeechSynthesisUtterance(text);
        utter.rate   = 0.92;
        utter.pitch  = 1.15;
        utter.volume = 1;
        const voice  = getFemaleVoice();
        if (voice) utter.voice = voice;
        synth.speak(utter);
    }

    function getLastAIMessage() {
        const messages = document.querySelectorAll(".ai-message");
        if (!messages.length) return null;
        return messages[messages.length - 1].textContent.trim();
    }

    function setButtonActive(btn, active) {
        if (!btn) return;
        if (active) {
            btn.classList.add("voice-btn-active");
            btn.style.opacity = "1";
            btn.style.filter  = "drop-shadow(0 0 6px #ffd700)";
        } else {
            btn.classList.remove("voice-btn-active");
            btn.style.opacity = "";
            btn.style.filter  = "";
        }
    }

    // ---------- MIC MODE — Speech to Text ----------

    function initMicMode() {
        const micBtn = document.getElementById("mic-btn");
        if (!micBtn) return;

        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            micBtn.title = "Speech recognition not supported in this browser";
            micBtn.style.opacity = "0.4";
            return;
        }

        recognition              = new SpeechRecognition();
        recognition.continuous   = false;
        recognition.interimResults = false;
        // Language set dynamically from selected UI language
        function getMicLang() {
            var lang = (typeof I18n !== "undefined") ? I18n.getLanguage() : "en";
            if (lang === "gu") return "gu-IN";
            if (lang === "hi") return "hi-IN";
            return "en-US";
        }
        recognition.lang = getMicLang();

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const input = document.getElementById("user-input");
            if (input) {
                input.value += (input.value ? " " : "") + transcript;
                input.focus();
            }
            micActive = false;
            setButtonActive(micBtn, false);
        };

        recognition.onerror = () => {
            micActive = false;
            setButtonActive(micBtn, false);
        };

        recognition.onend = () => {
            if (micActive) {
                // If still active, re-start (user held mic on)
                try { recognition.start(); } catch (e) { /* ignore */ }
            }
        };

        micBtn.addEventListener("click", () => {
            // Update lang every click so language change takes effect
            recognition.lang = getMicLang();
            if (!micActive) {
                micActive = true;
                setButtonActive(micBtn, true);
                micBtn.textContent = (typeof I18n !== "undefined") ? I18n.t("micModeOn") : "🎤 Mode: On";
                micBtn.style.background = "linear-gradient(135deg, #e74c3c, #c0392b)";
                try { recognition.start(); } catch (e) {
                    micActive = false;
                    setButtonActive(micBtn, false);
                    micBtn.textContent = (typeof I18n !== "undefined") ? I18n.t("micModeOff") : "🎤 Mode: Off";
                    micBtn.style.background = "";
                }
            } else {
                micActive = false;
                setButtonActive(micBtn, false);
                micBtn.textContent = (typeof I18n !== "undefined") ? I18n.t("micModeOff") : "🎤 Mode: Off";
                micBtn.style.background = "";
                try { recognition.stop(); } catch (e) { /* ignore */ }
            }
        });

        recognition.addEventListener("end", () => {
            if (!micActive) {
                micBtn.textContent = (typeof I18n !== "undefined") ? I18n.t("micModeOff") : "🎤 Mode: Off";
                micBtn.style.background = "";
                setButtonActive(micBtn, false);
            }
        });
    }

    // ---------- LISTEN — Read Last AI Message ----------

    function initListenMode() {
        const listenBtn = document.getElementById("speak-btn") || document.getElementById("listen-btn");
        if (!listenBtn) return;

        if (!synth) {
            listenBtn.title   = "Speech synthesis not supported";
            listenBtn.style.opacity = "0.4";
            return;
        }

        // Ensure voices are loaded
        if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = () => {};
        }

        listenBtn.addEventListener("click", () => {
            if (synth.speaking) {
                synth.cancel();
                setButtonActive(listenBtn, false);
                return;
            }
            const text = getLastAIMessage();
            if (!text) return;
            setButtonActive(listenBtn, true);
            speak(text);

            // Reset button when done
            const check = setInterval(() => {
                if (!synth.speaking) {
                    setButtonActive(listenBtn, false);
                    clearInterval(check);
                }
            }, 500);
        });
    }

    // ---------- STORY MODE — Story-style answers ----------

    function initStoryMode() {
        const storyBtn = document.getElementById("send-story-btn") || document.getElementById("story-btn");
        if (!storyBtn) return;

        storyBtn.addEventListener("click", () => {
            storyModeOn = !storyModeOn;
            setButtonActive(storyBtn, storyModeOn);
            // Expose flag globally so sendMessage() can read it
            window.voiceStoryMode = storyModeOn;
            console.log("Story mode:", storyModeOn ? "ON" : "OFF");
        });
    }

    // ---------- SUGGESTION MODE — Deep moral explanation ----------

    function initSuggestionMode() {
        const suggestionBtn = document.getElementById("send-suggestion-btn") || document.getElementById("suggestion-btn");
        if (!suggestionBtn) return;

        suggestionBtn.addEventListener("click", () => {
            suggestionModeOn = !suggestionModeOn;
            setButtonActive(suggestionBtn, suggestionModeOn);
            // Expose flag globally so sendMessage() can read it
            window.voiceSuggestionMode = suggestionModeOn;
            console.log("Suggestion mode:", suggestionModeOn ? "ON" : "OFF");
        });
    }

    // ---------- INIT ON DOM READY ----------

    function init() {
        initMicMode();
        initListenMode();
        initStoryMode();
        initSuggestionMode();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();

// =====================================================
// AUTO-SCROLL: Always scroll to latest message
// =====================================================
(function() {
    // Wait for DOM before attaching observer
    function attachAutoScroll() {
        const chatBox = document.getElementById("chat-box");
        if (!chatBox) return;

        const observer = new MutationObserver(() => {
            // Always scroll to bottom on any chat content change
            chatBox.scrollTop = chatBox.scrollHeight;
        });

        observer.observe(chatBox, { childList: true, subtree: true });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", attachAutoScroll);
    } else {
        attachAutoScroll();
    }
})();