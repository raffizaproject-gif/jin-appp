// commands/tiktok.js
// Perintah: /tiktok [link video]
// Mengambil link video TikTok tanpa watermark lewat API publik tikwm.com.
//
// CATATAN: hanya untuk pemakaian pribadi (nonton offline, arsip pribadi, dll).
// Video tetap hak milik pembuat aslinya — jangan unggah ulang mengaku sebagai karyamu.
// tikwm.com adalah layanan pihak ketiga, bisa berubah/down sewaktu-waktu di luar kendali kita.

// Mengurai link pendek (vt.tiktok.com / vm.tiktok.com) jadi link lengkap
// (www.tiktok.com/@user/video/id...), karena API download sering gagal
// kalau diberi link pendek secara langsung.
async function resolveShortLink(url) {
  try {
    const resp = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36' },
    });
    return resp.url || url;
  } catch (e) {
    return url; // kalau gagal resolve, tetap coba pakai link aslinya
  }
}

module.exports = {
  trigger: '/tiktok',
  description: 'Download video TikTok tanpa watermark. Contoh: /tiktok https://vt.tiktok.com/xxxxx',

  handler: async (argText) => {
    const rawUrl = (argText || '').trim();

    if (!rawUrl) {
      return { type: 'error', message: 'Sertakan link video TikTok setelah /tiktok, contoh: /tiktok https://vt.tiktok.com/xxxxx' };
    }
    if (!/tiktok\.com/.test(rawUrl)) {
      return { type: 'error', message: 'Itu bukan link TikTok yang valid.' };
    }

    // Kalau link pendek (vt./vm.tiktok.com), urai dulu ke link lengkap
    const isShortLink = /\/\/(vt|vm)\.tiktok\.com/.test(rawUrl);
    const url = isShortLink ? await resolveShortLink(rawUrl) : rawUrl;

    const apiUrl = 'https://www.tikwm.com/api/?url=' + encodeURIComponent(url) + '&hd=1';
    const MAX_ATTEMPTS = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const resp = await fetch(apiUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36' },
        });
        const data = await resp.json();

        if (data.code === 0 && data.data && (data.data.play || data.data.hdplay)) {
          return {
            type: 'video',
            title: data.data.title || 'Video TikTok',
            videoUrl: data.data.hdplay || data.data.play, // pakai HD kalau tersedia
            cover: data.data.cover || null,
          };
        }
        lastError = data.msg || 'Respons API tidak valid';
      } catch (err) {
        lastError = err.message;
      }
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    return { type: 'error', message: 'Gagal mengambil video setelah beberapa percobaan. Pastikan link benar dan videonya publik. (' + lastError + ')' };
  },
};
