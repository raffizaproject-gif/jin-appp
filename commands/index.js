// commands/index.js
// Registry otomatis: setiap file .js di folder ini yang punya
// { trigger, description, handler } akan otomatis terdaftar jadi perintah baru.
// Supaya nambah command baru, kamu TINGGAL BIKIN FILE BARU di folder ini,
// tidak perlu mengubah server.js sama sekali.

const fs = require('fs');
const path = require('path');

const registry = {};

fs.readdirSync(__dirname).forEach((file) => {
  if (file === 'index.js' || !file.endsWith('.js')) return;
  const mod = require(path.join(__dirname, file));
  if (mod && mod.trigger && typeof mod.handler === 'function') {
    registry[mod.trigger] = mod;
  } else {
    console.warn(`Command file "${file}" diabaikan: harus punya trigger, description, dan handler.`);
  }
});

module.exports = {
  list: () => Object.values(registry).map((c) => ({ trigger: c.trigger, description: c.description })),
  get: (trigger) => registry[trigger],
};
