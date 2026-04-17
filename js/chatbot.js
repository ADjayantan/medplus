/* MedPlus AI Chatbot — Powered by OpenRouter + FDA Drug Event API */
(function () {

  /* ── CONFIG ── */
  const OPENROUTER_API_KEY = 'sk-or-v1-85f.....a31'; // starts with sk-or-v1-...
  const FDA_API_BASE = 'https://api.fda.gov/drug/event.json';
  const FDA_API_KEY  = 'zMwBZLr4fxlK3qoaIWm5Iqr8R2EhUIuYs0qzbQ0O'; // ← Paste the key from your email (adjayantan2007@gmail.com)
                                             // With key: 240 req/min, 120,000 req/day

  const SYSTEM_PROMPT = `You are MedPlus AI, a friendly and knowledgeable pharmacy assistant for MedPlus — an online pharmacy platform.
You help customers with:
- Medicine information (uses, dosage, side effects, interactions)
- Order tracking and delivery queries
- Prescription upload guidance
- Payment and refund questions
- General health and wellness advice
- Product availability questions

Keep responses concise, warm, and helpful. If a question needs a doctor's consultation, always recommend that. Never suggest specific dosages for prescription medicines without a prescription. Format with line breaks for readability. Respond in the same language as the user.`;

  /* ── Inject CSS ── */
  const style = document.createElement('style');
  style.textContent = `
    #mp-chat-fab {
      position: fixed; bottom: 28px; right: 28px; z-index: 9999;
      width: 60px; height: 60px; border-radius: 50%;
      background: linear-gradient(135deg, #0d9488, #0f766e);
      border: none; cursor: pointer; box-shadow: 0 4px 20px rgba(13,148,136,.45);
      display: flex; align-items: center; justify-content: center;
      transition: transform .2s, box-shadow .2s;
    }
    #mp-chat-fab:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(13,148,136,.6); }
    #mp-chat-fab svg { width: 28px; height: 28px; fill: #fff; }
    #mp-chat-fab .mp-badge {
      position: absolute; top: -4px; right: -4px;
      background: #ef4444; color: #fff; font-size: 10px; font-weight: 700;
      width: 18px; height: 18px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid #fff; animation: mp-pulse 2s infinite;
    }
    @keyframes mp-pulse { 0%,100%{opacity:1} 50%{opacity:.6} }

    #mp-chat-window {
      position: fixed; bottom: 100px; right: 28px; z-index: 9998;
      width: 360px; max-height: 520px;
      background: #fff; border-radius: 20px;
      box-shadow: 0 12px 48px rgba(0,0,0,.18);
      display: flex; flex-direction: column;
      font-family: 'Segoe UI', sans-serif;
      transform: scale(.85) translateY(20px); opacity: 0; pointer-events: none;
      transition: transform .25s cubic-bezier(.34,1.56,.64,1), opacity .2s;
    }
    #mp-chat-window.open { transform: scale(1) translateY(0); opacity: 1; pointer-events: all; }

    .mp-chat-header {
      background: linear-gradient(135deg, #0d2b2e, #0d9488);
      border-radius: 20px 20px 0 0; padding: 16px 20px;
      display: flex; align-items: center; gap: 12px; color: #fff;
    }
    .mp-chat-header-avatar {
      width: 38px; height: 38px; border-radius: 50%;
      background: rgba(255,255,255,.2); display: flex; align-items: center; justify-content: center;
      font-size: 18px;
    }
    .mp-chat-header-info { flex: 1; }
    .mp-chat-header-info strong { display: block; font-size: 15px; }
    .mp-chat-header-info span { font-size: 11px; opacity: .8; }
    .mp-chat-header-close {
      background: none; border: none; color: rgba(255,255,255,.7);
      cursor: pointer; font-size: 18px; padding: 4px;
      transition: color .15s;
    }
    .mp-chat-header-close:hover { color: #fff; }

    .mp-chat-messages {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 10px;
      max-height: 340px; scroll-behavior: smooth;
    }
    .mp-chat-messages::-webkit-scrollbar { width: 4px; }
    .mp-chat-messages::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }

    .mp-msg { display: flex; gap: 8px; align-items: flex-end; animation: mp-fade-in .2s ease; }
    @keyframes mp-fade-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }

    .mp-msg.user { flex-direction: row-reverse; }
    .mp-msg-bubble {
      max-width: 78%; padding: 10px 14px; border-radius: 18px;
      font-size: 13.5px; line-height: 1.5; word-break: break-word;
    }
    .mp-msg.bot .mp-msg-bubble { background: #f1f5f9; color: #1e293b; border-bottom-left-radius: 4px; }
    .mp-msg.user .mp-msg-bubble {
      background: linear-gradient(135deg, #0d9488, #0f766e);
      color: #fff; border-bottom-right-radius: 4px;
    }
    .mp-msg-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      background: linear-gradient(135deg, #0d2b2e, #0d9488);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; flex-shrink: 0;
    }

    .mp-typing { display: flex; align-items: center; gap: 4px; padding: 10px 14px; }
    .mp-typing span {
      width: 7px; height: 7px; border-radius: 50%; background: #94a3b8;
      animation: mp-bounce .9s infinite;
    }
    .mp-typing span:nth-child(2) { animation-delay: .15s; }
    .mp-typing span:nth-child(3) { animation-delay: .3s; }
    @keyframes mp-bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }

    .mp-chat-footer {
      padding: 12px 14px; border-top: 1px solid #e2e8f0;
      display: flex; gap: 8px; align-items: flex-end;
    }
    .mp-chat-input {
      flex: 1; border: 1.5px solid #e2e8f0; border-radius: 12px;
      padding: 9px 13px; font-size: 13.5px; outline: none; resize: none;
      font-family: inherit; max-height: 80px; line-height: 1.4;
      transition: border-color .2s;
    }
    .mp-chat-input:focus { border-color: #0d9488; }
    .mp-chat-send {
      width: 38px; height: 38px; border-radius: 50%;
      background: linear-gradient(135deg, #0d9488, #0f766e);
      border: none; cursor: pointer; color: #fff;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: transform .15s, opacity .15s;
    }
    .mp-chat-send:hover { transform: scale(1.08); }
    .mp-chat-send:disabled { opacity: .5; cursor: not-allowed; transform: none; }
    .mp-chat-send svg { width: 16px; height: 16px; fill: #fff; }

    .mp-quick-btns { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 16px 10px; }
    .mp-quick-btn {
      font-size: 11.5px; padding: 5px 11px; border-radius: 20px;
      border: 1.5px solid #0d9488; color: #0d9488; background: #fff;
      cursor: pointer; transition: all .15s; white-space: nowrap;
    }
    .mp-quick-btn:hover { background: #0d9488; color: #fff; }

    .mp-fda-badge {
      display: inline-block; font-size: 10px; font-weight: 700;
      background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7;
      border-radius: 10px; padding: 2px 7px; margin-bottom: 5px;
    }

    @media (max-width: 420px) {
      #mp-chat-window { width: calc(100vw - 24px); right: 12px; bottom: 88px; }
      #mp-chat-fab { right: 16px; bottom: 16px; }
    }
  `;
  document.head.appendChild(style);

  /* ── Build DOM ── */
  const fab = document.createElement('button');
  fab.id = 'mp-chat-fab';
  fab.setAttribute('aria-label', 'Open AI Chat');
  fab.innerHTML = `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-2 10H6V10h12v2zm0-3H6V7h12v2z"/>
    </svg>
    <div class="mp-badge">AI</div>
  `;

  const win = document.createElement('div');
  win.id = 'mp-chat-window';
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-label', 'MedPlus AI Assistant');
  win.innerHTML = `
    <div class="mp-chat-header">
      <div class="mp-chat-header-avatar">💊</div>
      <div class="mp-chat-header-info">
        <strong>MedPlus AI Assistant</strong>
        <span>Ask me anything about medicines & health</span>
      </div>
      <button class="mp-chat-header-close" id="mp-close-btn" aria-label="Close chat">✕</button>
    </div>
    <div class="mp-chat-messages" id="mp-messages"></div>
    <div class="mp-quick-btns" id="mp-quick-btns">
      <button class="mp-quick-btn">🚚 Delivery time</button>
      <button class="mp-quick-btn">💊 Paracetamol info</button>
      <button class="mp-quick-btn">📋 Upload prescription</button>
      <button class="mp-quick-btn">💳 Payment options</button>
      <button class="mp-quick-btn">↩️ Returns & refunds</button>
      <button class="mp-quick-btn">📞 Contact support</button>
    </div>
    <div class="mp-chat-footer">
      <textarea class="mp-chat-input" id="mp-input" rows="1"
        placeholder="Ask about medicines, orders, health…"></textarea>
      <button class="mp-chat-send" id="mp-send-btn" aria-label="Send">
        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
      </button>
    </div>
  `;

  document.body.appendChild(fab);
  document.body.appendChild(win);

  /* ── State ── */
  const messagesEl = document.getElementById('mp-messages');
  const inputEl    = document.getElementById('mp-input');
  const sendBtn    = document.getElementById('mp-send-btn');
  let history   = [];
  let isOpen    = false;
  let isLoading = false;

  /* ── Toggle ── */
  function toggleChat() {
    isOpen = !isOpen;
    win.classList.toggle('open', isOpen);
    if (isOpen && messagesEl.children.length === 0) greet();
    if (isOpen) setTimeout(() => inputEl.focus(), 300);
  }

  fab.addEventListener('click', toggleChat);
  document.getElementById('mp-close-btn').addEventListener('click', toggleChat);

  /* ── Quick Buttons ── */
  document.getElementById('mp-quick-btns').addEventListener('click', e => {
    const btn = e.target.closest('.mp-quick-btn');
    if (btn) sendMessage(btn.textContent.replace(/^[^\w]+/, '').trim());
  });

  /* ── Greet ── */
  function greet() {
    appendMsg('bot', `👋 Hi! I'm your MedPlus Assistant.\n\nI can help you with:\n• 💊 Medicine info, side effects & uses\n• 🚚 Delivery & order tracking\n• 📋 Prescription upload guidance\n• 💳 Payment options & refunds\n• 🩺 Common health queries\n\nTry asking: <em>"What is paracetamol used for?"</em> or <em>"How long does delivery take?"</em>`);
  }

  /* ── Append message ── */
  function appendMsg(role, text, usedFDA) {
    const wrap = document.createElement('div');
    wrap.className = `mp-msg ${role}`;
    if (role === 'bot') {
      const badge = usedFDA ? '<div class="mp-fda-badge">📊 FDA Data</div>' : '';
      wrap.innerHTML = `
        <div class="mp-msg-avatar">🤖</div>
        <div class="mp-msg-bubble">${badge}${text.replace(/\n/g, '<br>')}</div>`;
    } else {
      wrap.innerHTML = `<div class="mp-msg-bubble">${text.replace(/\n/g, '<br>')}</div>`;
    }
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  /* ── Typing indicator ── */
  function showTyping() {
    const wrap = document.createElement('div');
    wrap.className = 'mp-msg bot';
    wrap.id = 'mp-typing';
    wrap.innerHTML = `
      <div class="mp-msg-avatar">🤖</div>
      <div class="mp-msg-bubble mp-typing">
        <span></span><span></span><span></span>
      </div>`;
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  function hideTyping() {
    const t = document.getElementById('mp-typing');
    if (t) t.remove();
  }

  /* ── FDA Drug Event API ── */
  function extractDrugName(text) {
    const patterns = [
      /(?:side[\s-]?effects?|adverse[\s-]?effects?|reactions?|events?)\s+(?:of|for|from|to)\s+([a-zA-Z][a-zA-Z0-9\s\-]{1,30})/i,
      /(?:tell\s+me\s+about|info(?:rmation)?\s+(?:on|about)|what\s+(?:is|are)|about)\s+([a-zA-Z][a-zA-Z0-9\s\-]{1,30})(?:\s+(?:drug|medicine|medication|tablet|capsule|pill))?/i,
      /([a-zA-Z][a-zA-Z0-9\s\-]{1,30})\s+(?:side[\s-]?effects?|adverse|reactions?|interactions?|warnings?|uses?|dosage)/i,
      /is\s+([a-zA-Z][a-zA-Z0-9\-]{2,20})\s+(?:safe|dangerous|okay|good|bad|effective)/i,
      /(?:drug|medicine|medication|tablet|capsule|pill)\s+([a-zA-Z][a-zA-Z0-9\-]{2,20})/i,
    ];
    for (const re of patterns) {
      const m = text.match(re);
      if (m && m[1]) return m[1].trim().split(/\s+/).slice(0, 2).join(' ');
    }
    return null;
  }

  async function fetchFDAData(drugName) {
    try {
      const keyParam = FDA_API_KEY ? `&api_key=${FDA_API_KEY}` : '';
      const url = `${FDA_API_BASE}?search=patient.drug.medicinalproduct:"${encodeURIComponent(drugName)}"&limit=5${keyParam}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.results || data.results.length === 0) return null;

      // Tally adverse reactions across all returned reports
      const reactionCounts = {};
      data.results.forEach(report => {
        (report.patient?.reaction || []).forEach(r => {
          const term = r.reactionmeddrapt;
          if (term) reactionCounts[term] = (reactionCounts[term] || 0) + 1;
        });
      });

      const topReactions = Object.entries(reactionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([term]) => term);

      if (topReactions.length === 0) return null;

      return {
        drug: drugName,
        reportCount: data.meta?.results?.total || data.results.length,
        reactions: topReactions,
      };
    } catch {
      return null;
    }
  }

  /* ================================================================
     LOCAL RULE-BASED RESPONSES
     Handles common pharmacy / store questions instantly, no API needed.
     Returns a string if matched, null if the AI should handle it.
  ================================================================ */
  const LOCAL_RULES = [
    /* ── Greetings ── */
    {
      match: /^(hi|hello|hey|good\s*(morning|afternoon|evening)|namaste|hii+|helo)\b/i,
      reply: `👋 Hello! Welcome to MedPlus.\nI can help you with:\n• Medicine information & side effects\n• Order tracking & delivery\n• Prescription upload\n• Payment & refunds\n• General health questions\n\nWhat can I help you with today?`
    },
    {
      match: /\b(how are you|how r u|how do you do)\b/i,
      reply: `I'm doing great, thank you for asking! 😊\nI'm here and ready to help you with medicines, orders, and health queries. What do you need?`
    },
    {
      match: /\b(thank(s| you)|thx|ty|thanks a lot|great|awesome|perfect|excellent)\b/i,
      reply: `You're welcome! 😊 Is there anything else I can help you with?`
    },
    {
      match: /\b(bye|goodbye|see you|exit|close)\b/i,
      reply: `Take care! 👋 Stay healthy. Visit MedPlus again whenever you need medicines or health advice.`
    },

    /* ── About MedPlus ── */
    {
      match: /\b(what is medplus|about medplus|tell me about (the )?(?:app|site|store|medplus)|who are you|what do you do)\b/i,
      reply: `🏥 MedPlus is your trusted online pharmacy!\n\n• 500+ genuine medicines in stock\n• Fast doorstep delivery\n• Upload prescriptions easily\n• Licensed by CDSCO\n• 50,000+ happy customers\n• 4.8⭐ average rating\n\nWe source all medicines from licensed manufacturers and have every order verified by a pharmacist. How can I help you today?`
    },

    /* ── Delivery ── */
    {
      match: /\b(delivery|deliver|shipping|dispatch|how (long|soon)|when (will|does)|arrive|reach)\b/i,
      reply: `🚚 Delivery Information:\n\n• Orders placed before 2 PM → same-day dispatch\n• Standard delivery: 2–4 business days\n• Express delivery available at checkout\n• Free delivery on orders above ₹499\n\nYou can track your order from your Profile page. Need help with a specific order?`
    },

    /* ── Order tracking ── */
    {
      match: /\b(track|where is my order|order status|my order)\b/i,
      reply: `📦 To track your order:\n\n1. Go to your Profile → "My Orders"\n2. Click on the order you want to track\n3. You'll see real-time status updates\n\nIf you're not logged in, please login first at the top of the page. Need any other help?`
    },

    /* ── Payment ── */
    {
      match: /\b(pay(ment)?|payment method|how (to pay|can i pay)|upi|card|cod|cash on delivery|net banking|wallet)\b/i,
      reply: `💳 We accept all major payment methods:\n\n• UPI (Google Pay, PhonePe, Paytm)\n• Credit & Debit Cards (Visa, Mastercard, RuPay)\n• Net Banking\n• Cash on Delivery (COD)\n• Digital Wallets\n\nAll payments are 100% secure and encrypted. Anything else?`
    },

    /* ── Prescription ── */
    {
      match: /\b(prescription|upload (rx|prescription)|rx|doctor.{0,10}(note|letter)|medicine.*prescription)\b/i,
      reply: `📋 Uploading a Prescription is easy:\n\n1. Click "Upload Prescription" in the menu\n2. Take a clear photo of your prescription or upload a PDF\n3. Our pharmacist reviews it within a few hours\n4. Your order is prepared with verified medicines\n\n✅ We accept photos, scans, and PDFs.\n⚠️ Prescription must be valid & legible.\n\nWant to go there now? → <a href="upload-prescription.html" style="color:#0d9488;font-weight:700">Upload Prescription</a>`
    },

    /* ── Returns & Refunds ── */
    {
      match: /\b(return|refund|cancel|wrong (medicine|product|item)|damaged|expired)\b/i,
      reply: `↩️ Returns & Refunds:\n\n• Return window: 7 days from delivery\n• Eligible: wrong product, damaged, expired items\n• Not eligible: opened prescription medicines\n\nTo raise a return:\n1. Go to Profile → My Orders\n2. Select the order → "Request Return"\n3. Our team will respond within 24 hours\n\nNeed more help? Call us: 📞 1800-123-456 (Toll Free)`
    },

    /* ── Paracetamol ── */
    {
      match: /\b(paracetamol|dolo|calpol|crocin|acetaminophen|panadol)\b/i,
      reply: `💊 Paracetamol (Dolo / Crocin / Calpol):\n\n📌 Uses: Fever, mild to moderate pain (headache, body ache, toothache)\n\n💉 Typical Dose (Adults): 500mg–1000mg every 4–6 hours\n⚠️ Max: 4000mg per day\n\n⚠️ Side effects (rare at normal doses):\n• Nausea, liver damage (with overdose)\n• Avoid alcohol while taking it\n\n🚫 Avoid if: liver disease, heavy alcohol use\n\n⚕️ Always follow your doctor's prescription. Available on MedPlus — <a href="products.html?q=paracetamol" style="color:#0d9488;font-weight:700">Shop Now</a>`
    },

    /* ── Ibuprofen ── */
    {
      match: /\b(ibuprofen|brufen|advil|combiflam)\b/i,
      reply: `💊 Ibuprofen (Brufen / Combiflam):\n\n📌 Uses: Pain relief, fever, inflammation (arthritis, muscle aches)\n\n💉 Typical Dose (Adults): 200–400mg every 4–6 hours with food\n⚠️ Max: 1200mg/day (OTC)\n\n⚠️ Common side effects:\n• Stomach upset, nausea, heartburn\n• Take with food or milk\n\n🚫 Avoid if: kidney disease, stomach ulcers, pregnancy (3rd trimester)\n\n⚕️ Consult your doctor before prolonged use. <a href="products.html?q=ibuprofen" style="color:#0d9488;font-weight:700">Browse on MedPlus</a>`
    },

    /* ── Metformin ── */
    {
      match: /\b(metformin|glucophage|glycomet|glyciphage)\b/i,
      reply: `💊 Metformin (Glycomet / Glyciphage):\n\n📌 Uses: Type 2 Diabetes — lowers blood sugar levels\n\n⚠️ This is a prescription medicine (Rx)\n\n💉 Typical starting dose: 500mg twice daily with meals\n\n⚠️ Common side effects:\n• Nausea, diarrhea, stomach upset (usually improves with time)\n• Take with food to reduce GI side effects\n\n🚫 Avoid if: kidney disease, liver problems, upcoming contrast imaging\n\n⚕️ Always take as prescribed by your doctor. Upload your prescription to order: <a href="upload-prescription.html" style="color:#0d9488;font-weight:700">Upload Rx</a>`
    },

    /* ── Azithromycin ── */
    {
      match: /\b(azithromycin|azithral|zithromax|azee|azimax)\b/i,
      reply: `💊 Azithromycin (Azithral / Azee):\n\n📌 Uses: Bacterial infections — chest, throat, ear, skin\n\n⚠️ This is a prescription antibiotic (Rx)\n\n💉 Typical course: 500mg once daily for 3–5 days\n\n⚠️ Side effects:\n• Nausea, diarrhea, stomach pain\n• Rarely: heart rhythm changes, liver issues\n\n⚠️ Important: Complete the full course even if you feel better.\n🚫 Never take antibiotics without a prescription — antibiotic resistance is serious.\n\n⚕️ Please consult your doctor. <a href="upload-prescription.html" style="color:#0d9488;font-weight:700">Upload Prescription to Order</a>`
    },

    /* ── Vitamins / supplements ── */
    {
      match: /\b(vitamin|supplement|multivitamin|vitamin\s*[bcdek]|calcium|iron|zinc|omega|fish oil|b12|d3)\b/i,
      reply: `🌿 Vitamins & Supplements at MedPlus:\n\nWe stock a wide range including:\n• Vitamin D3, B12, C, E\n• Calcium + D3 combinations\n• Iron & Folic Acid\n• Omega-3 Fish Oil\n• Multivitamins for Men, Women, Seniors\n• Zinc, Magnesium, Biotin\n\n💡 Tip: Blood tests can reveal deficiencies before supplementing.\n⚕️ Consult your doctor for the right dosage.\n\n<a href="products.html?cat=Vitamins+%26+Supplements" style="color:#0d9488;font-weight:700">Browse All Supplements →</a>`
    },

    /* ── Diabetes ── */
    {
      match: /\b(diabetes|diabetic|blood sugar|insulin|sugar level|hyperglycemia|type\s*[12])\b/i,
      reply: `🩺 Diabetes Care at MedPlus:\n\nWe carry a full range of diabetes medicines including:\n• Metformin, Glipizide, Sitagliptin\n• Insulin (requires cold chain — call us)\n• Blood glucose monitors & strips\n• Diabetic-friendly supplements\n\n💡 Tips for managing diabetes:\n• Monitor blood sugar regularly\n• Follow a low-glycemic diet\n• Exercise at least 30 min/day\n• Never skip or adjust doses without your doctor\n\n<a href="products.html?cat=Diabetes" style="color:#0d9488;font-weight:700">Shop Diabetes Care →</a>\n\n⚕️ Always consult your endocrinologist for dose changes.`
    },

    /* ── Blood pressure / heart ── */
    {
      match: /\b(blood pressure|bp|hypertension|amlodipine|atenolol|telmisartan|heart|cardiac|cholesterol|statin)\b/i,
      reply: `❤️ Heart & BP Medicines:\n\nMedPlus stocks all major heart & BP medicines:\n• Amlodipine, Atenolol, Telmisartan, Losartan\n• Statins: Atorvastatin, Rosuvastatin\n• Aspirin (low dose), Clopidogrel\n\n⚠️ All heart medicines are prescription-only (Rx)\n\n💡 Lifestyle tips:\n• Reduce salt intake\n• Regular exercise\n• Avoid smoking & alcohol\n• Monitor BP daily if diagnosed\n\n<a href="products.html?cat=Heart+%26+BP" style="color:#0d9488;font-weight:700">Shop Heart & BP →</a>\n\n⚕️ Never stop heart medication without consulting your cardiologist.`
    },

    /* ── Cold & fever ── */
    {
      match: /\b(cold|cough|fever|flu|runny nose|sore throat|congestion|sneezing|antihistamine|cetirizine|levocetrizine)\b/i,
      reply: `🤧 Cold, Cough & Fever:\n\nCommon OTC medicines available at MedPlus:\n• Paracetamol (Dolo 650, Crocin) — fever & pain\n• Cetirizine / Levocetirizine — allergies, runny nose\n• Cough syrups: Benadryl, Corex-DX, Alex\n• Nasal sprays: Otrivin, Nasivion\n\n💡 Home remedies that help:\n• Warm water with honey & ginger\n• Steam inhalation\n• Rest and stay hydrated\n• Turmeric milk at night\n\n⚕️ If fever is above 103°F or lasts more than 3 days, see a doctor.\n\n<a href="products.html?cat=Allergy+%26+Cold" style="color:#0d9488;font-weight:700">Shop Cold & Fever Medicines →</a>`
    },

    /* ── Skin care ── */
    {
      match: /\b(skin|acne|pimple|rash|eczema|psoriasis|moisturizer|sunscreen|clotrimazole|antifungal|hydrocortisone)\b/i,
      reply: `🧴 Skin Care at MedPlus:\n\nWe have a wide range of skin care products:\n• Antifungals: Clotrimazole, Terbinafine creams\n• Acne: Benzoyl peroxide, Clindamycin gel\n• Hydrocortisone cream for rashes & inflammation\n• Moisturizers: Cetaphil, CeraVe, Vaseline\n• Sunscreens: SPF 30–50+ options\n\n💡 Tips:\n• For acne — don't pop pimples\n• Use sunscreen daily (even indoors)\n• Patch test new products\n\n⚕️ For persistent rashes, eczema, or fungal infections consult a dermatologist.\n\n<a href="products.html?cat=Skin+Care" style="color:#0d9488;font-weight:700">Shop Skin Care →</a>`
    },

    /* ── Baby care ── */
    {
      match: /\b(baby|infant|child|kids?|paediatric|toddler|newborn|diaper|baby (medicine|fever|cough))\b/i,
      reply: `👶 Baby & Child Care at MedPlus:\n\nProducts available for infants & children:\n• Infant paracetamol drops & syrups (Calpol, Meftal-P)\n• ORS sachets for dehydration\n• Gripe water for colic\n• Baby moisturizers, powders\n• Vitamin D drops for infants\n• Diapers, wipes & baby hygiene\n\n⚠️ Important:\n• Always use weight-appropriate doses for children\n• Never give aspirin to children under 12\n• Consult a paediatrician for babies under 3 months\n\n<a href="products.html?cat=Baby+Care" style="color:#0d9488;font-weight:700">Shop Baby Care →</a>`
    },

    /* ── Women's health ── */
    {
      match: /\b(women.{0,5}health|period|menstrual|pcos|contraceptive|folic acid|pregnancy|prenatal|iron.*woman|anaemia)\b/i,
      reply: `🌸 Women's Health at MedPlus:\n\nWe stock a comprehensive range for women's health:\n• Folic Acid & Iron (prenatal)\n• Period pain relief: Mefenamic acid (Meftal Spas)\n• Calcium + D3 for bone health\n• UTI treatments (Nitrofurantoin — Rx)\n• Probiotic capsules\n\n⚠️ Oral contraceptives and hormonal medicines require a prescription.\n\n💡 Tips:\n• Take folic acid 3 months before and during pregnancy\n• Track your cycle for early detection of irregularities\n\n⚕️ Consult a gynaecologist for PCOS, hormonal issues, or pregnancy care.\n\n<a href="products.html?cat=Women's+Health" style="color:#0d9488;font-weight:700">Shop Women's Health →</a>`
    },

    /* ── Pain relief ── */
    {
      match: /\b(pain|painkiller|headache|migraine|backache|muscle (pain|ache)|joint (pain|ache)|arthritis|diclofenac|nimesulide)\b/i,
      reply: `💊 Pain Relief at MedPlus:\n\nCommon pain relief options:\n• Mild pain: Paracetamol (Dolo 650, Crocin)\n• Inflammation & fever: Ibuprofen (Brufen, Combiflam)\n• Strong pain / arthritis: Diclofenac, Nimesulide (Rx)\n• Topical: Volini gel, Moov, Iodex\n\n💡 For headaches:\n• Stay hydrated (most headaches are from dehydration)\n• Rest in a dark, quiet room\n• Avoid screen time\n\n⚠️ For chronic or severe pain, always consult a doctor.\n\n<a href="products.html?cat=Pain+Relief" style="color:#0d9488;font-weight:700">Shop Pain Relief →</a>`
    },

    /* ── Antacid / stomach ── */
    {
      match: /\b(acidity|acid reflux|heartburn|stomach|antacid|pantoprazole|omeprazole|rabeprazole|digestion|gas|bloating|diarrhea|constipation)\b/i,
      reply: `🫃 Stomach & Digestion Medicines:\n\n• Acidity / GERD: Pantoprazole, Omeprazole, Rabeprazole\n• Antacids: Gelusil, Digene, Pudin Hara\n• Diarrhea: ORS, Loperamide, Metronidazole (Rx)\n• Constipation: Isabgol (psyllium), Dulcolax, Lactulose\n• Gas & bloating: Simethicone, Eno\n\n💡 Lifestyle tips:\n• Eat smaller meals, avoid spicy/oily food\n• Don't lie down immediately after eating\n• Stay hydrated\n\n⚕️ If you have blood in stool or persistent pain, see a doctor urgently.\n\n<a href="products.html?cat=Stomach+%26+Digestion" style="color:#0d9488;font-weight:700">Shop Stomach Care →</a>`
    },

    /* ── Is a medicine available / do you have ── */
    {
      match: /\b(do you (have|stock|sell)|is .{0,20} available|available|in stock|can i (get|buy|order))\b/i,
      reply: `🔍 To check if a medicine is available:\n\n1. Use the search bar at the top of the page\n2. Or visit <a href="products.html" style="color:#0d9488;font-weight:700">All Medicines</a> and filter by category\n\nWe stock 500+ medicines including OTC and prescription drugs. If you can't find something, it may require a prescription — you can <a href="upload-prescription.html" style="color:#0d9488;font-weight:700">Upload Prescription</a> and we'll source it for you.`
    },

    /* ── Contact / support ── */
    {
      match: /\b(contact|support|help|customer (care|service)|phone|email|call|helpline|toll.?free)\b/i,
      reply: `📞 MedPlus Customer Support:\n\n• Phone: 1800-123-456 (Toll Free)\n• Email: care@medplus.in\n• Hours: Mon–Sat, 9 AM – 8 PM\n\nFor urgent medicine queries, our pharmacists are available during working hours. For order issues, visit Profile → My Orders.`
    },

    /* ── Generic "what medicines for X" ── */
    {
      match: /\b(medicine(s)?|drug(s)?|tablet(s)?|capsule(s)?)\s+(for|to treat|to cure|against)\s+(\w[\w\s]{1,30})/i,
      reply: (m) => {
        const condition = m[6] ? m[6].trim() : 'that condition';
        return `🔍 Looking for medicines for **${condition}**?\n\nYou can:\n1. Search directly on MedPlus: <a href="products.html?q=${encodeURIComponent(condition)}" style="color:#0d9488;font-weight:700">Search "${condition}"</a>\n2. Browse by category on the <a href="products.html" style="color:#0d9488;font-weight:700">Products page</a>\n\n⚕️ For specific prescriptions, always consult a doctor first. You can also <a href="upload-prescription.html" style="color:#0d9488;font-weight:700">Upload Prescription</a> for Rx medicines.`;
      }
    },
  ];

  /* ── Match a local rule ── */
  function matchLocalRule(text) {
    for (const rule of LOCAL_RULES) {
      const m = text.match(rule.match);
      if (m) {
        return typeof rule.reply === 'function' ? rule.reply(m) : rule.reply;
      }
    }
    return null;
  }

  /* ── Send ── */
  async function sendMessage(text) {
    text = (text || inputEl.value).trim();
    if (!text || isLoading) return;
    inputEl.value = '';
    inputEl.style.height = 'auto';
    appendMsg('user', text);

    history.push({ role: 'user', content: text });

    isLoading = true;
    sendBtn.disabled = true;

    /* ── 1. Try local rules first (instant, no API needed) ── */
    const localReply = matchLocalRule(text);
    if (localReply) {
      setTimeout(() => {
        appendMsg('bot', localReply);
        history.push({ role: 'assistant', content: localReply });
        isLoading = false;
        sendBtn.disabled = false;
      }, 420); /* small delay feels more natural */
      return;
    }

    /* ── 2. Fall back to AI (OpenRouter) if no local match ── */
    showTyping();

    let fdaContext = null;
    let usedFDA = false;

    try {
      const drugName = extractDrugName(text);
      if (drugName) {
        const fdaData = await fetchFDAData(drugName);
        if (fdaData) {
          fdaContext = `[FDA FAERS Data for "${fdaData.drug}": Based on ${fdaData.reportCount.toLocaleString()} adverse event reports, the most frequently reported reactions are: ${fdaData.reactions.join(', ')}. Use this data to inform your answer but always recommend consulting a doctor.]`;
          usedFDA = true;
        }
      }

      const hasValidKey = OPENROUTER_API_KEY
        && OPENROUTER_API_KEY !== 'YOUR_OPENROUTER_API_KEY_HERE'
        && OPENROUTER_API_KEY.startsWith('sk-or-')
        && !OPENROUTER_API_KEY.includes('.....');

      if (!hasValidKey) throw new Error('INVALID_KEY');

      const systemContent = fdaContext
        ? `${SYSTEM_PROMPT}\n\n${fdaContext}`
        : SYSTEM_PROMPT;

      const messages = [
        { role: 'system', content: systemContent },
        ...history.map(m => ({ role: m.role, content: m.content }))
      ];

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://adjayantan.github.io/medplus',
          'X-Title': 'MedPlus AI Chatbot'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-8b-instruct:free',
          messages
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || `API error ${res.status}`);

      const reply = data.choices?.[0]?.message?.content
        || "I'm sorry, I couldn't get a response. Please try again.";

      hideTyping();
      appendMsg('bot', reply, usedFDA);
      history.push({ role: 'assistant', content: reply });
      if (history.length > 20) history = history.slice(-20);

    } catch (err) {
      hideTyping();
      if (err.message === 'INVALID_KEY') {
        /* No valid AI key — give a helpful fallback instead of an error */
        appendMsg('bot', `I'm not sure about that specific question. 🤔\n\nHere's what I can help you with right now:\n• 💊 Medicine info (try: "tell me about paracetamol")\n• 🚚 Delivery & tracking\n• 📋 Prescription upload\n• 💳 Payment options\n• 📞 Contact support: 1800-123-456\n\nOr browse our <a href="products.html" style="color:#0d9488;font-weight:700">full medicine catalog</a>.`);
      } else if (err.message?.includes('401')) {
        appendMsg('bot', '⚠️ AI service unavailable. But I can still help with common questions — try asking about a specific medicine, delivery times, or payment methods!');
      } else {
        appendMsg('bot', "Sorry, I'm having trouble right now. Please try a different question or call us at 📞 1800-123-456.");
      }
    } finally {
      isLoading = false;
      sendBtn.disabled = false;
    }
  }

  /* ── Input events ── */
  sendBtn.addEventListener('click', () => sendMessage());
  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 80) + 'px';
  });
})();
