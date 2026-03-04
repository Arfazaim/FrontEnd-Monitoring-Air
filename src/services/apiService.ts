import axios from 'axios';

// Mengambil URL dari .env (Vite menggunakan import.meta.env)
const API_BASE = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY // Otomatis mengirim API Key untuk setiap request
  }
});

// Interface tetap sama, tapi kita sesuaikan dengan data dari Backend
export interface SensorData {
  ph: number;
  turbidity: number; // Dari kolom 'kekeruhan'
  tds: number;
  battery: number;   // Dari kolom 'tegangan'
  timestamp: string; // Dari kolom 'created_at'
  status: 'Layak' | 'Tidak Layak';
  pumpActive: boolean;
}

export interface SensorHistory {
  timestamp: string;
  ph: number;
  turbidity: number;
  tds: number;
}

export interface DosingLog {
  id: number;
  nama_aktuator: string;
  obat_digunakan: string;
  keterangan: string;
  created_at: string;
}

export interface SensorConfig {
  offset_ph: number;
  offset_tds: number;
  offset_kekeruhan: number;
}

export const apiService = {
  // 1. Mengambil data sensor terbaru & history
  async getSensors(): Promise<{ current: SensorData; history: SensorHistory[] }> {
    const { data } = await api.get('/sensors');
    const rawData = data.data; // Data dari backend (array)

    if (!rawData || rawData.length === 0) {
      throw new Error("Data sensor kosong di database");
    }

    // Ambil data paling baru (indeks 0 karena ORDER BY created_at DESC)
    const latest = rawData[0];

    return {
      current: {
        ph: latest.ph,
        turbidity: latest.kekeruhan,
        tds: latest.tds,
        battery: latest.tegangan,
        timestamp: latest.created_at,
        status: latest.status,
        pumpActive: latest.status === 'Tidak Layak', // Logika: Jika tidak layak, PAC pump nyala
      },
      // Map data untuk grafik history
      history: rawData.map((item: any) => ({
        timestamp: new Date(item.created_at).toLocaleTimeString(),
        ph: item.ph,
        turbidity: item.kekeruhan,
        tds: item.tds,
      })).reverse(), // Balik urutan agar grafik berjalan dari kiri ke kanan
    };
  },

  // 2. Mengambil Log Penggunaan PAC
  async getLogs(): Promise<DosingLog[]> {
    const { data } = await api.get('/logs'); // Pastikan backend punya endpoint GET /logs
    return data.data;
  },

  // 3. Mengambil Konfigurasi Kalibrasi
  async getConfig(): Promise<SensorConfig> {
    const { data } = await api.get('/config');
    return data;
  },

  // 4. Update Konfigurasi Kalibrasi
  async updateConfig(config: Partial<SensorConfig>): Promise<void> {
    await api.post('/config', config);
  },

  // 5. Link Download Export CSV
  getExportUrl(): string {
    return `${API_BASE}/export`;
  }
};