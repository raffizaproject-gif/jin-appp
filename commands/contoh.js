// commands/contoh.js
// Ini CONTOH TEMPLATE untuk bikin command barumu sendiri.
// Boleh dihapus, atau dijadikan contekan.
//
// Cara pakai: /contoh Budi
// Setiap command WAJIB punya 3 hal: trigger, description, handler.

module.exports = {
  // trigger: kata yang dipakai user untuk memanggil command ini (harus diawali "/")
  trigger: '/contoh',

  // description: muncul di panel "Perintah Cepat" pada tampilan Jin
  description: 'Contoh command sederhana. Coba ketik: /contoh Budi',

  // handler: fungsi yang dijalankan saat command dipanggil.
  // argText = semua teks setelah trigger (misal "/contoh Budi" -> argText = "Budi")
  // Harus me-return salah satu bentuk ini:
  //   { type: 'error', message: '...' }   -> ditampilkan sebagai pesan error
  //   { type: 'text', message: '...' }    -> ditampilkan sebagai balasan biasa dari Jin
  //   { type: 'video', title, videoUrl }  -> ditampilkan sebagai video (lihat commands/tiktok.js)
  handler: async (argText) => {
    const nama = (argText || '').trim();
    if (!nama) {
      return { type: 'error', message: 'Sertakan nama, contoh: /contoh Budi' };
    }
    return { type: 'text', message: `Halo, ${nama}! Ini balasan dari command custom kamu.` };
  },
};
