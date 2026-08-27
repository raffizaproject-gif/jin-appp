// server.js
// Backend kecil untuk Jin Assistant — versi Groq (GRATIS, TANPA KARTU).
// Tugasnya: menyimpan API key Groq dengan aman di server,
// lalu meneruskan (proxy) permintaan chat dari halaman web ke Groq API.

require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const commands = require('./commands');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GROQ_API_KEY;
const MODEL = 'openai/gpt-oss-120b'; // model gratis di Groq (per Agu 2026)
const WHISPER_MODEL = 'whisper-large-v3-turbo'; // model Speech-to-Text gratis di Groq

if (!API_KEY) {
  console.error('ERROR: GROQ_API_KEY belum diset di file .env');
  process.exit(1);
}

// Upload voice note disimpan sementara di memori (tidak ditulis ke disk),
// lalu langsung diteruskan ke Groq Whisper untuk ditranskripsi.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // maks 20MB per VN
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Daftar semua command yang tersedia (dibaca otomatis dari folder commands/)
app.get('/api/commands', (req, res) => {
  res.json(commands.list());
});

// Menjalankan satu command tertentu
app.post('/api/command', async (req, res) => {
  const { trigger, args } = req.body;
  const cmd = commands.get(trigger);
  if (!cmd) {
    return res.status(404).json({ type: 'error', message: 'Command tidak ditemukan: ' + trigger });
  }
  try {
    const result = await cmd.handler(args);
    res.json(result);
  } catch (err) {
    console.error('Command error:', err);
    res.status(500).json({ type: 'error', message: 'Gagal menjalankan command: ' + err.message });
  }
});

// Endpoint untuk fitur VN (Voice Note): terima file audio dari browser,
// teruskan ke Groq Whisper (Speech-to-Text), lalu kembalikan hasil teksnya.
// File audio TIDAK disimpan ke disk, hanya diproses di memori lalu dibuang.
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({ error: 'Tidak ada audio yang diterima.' });
    }

    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype || 'audio/webm' });
    formData.append('file', blob, req.file.originalname || 'voice-note.webm');
    formData.append('model', WHISPER_MODEL);
    formData.append('response_format', 'json');
    // Bahasa TIDAK dipaksa 'id' supaya Whisper otomatis mendeteksi bahasa
    // yang diucapkan pengguna (Indonesia, Inggris, dll).

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEY}` },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Groq transcription error:', data);
      return res.status(response.status).json({
        error: (data && data.error && data.error.message) || 'Gagal mentranskripsi audio.',
      });
    }

    const text = (data.text || '').trim();
    if (!text) {
      return res.status(422).json({ error: 'Tidak ada suara yang terdeteksi di rekaman.' });
    }
    res.json({ text });
  } catch (err) {
    console.error('Transcribe error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan saat memproses suara di server.' });
  }
});

// Definisi "tool" yang boleh dipanggil sendiri oleh Jin saat ngobrol.
// Model akan memutuskan sendiri kapan perlu memanggil ini (tool calling / function calling).
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'download_tiktok',
      description: 'Download video TikTok berdasarkan link yang diberikan pengguna, lalu mengembalikan link video tanpa watermark. Panggil ini HANYA setelah pengguna memberikan link TikTok yang valid (mengandung tiktok.com). Kalau pengguna minta download tapi belum kasih link, JANGAN panggil tool ini — tanya link-nya dulu.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Link/URL video TikTok yang ingin didownload' },
        },
        required: ['url'],
      },
    },
  },
];

async function callGroq(messages, useTools) {
  return fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: 1000,
      ...(useTools ? { tools: TOOLS, tool_choice: 'auto' } : {}),
    }),
  });
}

async function runToolCall(name, argsJson) {
  if (name !== 'download_tiktok') {
    return { type: 'error', message: 'Tool tidak dikenal: ' + name };
  }
  let url = '';
  try {
    url = JSON.parse(argsJson || '{}').url || '';
  } catch (e) {
    return { type: 'error', message: 'Argumen tool tidak valid.' };
  }
  const tiktokCmd = commands.get('/tiktok');
  return tiktokCmd.handler(url);
}

// Endpoint yang dipanggil oleh front-end (index.html).
app.post('/api/chat', async (req, res) => {
  try {
    const { system, messages } = req.body;

    let groqMessages = [
      ...(system ? [{ role: 'system', content: system }] : []),
      ...(messages || []).map(m => ({ role: m.role, content: m.content })),
    ];

    let response = await callGroq(groqMessages, true);
    let data = await response.json();
    if (!response.ok) {
      console.error('Groq API error:', data);
      return res.status(response.status).json({ error: data });
    }

    let choice = data.choices[0];
    let videoResult = null;

    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      groqMessages.push(choice.message);
      for (const toolCall of choice.message.tool_calls) {
        const result = await runToolCall(toolCall.function.name, toolCall.function.arguments);
        if (result.type === 'video') videoResult = result;
        groqMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
      response = await callGroq(groqMessages, true);
      data = await response.json();
      if (!response.ok) {
        console.error('Groq API error (2nd call):', data);
        return res.status(response.status).json({ error: data });
      }
      choice = data.choices[0];
    } else {
      // Jaring pengaman: kalau pesan terakhir user mengandung link TikTok
      // tapi model TIDAK memanggil tool (kadang model lupa), kita tetap
      // jalankan download-nya sendiri supaya video selalu berhasil dikirim.
      const lastUserMsg = [...(messages || [])].reverse().find(m => m.role === 'user');
      const linkMatch = lastUserMsg && lastUserMsg.content.match(/https?:\/\/[^\s]*tiktok\.com[^\s]*/i);
      if (linkMatch) {
        const tiktokCmd = commands.get('/tiktok');
        const result = await tiktokCmd.handler(linkMatch[0]);
        if (result.type === 'video') {
          videoResult = result;
          groqMessages.push({ role: 'assistant', content: 'Oke dapet, bos! Videonya sudah kukirim di bawah ini.' });
          choice = { message: { content: 'Oke dapet, bos! Videonya sudah kukirim di bawah ini.' } };
        }
      }
    }

    const replyText = choice.message.content || 'Maaf, aku tidak menerima jawaban dari alam gaib (API). Coba lagi.';

    res.json({
      content: [{ type: 'text', text: replyText }],
      video: videoResult,
    });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan di server.' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Jin server (Groq) jalan di http://localhost:${PORT}`);
  try {
    const os = require('os');
    const nets = os.networkInterfaces();
    const addrs = [];
    Object.values(nets).forEach((ifaces) => {
      (ifaces || []).forEach((iface) => {
        if (iface.family === 'IPv4' && !iface.internal) addrs.push(iface.address);
      });
    });
    if (addrs.length) {
      console.log('Bisa diakses dari HP di WiFi yang sama lewat:');
      addrs.forEach((a) => console.log(`  http://${a}:${PORT}`));
      console.log('CATATAN: fitur rekam suara (mikrofon) butuh koneksi HTTPS di HP,');
      console.log('kecuali diakses lewat "localhost". Lihat README bagian "Akses dari HP".');
    }
  } catch (e) {
    // Kalau gagal deteksi IP lokal, tidak masalah — server tetap jalan normal.
  }
});
