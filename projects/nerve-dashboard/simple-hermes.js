// Simple Hermes Bot - Test Version
// A reliable bot that actually does tasks

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const TELEGRAM_TOKEN = '8430548799:AAHkc4BNMBuB3SGB4_ZqgldUn3Iuf9yz74k';
const MEMU_API = 'http://127.0.0.1:31415';

// Simple AI call using free model
async function askAI(message) {
  const data = JSON.stringify({
    model: 'qwen/qwen3.6-plus:free',
    messages: [
      {
        role: 'system', 
        content: `You are Hermes. Keep responses SHORT (under 100 words). 
When asked to do something, actually try to help. 
If you can't do something, explain clearly why.
Current time: ${new Date().toISOString()}`
      },
      { role: 'user', content: message }
    ],
    max_tokens: 500
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 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',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed.choices?.[0]?.message?.content || 'No response');
        } catch (e) {
          resolve('Error parsing response');
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function sendMessage(chatId, text) {
  const data = JSON.stringify({
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown'
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${TELEGRAM_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, () => resolve());
    req.on('error', () => resolve());
    req.write(data);
    req.end();
  });
}

async function handleMessage(chatId, text) {
  console.log(`[Hermes] Got: ${text}`);
  
  // Simple commands
  if (text === '/start') {
    await sendMessage(chatId, 
      `🤖 *Hermes Online!* 🚀\n\n` +
      `I'm a simple test bot. Ask me anything!\n\n` +
      `Try: "Hello", "What can you do?", or ask a question.`
    );
    return;
  }

  if (text === '/help') {
    await sendMessage(chatId, 
      `*Commands:*\n` +
      `/start - Start\n` +
      `/help - This\n` +
      `/status - Check status\n\n` +
      `Or just chat with me!`
    );
    return;
  }

  if (text === '/status') {
    await sendMessage(chatId, 
      `✅ *Hermes Status*\n\n` +
      `Bot: Running\n` +
      `AI: Qwen 3.6 Plus\n` +
      `Time: ${new Date().toISOString()}`
    );
    return;
  }

  // Default - use AI
  try {
    const response = await askAI(text);
    await sendMessage(chatId, response);
  } catch (e) {
    await sendMessage(chatId, `Error: ${e.message}`);
  }
}

// Poll for updates
async function poll() {
  let offset = 0;
  
  while (true) {
    try {
      const updates = await getUpdates(offset);
      
      if (updates.ok && updates.result) {
        for (const update of updates.result) {
          if (update.message?.text) {
            await handleMessage(update.message.chat.id, update.message.text);
            offset = update.update_id + 1;
          }
        }
      }
    } catch (e) {
      console.log(`[Hermes] Poll error: ${e.message}`);
    }
    
    await sleep(1000);
  }
}

function getUpdates(offset) {
  return new Promise((resolve, reject) => {
    https.get(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates?offset=${offset}&timeout=5`,
      (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch (e) { reject(e); }
        });
      }
    ).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

console.log('🚀 Simple Hermes starting...');
poll().catch(console.error);
