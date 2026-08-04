# AGENTS.md — Frontend (Dashboard Monitoring & Pengendalian)

Konteks: **pondok pesantren**, deteksi air berpotensi iritasi kulit/gatal.

## ⚠️ Status: Belum Dibangun

Dokumen ini adalah **spesifikasi/brief**, bukan dokumentasi kode yang sudah ada.

## Tujuan

Dashboard web yang menampilkan:
1. Pembacaan sensor real-time (pH, TDS, turbidity — **tidak ada suhu**)
2. Hasil klasifikasi (Layak/Tidak Layak) dengan indikator warna
   (hijau=Layak, merah=Tidak Layak)
3. Status pompa dosing cairan purifikasi (ON/OFF) — **hanya satu aktuator**
4. Parameter yang menyebabkan Tidak Layak (bila ada), untuk keperluan
   diagnostik pengelola pondok
5. Grafik historis parameter dari waktu ke waktu
6. Tabel riwayat prediksi

## Sumber Data (Kontrak API dari Backend)

- `GET http://<ip-backend>:5000/riwayat` → 50 entri riwayat terakhir
- `GET http://<ip-backend>:5000/health` → status server

### Contoh Struktur JSON

```json
{
  "data_sensor": {"ph": 5.8, "tds": 620, "turbidity": 7.2},
  "klasifikasi": "Tidak Layak",
  "confidence": 0.984,
  "parameter_bermasalah": [
    "pH di luar rentang aman (indikasi berpotensi iritasi kulit)",
    "TDS melebihi ambang batas (indikasi kadar mineral/Fe/Mn tinggi)"
  ],
  "perintah_aktuator": {
    "pompa_dosing_purifikasi": 1,
    "indikator_led": "merah"
  },
  "waktu": "2026-08-02T17:15:22.504693"
}
```

**PENTING**: field `suhu` **tidak ada** dalam data ini. Jangan menampilkan
kartu/grafik suhu di dashboard.

## Rekomendasi Tech Stack

React JS untuk web, atau alternatif ringan (HTML + JS + Chart.js) untuk
skala demo sidang skripsi.

## Hal yang Perlu Diperhatikan

- Backend berjalan di jaringan lokal (LAN)
- **CORS**: `backend_api.py` perlu ditambahkan `flask-cors` begitu frontend
  mengakses dari browser di origin/port berbeda
- Karena hanya ada 1 aktuator, dashboard cukup menampilkan 1 indikator status
  pompa — tidak perlu kartu status untuk RO/filter/UV/dosing pH terpisah

## Langkah Membangun (Saran Urutan)

1. Tambahkan `flask-cors` ke backend
2. Buat halaman dasar yang polling `/riwayat` setiap 5–10 detik
3. Tambahkan grafik historis (Chart.js/Recharts) untuk pH, TDS, turbidity
4. Tambahkan indikator status pompa purifikasi (ON/OFF) dan LED hijau/merah
5. (Opsional) Tambahkan notifikasi browser saat klasifikasi = "Tidak Layak"

## Belum Dikerjakan / TODO

- Semuanya — bagian ini kosong dan siap dibangun dari nol
