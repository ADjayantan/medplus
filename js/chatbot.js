/* MedPlus AI Chatbot — Powered by OpenRouter (Free) */
(function () {

  /* ── CONFIG — Replace with your OpenRouter API key ── */
 const OPENROUTER_API_KEY = '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';

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
      <button class="mp-quick-btn">💊 Medicine info</button>
      <button class="mp-quick-btn">🚚 Delivery time</button>
      <button class="mp-quick-btn">💳 Payment options</button>
      <button class="mp-quick-btn">📋 Upload prescription</button>
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
    appendMsg('bot', "👋 Hi! I'm your MedPlus AI assistant. I can help you with medicine information, orders, prescriptions, delivery, and general health questions. How can I help you today?");
  }

  /* ── Append message ── */
  function appendMsg(role, text) {
    const wrap = document.createElement('div');
    wrap.className = `mp-msg ${role}`;
    if (role === 'bot') {
      wrap.innerHTML = `
        <div class="mp-msg-avatar">🤖</div>
        <div class="mp-msg-bubble">${text.replace(/\n/g, '<br>')}</div>`;
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
    showTyping();

    try {
      // Validate API key before calling
      if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'YOUR_OPENROUTER_API_KEY_HERE' || !OPENROUTER_API_KEY.startsWith('sk-or-')) {
        throw new Error('INVALID_KEY');
      }

      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
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

      if (!res.ok) {
        throw new Error(data?.error?.message || `API error ${res.status}`);
      }

      const reply = data.choices?.[0]?.message?.content
        || "I'm sorry, I couldn't get a response. Please try again.";

      hideTyping();
      appendMsg('bot', reply);
      history.push({ role: 'assistant', content: reply });

      if (history.length > 20) history = history.slice(-20);

    } catch (err) {
      hideTyping();
      let msg;
      if (err.message === 'INVALID_KEY') {
        msg = '⚠️ Chatbot not configured. Please add your OpenRouter API key (sk-or-v1-...) in chatbot.js line 5.';
      } else if (err.message?.includes('401')) {
        msg = '⚠️ OpenRouter API key is invalid. Please check your key at openrouter.ai/keys.';
      } else {
        msg = "Sorry, I'm having trouble connecting right now. Please try again in a moment. 🙏";
      }
      appendMsg('bot', msg);
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
