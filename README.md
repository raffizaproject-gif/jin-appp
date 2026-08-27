# Jin Assistant — Panduan Setup (Pemula) — Versi GRATIS 100% (Groq, tanpa kartu)

Proyek ini terdiri dari:
- `server.js` — backend kecil yang menyimpan API key dengan aman & terhubung ke Groq
- `public/index.html` — tampilan chat Jin (front-end)
- `.env.example` — contoh tempat menaruh API key

## Langkah-langkah

### 1. Buat API key Groq (GRATIS, TANPA kartu kredit sama sekali)
1. Buka https://console.groq.com/keys
2. Daftar/login (bisa pakai akun Google, tidak diminta info kartu apa pun)
3. Klik **Create API Key**, kasih nama bebas, lalu salin key yang muncul (formatnya `gsk_...`)

### 2. Install Node.js
Download dan install dari https://nodejs.org (pilih versi LTS). Cek di terminal:
```
node -v
npm -v
```

### 3. Siapkan proyek
Buka terminal di folder `jin-app`, lalu jalankan:
```
npm install
```

### 4. Isi API key
1. Duplikat file `.env.example` menjadi `.env`
2. Buka `.env`, ganti `isi_dengan_api_key_groq_kamu_di_sini` dengan API key asli kamu dari langkah 1

### 5. Jalankan server
```
npm start
```
Kalau berhasil, akan muncul: `Jin server (Groq) jalan di http://localhost:3000`

### 6. Buka di browser
Buka: http://localhost:3000

Jin sekarang jalan pakai Groq — 100% gratis, tidak ada langkah billing/kartu kredit sama sekali.

## Batas gratisnya
Groq memberi kuota harian yang besar untuk model gratis (ribuan request per hari untuk pemakaian personal). Kalau kena limit, biasanya reset per menit/hari. Detail limit terbaru: https://console.groq.com/docs/rate-limits

## Menambah perintah baru (mis. download YouTube, cek cuaca, dll)

Jin sekarang punya folder `commands/` — setiap file `.js` di situ otomatis jadi perintah baru, tanpa perlu ubah `server.js`.

Sudah tersedia:
- `commands/tiktok.js` — `/tiktok [link]` untuk download video TikTok tanpa watermark
- `commands/contoh.js` — template kosong buat kamu contek

**Cara bikin command baru:**
1. Duplikat `commands/contoh.js`, ganti namanya, misal `commands/cuaca.js`
2. Ubah `trigger`, `description`, dan isi `handler` sesuai kebutuhanmu
3. Simpan, lalu restart server (`Ctrl+C` lalu `npm start` lagi) — command baru langsung muncul di panel "Perintah Cepat"

`handler` boleh melakukan apa saja di sisi server (memanggil API lain, membaca file, dll) dan harus mengembalikan salah satu dari:
```js
{ type: 'error', message: '...' }   // pesan error
{ type: 'text', message: '...' }    // balasan teks biasa
{ type: 'video', title, videoUrl }  // video (otomatis dirender dengan player)
```

## Fitur Voice / VN (baru)

Jin sekarang bisa dengar dan bicara, tanpa mengubah chatbot teks yang sudah ada.

**1. Kirim pesan lewat suara (VN)**
- Klik tombol 🎙️ di sebelah kolom input untuk mulai merekam.
- Muncul bar rekaman dengan durasi berjalan (mm:ss) dan indikator mikrofon aktif.
- Tekan **■ Stop** untuk selesai merekam — audio otomatis dikirim ke server untuk ditranskripsi (Speech-to-Text via Groq Whisper) dan hasilnya langsung dikirim ke Jin seperti pesan teks biasa.
- Tekan **✕ Batal** untuk membatalkan rekaman tanpa mengirim apa pun.
- Kalau transkripsi gagal (koneksi error, kuota habis, dll), kamu tetap bisa mengetik pesan seperti biasa — fitur teks tidak terganggu.

**2. Balasan Jin dibacakan (Text-to-Speech)**
- Setiap balasan Jin punya tombol 🔊 kecil di sampingnya.
- Klik untuk mendengarkan, tombol berubah jadi ⏸ (jeda/lanjut) dan ⏹ (berhenti).
- TTS ini memakai **Web Speech API bawaan browser** (gratis, tanpa API tambahan), jadi kualitas suara tergantung browser/OS pengguna. Browser modern (Chrome, Edge, Safari) biasanya sudah punya suara Bahasa Indonesia.

**3. Voice Mode (obrolan suara penuh)**
- Tombol **🎙️ Voice Mode** di pojok kanan atas judul.
- Kalau **ON**: setiap balasan Jin (baik dari VN maupun teks) otomatis dibacakan — jadi alurnya benar-benar "bicara → Jin jawab → jawaban terdengar" tanpa perlu klik 🔊 manual.
- Kalau **OFF**: website kembali seperti chatbot teks biasa; tombol 🔊 tetap ada di tiap pesan kalau sewaktu-waktu ingin didengarkan manual.

**Izin mikrofon & error**
- Browser akan meminta izin akses mikrofon saat tombol 🎙️ pertama kali ditekan. Kalau ditolak, akan muncul pesan yang jelas di obrolan beserta cara mengaktifkannya kembali lewat pengaturan browser.
- Kalau perangkat tidak punya mikrofon, atau browser tidak mendukung perekaman/synthesis suara, tombol terkait otomatis dinonaktifkan dan diberi keterangan.
- **Catatan penting**: akses mikrofon (`getUserMedia`) hanya diizinkan browser di `https://` atau `http://localhost`. Kalau proyek ini di-deploy online, pastikan diakses lewat HTTPS (layanan seperti Render/Railway/Fly.io biasanya otomatis menyediakan HTTPS).
- File audio VN **tidak disimpan ke disk** di server — hanya diproses sementara di memori untuk dikirim ke Groq Whisper, lalu dibuang.

## Tentang fitur download TikTok

Fitur `/tiktok` memakai layanan publik pihak ketiga (tikwm.com) untuk mengambil link video tanpa watermark — bukan menembus/hack sistem TikTok. Ini untuk pemakaian pribadi (nonton offline/arsip pribadi); videonya tetap hak cipta pembuat aslinya, jadi bijak saja kalau mau dipakai ulang. Layanan pihak ketiga ini bisa berubah atau berhenti sewaktu-waktu di luar kendali kita — kalau suatu saat error terus, kemungkinan API mereka sedang bermasalah.

## Fitur suara (Voice Note & hands-free)

- Tekan tombol 🎙️ di sebelah kolom teks untuk mulai merekam. Tekan **■ Stop** untuk selesai — suaramu otomatis ditranskripsi jadi teks (lewat Groq Whisper) dan dikirim sebagai pesan biasa (tercatat di log obrolan, ada label `[via suara 🎙️]`).
- **Setiap kali kamu kirim pesan lewat VN, balasan Jin otomatis dibacakan sebagai suara** — tidak perlu menyalakan apa pun dulu. Ini yang bikin alurnya hands-free: ngomong → tercatat teks → Jin jawab → jawabannya dibacakan.
- Tombol **🎙️ Voice Mode** di pojok atas itu terpisah: kalau kamu nyalakan, balasan Jin akan otomatis dibacakan juga untuk pesan yang kamu **ketik** manual (bukan cuma VN).
- Text-to-Speech pakai Web Speech API bawaan browser (gratis, tanpa API tambahan). Kualitas suara dan bahasa yang tersedia tergantung browser & OS HP/laptop kamu.
- Transkripsi suara pakai model Whisper gratis di Groq (pakai `GROQ_API_KEY` yang sama, tidak perlu key tambahan).

## Akses dari HP (bukan cuma di komputer)

Ada dua cara, pilih sesuai kebutuhan:

### Cara 1 — Deploy online (disarankan, bisa diakses dari mana saja)
Deploy folder ini ke layanan seperti Render, Railway, atau Fly.io (ada paket gratis). Saat deploy:
- Set environment variable `GROQ_API_KEY` di dashboard layanan tersebut
- Layanan akan otomatis menjalankan `npm start`
- Kamu akan dapat URL publik (otomatis HTTPS) — buka URL itu di browser HP, dari WiFi atau kuota data mana saja, fitur rekam suara langsung berfungsi normal.

### Cara 2 — Akses lewat WiFi rumah yang sama (tanpa deploy, gratis, tapi terbatas)
1. Jalankan `npm start` seperti biasa di laptop/PC.
2. Pastikan HP dan laptop terhubung ke **WiFi yang sama**.
3. Di terminal, server sekarang akan menampilkan alamat seperti `http://192.168.x.x:3000` — buka alamat itu di browser HP.
4. **Penting soal mikrofon:** browser HP (dan browser modern pada umumnya) hanya mengizinkan akses mikrofon lewat koneksi **HTTPS**, atau lewat `localhost` persis. Alamat `http://192.168.x.x:3000` itu HTTP biasa, jadi **tombol 🎙️ kemungkinan besar akan diblokir/tidak muncul izin mikrofonnya di HP** — kamu tetap bisa chat lewat teks biasa, tapi VN tidak akan jalan.
   - Kalau tetap mau coba VN di HP tanpa deploy, pakai tool tunneling gratis seperti [ngrok](https://ngrok.com) atau `cloudflared tunnel` — jalankan `ngrok http 3000` di laptop, lalu buka URL `https://...ngrok-free.app` yang muncul dari HP. Ini kasih HTTPS sementara tanpa perlu deploy permanen.
   - Cara ini butuh laptop tetap menyala & terhubung selama dipakai.

Kalau kamu memang niat pakai Jin sehari-hari dari HP, **Cara 1 (deploy online)** jauh lebih praktis karena HTTPS-nya otomatis dan tidak tergantung laptop menyala.

## Keamanan
- **Jangan pernah** taruh API key langsung di file HTML/JavaScript yang dikirim ke browser.
- **Jangan upload** file `.env` ke GitHub. File ini sudah otomatis diabaikan lewat `.gitignore`.
- **Jangan pernah** kirim/tempel API key ke chat AI mana pun (termasuk ke saya) — kalau tidak sengaja terkirim, segera hapus key itu di console.groq.com dan buat yang baru.
