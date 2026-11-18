(() => {
  'use strict';
  const DEFAULT_DATA = {
    loja: 'XAVIER STORE',
    mensagemInicial: 'Olá! 👋 Sou o assistente virtual da Xavier Store. Posso ajudar com produtos, preços, tamanhos e atendimento.',
    respostas: [],
    respostaPadrao: 'Ainda não tenho essa informação na minha base. Para não te passar algo incorreto, fale com nossa equipe pelo contato no site.'
  };
  function normalize(value) {
    return String(value || '')
      .toLocaleLowerCase('pt-BR')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  function findAnswer(message, data) {
    const query = normalize(message);
    if (!query) return { resposta: 'Digite sua dúvida para eu tentar ajudar.' };
    let best = null;
    let bestScore = 0;
    (data.respostas || []).forEach((item) => {
      let score = 0;
      (item.perguntas || []).forEach((phrase) => {
        const keyword = normalize(phrase);
        if (!keyword) return;
        if (query === keyword) score = Math.max(score, 10 + keyword.length / 10);
        else if (query.includes(keyword)) score = Math.max(score, 5 + keyword.length / 10);
        else if (keyword.includes(query) && query.length > 3) score = Math.max(score, 2);
      });
      if (score > bestScore) { best = item; bestScore = score; }
    });
    return best || { resposta: data.respostaPadrao || DEFAULT_DATA.respostaPadrao };
  }
  function initChatbot(options = {}) {
    if (document.getElementById('xavier-chatbot')) return;
    const dataUrl = options.jsonUrl || 'minha-base-dados.json';
    let knowledge = DEFAULT_DATA;
    const style = document.createElement('style');
    style.textContent = `
      #xavier-chatbot{--xc-cyan:#13d8f3;--xc-blue:#1789ff;--xc-bg:#0c172a;--xc-line:rgba(255,255,255,.12);font-family:Inter,Arial,sans-serif;color:#f5f7fb;position:relative;z-index:9999}
      #xavier-chatbot *{box-sizing:border-box}
      .xc-launcher{position:fixed;right:24px;bottom:24px;width:62px;height:62px;border:0;border-radius:50%;background:linear-gradient(110deg,var(--xc-cyan),var(--xc-blue));color:#061022;box-shadow:0 8px 30px #0007;cursor:pointer;font-size:27px;font-weight:800;display:grid;place-items:center;transition:transform .2s}
      .xc-launcher:hover{transform:translateY(-3px)}
      .xc-window{position:fixed;right:24px;bottom:98px;width:min(380px,calc(100vw - 28px));height:min(540px,calc(100dvh - 125px));min-height:360px;background:#081326;border:1px solid var(--xc-line);border-radius:18px;box-shadow:0 20px 65px #0009;display:none;overflow:hidden;grid-template-rows:auto 1fr auto auto}
      .xc-window.xc-open{display:grid;animation:xc-in .18s ease-out}
      @keyframes xc-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      .xc-header{padding:16px;display:flex;align-items:center;gap:11px;background:linear-gradient(120deg,#0d2339,#0b1a31);border-bottom:1px solid var(--xc-line)}
      .xc-avatar{width:39px;height:39px;border-radius:12px;display:grid;place-items:center;color:#061022;background:linear-gradient(110deg,var(--xc-cyan),var(--xc-blue));font-weight:900}
      .xc-headtext{flex:1;min-width:0}.xc-headtext strong{display:block;font-size:14px}.xc-status{font-size:11px;color:#8fa4b9;margin-top:4px}.xc-status:before{content:'';display:inline-block;width:7px;height:7px;border-radius:50%;background:#38d996;margin-right:6px}
      .xc-close{border:0;background:transparent;color:#c5d1df;font-size:24px;cursor:pointer;padding:2px 6px}
      .xc-messages{overflow:auto;padding:16px 13px;display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth}
      .xc-message{max-width:88%;padding:11px 12px;border-radius:13px;font-size:13px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}
      .xc-bot{align-self:flex-start;background:#13233a;border:1px solid #ffffff0c;border-bottom-left-radius:4px;color:#eaf1f9}
      .xc-user{align-self:flex-end;background:linear-gradient(110deg,var(--xc-cyan),var(--xc-blue));color:#061022;border-bottom-right-radius:4px;font-weight:600}
      .xc-action{display:inline-flex;margin-top:10px;padding:8px 11px;border-radius:8px;background:#0c2e45;color:var(--xc-cyan);font-size:12px;font-weight:700;text-decoration:none;border:1px solid #13d8f344}
      .xc-quick{display:flex;gap:7px;flex-wrap:wrap;padding:0 13px 11px}.xc-quick button{border:1px solid #13d8f344;background:#0c2138;color:#cdebf6;border-radius:18px;padding:7px 10px;font-size:11px;cursor:pointer}.xc-quick button:hover{border-color:var(--xc-cyan)}
      .xc-form{padding:12px;display:flex;gap:8px;border-top:1px solid var(--xc-line);background:#0a172a}.xc-input{min-width:0;flex:1;border:1px solid #ffffff20;background:#061022;color:#fff;border-radius:10px;padding:12px;font:inherit;font-size:13px;outline:none}.xc-input:focus{border-color:var(--xc-cyan)}.xc-send{width:43px;border:0;border-radius:10px;background:linear-gradient(110deg,var(--xc-cyan),var(--xc-blue));color:#061022;font-size:19px;font-weight:900;cursor:pointer}
      @media(max-width:480px){.xc-launcher{right:15px;bottom:15px;width:56px;height:56px}.xc-window{right:8px;bottom:80px;width:calc(100vw - 16px);height:min(560px,calc(100dvh - 96px));}}
      @media(prefers-reduced-motion:reduce){.xc-window.xc-open{animation:none}.xc-launcher{transition:none}}
    `;
    document.head.appendChild(style);
    const root = document.createElement('div');
    root.id = 'xavier-chatbot';
    root.innerHTML = `
      <section class="xc-window" id="xc-window" role="dialog" aria-label="Chat de suporte Xavier Store" aria-modal="false">
        <header class="xc-header"><div class="xc-avatar" aria-hidden="true">X</div><div class="xc-headtext"><strong>Suporte Xavier Store</strong><div class="xc-status">Assistente virtual</div></div><button class="xc-close" type="button" aria-label="Fechar chat">×</button></header>
        <div class="xc-messages" id="xc-messages" aria-live="polite"></div>
        <div class="xc-quick" aria-label="Perguntas frequentes"><button type="button" data-question="Quais são os preços?">Preços</button><button type="button" data-question="Quais tamanhos estão disponíveis?">Tamanhos</button><button type="button" data-question="Como funciona a entrega?">Entrega</button><button type="button" data-question="Quero falar com atendimento">Atendimento</button></div>
        <form class="xc-form" id="xc-form"><input class="xc-input" id="xc-input" type="text" maxlength="400" placeholder="Escreva sua dúvida..." autocomplete="off" aria-label="Sua mensagem"><button class="xc-send" type="submit" aria-label="Enviar mensagem">➤</button></form>
      </section>
      <button class="xc-launcher" type="button" aria-label="Abrir suporte" aria-expanded="false" aria-controls="xc-window">✦</button>`;
    document.body.appendChild(root);
    const panel = root.querySelector('#xc-window');
    const launcher = root.querySelector('.xc-launcher');
    const messages = root.querySelector('#xc-messages');
    const input = root.querySelector('#xc-input');
    const form = root.querySelector('#xc-form');
    function addMessage(text, who = 'bot', action) {
      const bubble = document.createElement('div');
      bubble.className = `xc-message ${who === 'user' ? 'xc-user' : 'xc-bot'}`;
      bubble.textContent = text;
      if (action && action.href && action.texto) {
        const link = document.createElement('a');
        link.className = 'xc-action'; link.href = action.href; link.textContent = action.texto;
        if (action.href.startsWith('#')) link.addEventListener('click', () => closeChat());
        bubble.appendChild(document.createElement('br'));
        bubble.appendChild(link);
      }
      messages.appendChild(bubble);
      messages.scrollTop = messages.scrollHeight;
    }
    function openChat() { panel.classList.add('xc-open'); launcher.setAttribute('aria-expanded','true'); launcher.setAttribute('aria-label','Fechar suporte'); input.focus(); }
    function closeChat() { panel.classList.remove('xc-open'); launcher.setAttribute('aria-expanded','false'); launcher.setAttribute('aria-label','Abrir suporte'); }
    function reply(question) { addMessage(question, 'user'); const result = findAnswer(question, knowledge); addMessage(result.resposta || DEFAULT_DATA.respostaPadrao, 'bot', result.acao); }
    launcher.addEventListener('click', () => panel.classList.contains('xc-open') ? closeChat() : openChat());
    root.querySelector('.xc-close').addEventListener('click', closeChat);
    form.addEventListener('submit', (event) => { event.preventDefault(); const value = input.value.trim(); if (!value) return; input.value = ''; reply(value); });
    root.querySelectorAll('[data-question]').forEach((button) => button.addEventListener('click', () => reply(button.dataset.question)));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && panel.classList.contains('xc-open')) closeChat(); });
    addMessage(DEFAULT_DATA.mensagemInicial);
    fetch(dataUrl).then((response) => { if (!response.ok) throw new Error('Não foi possível carregar a base JSON'); return response.json(); })
      .then((json) => { if (json && Array.isArray(json.respostas)) knowledge = json; })
      .catch(() => { /* fallback seguro: o chat continua utilizável mesmo sem acesso ao JSON */ });
  }
  window.initChatbot = initChatbot;
})();
