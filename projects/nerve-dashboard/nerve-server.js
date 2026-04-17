// ═══════════════════════════════════════════════════════════════════════════════════
// NERVE COMMAND CENTER - Production Dashboard
// Config-driven via Paperclip orchestration layer
// ═══════════════════════════════════════════════════════════════════════════════════

const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');
const Paperclip = require('./paperclip');

const app = express();
const companyId = process.env.COMPANY_ID || 'pilot-company';
const paperclip = new Paperclip(companyId);
const PORT = paperclip.getCompanyInfo().dashboard.port || 3456;

app.use(express.json());

// ============ API ROUTES ============

app.get('/api/company', (req, res) => {
  res.json(paperclip.getCompanyInfo());
});

app.get('/api/dashboard', (req, res) => {
  const registry = paperclip.getAgentRegistry();
  registry.timestamp = new Date().toISOString();
  res.json(registry);
});

app.get('/api/agents/:id/projects', (req, res) => {
  const agents = paperclip.getAgentRegistry();
  const agent = agents[req.params.id];
  if (agent) {
    res.json(agent.projects || {});
  } else {
    res.status(404).json({ error: 'Agent not found' });
  }
});

app.post('/api/agents/:id/send', (req, res) => {
  const { chatId, message } = req.body;
  if (!chatId || !message) {
    return res.json({ ok: false, error: 'chatId and message required' });
  }

  const token = paperclip.getAgentTelegramToken(req.params.id);
  if (!token) {
    return res.json({ ok: false, error: 'Agent has no Telegram bot' });
  }

  sendTelegram(token, chatId, message)
    .then(() => res.json({ ok: true }))
    .catch(e => res.json({ ok: false, error: e.message }));
});

function sendTelegram(token, chatId, text) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    });

    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, () => resolve());

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ============ DASHBOARD HTML ============
app.get('/', (req, res) => {
  const companyInfo = paperclip.getCompanyInfo();
  const title = companyInfo.dashboard.title || 'Nerve Command Center';
  const botAgents = paperclip.listBotAgents();

  const botOptions = botAgents.map(id => {
    const config = paperclip.getAgentConfig(id);
    return `<option value="${id}">${config.name} (${config.telegram.botUsername})</option>`;
  }).join('\n          ');

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%);
      min-height: 100vh;
      color: #fff;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    h1 {
      text-align: center;
      margin-bottom: 10px;
      font-size: 2.5em;
      background: linear-gradient(90deg, #FF6B6B, #4ECDC4, #FFE66D);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle { text-align: center; opacity: 0.7; margin-bottom: 30px; }
    .agents {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .agent-card {
      background: rgba(255,255,255,0.05);
      border-radius: 16px;
      padding: 20px;
      backdrop-filter: blur(10px);
    }
    .agent-header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 15px;
    }
    .agent-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8em;
      font-weight: bold;
    }
    .agent-info h3 { font-size: 1.4em; margin-bottom: 5px; }
    .agent-role { font-size: 0.85em; opacity: 0.7; }
    .status { font-size: 0.9em; opacity: 0.8; }
    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 5px;
    }
    .status-running { background: #4ade80; }
    .status-online { background: #4ade80; }
    .capabilities {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 15px 0;
    }
    .cap {
      background: rgba(255,255,255,0.1);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85em;
    }
    .projects-section { margin-top: 20px; }
    .section-title {
      font-size: 1.1em;
      margin-bottom: 10px;
      opacity: 0.9;
    }
    .project {
      background: rgba(255,255,255,0.05);
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .project-name { font-weight: bold; margin-bottom: 5px; }
    .progress-bar {
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
      height: 8px;
      overflow: hidden;
      margin: 5px 0;
    }
    .progress-fill {
      height: 100%;
      border-radius: 10px;
      transition: width 0.3s ease;
    }
    .progress-text { font-size: 0.85em; opacity: 0.8; }
    .no-projects { opacity: 0.5; font-style: italic; }
    .send-section {
      background: rgba(255,255,255,0.05);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .send-section h2 { margin-bottom: 15px; }
    .send-form { display: grid; gap: 10px; }
    input, select, textarea {
      width: 100%;
      padding: 12px;
      border-radius: 8px;
      border: none;
      background: rgba(255,255,255,0.1);
      color: #fff;
      font-size: 1em;
    }
    input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.4); }
    button {
      padding: 12px 24px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-size: 1em;
      font-weight: bold;
      transition: transform 0.2s;
    }
    button:hover { transform: scale(1.02); }
    .btn-send { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    .stat-value { font-size: 2em; font-weight: bold; }
    .stat-label { opacity: 0.7; font-size: 0.9em; }
    .footer {
      text-align: center;
      opacity: 0.5;
      margin-top: 30px;
      font-size: 0.85em;
    }
    @media (max-width: 768px) {
      h1 { font-size: 1.8em; }
      .agents { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <p class="subtitle">${companyInfo.name} &mdash; Paperclip Orchestration Active</p>

    <div class="stats" id="stats"></div>
    <div class="agents" id="agents"></div>

    <div class="send-section">
      <h2>Send Task</h2>
      <div class="send-form">
        <input type="text" id="chatId" placeholder="Your Telegram Chat ID">
        <select id="targetBot">
          ${botOptions}
        </select>
        <textarea id="taskMessage" placeholder="What do you want the agent to do?" rows="3"></textarea>
        <button id="sendBtn" class="btn-send" onclick="sendTask()">Send Task</button>
      </div>
    </div>

    <div class="footer">
      ${title} &bull; Last updated: <span id="lastUpdate">Loading...</span>
    </div>
  </div>

  <script>
    async function loadDashboard() {
      try {
        const resp = await fetch('/api/dashboard');
        const data = await resp.json();
        renderDashboard(data);
      } catch (e) {
        console.error('Dashboard load error:', e);
      }
    }

    function renderDashboard(data) {
      document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();

      const agentEntries = Object.entries(data).filter(([k]) => k !== 'timestamp');
      let totalProjects = 0;
      let onlineCount = 0;

      agentEntries.forEach(([, agent]) => {
        totalProjects += Object.keys(agent.projects || {}).length;
        if (agent.status === 'running' || agent.status === 'online') onlineCount++;
      });

      document.getElementById('stats').innerHTML = \`
        <div class="stat-card">
          <div class="stat-value" style="color: #4ade80">\${onlineCount}/\${agentEntries.length}</div>
          <div class="stat-label">Agents Online</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: #4ECDC4">\${totalProjects}</div>
          <div class="stat-label">Total Projects</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: #FFE66D">\${agentEntries.length}</div>
          <div class="stat-label">Registered Agents</div>
        </div>
      \`;

      document.getElementById('agents').innerHTML = agentEntries.map(([id, agent]) =>
        renderAgent(agent, id)
      ).join('');
    }

    function renderAgent(agent, id) {
      const projectList = Object.entries(agent.projects || {});
      const projectsHtml = projectList.length > 0
        ? projectList.map(([name, data]) => \`
            <div class="project">
              <div class="project-name">\${name}</div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: \${data.progress || 0}%; background: \${agent.color}"></div>
              </div>
              <div class="progress-text">\${data.progress || 0}% complete</div>
            </div>
          \`).join('')
        : '<div class="no-projects">No projects yet</div>';

      return \`
        <div class="agent-card" style="border-top: 3px solid \${agent.color}">
          <div class="agent-header">
            <div class="agent-avatar" style="background: \${agent.color}">\${agent.name[0]}</div>
            <div class="agent-info">
              <h3>\${agent.name}</h3>
              <div class="agent-role">\${agent.role || ''}</div>
              <span class="status">
                <span class="status-dot status-\${agent.status}"></span>
                \${agent.status}
              </span>
            </div>
          </div>
          <p><strong>Bot:</strong> \${agent.bot || 'N/A'}</p>
          <div class="capabilities">
            \${agent.capabilities.map(c => \`<span class="cap">\${c}</span>\`).join('')}
          </div>
          <div class="projects-section">
            <div class="section-title">Projects (\${projectList.length})</div>
            \${projectsHtml}
          </div>
        </div>
      \`;
    }

    async function sendTask() {
      const chatId = document.getElementById('chatId').value.trim();
      const target = document.getElementById('targetBot').value;
      const message = document.getElementById('taskMessage').value.trim();
      const btn = document.getElementById('sendBtn');

      if (!chatId || !message) {
        alert('Enter Chat ID and message');
        return;
      }

      btn.textContent = 'Sending...';
      btn.disabled = true;

      try {
        const resp = await fetch(\`/api/agents/\${target}/send\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId, message })
        });
        const result = await resp.json();

        if (result.ok) {
          alert('Task sent to ' + target + '!');
          document.getElementById('taskMessage').value = '';
        } else {
          alert('Error: ' + (result.error || 'Unknown error'));
        }
      } catch (e) {
        alert('Error: ' + e.message);
      }

      btn.textContent = 'Send Task';
      btn.disabled = false;
    }

    loadDashboard();
    setInterval(loadDashboard, 10000);

    const savedChatId = localStorage.getItem('nerve_chatId');
    if (savedChatId) {
      document.getElementById('chatId').value = savedChatId;
    }
    document.getElementById('chatId').addEventListener('change', (e) => {
      localStorage.setItem('nerve_chatId', e.target.value);
    });
  </script>
</body>
</html>`);
});

// ============ START ============
app.listen(PORT, '0.0.0.0', () => {
  const info = paperclip.getCompanyInfo();
  console.log(\`Nerve Command Center running for \${info.name}!\`);
  console.log('   Local: http://localhost:' + PORT);
  console.log('   Network: http://' + getLocalIP() + ':' + PORT);
});

function getLocalIP() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}
