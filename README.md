# RC Car Controller

Aplikasi web modern untuk mengontrol mobil RC berbasis ESP32-CAM melalui internet menggunakan protokol MQTT. Aplikasi ini menyediakan interface yang intuitif untuk mengontrol pergerakan mobil, melihat live stream kamera, dan memantau status sistem secara real-time.

## 🚗 Fitur Utama

- **Kontrol Real-time**: Kontrol pergerakan mobil RC menggunakan keyboard (WASD) atau tombol UI
- **Live Camera Stream**: Streaming video langsung dari ESP32-CAM dengan kemampuan rotasi gambar
- **Mode Autonomous**: Mode otomatis dengan sensor jarak untuk navigasi mandiri
- **Kontrol Kecepatan & Pencahayaan**: Pengaturan kecepatan motor dan intensitas LED flash
- **System Logging**: Panel log real-time untuk monitoring status dan debugging
- **Sensor Monitoring**: Pembacaan sensor jarak proximity secara real-time
- **Autentikasi Aman**: Sistem login menggunakan Supabase Authentication
- **Responsive Design**: Interface yang responsif dan modern dengan Tailwind CSS
- **Pengaturan Jarak Kustomisasi**: Konfigurasi batas jarak autonomous yang dapat disesuaikan
- **Validasi Input Real-time**: Validasi pengaturan jarak dengan feedback visual
- **Persistent Settings**: Penyimpanan pengaturan yang bertahan setelah restart

## 🛠 Teknologi yang Digunakan

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Authentication**: Supabase Auth
- **Communication**: MQTT over WebSocket
- **State Management**: React Context API + Custom Hooks

## 📋 Prasyarat

Sebelum menjalankan aplikasi, pastikan Anda memiliki:

- Node.js (versi 16 atau lebih baru)
- npm atau yarn
- Akun Supabase (untuk autentikasi)
- MQTT Broker (HiveMQ Cloud atau broker MQTT lainnya)
- ESP32-CAM dengan firmware yang kompatibel

## 🚀 Instalasi dan Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd rc-car-controller
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Buat file `.env` di root directory dan tambahkan variabel berikut:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Konfigurasi MQTT

Edit file `src/App.tsx` dan sesuaikan konfigurasi MQTT:

```typescript
const mqttConfig = {
  brokerUrl: 'wss://your-mqtt-broker-url:8884/mqtt',
  options: {
    clientId: getStableClientId(),
    username: 'your-mqtt-username',
    password: 'your-mqtt-password',
    clean: true,
    connectTimeout: 4000,
  }
};
```

### 5. Setup Supabase

1. Buat project baru di [Supabase](https://supabase.com)
2. Buat user untuk autentikasi melalui Supabase Dashboard
3. Copy URL project dan anon key ke file `.env`

### 6. Jalankan Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173`

## 📁 Struktur Project

```
src/
├── components/          # Komponen UI yang dapat digunakan kembali
│   ├── LoadingSpinner.tsx
│   ├── LoginForm.tsx
│   ├── LogPanel.tsx
│   ├── MQTTStatus.tsx
│   └── UserProfile.tsx
├── contexts/           # React Context untuk state management
│   └── AuthContext.tsx
├── hooks/              # Custom React hooks
│   └── useMQTT.ts
├── lib/                # Konfigurasi library eksternal
│   └── supabase.ts
├── App.tsx             # Komponen utama aplikasi
├── main.tsx            # Entry point aplikasi
└── index.css           # Global styles
```

## 🎮 Cara Penggunaan

### Login
1. Buka aplikasi di browser
2. Masukkan email dan password yang telah terdaftar di Supabase
3. Klik "Sign In" untuk masuk

### Kontrol Mobil RC

#### Kontrol Keyboard
- **W**: Maju
- **S**: Mundur  
- **A**: Belok kiri
- **D**: Belok kanan

#### Kontrol UI
- Gunakan tombol panah di interface untuk kontrol manual
- Tombol merah (kotak) untuk stop
- Slider untuk mengatur kecepatan dan intensitas LED

#### Mode Autonomous
1. Klik tombol "Start Autonomous" untuk mengaktifkan mode otomatis
2. Mobil akan bergerak secara otomatis berdasarkan pembacaan sensor jarak
3. Klik "Stop Autonomous" untuk kembali ke mode manual

### Monitoring
- **Live Camera**: Lihat streaming video real-time dari ESP32-CAM
- **System Logs**: Monitor pesan log dari sistem di panel kanan
- **Sensor Data**: Lihat pembacaan sensor jarak proximity
- **Connection Status**: Status koneksi MQTT ditampilkan di header

### Pengaturan Jarak Autonomous
1. Klik panel "Pengaturan Jarak" untuk membuka konfigurasi
2. Atur tiga parameter jarak:
   - **Jarak Minimum**: Jarak untuk berhenti/mundur (default: 0.3m)
   - **Jarak Aman**: Jarak untuk navigasi normal (default: 1.0m)  
   - **Jarak Maksimum**: Jarak deteksi maksimum (default: 2.0m)
3. Sistem akan memvalidasi input secara real-time
4. Klik "Simpan Pengaturan" untuk menerapkan perubahan
5. Pengaturan akan tersimpan dan bertahan setelah restart

## 📡 MQTT Topics

Aplikasi menggunakan topik MQTT berikut untuk komunikasi dengan ESP32:

| Topic | Deskripsi | Payload |
|-------|-----------|---------|
| `esp32/car/control/move` | Kontrol pergerakan | `forward`, `backward`, `left`, `right`, `stop` |
| `esp32/car/control/speed` | Kontrol kecepatan | `100-255` (integer) |
| `esp32/car/control/flash` | Kontrol LED flash | `0-255` (integer) |
| `esp32/car/config/distance` | Pengaturan jarak autonomous | JSON object dengan minDistance, maxDistance, safeDistance |
| `esp32/car/command/autonomous` | Mode autonomous | `on`, `off` |
| `esp32/car/status` | Status mobil | JSON status |
| `esp32/cam/stream` | Stream kamera | Binary image data |
| `esp32/car/log` | Log sistem | String log message |
| `esp32/car/sensor/distance` | Data sensor jarak | Float distance in cm |

## 🔧 Konfigurasi ESP32

Untuk menggunakan aplikasi ini, ESP32-CAM Anda harus dikonfigurasi untuk:

1. **Koneksi WiFi**: Terhubung ke jaringan internet
2. **MQTT Client**: Terhubung ke broker MQTT yang sama
3. **Camera Module**: Streaming video ke topik `esp32/cam/stream`
4. **Motor Control**: Menerima perintah dari topik kontrol
5. **Sensor Integration**: Mengirim data sensor ke topik yang sesuai
6. **Distance Settings**: Menerima konfigurasi jarak dari topik `esp32/car/config/distance`

## 🚀 Deployment

### Build untuk Production

```bash
npm run build
```

### Deploy ke Netlify

1. Build aplikasi dengan perintah di atas
2. Upload folder `dist` ke Netlify
3. Atau gunakan Netlify CLI:

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## 🔒 Keamanan

- Autentikasi pengguna menggunakan Supabase Auth
- Koneksi MQTT menggunakan WebSocket Secure (WSS)
- Environment variables untuk menyimpan kredensial sensitif
- Row Level Security (RLS) diaktifkan di Supabase

## 🐛 Troubleshooting

### Masalah Koneksi MQTT
- Pastikan URL broker MQTT benar
- Periksa username dan password MQTT
- Pastikan firewall tidak memblokir port WebSocket

### Masalah Autentikasi
- Periksa konfigurasi Supabase URL dan anon key
- Pastikan user sudah terdaftar di Supabase Dashboard
- Periksa pengaturan RLS di Supabase

### Masalah Camera Stream
- Pastikan ESP32-CAM terhubung dan berfungsi
- Periksa topik MQTT untuk camera stream
- Pastikan format data gambar sesuai

### Masalah Pengaturan Jarak
- Periksa validasi input jika pengaturan tidak bisa disimpan
- Pastikan nilai jarak dalam rentang 0.1m - 10m
- Pastikan relasi jarak: minimum < aman < maksimum
- Cek localStorage browser jika pengaturan tidak tersimpan
## 📝 Development

### Menjalankan dalam Mode Development

```bash
npm run dev
```

### Linting

```bash
npm run lint
```

### Build

```bash
npm run build
```

### Preview Build

```bash
npm run preview
```

## 🤝 Kontribusi

1. Fork repository ini
2. Buat branch fitur baru (`git checkout -b feature/amazing-feature`)
3. Commit perubahan (`git commit -m 'Add some amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

## 📄 Lisensi

Project ini menggunakan lisensi MIT. Lihat file `LICENSE` untuk detail lebih lanjut.

## 📞 Support

Jika Anda mengalami masalah atau memiliki pertanyaan, silakan buat issue di repository ini atau hubungi tim development.

---

**Dibuat dengan ❤️ menggunakan React + TypeScript + Tailwind CSS**