/* =====================================================
   CHATBOT.JS — Genezenz Pharmacy AI chat widget
   FIXES:
   - Sends { messages: [...] } array instead of { message: text }
     (backend was returning 400 on every single message)
   - Maintains conversation history so context is preserved
   - addMsg() now returns the element so typing indicator works
===================================================== */
(function () {
  const BASE = window.API_BASE || 'https://medplus-lkr7.onrender.com';

  /* ── Conversation history (kept in memory per session) ── */
  const history = [];

  const SYSTEM_PROMPT = `You are a helpful assistant for Genezenz Pharmacy, an online pharmacy in India.
Help users with medicine information, product queries, order status, and general health questions.
Keep answers concise and friendly. Always recommend consulting a doctor for medical advice.
Do not provide specific dosage instructions — direct users to the product label or their doctor.`;

  /* ── Build widget HTML ── */
  const widget = document.createElement('div');
  widget.id = 'chatbot-widget';
  widget.innerHTML = `
    <style>
      #chatbot-widget { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9000; font-family: inherit; }
      #chatbot-fab {
        width: 52px; height: 52px; border-radius: 50%; background: var(--teal-600, #1e6b6b);
        color: #fff; border: none; cursor: pointer; font-size: 1.35rem;
        box-shadow: 0 4px 18px rgba(0,0,0,.22); display: flex; align-items: center; justify-content: center;
        transition: background .2s, transform .2s;
      }
      #chatbot-fab:hover { background: var(--teal-500, #228080); transform: scale(1.08); }
      #chatbot-box {
        display: none; position: absolute; bottom: 64px; right: 0;
        width: 330px; max-height: 440px; background: #fff; border-radius: 16px;
        box-shadow: 0 12px 40px rgba(0,0,0,.18); overflow: hidden;
        flex-direction: column; border: 1.5px solid #e2e8f0;
      }
      #chatbot-box.open { display: flex; }
      #chatbot-header {
        background: var(--teal-700, #1a5454); color: #fff; padding: .75rem 1rem;
        display: flex; align-items: center; gap: .6rem; font-weight: 700; font-size: .9rem;
      }
      #chatbot-header .cb-clear {
        margin-left: auto; background: none; border: none; color: #fff;
        font-size: .75rem; cursor: pointer; opacity: .6; padding: 2px 6px;
        border-radius: 4px; transition: opacity .15s;
      }
      #chatbot-header .cb-clear:hover { opacity: 1; }
      #chatbot-close-btn {
        background: none; border: none; color: #fff; font-size: 1rem; cursor: pointer; opacity: .7;
      }
      #chatbot-close-btn:hover { opacity: 1; }
      #chatbot-messages {
        flex: 1; overflow-y: auto; padding: .75rem 1rem; display: flex; flex-direction: column; gap: .6rem;
        font-size: .875rem; background: #f8fafc;
      }
      .cb-msg { max-width: 85%; padding: .55rem .85rem; border-radius: 12px; line-height: 1.5; }
      .cb-msg.bot { background: #fff; border: 1px solid #e2e8f0; color: #1e293b; align-self: flex-start; }
      .cb-msg.user { background: var(--teal-600, #1e6b6b); color: #fff; align-self: flex-end; }
      .cb-msg.typing { opacity: .6; font-style: italic; }
      #chatbot-input-row {
        display: flex; border-top: 1px solid #e2e8f0; background: #fff;
      }
      #chatbot-input {
        flex: 1; padding: .7rem 1rem; border: none; outline: none; font-size: .875rem;
      }
      #chatbot-send {
        padding: .7rem 1rem; background: var(--teal-600, #1e6b6b); color: #fff;
        border: none; cursor: pointer; font-size: 1rem; transition: background .18s;
      }
      #chatbot-send:hover { background: var(--teal-500, #228080); }
      #chatbot-send:disabled { opacity: .5; cursor: not-allowed; }
    </style>

    <div id="chatbot-box" role="dialog" aria-label="Genezenz Pharmacy chat assistant">
      <div id="chatbot-header">
        <i class="fas fa-comment-medical"></i> Genezenz Pharmacy Assistant
        <button class="cb-clear" id="chatbot-clear-btn" title="Clear chat">Clear</button>
        <button id="chatbot-close-btn" aria-label="Close chat"><i class="fas fa-times"></i></button>
      </div>
      <div id="chatbot-messages">
        <div class="cb-msg bot">👋 Hi! I'm the Genezenz Pharmacy assistant. Ask me about medicines, products, or your order.</div>
      </div>
      <div id="chatbot-input-row">
        <input id="chatbot-input" type="text" placeholder="Type your message…" aria-label="Chat message" maxlength="300">
        <button id="chatbot-send" aria-label="Send"><i class="fas fa-paper-plane"></i></button>
      </div>
    </div>

    <button id="chatbot-fab" aria-label="Open chat assistant">
      <i class="fas fa-comment-medical"></i>
    </button>
  `;
  document.body.appendChild(widget);

  const fab      = document.getElementById('chatbot-fab');
  const box      = document.getElementById('chatbot-box');
  const closeBtn = document.getElementById('chatbot-close-btn');
  const clearBtn = document.getElementById('chatbot-clear-btn');
  const input    = document.getElementById('chatbot-input');
  const sendBtn  = document.getElementById('chatbot-send');
  const msgs     = document.getElementById('chatbot-messages');

  fab.addEventListener('click',   () => { box.classList.toggle('open'); if (box.classList.contains('open')) input.focus(); });
  closeBtn.addEventListener('click', () => box.classList.remove('open'));
  clearBtn.addEventListener('click', () => {
    history.length = 0;
    msgs.innerHTML = '<div class="cb-msg bot">Chat cleared. How can I help you?</div>';
  });
  sendBtn.addEventListener('click', sendMsg);
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } });

  /* Returns the created element so the caller can update it (e.g. typing → reply) */
  function addMsg(text, who, extraClass = '') {
    const el = document.createElement('div');
    el.className = `cb-msg ${who}${extraClass ? ' ' + extraClass : ''}`;
    el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
  }

  async function sendMsg() {
    const text = input.value.trim();
    if (!text || sendBtn.disabled) return;

    addMsg(text, 'user');
    input.value = '';
    sendBtn.disabled = true;

    /* FIX: Push to history BEFORE the request so context is always sent */
    history.push({ role: 'user', content: text });

    /* Show typing indicator */
    const typingEl = addMsg('Typing…', 'bot', 'typing');

    try {
      /* FIX: Send { messages: [...] } array — backend was returning 400 when
         we sent { message: text } (a single string) instead of an array. */
      const res = await fetch(`${BASE}/api/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages:     history.slice(-20), // last 20 turns for token efficiency
          systemPrompt: SYSTEM_PROMPT,
        }),
      });

      const data  = await res.json();
      const reply = data.reply || data.message || "Sorry, I couldn't get a response.";

      typingEl.textContent  = reply;
      typingEl.classList.remove('typing');

      /* Add assistant reply to history for next turn */
      history.push({ role: 'assistant', content: reply });
    } catch {
      typingEl.textContent = 'Unable to reach the assistant. Please try again.';
      typingEl.classList.remove('typing');
      /* Remove the failed user message from history so it isn't re-sent */
      history.pop();
    } finally {
      sendBtn.disabled = false;
      input.focus();
      msgs.scrollTop = msgs.scrollHeight;
    }
  }
})();
