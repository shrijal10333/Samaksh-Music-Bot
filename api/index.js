const config = require('../src/config.js');
const getAllCommands = require('../src/utils/commandScanner.js');

let botInstance = null;
function getOrStartBot() {
  if (!botInstance && config.token && config.token !== "YOUR_BOT_TOKEN_HERE") {
    try {
      botInstance = require('../index.js');
    } catch (e) {
      console.error("[Vercel Handler] Bot instantiation notice:", e.message);
    }
  }
  return botInstance;
}

module.exports = (req, res) => {
  const bot = getOrStartBot();
  const isBotLogged = bot && bot.user;
  const botTag = isBotLogged ? bot.user.tag : (config.token && config.token !== "YOUR_BOT_TOKEN_HERE" ? "Connecting..." : "Token Missing");
  const commands = getAllCommands();
  const prefix = config.prefix || ".";

  // Handle JSON API Requests
  if (req.query && (req.query.json === 'true' || req.query.format === 'json' || req.query.commands === 'true')) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      name: "Samaksh Music Bot",
      botUser: botTag,
      botStatus: isBotLogged ? "online" : "initializing",
      prefix: prefix,
      totalCommands: commands.length,
      commands: commands,
      support: config.links ? config.links.support : "https://discord.gg/u98eRQRQQZ",
      invite: config.links ? config.links.invite : "https://discord.gg/u98eRQRQQZ",
      timestamp: new Date().toISOString()
    });
  }

  // Extract Unique Categories & Counts
  const categoriesMap = {};
  commands.forEach(cmd => {
    const cat = cmd.category || "General";
    categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
  });
  const categoriesList = Object.keys(categoriesMap).sort();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Samaksh Music Bot - All Bot Commands (${commands.length})</title>
  <meta name="description" content="Explore all ${commands.length} commands for Samaksh Music & Utility Discord Bot including Music, Moderation, Automod, Giveaways, Tracker, and Utilities.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090c10;
      --card-bg: rgba(22, 27, 34, 0.75);
      --card-border: rgba(255, 255, 255, 0.08);
      --accent: #00D4FF;
      --accent-glow: rgba(0, 212, 255, 0.25);
      --purple: #9333ea;
      --text: #f0f6fc;
      --text-muted: #8b949e;
      --success: #3fb950;
      --warning: #d29922;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Outfit', sans-serif;
      background-color: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 15px;
      overflow-x: hidden;
      background-image: 
        radial-gradient(circle at 10% 15%, rgba(0, 212, 255, 0.09) 0%, transparent 40%),
        radial-gradient(circle at 90% 85%, rgba(147, 51, 234, 0.09) 0%, transparent 40%);
    }

    header {
      width: 100%;
      max-width: 1100px;
      margin-bottom: 30px;
    }

    .top-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 15px;
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      border: 1px solid var(--card-border);
      padding: 16px 28px;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    }

    .logo-group {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .logo-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #00D4FF 0%, #7928CA 100%);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      box-shadow: 0 8px 20px var(--accent-glow);
    }

    .logo-text h1 {
      font-size: 1.5rem;
      font-weight: 800;
      background: linear-gradient(90deg, #ffffff, var(--accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .logo-text p {
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(63, 185, 80, 0.12);
      border: 1px solid rgba(63, 185, 80, 0.3);
      color: var(--success);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background-color: var(--success);
      border-radius: 50%;
      box-shadow: 0 0 10px var(--success);
    }

    .container {
      width: 100%;
      max-width: 1100px;
    }

    .hero-section {
      text-align: center;
      margin: 20px 0 35px 0;
    }

    .hero-title {
      font-size: 2.5rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 10px;
    }

    .hero-subtitle {
      color: var(--text-muted);
      font-size: 1.05rem;
      max-width: 650px;
      margin: 0 auto 25px auto;
    }

    .stats-row {
      display: flex;
      justify-content: center;
      gap: 20px;
      flex-wrap: wrap;
      margin-bottom: 30px;
    }

    .stat-pill {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--card-border);
      padding: 10px 22px;
      border-radius: 30px;
      font-size: 0.95rem;
      color: var(--text-muted);
    }

    .stat-pill strong {
      color: var(--accent);
      font-family: 'JetBrains Mono', monospace;
    }

    /* Search & Filter Bar */
    .controls-panel {
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      padding: 24px;
      margin-bottom: 30px;
      box-shadow: 0 15px 35px rgba(0,0,0,0.3);
    }

    .search-wrapper {
      position: relative;
      margin-bottom: 20px;
    }

    .search-input {
      width: 100%;
      padding: 14px 20px 14px 48px;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      color: #fff;
      font-size: 1rem;
      font-family: 'Outfit', sans-serif;
      outline: none;
      transition: all 0.2s;
    }

    .search-input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 15px var(--accent-glow);
    }

    .search-icon {
      position: absolute;
      left: 18px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.1rem;
      color: var(--text-muted);
    }

    .categories-flex {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .cat-btn {
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      color: var(--text-muted);
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .cat-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .cat-btn.active {
      background: linear-gradient(135deg, var(--accent) 0%, #0088FF 100%);
      color: #000;
      border-color: transparent;
      box-shadow: 0 4px 12px var(--accent-glow);
    }

    .cat-count {
      background: rgba(0, 0, 0, 0.25);
      padding: 2px 7px;
      border-radius: 10px;
      font-size: 0.75rem;
      font-family: 'JetBrains Mono', monospace;
    }

    .cat-btn.active .cat-count {
      background: rgba(0, 0, 0, 0.2);
      color: #000;
    }

    /* Command Grid */
    .commands-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .cmd-card {
      background: var(--card-bg);
      backdrop-filter: blur(12px);
      border: 1px solid var(--card-border);
      border-radius: 18px;
      padding: 22px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
    }

    .cmd-card:hover {
      transform: translateY(-4px);
      border-color: rgba(0, 212, 255, 0.35);
      box-shadow: 0 12px 30px rgba(0, 212, 255, 0.12);
    }

    .cmd-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 12px;
    }

    .cmd-name {
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--accent);
      word-break: break-all;
    }

    .cmd-category-tag {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 3px 9px;
      border-radius: 8px;
      background: rgba(147, 51, 234, 0.15);
      border: 1px solid rgba(147, 51, 234, 0.3);
      color: #c084fc;
      font-weight: 700;
    }

    .cmd-desc {
      color: #d1d5db;
      font-size: 0.92rem;
      line-height: 1.5;
      margin-bottom: 16px;
      flex-grow: 1;
    }

    .cmd-meta {
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 0.82rem;
      color: var(--text-muted);
    }

    .cmd-aliases {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      max-width: 200px;
    }

    .alias-pill {
      background: rgba(255, 255, 255, 0.06);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .copy-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--card-border);
      color: var(--text);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .copy-btn:hover {
      background: var(--accent);
      color: #000;
      border-color: transparent;
    }

    .no-results {
      grid-column: 1 / -1;
      text-align: center;
      padding: 60px 20px;
      background: var(--card-bg);
      border: 1px dashed var(--card-border);
      border-radius: 20px;
      color: var(--text-muted);
    }

    .no-results h3 {
      font-size: 1.3rem;
      color: #fff;
      margin-bottom: 8px;
    }

    .nav-actions {
      display: flex;
      gap: 10px;
    }

    .btn {
      padding: 10px 20px;
      border-radius: 12px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #00D4FF 0%, #0088FF 100%);
      color: #000;
      box-shadow: 0 4px 15px var(--accent-glow);
    }

    .btn-primary:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.06);
      color: var(--text);
      border: 1px solid var(--card-border);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    /* Toast Notification */
    #toast {
      position: fixed;
      bottom: 25px;
      right: 25px;
      background: linear-gradient(135deg, #00D4FF 0%, #0088FF 100%);
      color: #000;
      padding: 12px 22px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.9rem;
      box-shadow: 0 10px 25px rgba(0, 212, 255, 0.3);
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      z-index: 9999;
    }

    #toast.show {
      transform: translateY(0);
      opacity: 1;
    }

    footer {
      margin-top: auto;
      padding: 30px 0 10px 0;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85rem;
    }
  </style>
</head>
<body>
  <header>
    <div class="top-nav">
      <div class="logo-group">
        <div class="logo-icon">🎵</div>
        <div class="logo-text">
          <h1>Samaksh Music Bot</h1>
          <p>Official Command List & Documentation</p>
        </div>
      </div>
      <div class="nav-actions">
        <a href="${config.links ? config.links.invite : '#'}" target="_blank" class="btn btn-primary">➕ Invite Bot</a>
        <a href="${config.links ? config.links.support : '#'}" target="_blank" class="btn btn-secondary">💬 Support</a>
      </div>
    </div>
  </header>

  <div class="container">
    <div class="hero-section">
      <h2 class="hero-title">Bot Command Explorer</h2>
      <p class="hero-subtitle">Discover all ${commands.length} commands available in SamakshBot. Search by name, description, or filter by category.</p>
      
      <div class="stats-row">
        <div class="stat-pill">Prefix: <strong>${prefix}</strong></div>
        <div class="stat-pill">Total Commands: <strong>${commands.length}</strong></div>
        <div class="stat-pill">Categories: <strong>${categoriesList.length}</strong></div>
      </div>
    </div>

    <!-- Search & Filters -->
    <div class="controls-panel">
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input type="text" id="searchInput" class="search-input" placeholder="Search commands, aliases, or descriptions (e.g. play, ban, skip, automod)...">
      </div>

      <div class="categories-flex">
        <button class="cat-btn active" data-cat="all">
          All Commands <span class="cat-count">${commands.length}</span>
        </button>
        ${categoriesList.map(cat => `
          <button class="cat-btn" data-cat="${cat}">
            ${cat} <span class="cat-count">${categoriesMap[cat]}</span>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Commands List Grid -->
    <div class="commands-grid" id="commandsGrid">
      ${commands.map(cmd => `
        <div class="cmd-card" data-name="${cmd.name.toLowerCase()}" data-category="${cmd.category}" data-search="${(cmd.name + ' ' + cmd.description + ' ' + (cmd.aliases ? cmd.aliases.join(' ') : '')).toLowerCase()}">
          <div>
            <div class="cmd-header">
              <span class="cmd-name">${prefix}${cmd.name}</span>
              <span class="cmd-category-tag">${cmd.category}</span>
            </div>
            <div class="cmd-desc">${cmd.description}</div>
          </div>
          <div class="cmd-meta">
            <div class="cmd-aliases">
              ${cmd.aliases && cmd.aliases.length > 0 ? cmd.aliases.map(a => `<span class="alias-pill">${a}</span>`).join('') : '<span style="opacity:0.5;">No aliases</span>'}
            </div>
            <button class="copy-btn" onclick="copyCommand('${prefix}${cmd.name}')">
              📋 Copy
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <div id="toast">Copied to clipboard!</div>

  <footer>
    Samaksh Music Bot &bull; Powered by discord.js v14 & Lavalink v4
  </footer>

  <script>
    const searchInput = document.getElementById('searchInput');
    const catButtons = document.querySelectorAll('.cat-btn');
    const cmdCards = document.querySelectorAll('.cmd-card');
    const grid = document.getElementById('commandsGrid');
    const toast = document.getElementById('toast');

    let activeCategory = 'all';

    function filterCommands() {
      const query = searchInput.value.toLowerCase().trim();
      let visibleCount = 0;

      cmdCards.forEach(card => {
        const catMatch = activeCategory === 'all' || card.getAttribute('data-category') === activeCategory;
        const searchMatch = !query || card.getAttribute('data-search').includes(query);

        if (catMatch && searchMatch) {
          card.style.display = 'flex';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      let noResults = document.getElementById('noResultsMsg');
      if (visibleCount === 0) {
        if (!noResults) {
          noResults = document.createElement('div');
          noResults.id = 'noResultsMsg';
          noResults.className = 'no-results';
          noResults.innerHTML = '<h3>No commands found</h3><p>Try searching for a different keyword or selecting another category.</p>';
          grid.appendChild(noResults);
        }
      } else if (noResults) {
        noResults.remove();
      }
    }

    searchInput.addEventListener('input', filterCommands);

    catButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        catButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.getAttribute('data-cat');
        filterCommands();
      });
    });

    function copyCommand(text) {
      navigator.clipboard.writeText(text).then(() => {
        toast.textContent = 'Copied "' + text + '" to clipboard!';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
      });
    }
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(html);
};
