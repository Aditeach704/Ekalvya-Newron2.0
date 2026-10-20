'use strict';

/* =========================================================
   EKALVYA — Main Frontend Application (Clean URL Router)
========================================================= */

const PAGES = {
  landing: {
    title: 'Meet your new thinking space',
    subtitle: 'A smarter workspace for ideas, questions, and the things you want to create.'
  },
  login: {
    title: 'Welcome back',
    subtitle: 'Sign in to continue to your workspace.'
  },
  signup: {
    title: 'Create your account',
    subtitle: 'Your next great idea starts here.'
  },
  forgot: {
    title: 'Reset your password',
    subtitle: 'We’ll help you get back into your account.'
  },
  chat: {
    title: 'AI Chat',
    subtitle: 'Ask a question, explore an idea, or work through a problem.'
  },
  profile: {
    title: 'Your profile',
    subtitle: 'Manage the details associated with your account.'
  },
  settings: {
    title: 'Settings',
    subtitle: 'Make your workspace feel right for you.'
  },
  help: {
    title: 'Help center',
    subtitle: 'Find answers and get help when you need it.'
  }
};

const NAV = [
  ['Workspace', [
    ['chat', '✧', 'AI Chat']
  ]],
  ['Account', [
    ['profile', '◉', 'Profile'],
    ['settings', '⚙', 'Settings'],
    ['help', '?', 'Help Center']
  ]]
];

const rawPath = location.pathname.replace(/\/+$/, '').toLowerCase();
const route = {
  '': 'landing',
  '/': 'landing',
  '/index.html': 'landing',
  '/login': 'login',
  '/login.html': 'login',
  '/signup': 'signup',
  '/signup.html': 'signup',
  '/forgot-password': 'forgot',
  '/forgot-password.html': 'forgot',
  '/chat': 'chat',
  '/chat.html': 'chat',
  '/profile': 'profile',
  '/profile.html': 'profile',
  '/settings': 'settings',
  '/settings.html': 'settings',
  '/help': 'help',
  '/help.html': 'help'
};

const page = route[rawPath] || 'landing';

const href = {
  landing: '/',
  login: '/login',
  signup: '/signup',
  forgot: '/forgot-password',
  chat: '/chat',
  profile: '/profile',
  settings: '/settings',
  help: '/help'
};

const $ = selector => document.querySelector(selector);

const esc = value =>
  String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);

function getStore(key, fallback = []) {
  try {
    const value = localStorage.getItem(`newron_${key}`);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function setStore(key, value) {
  try {
    localStorage.setItem(`newron_${key}`, JSON.stringify(value));
  } catch (error) {
    console.error('Could not save local data:', error);
  }
}

function toast(message) {
  const element = document.createElement('div');
  element.className = 'toast';
  element.textContent = message;
  document.body.appendChild(element);
  setTimeout(() => element.remove(), 3200);
}

function header() {
  return `
    <header class="topbar">
      <a class="brand" href="${href.landing}">
        <span class="brand-mark">E</span> Ekalvya
      </a>
      <nav class="top-links">
        <a href="${href.landing}">Home</a>
        <a href="${href.chat}">AI Chat</a>
        <a href="${href.help}">Help</a>
      </nav>
      <div class="top-actions">
        <a class="btn btn-ghost hide-mobile" href="${href.login}">Log in</a>
        <a class="btn btn-primary" href="${href.signup}">Get started ↗</a>
        <button class="btn mobile-menu" id="menuBtn" aria-label="Open navigation">☰</button>
      </div>
    </header>
  `;
}

function sidebar() {
  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand-row">
        <a class="sidebar-brand" href="${href.chat}">
          <span class="brand-mark">E</span>
          <span><strong>Ekalvya</strong><small>AI WORKSPACE</small></span>
        </a>
        <button class="sidebar-close" id="sidebarClose" aria-label="Close navigation">×</button>
      </div>
      <a class="sidebar-new-chat" href="${href.chat}">
        <span>＋</span><span>New conversation</span><kbd>↵</kbd>
      </a>
      <label class="sidebar-search">
        <span>⌕</span>
        <input id="sidebarSearch" type="search" placeholder="Search navigation" aria-label="Search navigation">
      </label>
      <div class="sidebar-scroll">
        ${NAV.map(group => `
          <section class="side-group">
            <div class="side-label">${group[0]}</div>
            <nav class="side-nav">
              ${group[1].map(([key, symbol, label]) => `
                <a class="nav-link ${page === key ? 'active' : ''}"
                  href="${href[key]}"
                  ${page === key ? 'aria-current="page"' : ''}>
                  <span class="nav-icon">${symbol}</span>
                  <span class="nav-text">${label}</span>
                  ${page === key ? '<span class="nav-active-dot"></span>' : ''}
                </a>
              `).join('')}
            </nav>
          </section>
        `).join('')}
      </div>
      <div class="sidebar-footer">
        <div class="sidebar-upgrade-icon">✦</div>
        <div class="sidebar-footer-copy">
          <strong>Your ideas, in motion</strong>
          <span>Keep every project moving forward.</span>
        </div>
        <a href="${href.profile}" class="sidebar-footer-link" aria-label="Open profile">↗</a>
      </div>
      <div class="sidebar-user">
        <span class="sidebar-avatar">E</span>
        <span class="sidebar-user-copy">
          <strong>Ekalvya workspace</strong>
          <small>Personal space</small>
        </span>
        <a href="${href.settings}" aria-label="Workspace settings">•••</a>
      </div>
    </aside>
  `;
}

function heading() {
  return `
    <div class="page-heading">
      <div>
        <h1>${PAGES[page].title}</h1>
        <p>${PAGES[page].subtitle}</p>
      </div>
      ${page === 'chat' ? `<a class="btn btn-primary" href="${href.chat}">＋ New chat</a>` : ''}
    </div>
  `;
}

function card(symbol, title, description, destination) {
  return `
    <a class="card card-link" href="${destination}">
      <div class="icon-box">${symbol}</div>
      <h3>${title}</h3>
      <p>${description}</p>
      <div style="margin-top:18px;color:var(--cyan);font-size:13px">Open workspace ↗</div>
    </a>
  `;
}

function landing() {
  return `
    <main>
      <section class="hero">
        <span class="pill">✦ A clearer way to create</span>
        <h1>Make room for<br><span class="gradient-text">great ideas.</span></h1>
        <p>One calm, connected space to ask questions, learn faster, write clearly, and keep every conversation close at hand.</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="${href.signup}">Get started for free ↗</a>
          <a class="btn" href="${href.login}">Sign in to your workspace</a>
        </div>
        <div class="hero-orb"></div>
      </section>
      <section class="section">
        <div class="center">
          <div class="eyebrow">One connected workspace</div>
          <h2>Everything you need to get moving.</h2>
          <p class="muted">Thoughtful tools. One simple place.</p>
        </div>
        <div class="grid grid-3" style="margin-top:28px">
          ${card('✧', 'AI Chat', 'Think through questions and ideas.', href.chat)}
          ${card('◉', 'Your profile', 'Manage your personal workspace.', href.profile)}
          ${card('⚙', 'Settings', 'Shape your workspace.', href.settings)}
        </div>
      </section>
      <footer class="footer">
        <span>© 2026 Ekalvya. Made for curious minds.</span>
        <span>
          <a href="${href.help}">Help</a> ·
          <a href="${href.settings}">Privacy & settings</a>
        </span>
      </footer>
    </main>
  `;
}

function auth() {
  const login = page === 'login';
  const signup = page === 'signup';

  return `
    <main class="auth-wrap">
      <section class="auth-card">
        <a class="brand" href="${href.landing}">
          <span class="brand-mark">E</span> Ekalvya
        </a>
        <div class="auth-kicker">YOUR PERSONAL AI WORKSPACE</div>
        <h1>${login ? 'Welcome back' : signup ? 'Create your account' : 'Reset your password'}</h1>
        <p>
          ${login ? 'Sign in to continue your conversations and workspace.'
            : signup ? 'Create your account and start exploring with Ekalvya.'
            : 'Enter your email to learn about password recovery options.'}
        </p>
        <form id="authForm">
          ${signup ? `
            <div class="field">
              <label for="name">Full name</label>
              <input id="name" name="name" autocomplete="name" placeholder="Your name" required>
            </div>
          ` : ''}
          <div class="field">
            <label for="email">Email address</label>
            <input id="email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required>
          </div>
          ${page !== 'forgot' ? `
            <div class="field">
              <label for="password">Password</label>
              <input id="password" name="password" type="password"
                autocomplete="${login ? 'current-password' : 'new-password'}"
                placeholder="Enter your password" minlength="8" required>
            </div>
          ` : ''}
          ${login ? `
            <div class="auth-forgot">
              <a href="${href.forgot}">Forgot password?</a>
            </div>
          ` : ''}
          <button class="btn btn-primary btn-block" type="submit">
            ${login ? 'Sign in' : signup ? 'Create account' : 'Continue'}
            <span>→</span>
          </button>
          <div id="authMessage" class="notice hidden" role="status"></div>
        </form>
        <div class="auth-divider"><span>EKALVYA ANI</span></div>
        <div class="auth-foot">
          ${login
            ? `New to Ekalvya? <a href="${href.signup}">Create an account</a>`
            : signup
              ? `Already have an account? <a href="${href.login}">Sign in</a>`
              : `Remembered your password? <a href="${href.login}">Back to login</a>`}
        </div>
      </section>
    </main>
  `;
}

async function submitAuth(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  const message = $('#authMessage');

  const mode = page === 'signup' ? 'register' : page === 'login' ? 'login' : 'forgot-password';
  const payload = { email: form.elements.email?.value.trim() };

  if (page !== 'forgot') payload.password = form.elements.password?.value;
  if (page === 'signup') payload.name = form.elements.name?.value.trim();

  message.classList.remove('hidden');
  message.textContent = 'Please wait…';
  button.disabled = true;

  try {
    const response = await fetch(`/api/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || data.message || `Request failed (${response.status})`);
    }

    if (page === 'forgot') {
      message.textContent = 'Password recovery is not enabled yet. Please contact your administrator.';
      return;
    }

    message.textContent = 'Success! Opening your workspace…';

    const next = new URLSearchParams(location.search).get('next');
    const safeNext = /^\/(chat|profile|settings|help)(\?.*)?$/.test(next || '')
      ? next
      : href.chat;

    setTimeout(() => {
      location.href = safeNext;
    }, 400);
  } catch (error) {
    message.textContent = error.message || 'Could not complete this request. Please try again.';
  } finally {
    button.disabled = false;
  }
}

function chat() {
  const recent = normalizeChats().slice(0, 30);
  const active = getStore('active_chat_id', '');

  const recentMarkup = recent.length
    ? recent.map(item => `
        <li>
          <button type="button"
            class="chat-history-item ${item.id === active ? 'active' : ''}"
            data-load-chat="${esc(item.id)}"
            title="${esc(item.title)}">
            <span class="history-item-title">${esc(item.title)}</span>
            <span class="history-item-date">${esc(item.date)}</span>
          </button>
        </li>
      `).join('')
    : '<li class="history-empty">Your conversations will appear here.</li>';

  return `
    <div class="newron-chat-workspace">
      <aside class="chat-sidebar" id="chatSidebar">
        <a class="chat-brand" href="${href.landing}">
          <span class="chat-brand-mark">E</span><span>Ekalvya</span>
        </a>
        <button class="new-chat-btn" id="newChatBtn" type="button">
          <span class="new-chat-plus">＋</span> New Chat
        </button>
        <div class="chat-nav-label">Previous conversations</div>
        <ul class="chat-history" id="chatHistory">${recentMarkup}</ul>
        <div class="chat-sidebar-footer">
          <a href="${href.profile}" class="chat-sidebar-link"><span>◉</span> Profile</a>
          <a href="${href.settings}" class="chat-sidebar-link"><span>⚙</span> Settings</a>
          <a href="${href.help}" class="chat-sidebar-link"><span>?</span> Help &amp; FAQ</a>
          <a href="#" class="chat-sidebar-link chat-signout" id="signOutLink"><span>↪</span> Sign out</a>
        </div>
      </aside>
      <main class="main-chat-container">
        <header class="chat-header">
          <div class="chat-header-left">
            <button class="chat-mobile-toggle" id="chatMobileToggle" type="button" aria-label="Toggle sidebar">☰</button>
            <span class="model-selector">Ekalvya <span class="chat-version">AI Assistant</span></span>
          </div>
          <a href="${href.settings}" class="chat-options">Options <span>⚙</span></a>
        </header>
        <div class="messages-viewport" id="viewport">
          <div class="messages-list" id="messages">
            <div class="chat-welcome" id="chatWelcome">
              <div class="chat-welcome-icon">✦</div>
              <div class="chat-welcome-eyebrow">EKALVYA AI</div>
              <h1>What can I help you with?</h1>
              <p>Ask anything, explore an idea, or continue a previous conversation.</p>
              <div class="chat-suggestions">
                <button class="prompt-btn chat-suggestion" data-prompt="Explain a difficult topic in simple steps" type="button">
                  <span>✧</span><strong>Learn something</strong><small>Get a clear explanation</small>
                </button>
                <button class="prompt-btn chat-suggestion" data-prompt="Help me brainstorm a creative project" type="button">
                  <span>✎</span><strong>Brainstorm ideas</strong><small>Explore possibilities</small>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="input-dock">
          <form class="input-box" id="chatForm">
            <textarea id="chatInput" rows="1" placeholder="Message Ekalvya… (Enter to send)" aria-label="Message Ekalvya" required></textarea>
            <div class="input-actions">
              <label class="google-search-toggle" title="Search the web for relevant sources">
                <input id="useGoogleSearch" type="checkbox"><span>⌕</span> Web Search
              </label>
              <button type="submit" class="send-btn" aria-label="Send message">↑</button>
            </div>
          </form>
          <div class="disclaimer" id="chatStatus">Enter to send · Shift + Enter for a new line.</div>
        </div>
      </main>
    </div>
  `;
}

function renderMarkdown(raw) {
  const escaped = esc(raw);
  const codeBlocks = [];
  let output = escaped.replace(/```([\w-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const token = `@@CODEBLOCK${codeBlocks.length}@@`;
    codeBlocks.push(`<pre class="md-code"><code>${code.replace(/\n$/, '')}</code></pre>`);
    return token;
  });

  output = output.replace(/`([^`\n]+)`/g, '<code class="md-inline-code">$1</code>');
  output = output
    .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
    .replace(/^&gt;\s?(.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/^\s*[-*+]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(?:<li>[\s\S]*?<\/li>\n?)+/g, match => `<ul>${match}</ul>`)
    .replace(/^\s*\d+[.)]\s+(.+)$/gm, '<li class="md-ordered-item">$1</li>')
    .replace(/(?:<li class="md-ordered-item">[\s\S]*?<\/li>\n?)+/g, match => `<ol>${match.replace(/ class="md-ordered-item"/g, '')}</ol>`);

  output = output.split(/\n{2,}/).map(part => {
    if (/^@@CODEBLOCK\d+@@$/.test(part)) return part;
    if (/^<(h[1-3]|ul|ol|blockquote|pre)/.test(part)) return part;
    return part ? `<p>${part.replace(/\n/g, '<br>')}</p>` : '';
  }).join('');

  return output.replace(/@@CODEBLOCK(\d+)@@/g, (_, index) => codeBlocks[Number(index)]);
}

function scrollChatToBottom() {
  const viewport = $('#viewport');
  if (viewport) viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
}

function addListenControl(row, text) {
  if (row.querySelector('.listen-message')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'listen-message';
  button.textContent = '🔊 Listen';
  button.title = 'Read this answer aloud';

  button.addEventListener('click', () => {
    if (!('speechSynthesis' in window)) return toast('Text-to-speech is not supported.');
    if (button.dataset.speaking === 'true') {
      speechSynthesis.cancel();
      button.dataset.speaking = 'false';
      button.textContent = '🔊 Listen';
      return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(String(text || ''));
    utterance.lang = document.documentElement.lang || 'en-US';
    utterance.onend = utterance.onerror = () => {
      button.dataset.speaking = 'false';
      button.textContent = '🔊 Listen';
    };
    button.dataset.speaking = 'true';
    button.textContent = '⏹ Stop';
    speechSynthesis.speak(utterance);
  });
  row.appendChild(button);
}

function appendMessage(role, text) {
  $('#chatWelcome')?.remove();
  const row = document.createElement('div');
  row.className = `message-row ${role === 'assistant' ? 'ai' : 'user'}`;
  const avatar = document.createElement('div');
  avatar.className = `avatar ${role === 'assistant' ? 'ai' : 'user'}`;
  avatar.textContent = role === 'assistant' ? 'E' : 'You';
  const body = document.createElement('div');
  body.className = 'message-body';
  if (role === 'assistant') body.innerHTML = renderMarkdown(text);
  else body.textContent = text;

  row.append(avatar, body);
  $('#messages')?.appendChild(row);
  if (role === 'assistant') addListenControl(row, text);
  scrollChatToBottom();
  return body;
}

function appendCitations(container, citations) {
  if (!Array.isArray(citations) || !citations.length) return;
  const wrapper = document.createElement('div');
  wrapper.className = 'small';
  wrapper.style.cssText = 'margin:8px 0 16px 10px;display:flex;flex-wrap:wrap;gap:8px';
  const label = document.createElement('strong');
  label.textContent = 'Sources:';
  wrapper.appendChild(label);

  citations.slice(0, 10).forEach((source, index) => {
    if (!source?.url || !/^https?:\/\//i.test(source.url)) return;
    const link = document.createElement('a');
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = `[${index + 1}] ${source.title || source.url}`;
    link.style.cssText = 'color:var(--cyan);text-decoration:underline;overflow-wrap:anywhere';
    wrapper.appendChild(link);
  });
  if (wrapper.children.length > 1) container.after(wrapper);
}

function normalizeChats() {
  const chats = getStore('history', []);
  const normalized = chats.map((c, i) => ({
    id: c.id || `legacy-${i}-${String(c.title || 'chat').replace(/[^a-z0-9]/gi, '').slice(0, 10)}`,
    title: c.title || 'Previous conversation',
    date: c.date || '',
    messages: Array.isArray(c.messages) ? c.messages : []
  }));
  setStore('history', normalized);
  return normalized;
}

function refreshChatHistory() {
  const list = $('#chatHistory');
  if (!list) return;
  const chats = normalizeChats();
  const active = getStore('active_chat_id', '');
  list.innerHTML = chats.length
    ? chats.slice(0, 50).map(c => `
        <li>
          <button type="button" class="chat-history-item ${c.id === active ? 'active' : ''}"
            data-load-chat="${esc(c.id)}" title="${esc(c.title)}">
            <span class="history-item-title">${esc(c.title)}</span>
            <span class="history-item-date">${esc(c.date)}</span>
          </button>
        </li>
      `).join('')
    : '<li class="history-empty">Your conversations will appear here.</li>';

  list.querySelectorAll('[data-load-chat]').forEach(b => {
    b.addEventListener('click', () => loadConversation(b.dataset.loadChat));
  });
}

function saveCurrentConversation() {
  const messages = getStore('current_chat', []);
  if (!messages.length) return;
  let chats = normalizeChats();
  let id = getStore('active_chat_id', '');
  let current = chats.find(c => c.id === id);

  if (!current) {
    id = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    current = {
      id,
      title: messages.find(m => m.role === 'user')?.text?.slice(0, 70) || 'New conversation',
      date: new Date().toLocaleString(),
      messages: []
    };
    chats.unshift(current);
    setStore('active_chat_id', id);
  }

  current.messages = messages;
  current.title = messages.find(m => m.role === 'user')?.text?.slice(0, 70) || current.title;
  current.date = new Date().toLocaleString();
  chats = [current, ...chats.filter(c => c.id !== current.id)].slice(0, 100);
  setStore('history', chats);
  refreshChatHistory();
}

function showWelcome() {
  const list = $('#messages');
  if (!list) return;
  list.innerHTML = `
    <div class="chat-welcome" id="chatWelcome">
      <div class="chat-welcome-icon">✦</div>
      <div class="chat-welcome-eyebrow">EKALVYA AI</div>
      <h1>What can I help you with?</h1>
      <p>Ask anything, explore an idea, or continue a previous conversation.</p>
      <div class="chat-suggestions">
        <button class="prompt-btn chat-suggestion" data-prompt="Explain a difficult topic in simple steps" type="button">
          <span>✧</span><strong>Learn something</strong><small>Get a clear explanation</small>
        </button>
        <button class="prompt-btn chat-suggestion" data-prompt="Help me brainstorm a creative project" type="button">
          <span>✎</span><strong>Brainstorm ideas</strong><small>Explore possibilities</small>
        </button>
      </div>
    </div>
  `;
  bindPromptButtons();
}

function loadConversation(id) {
  const conversation = normalizeChats().find(c => c.id === id);
  if (!conversation) return;
  setStore('active_chat_id', conversation.id);
  setStore('current_chat', conversation.messages || []);
  const list = $('#messages');
  if (!list) return;
  list.innerHTML = '';
  if (conversation.messages.length) {
    conversation.messages.forEach(m => appendMessage(m.role, m.text));
  } else {
    showWelcome();
  }
  refreshChatHistory();
  $('#chatSidebar')?.classList.remove('open');
  scrollChatToBottom();
}

async function sendChat(event) {
  event.preventDefault();
  const input = $('#chatInput');
  const text = input.value.trim();
  if (!text) return;
  const useGoogleSearch = Boolean($('#useGoogleSearch')?.checked);

  input.value = '';
  input.style.height = 'auto';
  appendMessage('user', text);

  let conversation = getStore('current_chat', []);
  conversation.push({ role: 'user', text });
  conversation = conversation.slice(-24);
  setStore('current_chat', conversation);
  saveCurrentConversation();

  const answerBubble = appendMessage('assistant', 'Thinking…');
  const submitButton = $('#chatForm button[type="submit"]');
  if (submitButton) submitButton.disabled = true;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ message: text, history: conversation.slice(0, -1), useGoogleSearch })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || data.message || `Request failed (${response.status})`);
    const answer = data.reply || data.text || data.response || data.message;
    if (typeof answer !== 'string' || !answer.trim()) throw new Error('The server returned an empty response.');

    answerBubble.innerHTML = renderMarkdown(answer);
    const row = answerBubble.closest('.message-row');
    row?.querySelector('.listen-message')?.remove();
    if (row) addListenControl(row, answer);
    appendCitations(answerBubble, data.citations);

    conversation.push({ role: 'assistant', text: answer });
    setStore('current_chat', conversation.slice(-24));
    saveCurrentConversation();
    scrollChatToBottom();
  } catch (error) {
    answerBubble.textContent = error.message || 'I couldn’t reach the chat service.';
  } finally {
    if (submitButton) submitButton.disabled = false;
    input.focus();
  }
}

function bindPromptButtons() {
  document.querySelectorAll('.prompt-btn').forEach(btn => {
    if (btn.dataset.boundPrompt === '1') return;
    btn.dataset.boundPrompt = '1';
    btn.addEventListener('click', () => {
      const input = $('#chatInput');
      if (input) {
        input.value = btn.dataset.prompt || '';
        input.focus();
      }
    });
  });
}

function accountWorkspace() {
  const name = getStore('account_user', { name: 'Ekalvya account' }).name || 'Ekalvya account';
  const currentLabel = page === 'profile' ? 'Profile' : page === 'settings' ? 'Settings' : 'Help & FAQ';

  return `
    <div class="newron-chat-workspace account-workspace">
      <aside class="chat-sidebar" id="chatSidebar">
        <a class="chat-brand" href="${href.chat}">
          <span class="chat-brand-mark">E</span><span>Ekalvya</span>
        </a>
        <a class="new-chat-btn" href="${href.chat}">
          <span class="new-chat-plus">＋</span> New Chat
        </a>
        <div class="chat-nav-label">Workspace</div>
        <a class="chat-sidebar-link" href="${href.chat}"><span>✧</span> AI Chat</a>
        <div class="chat-nav-label">Account</div>
        <a class="chat-sidebar-link ${page === 'profile' ? 'active' : ''}" href="${href.profile}"><span>◉</span> Profile</a>
        <a class="chat-sidebar-link ${page === 'settings' ? 'active' : ''}" href="${href.settings}"><span>⚙</span> Settings</a>
        <a class="chat-sidebar-link ${page === 'help' ? 'active' : ''}" href="${href.help}"><span>?</span> Help &amp; FAQ</a>
        <div class="chat-sidebar-footer">
          <button class="chat-sidebar-link chat-signout" id="accountSignOut" type="button"><span>↪</span> Sign out</button>
        </div>
      </aside>
      <main class="main-chat-container">
        <header class="chat-header">
          <div class="chat-header-left">
            <button class="chat-mobile-toggle" id="chatMobileToggle" type="button" aria-label="Toggle sidebar">☰</button>
            <span class="model-selector">${currentLabel}</span>
          </div>
        </header>
        <div class="account-page-content">
          <div class="account-page-inner">
            ${page === 'profile' ? profile() : page === 'settings' ? settings() : help()}
          </div>
        </div>
      </main>
    </div>
  `;
}

function profile() {
  return `
    ${heading()}
    <section class="profile-hero card">
      <div class="profile-avatar-large" id="profileAvatar">E</div>
      <div class="profile-hero-copy">
        <span class="eyebrow">ACCOUNT OVERVIEW</span>
        <h2 id="profileDisplayHeading">Your Ekalvya account</h2>
        <div class="profile-status"><span class="status-dot"></span> Signed-in account</div>
      </div>
    </section>
    <div class="grid grid-2 profile-grid">
      <section class="card">
        <h3>Account information</h3>
        <div class="profile-detail"><span>Full name</span><strong id="profileNameValue">Loading…</strong></div>
        <div class="profile-detail"><span>Email address</span><strong id="profileEmailValue">Loading…</strong></div>
      </section>
    </div>
    <section class="card danger-zone" style="margin-top:24px">
      <h3>Sign out of Ekalvya</h3>
      <button class="btn btn-danger" id="profileSignOut" type="button">Sign out</button>
    </section>
  `;
}

function settings() {
  return `
    ${heading()}
    <section class="card settings-feature">
      <h2>Workspace appearance</h2>
      <div class="theme-options" role="radiogroup">
        <button type="button" class="theme-choice" data-theme-choice="light"><strong>Light</strong></button>
        <button type="button" class="theme-choice" data-theme-choice="dark"><strong>Dark</strong></button>
        <button type="button" class="theme-choice" data-theme-choice="blue"><strong>Blue</strong></button>
      </div>
    </section>
    <section class="card settings-section" style="margin-top:24px">
      <h3>Interface</h3>
      <div class="toggle-row">
        <span>Compact interface</span>
        <input class="switch" type="checkbox" id="compactSetting">
      </div>
      <div class="toggle-row">
        <span>Reduce motion</span>
        <input class="switch" type="checkbox" id="motionSetting">
      </div>
      <button class="btn btn-primary" id="saveSettings" style="margin-top:16px">Save preferences</button>
    </section>
  `;
}

function help() {
  return `
    ${heading()}
    <section class="help-hero card">
      <h2>How can we help?</h2>
      <p class="muted">Check common questions or contact support.</p>
    </section>
  `;
}

async function signOut() {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  } catch (error) {
    console.error('Sign-out request failed:', error);
  } finally {
    location.href = href.login;
  }
}

async function loadAccount() {
  if (!['profile', 'settings', 'help'].includes(page)) return;
  try {
    const response = await fetch('/api/auth/me', { credentials: 'same-origin' });
    if (!response.ok) throw new Error('Sign in required');
    const data = await response.json();
    const user = data.user || {};
    const name = user.name || 'Ekalvya user';
    const email = user.email || 'Not available';
    const initial = name.trim().charAt(0).toUpperCase() || 'E';

    setStore('account_user', { name, email });
    if (page === 'profile') {
      const headingEl = $('#profileDisplayHeading');
      const nameVal = $('#profileNameValue');
      const emailVal = $('#profileEmailValue');
      const avatarEl = $('#profileAvatar');
      if (headingEl) headingEl.textContent = name;
      if (nameVal) nameVal.textContent = name;
      if (emailVal) emailVal.textContent = email;
      if (avatarEl) avatarEl.textContent = initial;
    }
  } catch (error) {
    // Avoid redirect loops if already on login
    if (window.location.pathname !== '/login') {
      location.replace(`${href.login}?next=${encodeURIComponent(location.pathname)}`);
    }
  }
}

function applyPreferences() {
  const s = getStore('settings', {});
  const theme = ['dark', 'light', 'blue'].includes(s.theme) ? s.theme : 'light';
  document.documentElement.dataset.theme = theme;
  document.body.dataset.theme = theme;
  document.body.classList.toggle('compact', Boolean(s.compact));
  document.body.classList.toggle('reduce-motion', Boolean(s.motion));
}

function updateThemeChoices() {
  const current = getStore('settings', {}).theme || 'light';
  document.querySelectorAll('[data-theme-choice]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.themeChoice === current));
  });
}

function bind() {
  $('#authForm')?.addEventListener('submit', submitAuth);
  $('#chatForm')?.addEventListener('submit', sendChat);
  $('#chatInput')?.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      $('#chatForm')?.requestSubmit();
    }
  });

  $('#newChatBtn')?.addEventListener('click', () => {
    saveCurrentConversation();
    setStore('current_chat', []);
    setStore('active_chat_id', '');
    showWelcome();
    refreshChatHistory();
    $('#chatInput')?.focus();
  });

  $('#chatMobileToggle')?.addEventListener('click', () => $('#chatSidebar')?.classList.toggle('open'));
  $('#signOutLink')?.addEventListener('click', e => { e.preventDefault(); signOut(); });
  $('#accountSignOut')?.addEventListener('click', signOut);
  $('#profileSignOut')?.addEventListener('click', signOut);

  document.querySelectorAll('[data-theme-choice]').forEach(b => {
    b.addEventListener('click', () => {
      const s = getStore('settings', {});
      s.theme = b.dataset.themeChoice;
      setStore('settings', s);
      applyPreferences();
      updateThemeChoices();
    });
  });

  $('#saveSettings')?.addEventListener('click', () => {
    const s = getStore('settings', {});
    s.compact = Boolean($('#compactSetting')?.checked);
    s.motion = Boolean($('#motionSetting')?.checked);
    setStore('settings', s);
    applyPreferences();
    toast('Preferences saved.');
  });

  const s = getStore('settings', {});
  if ($('#compactSetting')) $('#compactSetting').checked = Boolean(s.compact);
  if ($('#motionSetting')) $('#motionSetting').checked = Boolean(s.motion);
  applyPreferences();
  updateThemeChoices();
}

async function init() {
  const app = $('#app');
  if (!app) return;

  const currentPath = window.location.pathname.replace(/\/+$/, '').toLowerCase() || '/';

  // Explicitly check current route category
  const isProtectedPath = ['/chat', '/profile', '/settings', '/help'].includes(currentPath);
  const isGuestAuthPath = ['/login', '/signup', '/forgot-password'].includes(currentPath);

  // Probe authentication state
  let isAuthenticated = false;
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json' }
    });
    if (response.ok) {
      isAuthenticated = true;
    }
  } catch (err) {
    isAuthenticated = false;
  }

  // Guard 1: Logged-in user on /login, /signup, or /forgot-password
  if (isAuthenticated && isGuestAuthPath) {
    if (currentPath !== '/chat') {
      window.location.replace('/chat');
      return;
    }
  }

  // Guard 2: Unauthenticated user on protected route
  if (!isAuthenticated && isProtectedPath) {
    if (currentPath !== '/login') {
      window.location.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
  }

  document.title = `${PAGES[page]?.title || 'Ekalvya'} — Ekalvya`;

  if (page === 'chat') {
    document.body.classList.add('newron-chat-page');
    app.innerHTML = chat();
  } else if (['profile', 'settings', 'help'].includes(page)) {
    document.body.classList.add('newron-chat-page');
    app.innerHTML = accountWorkspace();
  } else if (page === 'landing') {
    app.innerHTML = header() + landing();
  } else {
    app.innerHTML = header() + `<div class="shell">${sidebar()}<main class="main">${auth()}</main></div>`;
  }

  applyPreferences();
  bind();

  if (['profile', 'settings', 'help'].includes(page)) {
    await loadAccount();
  }

  if (page === 'chat') {
    refreshChatHistory();
    const active = getStore('active_chat_id', '');
    const chats = normalizeChats();
    if (active && chats.some(c => c.id === active)) {
      loadConversation(active);
    } else {
      const current = getStore('current_chat', []);
      if (current.length) current.forEach(m => appendMessage(m.role, m.text));
    }
  }
}

init();