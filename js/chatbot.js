/* =====================================================
   CHATBOT.JS — Genezenz Pharmacy AI chat widget
===================================================== */
(function () {
  const BASE = window.API_BASE || 'https://genezenz-pharmacy-lkr7.onrender.com';

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
      #chatbot-header button {
        margin-left: auto; background: none; border: none; color: #fff; font-size: 1rem; cursor: pointer; opacity: .7;
      }
      #chatbot-header button:hover { opacity: 1; }
      #chatbot-messages {
        flex: 1; overflow-y: auto; padding: .75rem 1rem; display: flex; flex-direction: column; gap: .6rem;
        font-size: .875rem; background: #f8fafc;
      }
      .cb-msg { max-width: 85%; padding: .55rem .85rem; border-radius: 12px; line-height: 1.5; }
      .cb-msg.bot { background: #fff; border: 1px solid #e2e8f0; color: #1e293b; align-self: flex-start; }
      .cb-msg.user { background: var(--teal-600, #1e6b6b); color: #fff; align-self: flex-end; }
      #chatbot-input-row {
        display: flex; border-top: 1px solid #e2e8f0; background: #fff;
      }
      #chatbot-input {
        flex: 1; padding: .7rem 1rem; border: none; outline: none; font-size: .875rem; resize: none;
      }
      #chatbot-send {
        padding: .7rem 1rem; background: var(--teal-600, #1e6b6b); color: #fff;
        border: none; cursor: pointer; font-size: 1rem; transition: background .18s;
      }
      #chatbot-send:hover { background: var(--teal-500, #228080); }
    </style>

    <div id="chatbot-box" role="dialog" aria-label="Genezenz Pharmacy chat assistant">
      <div id="chatbot-header">
        <i class="fas fa-comment-medical"></i> Genezenz Pharmacy Assistant
        <button id="chatbot-close" aria-label="Close chat"><i class="fas fa-times"></i></button>
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

  const fab   = document.getElementById('chatbot-fab');
  const box   = document.getElementById('chatbot-box');
  const close = document.getElementById('chatbot-close');
  const input = document.getElementById('chatbot-input');
  const send  = document.getElementById('chatbot-send');
  const msgs  = document.getElementById('chatbot-messages');

  fab.addEventListener('click',   () => box.classList.toggle('open'));
  close.addEventListener('click', () => box.classList.remove('open'));
  send.addEventListener('click',  sendMsg);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });

  function addMsg(text, who) {
    const el = document.createElement('div');
    el.className = 'cb-msg ' + who;
    el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
  }

  async function sendMsg() {
    const text = input.value.trim();
    if (!text) return;
    addMsg(text, 'user');
    input.value = '';
    addMsg('…', 'bot');
    try {
      const res  = await fetch(`${BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      msgs.lastChild.textContent = data.reply || data.message || 'Sorry, I couldn't get a response.';
    } catch {
      msgs.lastChild.textContent = 'Unable to reach the assistant. Please try again.';
    }
    msgs.scrollTop = msgs.scrollHeight;
  }
})();
