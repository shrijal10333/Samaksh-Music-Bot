const config = require('../src/config.js');

module.exports = (req, res) => {
  if (req.query && (req.query.json === 'true' || req.query.format === 'json')) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      name: "Groove Music Bot",
      status: "online",
      version: "1.0.0",
      prefix: config.prefix || ".",
      support: config.links ? config.links.support : "https://discord.gg/u98eRQRQQZ",
      invite: config.links ? config.links.invite : "https://discord.gg/u98eRQRQQZ",
      nodes: (config.nodes || []).map(n => ({ name: n.name, secure: n.secure })),
      timestamp: new Date().toISOString()
    });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Groove Music Bot - Vercel Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090c10;
      --card-bg: rgba(22, 27, 34, 0.7);
      --card-border: rgba(255, 255, 255, 0.08);
      --accent: #00D4FF;
      --accent-glow: rgba(0, 212, 255, 0.25);
      --text: #f0f6fc;
      --text-muted: #8b949e;
      --success: #3fb950;
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
      justify-content: center;
      padding: 20px;
      overflow-x: hidden;
      background-image: 
        radial-gradient(circle at 10% 20%, rgba(0, 212, 255, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(147, 51, 234, 0.08) 0%, transparent 40%);
    }

    .container {
      max-width: 800px;
      width: 100%;
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      border: 1px solid var(--card-border);
      border-radius: 24px;
      padding: 40px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    }

    .header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 30px;
    }

    .logo-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #00D4FF 0%, #7928CA 100%);
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      box-shadow: 0 10px 25px var(--accent-glow);
    }

    .header-text h1 {
      font-size: 2.2rem;
      font-weight: 800;
      background: linear-gradient(90deg, #ffffff, var(--accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .header-text p {
      color: var(--text-muted);
      font-size: 0.95rem;
      margin-top: 4px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(63, 185, 80, 0.15);
      border: 1px solid rgba(63, 185, 80, 0.3);
      color: var(--success);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .badge-dot {
      width: 8px;
      height: 8px;
      background-color: var(--success);
      border-radius: 50%;
      box-shadow: 0 0 10px var(--success);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin: 30px 0;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 20px;
      transition: transform 0.2s, border-color 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      border-color: rgba(0, 212, 255, 0.3);
    }

    .stat-label {
      color: var(--text-muted);
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--text);
      font-family: 'JetBrains Mono', monospace;
    }

    .notice-box {
      background: rgba(0, 212, 255, 0.05);
      border-left: 4px solid var(--accent);
      padding: 16px 20px;
      border-radius: 8px 16px 16px 8px;
      margin: 24px 0;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .notice-box code {
      font-family: 'JetBrains Mono', monospace;
      background: rgba(0, 0, 0, 0.3);
      padding: 2px 6px;
      border-radius: 4px;
      color: var(--accent);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 24px;
    }

    .btn {
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.95rem;
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

    footer {
      margin-top: 30px;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-icon">🎵</div>
      <div class="header-text">
        <h1>Groove Music Bot</h1>
        <p>Vercel Web API & Serverless Dashboard</p>
      </div>
    </div>

    <div class="badge">
      <div class="badge-dot"></div>
      Vercel Deployment Active
    </div>

    <div class="grid">
      <div class="stat-card">
        <div class="stat-label">Bot Prefix</div>
        <div class="stat-value">${config.prefix || "."}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Lavalink Node</div>
        <div class="stat-value">${config.nodes && config.nodes[0] ? config.nodes[0].name : "Groove"}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Web API Status</div>
        <div class="stat-value" style="color: var(--success);">HTTP 200 OK</div>
      </div>
    </div>

    <div class="notice-box">
      <strong>💡 Deployment Note:</strong> Vercel hosts this Web Status & API endpoint. For 24/7 Discord Voice & Music streaming, combine Vercel with a persistent background host (Railway, Render, Koyeb, Docker, or VPS).
    </div>

    <div class="actions">
      <a href="${config.links ? config.links.invite : '#'}" target="_blank" class="btn btn-primary">➕ Invite Bot</a>
      <a href="${config.links ? config.links.support : '#'}" target="_blank" class="btn btn-secondary">💬 Support Server</a>
      <a href="/api?json=true" target="_blank" class="btn btn-secondary">⚡ JSON Status API</a>
    </div>
  </div>

  <footer>
    Groove Music Bot &bull; Powered by Vercel & Node.js
  </footer>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(html);
};
