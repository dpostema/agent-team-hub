// ═══════════════════════════════════════════════════════════════════════════════════
// NERVE COMMAND CENTER - Production Dashboard
// Shows real-time project progress from Hermes and MJ
// ═══════════════════════════════════════════════════════════════════════════════════

const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const app = express();
const PORT = 3456;

// Data paths for PRO agents
const HERMES_DATA = 'C:\\Users\\Jarvis\\AppData\\Roaming\\memu-bot\\workspace\\services\\hermes-pro-(h2-hermebot)_1775217775837\\data';
const MJ_DATA = 'C:\\Users\\Jarvis\\AppData\\Roaming\\memu-bot\\workspace\\services\\mj-pro-builder-bot_1775217860196\\data';

// ============ MIDDLEWARE ============
app.use(express.json());

// ============ DATA LOADERS ============
function loadHermesProjects() {
  try {
    const file = path.join(HERMES_DATA, 'projects.json');
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (e) { console.log('Hermes projects load error:', e.message); }
  return {};
}

function loadMJProjects() {
  try {
    const file = path.join(MJ_DATA, 'mj_projects.json');
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (e) { console.log('MJ projects load error:', e.message); }
  return {};
}

function loadHermesMemory() {
  try {
    const file = path.join(HERMES_DATA, 'memory.json');
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (e) {}
  return {};
}

// ============ API ROUTES ============

// Get all data for dashboard
app.get('/api/dashboard', (req, res) => {
  res.json({
    hermes: {
      name: 'Hermes',
      bot: '@H2_HermeBot',
      status: 'running',
      color: '#FF6B6B',
      capabilities: ['Research', 'Analysis', 'Planning', 'Memory', 'Projects'],
      projects: loadHermesProjects(),
      memory: loadHermesMemory()
    },
    mj: {
      name: 'MJ',
      bot: '@MJMiniJarvis_bot',
      status: 'running',
      color: '#4ECDC4',
      capabilities: ['Code Building', 'Python', 'JavaScript', 'Bots', 'Automation'],
      projects: loadMJProjects()
    },
    pepper: {
      name: 'Pepper',
      bot: 'memu.bot AI',
      status: 'online',
      color: '#FFE66D',
      capabilities: ['Supervision', 'Strategy', 'Coordination']
    },
    timestamp: new Date().toISOString()
  });
});

// Get Hermes projects
app.get('/api/hermes/projects', (req, res) => {
  res.json(loadHermesProjects());
});

// Get MJ projects
app.get('/api/mj/projects', (req, res) => {
  res.json(loadMJProjects());
});

// Send task to Hermes
app.post('/api/hermes/send', (req, res) => {
  const { chatId, message } = req.body;
  if (!chatId || !message) {
    return res.json({ ok: false, error: 'chatId and message required' });
  }
  sendTelegram('8430548799:AAHkc4BNMBuB3SGB4_ZqgldUn3Iuf9yz74k', chatId, message)
    .then(() => res.json({ ok: true }))
    .catch(e => res.json({ ok: false, error: e.message }));
});

// Send task to MJ
app.post('/api/mj/send', (req, res) => {
  const { chatId, message } = req.body;
  if (!chatId || !message) {
    return res.json({ ok: false, error: 'chatId and message required' });
  }
  sendTelegram('8769773397:AAHCuzsENN2Qn7pavVc4BBcGqgcYvYc2sJ0', chatId, message)
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
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🔥 Nerve Command Center</title>
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
      margin-bottom: 30px;
      font-size: 2.5em;
      background: linear-gradient(90deg, #FF6B6B, #4ECDC4, #FFE66D);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle { text-align: center; opacity: 0.7; margin-bottom: 30px; }
    
    /* Agent Grid */
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
    
    /* Capabilities */
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
    
    /* Projects */
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
    
    /* Send Message Section */
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
    .btn-hermes { background: linear-gradient(135deg, #FF6B6B, #ff8787); color: #fff; }
    .btn-mj { background: linear-gradient(135deg, #4ECDC4, #7ee8e1); color: #000; }
    
    /* Stats */
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
    
    /* Footer */
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
    <h1>🔥 Nerve Command Center</h1>
    <p class="subtitle">24/7 AI Agent Management</p>
    
    <div class="stats" id="stats"></div>
    
    <div class="agents" id="agents"></div>
    
    <div class="send-section">
      <h2>📨 Send Task</h2>
      <div class="send-form">
        <input type="text" id="chatId" placeholder="Your Telegram Chat ID">
        <select id="targetBot">
          <option value="hermes">Hermes (@H2_HermeBot)</option>
          <option value="mj">MJ (@MJMiniJarvis_bot)</option>
        </select>
        <textarea id="taskMessage" placeholder="What do you want the agent to do?" rows="3"></textarea>
        <button id="sendBtn" class="btn-hermes" onclick="sendTask()">Send Task</button>
      </div>
    </div>
    
    <div class="footer">
      Nerve Command Center • Last updated: <span id="lastUpdate">Loading...</span>
    </div>
  </div>

  <script>
    let lastChatId = '';
    
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
      
      // Stats
      const hermesProjects = Object.keys(data.hermes.projects).length;
      const mjProjects = Object.keys(data.mj.projects).length;
      const hermesMemory = Object.keys(data.hermes.memory || {}).length;
      
      document.getElementById('stats').innerHTML = \`
        <div class="stat-card">
          <div class="stat-value" style="color: #FF6B6B">\${hermesProjects}</div>
          <div class="stat-label">Hermes Projects</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: #4ECDC4">\${mjProjects}</div>
          <div class="stat-label">MJ Projects</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: #FFE66D">\${hermesMemory}</div>
          <div class="stat-label">Memories Stored</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: #4ade80">2/2</div>
          <div class="stat-label">Agents Online</div>
        </div>
      \`;
      
      // Render each agent
      document.getElementById('agents').innerHTML = renderAgent(data.hermes, 'hermes') +
                                                   renderAgent(data.mj, 'mj') +
                                                   renderAgent(data.pepper, 'pepper');
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
        <div class="agent-card">
          <div class="agent-header">
            <div class="agent-avatar" style="background: \${agent.color}">\${agent.name[0]}</div>
            <div class="agent-info">
              <h3>\${agent.name}</h3>
              <span class="status">
                <span class="status-dot status-\${agent.status}"></span>
                \${agent.status}
              </span>
            </div>
          </div>
          <p><strong>Bot:</strong> \${agent.bot}</p>
          <div class="capabilities">
            \${agent.capabilities.map(c => \`<span class="cap">\${c}</span>\`).join('')}
          </div>
          <div class="projects-section">
            <div class="section-title">📋 Projects (\${projectList.length})</div>
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
      
      lastChatId = chatId;
      btn.textContent = 'Sending...';
      btn.disabled = true;
      
      try {
        const endpoint = target === 'hermes' ? '/api/hermes/send' : '/api/mj/send';
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId, message })
        });
        const result = await resp.json();
        
        if (result.ok) {
          alert('✅ Task sent to ' + (target === 'hermes' ? 'Hermes' : 'MJ') + '!');
          document.getElementById('taskMessage').value = '';
        } else {
          alert('❌ Error: ' + (result.error || 'Unknown error'));
        }
      } catch (e) {
        alert('❌ Error: ' + e.message);
      }
      
      btn.textContent = 'Send Task';
      btn.disabled = false;
    }
    
    // Load on start
    loadDashboard();
    
    // Refresh every 10 seconds
    setInterval(loadDashboard, 10000);
    
    // Save chat ID to localStorage
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
  console.log('🔥 Nerve Command Center running!');
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
