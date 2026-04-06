import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL;
const API_KEY  = import.meta.env.VITE_API_KEY;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  },
});

export interface SensorData {
  ph: number;
  turbidity: number;   // dari kolom 'kekeruhan'
  tds: number;
  battery: number;     // dari kolom 'tegangan'
  timestamp: string;   // dari kolom 'created_at'
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

// Field names harus konsisten dengan backend
export interface SensorConfig {
  offset_ph: number;
  offset_tds: number;
  offset_kekeruhan: number;
}

export const apiService = {
  async getSensors(): Promise<{ current: SensorData; history: SensorHistory[] }> {
    const { data } = await api.get('/sensors');
    const rawData  = data.data;

    if (!rawData || rawData.length === 0) {
      throw new Error("Data sensor kosong di database");
    }

    const latest = rawData[0];

    return {
      current: {
        ph:        latest.ph,
        turbidity: latest.kekeruhan,
        tds:       latest.tds,
        battery:   latest.tegangan,
        timestamp: latest.created_at,
        status:    latest.status,
        pumpActive: latest.status === 'Tidak Layak',
      },
      history: rawData.map((item: any) => ({
        timestamp: new Date(item.created_at).toLocaleTimeString('id-ID', {
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        }),
        ph:        item.ph,
        turbidity: item.kekeruhan,
        tds:       item.tds,
      })).reverse(),
    };
  },

  async getLogs(): Promise<DosingLog[]> {
    const { data } = await api.get('/logs');
    return data.data;
  },

  async getConfig(): Promise<SensorConfig> {
    const { data } = await api.get('/config');
    return data;
  },

  async updateConfig(config: Partial<SensorConfig>): Promise<void> {
    await api.post('/config', config);
  },

  async checkConnection(): Promise<boolean> {
    try {
      await api.get('/sensors');
      return true;
    } catch {
      return false;
    }
  },

  getExportUrl(): string {
    return `${API_BASE}/export`;
  },
};
