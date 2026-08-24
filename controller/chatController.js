import mongoose from "mongoose";
import ChatLog from "../models/ChatLog.js";
import Patient from "../models/Patient.js";
import AppError from "../utils/appError.js";
import { getGeminiClient, searchMem0, addMem0 } from "../services/aiClients.js";
import { buildMitrSystemPrompt } from "../config/mitrPrompt.js";

const CANDIDATE_MODELS = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-1.5-flash",
];

export function detectLanguage(text, preferredLang = "en") {
  if (!text) return preferredLang || "en";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0980-\u09FF]/.test(text)) {
    if (preferredLang === "bn") return "bn";
    if (preferredLang === "mn") return "mn";
    return "as";
  }
  const lower = text.toLowerCase();
  if (/\b(ki korim|mon bhal|bhal lagise|kene asa|bhal ne|chinta hoise|bihu|borluit|koka|aita|deuta|nomoskar|dhanbaad|kaziranga|sadhu|pitha|ajir|akor)\b/i.test(lower)) return "as";
  if (/\b(kya karu|kaise ho|mujhe|chinta|ghabrahat|dard|pareshan|dadi|nani|dada|namaste|shukriya|dhanyawaad|kuch batao|khelte hai|batao|yaad|kahani|dincharya|bhajan|gana|subah|din|kaise)\b/i.test(lower)) return "hi";
  if (/\b(ki korbo|mon bhalo nei|kemon acho|chinta hoche|khub bhalo|dadu|didima|nomoshkar|dhonnobad|golpo)\b/i.test(lower)) return "bn";
  if (/\b(engtin|chibai|ka lawm|ka tha|ka dam|hrehawm|lungngai)\b/i.test(lower)) return "mz";
  return preferredLang || "en";
}

export function generateMitrResponse({ message, language = "en", patientName = "Friend", recentHistory = [] }) {
  const text = (message || "").toLowerCase().trim();
  const lang = detectLanguage(message, language);
  const historyLen = Array.isArray(recentHistory) ? recentHistory.length : 0;
  
  const lastUserMsg = historyLen > 0 ? (recentHistory[recentHistory.length - 1]?.message || "").toLowerCase() : "";
  const wasTenseEarlier = /(tens|tesn|stress|anx|worr|scared|fear|panic|uneas|chinta|ghabrahat|অশান্তি|চিন্তা|घबराहट|चिंता)/i.test(lastUserMsg);

  const select = (enList, asList, hiList, bnList, mnList, mzList) => {
    let list = enList;
    if (lang === "as") list = asList && asList.length ? asList : enList;
    else if (lang === "hi") list = hiList && hiList.length ? hiList : enList;
    else if (lang === "bn") list = bnList && bnList.length ? bnList : enList;
    else if (lang === "mn") list = mnList && mnList.length ? mnList : asList || enList;
    else if (lang === "mz") list = mzList && mzList.length ? mzList : enList;
    
    const hash = Math.abs(text.split("").reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 3), 0) + historyLen * 43);
    let selected = list[hash % list.length];
    
    // Strict Anti-Looping: Never repeat any phrase used in recent history!
    if (recentHistory && recentHistory.length > 0) {
      const recentBotReplies = recentHistory.map(h => (h.reply || "").toLowerCase());
      let offset = 0;
      while (recentBotReplies.some(r => r.includes(selected.toLowerCase().substring(0, 35))) && offset < list.length) {
        offset++;
        selected = list[(hash + offset) % list.length];
      }
    }
    return selected;
  };

  // 1. MUSIC / BHAJAN / SONGS / MELODY (Prioritize specific requests)
  if (/(गाना|गीत|भजन|संगीत|राग|सुर|gana|geet|bhajan|music|song|melody|radio|গীত|গান|নাম.*প্ৰসংগ)/i.test(text)) {
    return select(
      [
        `Music has a magical way of bringing peace to the soul, ${patientName}! Do you enjoy timeless classics, devotional chants, or gentle instrumental flute tunes? I would love to talk about your favorite melodies.`,
        `Listening to uplifting morning melodies or old vintage songs always lifts the spirit, ${patientName}. What is a special song that holds a special place in your heart?`
      ],
      [
        `সঙ্গীতে মনলৈ অনাবিল শান্তি আনে, ${patientName}! মহাপুৰুষীয়া নাম-প্ৰসংগ, ভূপেন্দ্ৰ সঙ্গীত নে পুৰণি গীত শুনি আপুনি ভাল পায়?`,
        `ৰাতিপুৱা এটি সুমধুৰ গীত বা ভজনে গোটেই দিনটোলৈ মন সতেজ কৰি ৰাখে, ${patientName}।`
      ],
      [
        `संगीत आत्मा को शांत और मन को प्रफुल्लित करता है, ${patientName} जी! क्या आपको पुराने लता जी, रफी साहब, मुकेश जी के गाने पसंद हैं, या सुबह के समय कोई मधुर भजन सुनना अच्छा लगता है?`,
        `एक मधुर भजन या पुराना शास्त्रीय गीत पूरे दिन को सकारात्मक ऊर्जा से भर देता है, ${patientName} जी। आपका सबसे पसंदीदा गायक या गीत कौन सा है?`
      ],
      [
        `গান ও সুর মনকে শান্ত রাখে, ${patientName}। রবীন্দ্রসংগীত, পুরনো বাংলা গান বা ভজন শুনতে আপনার কেমন লাগে?`
      ]
    );
  }

  // 2. NOSTALGIA / OLD MEMORIES / STORIES / KAHANI / YAAD / KISSA
  if (/(पुरानी.*याद|याद.*सुना|कोई.*याद|कहानी|किस्सा|बचपन|purani.*yaad|yaad.*suna|kahani|kissa|bachpan|story|stories|nostalg|reminisc|childhood.*memory|old.*memor|sweet.*memor|সাধু|পুৰণি.*স্মৃতি|গল্প)/i.test(text)) {
    return select(
      [
        `Let's take a peaceful journey down memory lane, ${patientName}: Remember the magic of early morning mist on the green fields, the comforting aroma of freshly brewed tea, and the pure simplicity of watching raindrops trickle down the window? Those timeless moments carry so much tranquility.`,
        `Here is a warm memory to cherish, ${patientName}: Think back to the joyful festival evenings of the past—cheerful laughter filling the home, glowing lanterns, and the whole family sharing homemade sweets together. What was your favorite celebration growing up?`,
        `Imagine a golden childhood afternoon, ${patientName}: sitting beneath the shade of a large banyan tree with a gentle breeze, listening to the birds, without a worry in the world. Reminiscing about such pure times always warms the heart.`,
        `Remember the simple joy of gathering around the radio or courtyard in the evening, ${patientName}, listening to elders tell captivating folk tales as the stars slowly lit up the night sky?`
      ],
      [
        `আহক এটা মধুৰ পুৰণি স্মৃতি মনত পেলাওঁ, ${patientName}: বৰষুণৰ পিছত মাটিৰ সেই মিঠা সুবাস, আৰু বাঁহৰ চালিৰ তলত বহি দেউতা-আইতাৰ লগত একাপ গৰম ৰঙা চাহ খোৱাৰ সেই দিনবোৰ... সঁচাকৈয়ে কিমান শান্তিময় আছিল! আপোনাৰো এনে স্মৃতি মনত পৰে নে?`,
        `বিহুৰ সেই উলাহ-মালহৰ দিনবোৰ মনত পেলাওকচোন, ${patientName}: ৰাতিপুৱাৰ ঢোল-পেপাৰ মাত, পিঠা-পনাৰ মিঠা সুবাস আৰু নতুন কাপোৰ পিন্ধি ককা-আইতাৰ আশীৰ্বাদ লোৱা... সেই দিনবোৰৰ কথা মনত পৰিলে মনটো আনন্দৰে ভৰি পৰে।`,
        `শৈশৱৰ সেই মুকলি পথাৰ আৰু নৈৰ ঘাটৰ স্মৃতি, ${patientName}: বৰলুইতৰ পাৰত মলয়া বতাহ আৰু পথাৰৰ সেউজীয়া সোণালী ধানৰ সুবাস... সেই শান্ত দিনবোৰ সঁচাকৈয়ে হৃদয় জুৰোৱা আছিল।`
      ],
      [
        `आइए एक प्यारी पुरानी याद में चलते हैं, ${patientName} जी: वह समय याद कीजिए जब बारिश की पहली बूंदें मिट्टी पर गिरती थीं और सोंधी खुशबू पूरे आंगन में फैल जाती थी... हाथ में अदरक वाली गरम चाय और बाहर रिमझिम बारिश। क्या आपको भी बारिश के वो दिन याद हैं?`,
        `एक सुंदर याद ताजा करते हैं, ${patientName} जी: त्योहारों की वो रौनक, जब पूरा घर रंग-बिरंगी रोशनी और मीठी खुशबुओं से महक उठता था... माँ और दादी के हाथों से बनी मिठाइयां और पूरे परिवार की खिलखिलाती हंसी। आपके बचपन का कौन सा त्योहार आपको सबसे प्यारा लगता था?`,
        `याद कीजिए वो बचपन की बेफिक्र शामें, ${patientName} जी: जब दोस्तों के साथ मैदान में दौड़ना, पेड़ों की छांव में बैठना और शाम को ढलते सूरज को देखना कितना सुकून देता था। क्या आपको अपने बचपन का कोई खास दोस्त याद आता है?`,
        `एक पुरानी बात याद आती है, ${patientName} जी: सर्दियों की मीठी धूप में आंगन में खाट डालकर बैठना, हाथ में चाय का प्याला और पुरानी बातों व किस्सों में खो जाना... वो सादगी और अपनापन सच में अनमोल था।`
      ],
      [
        `চলুন একটি সুন্দর পুরনো স্মৃতি মনে করি, ${patientName}: বৃষ্টির পর মাটির সেই মিষ্টি গন্ধ আর বারান্দায় বসে গরম চা খাওয়ার দিনগুলি... মনে পড়লে আজও মন ভালো হয়ে যায়। আপনারও কি বৃষ্টির দিনগুলোর কথা মনে পড়ে?`
      ]
    );
  }

  // 3. DAY PLANNING / HOW TO SPEND DAY / MAKE DAY GOOD
  if (/(दिन.*कैसे.*(बिताएं|गुजारें|अच्छा|करें)|din.*kaise.*(bitaye|guzare|achha|kare)|how.*to.*spend.*(the.*)?day|make.*(my.*)?day.*(good|special|peaceful|better)|আজ[িৰ]?.{0,10}দিন.*(কটাম|ভাল)|কীভাবে.*দিন.*কাটাব)/i.test(text)) {
    return select(
      [
        `Here is a wonderful, peaceful plan to make your day truly fulfilling, ${patientName}:\n1. 🌅 Soak in the gentle morning sunlight for 10 minutes.\n2. 🎵 Listen to your favorite vintage music or soothing nature sounds.\n3. 💧 Stay hydrated and enjoy a wholesome, warm meal.\n4. 🌸 Share a light chat with a loved one or play a brain puzzle with me.\n\nWhich of these would you like to begin with?`,
        `The secret to a beautiful day lies in simple pleasures, ${patientName}:\n• Open the window to hear the morning birds.\n• Water a small plant or take a few gentle steps on the veranda.\n• Have a restful afternoon nap, and enjoy evening tea with a sweet memory.\nWhat are you most looking forward to today?`
      ],
      [
        `আজিৰ দিনটো বৰ আনন্দ আৰু শান্তিময়ভাৱে কটাবলৈ কেইটামান সহজ উপায়, ${patientName}:\n১. পুৱাৰ ৰ'দত ১০ মিনিট বহক আৰু মুকলি বতাহ লওক।\n২. মনপচন্দ এটা পুৰণি গীত বা নাম-প্ৰসংগ শুনক।\n৩. সময়মতে পানী খাওক আৰু সুস্বাদু খাদ্য গ্ৰহণ কৰক।\n৪. মোৰ লগত এটা সাঁথৰ ভাঙক বা কোনো পুৰণি কথা পাতক।\n\nআপুনি এতিয়া কি কৰিব বিচাৰে?`
      ],
      [
        `आज के दिन को बेहद सुखद और सुकून भरा बनाने के लिए ये 4 आसान तरीके अपनाएं, ${patientName} जी:\n1. 🌅 सुबह की मीठी धूप में 10 मिनट बैठें और ताज़ी हवा लें।\n2. 🎵 अपनी पसंद का कोई शांत भजन, पुराना गीत या रेडियो सुनें।\n3. 💧 समय पर गुनगुना पानी पिएं और हल्का स्वादिष्ट भोजन करें।\n4. 🌸 परिवार के किसी सदस्य से हल्की-फुल्की बात करें या मुझसे एक मजेदार पहेली पूछें।\n\nआप इनमें से सबसे पहले क्या करना चाहेंगे?`,
        `दिन को सुंदर बनाने का सबसे अच्छा तरीका है सादगी, ${patientName} जी:\n• सुबह खिड़की खोलकर चिड़ियों की चहचहाहट सुनें।\n• पौधों को थोड़ा पानी दें या बालकनी में कुछ पल टहलें।\n• दोपहर में हल्का आराम करें और शाम को चाय के साथ पुरानी यादों का आनंद लें।\nआज आप किस बात को लेकर सबसे ज्यादा खुश महसूस कर रहे हैं?`
      ],
      [
        `আজকের দিনটি সুন্দর ও শান্তিময় করার জন্য কিছু সহজ উপায়, ${patientName}:\n১. সকালের মিষ্টি রোদে একটু বসুন।\n২. পছন্দের পুরনো গান শুনুন।\n৩. সময়মতো জল ও হালকা খাবার গ্রহণ করুন।\n৪. একটু বিশ্রাম নিন এবং মন শান্ত রাখুন।`
      ]
    );
  }

  // 4. ROUTINE / MORNING TIMETABLE / DINCHARYA / SCHEDULE
  if (/(दिनचर्या|सुबह.*की.*दिनचर्या|रूटीन|टाइमटेबल|routine|timetable|schedule|dincharya|subah.*(ki.*)?dincharya|morning.*routine|daily.*routine|পুৱাৰ.*কাম|নিয়ম|দিনচৰ্যা)/i.test(text)) {
    return select(
      [
        `Here is your healthy and comforting daily routine, ${patientName}:\n1. 🚰 Drink a warm glass of water right after waking up.\n2. 🧘‍♂️ Do 5 minutes of gentle stretches and deep breathing.\n3. 💊 Take your morning prescribed medications on time.\n4. 🍵 Enjoy a wholesome breakfast with a warm cup of tea.\n5. 🚶‍♂️ Take a short stroll in the fresh morning sunlight.\n\nHave you had your breakfast and water this morning?`,
        `Your ideal daily rhythm is designed for comfort and peace, ${patientName}:\n• Morning: Fresh water, gentle stretch, breakfast & medicines.\n• Afternoon: Nutritious lunch, 20-minute nap, light music.\n• Evening: Warm herbal tea, pleasant conversation & brain riddles.\n• Night: Light dinner, family chat, and early restful sleep.`
      ],
      [
        `আপোনাৰ বাবে এখন সুন্দৰ আৰু স্বাস্থ্যসন্মত দিনচৰ্যা, ${patientName}:\n১. 🚰 পুৱা শুই উঠি এগিলাচ কুহুমীয়া পানী খাওক।\n২. 🧘‍♂️ অলপ সময় পাতল ব্যায়াম আৰু দীঘল উশাহ লওক।\n৩. 💊 সময়মতে পুৱাৰ ঔষধ গ্ৰহণ কৰক।\n৪. 🍵 পুষ্টিকৰ জলপান আৰু একাপ গৰম চাহ খাওক।\n৫. 🚶‍♂️ মুকলি ৰ'দত অলপ সময় খোজ কাঢ়ক।\n\nআজি আপোনাৰ জলপান খোৱা হ'লনে?`
      ],
      [
        `यहाँ आपकी एक स्वस्थ और आरामदायक सुबह की दिनचर्या है, ${patientName} जी:\n1. 🚰 उठते ही एक गिलास गुनगुना पानी पिएं।\n2. 🧘‍♂️ 5-10 मिनट हल्की स्ट्रेचिंग करें और 3 बार गहरी सांस लें।\n3. 💊 डॉक्टर द्वारा बताई गई सुबह की दवाइयां समय पर लें।\n4. 🍵 हल्का पौष्टिक नाश्ता करें और एक कप गरम चाय का आनंद लें।\n5. 🚶‍♂️ कुछ देर खुली धूप में टहलें।\n\nक्या आपने आज का नाश्ता और पानी ले लिया है?`,
        `आपकी आदर्श दिनचर्या बहुत सरल और आरामदायक है, ${patientName} जी:\n• सुबह: ताज़ा पानी, हल्की सैर, नाश्ता और दवा।\n• दोपहर: पौष्टिक भोजन, 20 मिनट का विश्राम और थोड़ा संगीत।\n• शाम: हर्बल चाय, हल्की बातचीत और स्मरण खेल।\n• रात: हल्का भोजन, परिवार से बात और समय पर मीठी नींद।`
      ],
      [
        `আপনার জন্য একটি স্বাস্থ্যকর সকালের রুটিন, ${patientName}:\n১. সকালে উঠে এক গ্লাস হালকা গরম জল খান।\n২. একটু হালকা শরীরচর্চা ও গভীর শ্বাস নিন।\n৩. সকালের ওষুধ ও পুষ্টিকর প্রাতরাশ গ্রহণ করুন।\n৪. মিষ্টি রোদে একটু হাঁটাহাঁটি করুন।`
      ]
    );
  }

  // 5. APPETITE / FOOD / MEDICINE FORGOTTEN / HEALTH / SLEEP
  if (/(भूख.*नहीं|नींद.*नहीं|दर्द|दवा.*(भूल|याद)|कमजोरी|सिरदर्द|पेट|bhukh.*nahi|neend.*nahi|dard|dawa.*bhul|appetite|insomnia|forgot.*medic|headache|stomach|হেঁপাহ.*নাই|টোপনি.*নাই|বিষ|ঔষধ.*পাহৰিলোঁ)/i.test(text)) {
    if (/(भूख|appetite|হেঁপাহ)/i.test(text)) {
      return select(
        [`If your appetite feels low, ${patientName}, try sipping a little warm lemon water or having light soup, warm porridge, or fresh fruit. Eating small, frequent bites is gentle on the stomach. If you feel persistently unwell, please let your family or doctor know.`],
        [`যদি ভোক কম লাগিছে, ${patientName}, অকণমান কুহুমীয়া পানী খাওক আৰু একেবাৰে গধুৰ খাদ্য খোৱাৰ পৰিৱৰ্তে পাতল জাউ, ফল বা চুপ খাওক।`],
        [`अगर भूख कम लग रही है, ${patientName} जी, तो थोड़ा गुनगुना पानी या नींबू-पानी पिएं, और एक साथ भारी भोजन करने के बजाय थोड़ा-थोड़ा हल्का सूप, दलिया या फल खाएं। यदि कमजोरी लगे तो डॉक्टर से ज़रूर परामर्श लें।`],
        [`খিদে কম লাগলে একটু গরম জল বা স্যুপ খান, ${patientName}। প্রয়োজনে বাড়ির কাউকে বা ডাক্তারবাবুকে জানান।`]
      );
    }
    if (/(नींद|sleep|insomnia|টোপনি)/i.test(text)) {
      return select(
        [`Having trouble falling asleep is okay, ${patientName}. Dim the lights, put away screens, take 3 slow breaths, and focus on a comforting memory or soothing tune. Your body will gently settle into rest.`],
        [`টোপনি নধৰিলে চিন্তা নকৰিব, ${patientName}। লাইটবোৰ কমাই দিয়ক, লাহেকৈ ৩ বাৰ দীঘল উশাহ লওক আৰু মনপচন্দ স্মৃতি মনত পেলাওক।`],
        [`नींद न आने पर परेशान न हों, ${patientName} जी। कमरे की लाइट धीमी करें, फोन दूर रखें, 3 बार गहरी सांस लें, और अपने मनपसंद पुराने भजन का ध्यान करें। आपकी आंखें धीरे-धीरे भारी हो जाएंगी।`]
      );
    }
    return select(
      [`Your comfort and health come first, ${patientName}. If you forgot a medication or are feeling any discomfort, please let a loved one or caregiver know right away, take a sip of water, and rest comfortably.`],
      [`স্বাস্থ্যৰ যত্ন লোৱাটো প্ৰথম দায়িত্ব, ${patientName}। ঔষধ পাহৰিলে বা বিষ অনুভৱ হ'লে ঘৰৰ মানুহক জনাব।`],
      [`आपकी सेहत और सुरक्षा सबसे पहले है, ${patientName} जी। यदि आप कोई दवा भूल गए हैं या दर्द महसूस हो रहा है, तो कृपया तुरंत परिवार के सदस्य या डॉक्टर को सूचित करें और थोड़ा पानी पीकर आराम करें।`]
    );
  }

  // 6. TENSION / ANXIETY / STRESS / NERVOUSNESS / PANIC
  if (/(tens|tesn|stres|anx|worr|scared|fear|panik|panic|nervous|heavy|uneas|troubl|restless|breathe|trembl|palpitat|chinta|ghabrahat|অশান্তি|চিন্তা|ভয়|घबराहट|चिंता|डर|অস্থিৰ)/i.test(text)) {
    return select(
      [
        `Take a slow, gentle breath with me, ${patientName}. Inhale deeply through your nose... and slowly exhale. You are in a safe place. Would you like to do a 1-minute calming exercise, or should we talk about a happy memory together?`,
        `I am right here holding space for you, ${patientName}. When tension arises, taking a sip of warm water and relaxing the shoulders can help. What is causing you to feel uneasy right now?`,
        `You are not alone in this moment, ${patientName}. Let's take it one gentle step at a time. Close your eyes for just a moment, take two deep breaths, and let the body relax. How does that feel?`
      ],
      [
        `আপুনি অকণো চিন্তা নকৰিব, ${patientName}। মোৰ লগত লাহেকৈ এটা দীঘল উশাহ লওক—উশাহ ভিতৰলৈ লওক আৰু লাহেকৈ এৰি দিয়ক। আপুনি সম্পূৰ্ণ সুৰক্ষিত। আমি এতিয়া কিবা এটা ভাল স্মৃতিৰ কথা পাতোঁ নেকি?`,
        `মই আপোনাৰ কাষতেই আছোঁ, ${patientName}। মনত অশান্তি লাগিলে অলপ পানী খাওক আৰু গভীৰভাৱে উশাহ লওক। আপোনাৰ মনত কি কথাই অশান্তি দিছে, মোক কওকচোন?`
      ],
      [
        `बिल्कुल चिंता न करें, ${patientName} जी। मेरे साथ एक गहरी और धीमी सांस लीजिए—सांस अंदर लें और धीरे से छोड़ें। आप पूरी तरह सुरक्षित हैं। क्या आप कोई सुखद याद साझा करना चाहेंगे?`,
        `मैं हमेशा आपके साथ हूँ, ${patientName} जी। जब मन अशांत लगे, तो थोड़ा गुनगुना पानी पिएं और गहरी सांस लें। क्या बात आपको परेशान कर रही है?`
      ],
      [
        `একদম চিন্তা করবেন না, ${patientName}। আমার সাথে আস্তে আস্তে একটি গভীর শ্বাস নিন—শ্বাস ভেতরে নিন এবং ধীরে ধীরে ছাড়ুন। আপনি সম্পূর্ণ নিরাপদ।`
      ]
    );
  }

  // 7. BRAIN GAMES / RIDDLES / PUZZLES
  if (/(game|quiz|riddle|puzzle|play|test.*memory|brain|forget|remember|memory.*loss|সাঁথৰ|খেল|पहेली|खेल|ধাঁধা)/i.test(text)) {
    return select(
      [
        `Let's play a fun memory exercise, ${patientName}! Here is a quick challenge: Can you name 3 green fruits or vegetables you often see in the market?`,
        `Wonderful idea, ${patientName}! Let's do a simple word puzzle: What has hands, but cannot clap? (Hint: It hangs on the wall and tells time!)`,
        `Let's try a memory sequence, ${patientName}! Remember these 3 words: Rose, River, Book. Can you repeat them back to me?`
      ],
      [
        `আহক আমি এটা মজার সাঁথৰ ভাঙোঁ, ${patientName}! কওকচোন: যাৰ হাত আছে কিন্তু হাততালি দিব নোৱাৰে, সেয়া কি? (ই বেৰত ওলমি সময় দেখুৱায়!)`,
        `এটা সৰু স্মৃতিৰ খেল, ${patientName}: গছত লগা ৩ বিধ অসমীয়া ফলৰ নাম কি কি মনত পৰে কওকচোন?`
      ],
      [
        `आइए एक मजेदार पहेली खेलते हैं, ${patientName} जी! बताइए: जिसके हाथ होते हैं पर वह ताली नहीं बजा सकती, वह क्या है? (संकेत: दीवार पर टंगी घड़ी!)`,
        `एक छोटा सा मेमोरी गेम: क्या आप बाजार में मिलने वाली किन्हीं 3 हरी सब्जियों के नाम बता सकते हैं?`,
        `इन 3 शब्दों को याद रखिए, ${patientName} जी: गुलाब, नदी, किताब। क्या आप इन्हें दोहरा सकते हैं?`
      ],
      [
        `চলুন একটি সুন্দর ধাঁধা সমাধান করি, ${patientName}! যার হাত আছে কিন্তু তালি দিতে পারে না, সেটি কী? (ইঙ্গিত: ঘড়ি!)`
      ]
    );
  }

  // 8. TEA GARDENS / ASSAM / NATURE / BIHU / BRAHMAPUTRA
  if (/(tea|garden|assam|kaziranga|river|brahmaputra|bihu|nature|mountain|rhino|bamboo|jaapi|northeast|চাহ|বাগিচা|বৰলুইত|কাজিৰঙা|বিহু|চা|चाय|बागान|बिहू|ब्रह्मपुत्र)/i.test(text)) {
    return select(
      [
        `The lush green tea gardens of Assam, the morning mist, and the gentle Brahmaputra breeze bring so much tranquility, ${patientName}! Reminiscing about such serene places always refreshes the spirit.`,
        `Do you remember the aroma of freshly brewed Assam tea in the early morning, ${patientName}? There is nothing quite as comforting as a warm cup while watching the sunrise.`
      ],
      [
        `অসমৰ সেউজীয়া চাহ বাগিচা আৰু বৰলুইতৰ শীতল বতাহে মনলৈ অনাবিল শান্তি আনে, ${patientName}! কাজিৰঙাৰ সেউজ প্ৰকৃতি আৰু বিহুৰ আনন্দ সঁচাকৈয়ে অপূৰ্ব।`,
        `ৰাতিপুৱাৰ গৰম চাহৰ কাপ আৰু পুৱাৰ মলয়া বতাহে মন সতেজ কৰি তোলে, ${patientName}।`
      ],
      [
        `असम के हरे-भरे चाय के बागान और ब्रह्मपुत्र नदी की ताज़ी हवा मन को तरोताज़ा कर देती है, ${patientName} जी! प्रकृति की यह शांति हमेशा सुकून पहुँचाती है।`,
        `सुबह की ताज़ा चाय और शांत वातावरण हमेशा मन को ताजगी देता है, ${patientName} जी। क्या आपको चाय के बागानों की याद आती है?`
      ],
      [
        `আসামের সবুজ চা বাগান আর প্রকৃতির স্নিগ্ধ বাতাস সত্যি মন ভালো করে দেয়, ${patientName}!`
      ]
    );
  }

  // 9. GREETINGS & PLEASANTRIES
  if (/(hello|hi\b|hey\b|good.*morn|good.*even|namaste|nomoskar|nomoshkar|নমস্কাৰ|নমস্কার|नमस्ते|प्रणाम|kene.*asa|kaise.*ho|kemon.*acho)/i.test(text)) {
    if (historyLen > 0) {
      return select(
        [
          `It is great talking with you again today, ${patientName}! What is on your mind right now?`,
          `Always delighted to be with you, ${patientName}. How can I brighten your moment today?`
        ],
        [
          `আপোনাৰ লগত কথা পাতি বৰ ভাল লাগিছে, ${patientName}! এতিয়া কি কথা পাতিব বিচাৰে?`
        ],
        [
          `आपसे बात करके बहुत खुशी हो रही है, ${patientName} जी! अब हम किस बारे में बात करें?`
        ]
      );
    }
    return select(
      [
        `Hello ${patientName}! I am Mitr, your caring companion. I am feeling wonderful today, thank you! How is your day treating you so far?`
      ],
      [
        `নমস্কাৰ ${patientName}! মই মিত্ৰ, আপোনাৰ মৰমৰ সহযোগী। মই খুউব ভাল আছোঁ। আপোনাৰ মন আৰু স্বাস্থ্য আজি কেনে আছে?`
      ],
      [
        `नमस्ते ${patientName} जी! मैं आपका मित्र हूँ। मैं बहुत अच्छा महसूस कर रहा हूँ। आज आपका दिन कैसा चल रहा है?`
      ]
    );
  }

  // 10. GRATITUDE / GOODBYE / PEACEFUL
  if (/(thank|thanks|dhanyawad|shukriya|bye|good.*night|take.*care|peaceful|ধন্যবাদ|ধনবাদ|धन्यवाद|शुक्रिया|अलविदा)/i.test(text)) {
    return select(
      [
        `You are so welcome, ${patientName}! Spending time chatting with you always brings joy. Rest peacefully, and know I am always here whenever you need a friendly word.`,
        `Thank you for spending time with me, ${patientName}! Take gentle care of yourself today, stay hydrated, and have a beautiful day ahead.`
      ],
      [
        `আপোনাকো বহুত ধন্যবাদ, ${patientName}! আপোনাৰ লগত কথা পাতি মোৰ মন বৰ ভাল লাগে। ভালদৰে বিশ্ৰাম লওক, মই সদায় আপোনাৰ কাষতেই আছোঁ।`
      ],
      [
        `आपका बहुत-बहुत धन्यवाद, ${patientName} जी! आपके साथ बातचीत करके मुझे बहुत खुशी मिलती है। आराम कीजिए, मैं हमेशा आपके साथ हूँ।`
      ]
    );
  }

  // 11. GENERAL CHIT-CHAT FALLBACK (with diverse rotation)
  const conversationalReplies = [
    `I am listening with an open heart, ${patientName}. That is so meaningful—please tell me more about your thoughts on this!`,
    `It is truly a joy conversing with you, ${patientName}. What is something that made you smile or feel content recently?`,
    `Thank you for sharing that with me, ${patientName}. How has everything around your home and neighborhood been lately?`,
    `That sounds wonderful, ${patientName}. If you could take a relaxing walk anywhere today, where would you love to wander?`,
    `Cherishing small everyday moments brings so much peace, ${patientName}. What is a favorite song or tune that always cheers you up?`
  ];

  const idx = Math.abs((text.length * 17 + historyLen * 29) % conversationalReplies.length);
  return select(
    [conversationalReplies[idx]],
    [
      `মই আপোনাৰ কথা মন দি শুনি আছোঁ, ${patientName}। এই বিষয়ে মোক আৰু অকণমান কওকচোন!`,
      `আপোনাৰ লগত কথা পাতি বৰ ভাল লাগিছে, ${patientName}। আজি আপুনি কিবা বিশেষ কাম কৰিলে নেকি?`
    ],
    [
      `मैं आपकी बात बहुत ध्यान से सुन रहा हूँ, ${patientName} जी। इसके बारे में मुझे थोड़ा और बताइए!`,
      `आपके साथ बात करके बहुत अच्छा लग रहा है, ${patientName} जी। क्या आज आपने कुछ खास किया या कोई पुरानी बात याद आई?`
    ],
    [
      `আমি আপনার কথা খুব মনোযোগ দিয়ে শুনছি, ${patientName}। এই বিষয়ে আমাকে আর একটু বলুন!`
    ],
    [
      `ঐহাক অদোমগী ৱাফম তারিবনি, ${patientName}। মসিগী মরমদা হেন্না হায়বীরকো!`,
    ],
    [
      `I thusawi chu ka ngaithla uluk hle mai, ${patientName}. Sawi zawm zel rawh le!`
    ]
  );
}

export const sendChatMessage = async (req, res, next) => {
  try {
    const userId = req.authenticatedUserId || req.patientId || req.user?.id;
    if (!userId || !mongoose.isObjectIdOrHexString(userId)) {
      return next(new AppError("Authentication required to chat with Mitr", 401));
    }

    const { message, language: clientLang } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) {
      return next(new AppError("Message text is required", 400));
    }

    const cleanMessage = message.trim();

    // 1. Retrieve patient profile for personalization
    let patient = null;
    try {
      patient = await Patient.findById(userId).lean();
    } catch {
      // Non-blocking
    }

    const preferredLanguage = clientLang || patient?.language || "en";
    const detectedLanguage = detectLanguage(cleanMessage, preferredLanguage);
    const patientName = patient?.name || "Friend";
    const patientAge = patient?.age || 70;
    const patientRegion = patient?.region || "North-Eastern Region";

    // 2. Fetch long-term memories from Mem0
    let recalledMemories = [];
    try {
      recalledMemories = await searchMem0(userId, cleanMessage);
    } catch (memErr) {
      console.warn("Mem0 recall warning:", memErr.message);
    }

    // 3. Fetch recent 10 conversation turns from MongoDB for rich multi-turn context
    let recentHistory = [];
    try {
      recentHistory = await ChatLog.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      recentHistory.reverse();
    } catch (histErr) {
      console.warn("Chat history fetch warning:", histErr.message);
    }

    // 4. Build System Instruction with separate prompt configuration
    const systemInstruction = buildMitrSystemPrompt({
      patientName,
      age: patientAge,
      region: patientRegion,
      language: detectedLanguage,
      recalledMemories,
    });

    // 5. Build conversation turns for Gemini
    const contents = [];
    for (const h of recentHistory) {
      contents.push({ role: "user", parts: [{ text: h.message }] });
      contents.push({ role: "model", parts: [{ text: h.reply }] });
    }
    contents.push({ role: "user", parts: [{ text: cleanMessage }] });

    let reply = "";

    // 6. Try Gemini LLM generation with candidate models
    const gemini = getGeminiClient();
    if (gemini) {
      for (const model of CANDIDATE_MODELS) {
        try {
          const response = await gemini.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
              maxOutputTokens: 350,
            },
          });

          if (response.text && response.text.trim()) {
            reply = response.text.trim();
            break;
          }
        } catch (aiErr) {
          // Non-blocking fallback
        }
      }
    }

    // 7. Context-Aware Multilingual Hybrid Dialogue Engine
    if (!reply) {
      reply = generateMitrResponse({
        message: cleanMessage,
        language: detectedLanguage,
        patientName,
        recentHistory,
      });
    }

    // 8. Asynchronously store the conversation in Mem0
    addMem0(userId, [
      { role: "user", content: cleanMessage },
      { role: "assistant", content: reply },
    ]).catch((err) => console.warn("Mem0 async store failed:", err.message));

    // 9. Persist turn to MongoDB ChatLog
    let chatLogRecord = null;
    try {
      chatLogRecord = await ChatLog.create({
        userId,
        message: cleanMessage,
        reply,
        language: detectedLanguage,
      });
    } catch (dbErr) {
      console.warn("ChatLog persistence error:", dbErr.message);
    }

    res.json({
      success: true,
      reply,
      language: detectedLanguage,
      id: chatLogRecord?._id || Date.now().toString(),
      createdAt: chatLogRecord?.createdAt || new Date(),
    });
  } catch (error) {
    next(error);
  }
};

export const getChatHistory = async (req, res, next) => {
  try {
    const userId = req.authenticatedUserId || req.patientId || req.user?.id;
    if (!userId || !mongoose.isObjectIdOrHexString(userId)) {
      return next(new AppError("Authentication required", 401));
    }

    const logs = await ChatLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const history = logs.reverse().map((l) => ({
      id: l._id.toString(),
      message: l.message,
      reply: l.reply,
      language: l.language,
      createdAt: l.createdAt,
    }));

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    next(error);
  }
};

export const clearChatHistory = async (req, res, next) => {
  try {
    const userId = req.authenticatedUserId || req.patientId || req.user?.id;
    if (!userId || !mongoose.isObjectIdOrHexString(userId)) {
      return next(new AppError("Authentication required", 401));
    }

    await ChatLog.deleteMany({ userId });

    res.json({
      success: true,
      message: "Chat history cleared successfully",
    });
  } catch (error) {
    next(error);
  }
};
