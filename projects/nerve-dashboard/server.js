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

const tasks = [];
const chatMessages = [];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============ API ROUTES ============

app.get('/api/company', (req, res) => {
  res.json(paperclip.getCompanyInfo());
});

app.get('/api/agents', (req, res) => {
  res.json(paperclip.getAgentRegistry());
});

app.get('/api/agents/:id', (req, res) => {
  const agents = paperclip.getAgentRegistry();
  const agent = agents[req.params.id];
  if (agent) res.json(agent);
  else res.status(404).json({ error: 'Agent not found' });
});

app.post('/api/agents/:id/status', (req, res) => {
  const agents = paperclip.getAgentRegistry();
  const agent = agents[req.params.id];
  if (agent) {
    agent.status = req.body.status;
    res.json({ ok: true, agent });
  } else {
    res.status(404).json({ error: 'Agent not found' });
  }
});

app.get('/api/tasks', (req, res) => {
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const { title, description, assignedTo, priority } = req.body;
  const task = {
    id: Date.now(),
    title,
    description,
    assignedTo,
    priority: priority || 'normal',
    status: 'pending',
    created: new Date().toISOString()
  };
  tasks.push(task);
  res.json(task);
});

app.put('/api/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id == req.params.id);
  if (task) {
    Object.assign(task, req.body);
    res.json(task);
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  const idx = tasks.findIndex(t => t.id == req.params.id);
  if (idx > -1) {
    tasks.splice(idx, 1);
    res.json({ ok: true });
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

app.get('/api/chat', (req, res) => {
  res.json(chatMessages.slice(-50));
});

app.post('/api/chat', (req, res) => {
  const { from, message, agent } = req.body;
  const msg = {
    id: Date.now(),
    from,
    message,
    agent,
    timestamp: new Date().toISOString()
  };
  chatMessages.push(msg);
  res.json(msg);
});

app.post('/api/agents/:id/assign', async (req, res) => {
  const { task } = req.body;
  const agents = paperclip.getAgentRegistry();
  const agent = agents[req.params.id];

  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  const token = paperclip.getAgentTelegramToken(req.params.id);
  if (!token) {
    return res.json({ ok: true, message: 'Agent does not use Telegram' });
  }

  const chatId = req.body.chatId || req.body.chat_id;
  if (!chatId) {
    return res.json({ ok: false, error: 'No chatId provided' });
  }

  const telegramMsg = `*New Task for ${agent.name}:*\n\n${task}\n\n- From Nerve Dashboard`;

  const data = JSON.stringify({
    chat_id: chatId,
    text: telegramMsg,
    parse_mode: 'Markdown'
  });

  const options = {
    hostname: 'api.telegram.org',
    path: `/bot${token}/sendMessage`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req2 = https.request(options, (res2) => {
    let body = '';
    res2.on('data', chunk => body += chunk);
    res2.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        res.json({ ok: parsed.ok, message: 'Task sent to agent!' });
      } catch (e) {
        res.json({ ok: true, message: 'Task sent!' });
      }
    });
  });

  req2.on('error', () => {
    res.json({ ok: true, message: 'Task queued for agent!' });
  });

  req2.write(data);
  req2.end();
});

app.get('/api/dashboard', (req, res) => {
  res.json(paperclip.getDashboardData());
});

// ============ DASHBOARD HTML ============
app.get('/', (req, res) => {
  const companyInfo = paperclip.getCompanyInfo();
  const title = companyInfo.dashboard.title || 'Nerve Command Center';
  const botAgents = paperclip.listBotAgents();

  const agentOptions = botAgents
    .map(id => {
      const config = paperclip.getAgentConfig(id);
      return `<option value="${id}">${config.name}</option>`;
    })
    .join('\n            ');

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      color: #fff;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 {
      text-align: center;
      margin-bottom: 10px;
      font-size: 2.5em;
      background: linear-gradient(90deg, #FF6B6B, #4ECDC4, #FFE66D);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .company-badge {
      text-align: center;
      margin-bottom: 30px;
      font-size: 0.9em;
      opacity: 0.7;
    }
    .agents {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .agent-card {
      background: rgba(255,255,255,0.1);
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
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5em;
    }
    .agent-role { font-size: 0.85em; opacity: 0.7; }
    .status-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: inline-block;
    }
    .status-running { background: #4ade80; }
    .status-stopped { background: #ef4444; }
    .status-online { background: #4ade80; }
    .skills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }
    .skill {
      background: rgba(255,255,255,0.2);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85em;
    }
    .section {
      background: rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .section h2 { margin-bottom: 15px; font-size: 1.3em; }
    .task-form { display: grid; gap: 15px; }
    input, select, textarea {
      width: 100%;
      padding: 12px;
      border-radius: 8px;
      border: none;
      background: rgba(255,255,255,0.1);
      color: #fff;
      font-size: 1em;
    }
    input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.5); }
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
    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; }
    .btn-danger { background: #ef4444; color: #fff; }
    .btn-success { background: #4ade80; color: #000; }
    .tasks-list { max-height: 400px; overflow-y: auto; }
    .task-item {
      background: rgba(255,255,255,0.05);
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .task-info { flex: 1; }
    .task-title { font-weight: bold; margin-bottom: 5px; }
    .task-meta { font-size: 0.85em; opacity: 0.7; }
    .priority-high { border-left: 4px solid #ef4444; }
    .priority-normal { border-left: 4px solid #4ade80; }
    .priority-low { border-left: 4px solid #fbbf24; }
    .task-actions { display: flex; gap: 8px; }
    .chat-messages { max-height: 300px; overflow-y: auto; margin-bottom: 15px; }
    .chat-msg {
      padding: 10px;
      border-radius: 8px;
      margin-bottom: 8px;
      background: rgba(255,255,255,0.05);
    }
    .chat-user { border-left: 3px solid #667eea; }
    .chat-time { font-size: 0.75em; opacity: 0.5; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 768px) {
      .grid-2 { grid-template-columns: 1fr; }
      h1 { font-size: 1.8em; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <div class="company-badge">${companyInfo.name} &mdash; Paperclip Orchestration Active</div>

    <div class="agents" id="agents"></div>

    <div class="grid-2">
      <div class="section">
        <h2>Assign Task</h2>
        <div class="task-form">
          <input type="text" id="taskTitle" placeholder="Task title...">
          <textarea id="taskDesc" placeholder="Task description..." rows="3"></textarea>
          <select id="taskAgent">
            ${agentOptions}
          </select>
          <select id="taskPriority">
            <option value="normal">Normal</option>
            <option value="high">High Priority</option>
            <option value="low">Low Priority</option>
          </select>
          <button class="btn-primary" onclick="createTask()">Assign Task</button>
        </div>
      </div>

      <div class="section">
        <h2>Quick Chat</h2>
        <div class="chat-messages" id="chatMessages"></div>
        <div class="task-form">
          <input type="text" id="chatInput" placeholder="Type a message...">
          <select id="chatAgent">
            ${agentOptions}
          </select>
          <input type="text" id="chatId" placeholder="Your Telegram Chat ID">
          <button class="btn-success" onclick="sendChat()">Send Message</button>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Active Tasks</h2>
      <div class="tasks-list" id="tasksList"></div>
    </div>
  </div>

  <script>
    let agents = {};

    async function loadAgents() {
      const res = await fetch('/api/agents');
      agents = await res.json();
      renderAgents();
    }

    function renderAgents() {
      const container = document.getElementById('agents');
      container.innerHTML = Object.entries(agents).map(([id, agent]) => \`
        <div class="agent-card" style="border-top: 3px solid \${agent.color}">
          <div class="agent-header">
            <div class="agent-avatar" style="background: \${agent.color}">
              \${agent.name[0]}
            </div>
            <div>
              <h3>\${agent.name}</h3>
              <div class="agent-role">\${agent.role || ''}</div>
              <span class="status-dot status-\${agent.status}"></span> \${agent.status}
            </div>
          </div>
          <p><strong>Bot:</strong> \${agent.bot || 'N/A'}</p>
          <div class="skills">
            \${agent.capabilities.map(s => \`<span class="skill">\${s}</span>\`).join('')}
          </div>
        </div>
      \`).join('');
    }

    function createTask() {
      const title = document.getElementById('taskTitle').value;
      const desc = document.getElementById('taskDesc').value;
      const agent = document.getElementById('taskAgent').value;
      const priority = document.getElementById('taskPriority').value;

      if (!title) return alert('Enter a task title');

      fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: desc, assignedTo: agent, priority })
      }).then(() => {
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDesc').value = '';
        loadTasks();
      });
    }

    function loadTasks() {
      fetch('/api/tasks').then(r => r.json()).then(tasks => {
        document.getElementById('tasksList').innerHTML = tasks.map(t => \`
          <div class="task-item priority-\${t.priority}">
            <div class="task-info">
              <div class="task-title">\${t.title}</div>
              <div class="task-meta">
                Assigned to: \${t.assignedTo} | Priority: \${t.priority}
              </div>
            </div>
            <div class="task-actions">
              <button class="btn-success" onclick="assignToAgent(\${t.id}, '\${t.assignedTo}')">Send</button>
              <button class="btn-danger" onclick="deleteTask(\${t.id})">X</button>
            </div>
          </div>
        \`).join('') || '<p>No tasks yet</p>';
      });
    }

    function assignToAgent(taskId, agentId) {
      const chatId = prompt('Enter Telegram Chat ID to send to:');
      if (!chatId) return;

      fetch(\`/api/tasks/\${taskId}\`).then(r => r.json()).then(task => {
        fetch(\`/api/agents/\${agentId}/assign\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task: task.title + '\\n\\n' + task.description, chatId })
        }).then(r => r.json()).then(result => {
          alert(result.message || 'Sent!');
        });
      });
    }

    function deleteTask(id) {
      fetch(\`/api/tasks/\${id}\`, { method: 'DELETE' }).then(() => loadTasks());
    }

    function sendChat() {
      const msg = document.getElementById('chatInput').value;
      const agent = document.getElementById('chatAgent').value;
      const chatId = document.getElementById('chatId').value;

      if (!msg || !chatId) return alert('Enter message and Chat ID');

      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'User', message: msg, agent })
      });

      fetch(\`/api/agents/\${agent}/assign\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: msg, chatId })
      }).then(r => r.json()).then(() => {
        document.getElementById('chatInput').value = '';
        loadChat();
      });
    }

    function loadChat() {
      fetch('/api/chat').then(r => r.json()).then(msgs => {
        document.getElementById('chatMessages').innerHTML = msgs.map(m => \`
          <div class="chat-msg chat-\${m.agent || 'user'}">
            <strong>\${m.from}</strong>: \${m.message}
            <div class="chat-time">\${new Date(m.timestamp).toLocaleTimeString()}</div>
          </div>
        \`).join('') || '<p>No messages</p>';
      });
    }

    loadAgents();
    loadTasks();
    loadChat();
    setInterval(() => { loadAgents(); loadTasks(); }, 5000);
  </script>
</body>
</html>
  `);
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
