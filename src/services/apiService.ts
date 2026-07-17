import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL;
const API_KEY  = import.meta.env.VITE_API_KEY;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    // x-api-key hanya diperlukan untuk POST /sensors (ESP32)
    // GET endpoints tidak memerlukan API key
  },
});

export interface SensorData {
  ph: number;
  turbidity: number;
  tds: number;
  battery: number;
  timestamp: string;
  status: 'Layak' | 'Tidak Layak';
  solenoidActive: boolean;
  // ML prediksi (null jika ML service belum aktif)
  ml: {
    score: number;         // 0-100 — probabilitas Tidak Layak
    confidence: 'Tinggi' | 'Sedang' | 'Rendah';
    prediction: 'Layak' | 'Tidak Layak';
    detail: {
      rf: { score: number; prediction: string };
      dt: { score: number; prediction: string };
      nb: { score: number; prediction: string };
      best_model: string;
    };
  } | null;
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

export interface SensorStats {
  total: number;
  avg_ph: number;
  min_ph: number;
  max_ph: number;
  avg_turbidity: number;
  avg_tds: number;
  total_layak: number;
  total_tidak_layak: number;
  oldest: string;
  newest: string;
}

export interface MLModelResult {
  key: string;
  name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  cv_mean: number;
  cv_std: number;
  is_best: boolean;
}

export interface MLAccuracy {
  best_model: string;
  total_data: number;
  trained_at: string;
  models: MLModelResult[];
}

export interface FeatureImportance {
  feature: string;
  importance: number;  // 0-100 (%)
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
        ph:             latest.ph,
        turbidity:      latest.kekeruhan,
        tds:            latest.tds,
        battery:        latest.tegangan,
        timestamp:      latest.created_at,
        status:         latest.status,
        solenoidActive: latest.status === 'Tidak Layak',
        ml: latest.ml_score != null ? {
          score:      parseFloat(latest.ml_score),
          confidence: latest.ml_confidence,
          prediction: latest.ml_prediction,
          detail:     { rf: {score:0,prediction:''}, dt: {score:0,prediction:''}, nb: {score:0,prediction:''}, best_model: '' },
        } : null,
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

  // Ambil hanya 1 data terbaru (lebih ringan untuk polling status)
  async getLatest(): Promise<SensorData | null> {
    try {
      const { data } = await api.get('/latest');
      const row = data.data;
      if (!row) return null;

      // Ambil state solenoid yang sebenarnya (termasuk manual override)
      let solenoidActive = row.status === 'Tidak Layak'; // fallback
      try {
        const { data: actData } = await api.get('/actuator/solenoid');
        solenoidActive = actData.solenoid === true;
      } catch { /* fallback ke status otomatis */ }

      return {
        ph:             row.ph,
        turbidity:      row.kekeruhan,
        tds:            row.tds,
        battery:        row.tegangan,
        timestamp:      row.created_at,
        status:         row.status,
        solenoidActive,
      };
    } catch {
      return null;
    }
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

  // Ambil statistik ringkas dari seluruh data historis
  async getStats(): Promise<SensorStats> {
    const { data } = await api.get('/stats');
    return data.data;
  },

  // ── ML Service ───────────────────────────────────────────
  async getMLStatus(): Promise<{ online: boolean; best_model?: string }> {
    try {
      const { data } = await api.get('/ml/status');
      return data;
    } catch {
      return { online: false };
    }
  },

  async getMLAccuracy(): Promise<MLAccuracy | null> {
    try {
      const { data } = await api.get('/ml/accuracy');
      return data;
    } catch {
      return null;
    }
  },

  async getFeatureImportance(): Promise<FeatureImportance[]> {
    try {
      const { data } = await api.get('/ml/feature-importance');
      return data.data;
    } catch {
      return [];
    }
  },

  async checkConnection(): Promise<boolean> {
    try {
      await api.get('/latest');
      return true;
    } catch {
      return false;
    }
  },

  getExportUrl(): string {
    return `${API_BASE}/export`;
  },
};
