import { useEffect, useState, useCallback } from "react";
import {
  Droplets, Waves, Zap, Battery, AlertTriangle, CheckCircle,
  TrendingUp, TrendingDown, Minus, Activity, Clock, RefreshCw, Brain
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, AreaChart, Area
} from "recharts";
import {
  apiService, type SensorData, type SensorHistory,
  type MLAccuracy, type FeatureImportance
} from "@/services/apiService";
import { cn } from "@/lib/utils";

// ── Threshold helpers ──────────────────────────────────────────
const thresholds = {
  ph:        { min: 6.5, max: 8.5, unit: "pH",  label: "pH Level" },
  turbidity: { min: 0,   max: 25,  unit: "NTU", label: "Kekeruhan" },
  tds:       { min: 0,   max: 500, unit: "ppm", label: "TDS" },
  battery:   { min: 0,   max: 5,   unit: "V",   label: "Tegangan" },
};

function getStatus(key: keyof typeof thresholds, value: number) {
  const t = thresholds[key];
  if (key === "ph") {
    if (value < t.min || value > t.max) return "danger";
    if (value < 6.8 || value > 8.2) return "warning";
    return "good";
  }
  const ratio = value / t.max;
  if (ratio > 0.9) return "danger";
  if (ratio > 0.7) return "warning";
  return "good";
}

const statusColors = {
  good:    "text-emerald-500",
  warning: "text-amber-500",
  danger:  "text-red-500",
};
const statusBg = {
  good:    "border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/10",
  warning: "border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/10",
  danger:  "border-red-500/20 bg-red-50/50 dark:bg-red-500/10",
};

// ── Trend arrow ───────────────────────────────────────────────
function TrendIcon({ history, dataKey }: { history: SensorHistory[]; dataKey: string }) {
  if (history.length < 3) return <Minus className="h-3 w-3 text-muted-foreground" />;
  const last = (history[history.length - 1] as any)[dataKey];
  const prev = (history[history.length - 3] as any)[dataKey];
  const delta = last - prev;
  if (Math.abs(delta) < 0.05) return <Minus className="h-3 w-3 text-muted-foreground" />;
  return delta > 0
    ? <TrendingUp className="h-3 w-3 text-amber-400" />
    : <TrendingDown className="h-3 w-3 text-emerald-400" />;
}

// ── Mini sparkline ─────────────────────────────────────────────
function Sparkline({ data, dataKey, color }: { data: SensorHistory[]; dataKey: string; color: string }) {
  const sliced = data.slice(-20);
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={sliced} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`sg-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#sg-${dataKey})`}
          strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Sensor Card ────────────────────────────────────────────────
function SensorCard({
  sensorKey, value, history, icon: Icon, color, sparkColor
}: {
  sensorKey: keyof typeof thresholds;
  value: number;
  history: SensorHistory[];
  icon: any;
  color: string;
  sparkColor: string;
}) {
  const t = thresholds[sensorKey];
  const st = getStatus(sensorKey, value);
  const pct = Math.min(100, Math.max(0, ((value - t.min) / (t.max - t.min)) * 100));
  
  const numValue = Number(value || 0); 
  const displayVal = sensorKey === "ph" ? numValue.toFixed(2)
    : sensorKey === "battery" ? numValue.toFixed(1)
    : sensorKey === "tds" ? numValue.toFixed(0)
    : numValue.toFixed(1);

  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-md animate-fade-in">
      <CardHeader>
        <CardDescription className="flex items-center gap-1.5 font-medium text-sm">
          <Icon className="h-4 w-4" />
          {t.label}
        </CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums mt-1 text-foreground">
          {displayVal} <span className="text-sm text-muted-foreground font-normal">{t.unit}</span>
        </CardTitle>
        <div className="absolute right-4 top-4">
          <Badge variant="outline" className={cn("flex gap-1 px-1.5 py-0 font-medium", statusColors[st], statusBg[st])}>
            <TrendIcon history={history} dataKey={sensorKey === "turbidity" ? "turbidity" : sensorKey} />
            {st === "good" ? "Normal" : st === "warning" ? "Waspada" : "Bahaya"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-4 space-y-3">
        <div className="w-full">
          <Progress value={pct} className={cn("h-1.5", statusBg[st])} indicatorColor={st === "good" ? "bg-emerald-500" : st === "warning" ? "bg-amber-500" : "bg-red-500"} />
          <div className="flex justify-between mt-1.5 w-full">
            <span className="text-[10px] text-muted-foreground">Min: {t.min}</span>
            <span className="text-[10px] text-muted-foreground">Max: {t.max}</span>
          </div>
        </div>
        <div className="w-full">
          <Sparkline data={history} dataKey={sensorKey === "turbidity" ? "turbidity" : sensorKey} color={sparkColor} />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Custom tooltip ─────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs font-mono shadow-xl">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="leading-5">
          {p.name}: <span className="font-bold">{typeof p.value === "number" ? p.value.toFixed(2) : p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ── WQI (Water Quality Index) gauge ───────────────────────────
function WQIGauge({ current }: { current: SensorData }) {
  const phScore = (() => {
    const v = current.ph;
    if (v >= 6.5 && v <= 8.5) return 100;
    if (v < 6.5) return Math.max(0, (v / 6.5) * 80);
    return Math.max(0, ((9.5 - v) / 1) * 80);
  })();
  const turbScore = Math.max(0, 100 - (current.turbidity / 25) * 100);
  const tdsScore  = Math.max(0, 100 - (current.tds / 500) * 100);
  const wqi = Math.round((phScore * 0.4 + turbScore * 0.35 + tdsScore * 0.25));

  const color = wqi >= 75 ? "#34d399" : wqi >= 50 ? "#fbbf24" : "#f87171";
  const label = wqi >= 75 ? "Layak Konsumsi" : wqi >= 50 ? "Perlu Perhatian" : "Tidak Layak";
  const deg   = (wqi / 100) * 180;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="120" height="68" viewBox="0 0 120 68">
        <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="hsl(222 18% 18%)" strokeWidth="10" strokeLinecap="round" />
        <path
          d="M10 60 A50 50 0 0 1 110 60"
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray="157" strokeDashoffset={157 - (deg / 180) * 157}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text x="60" y="58" textAnchor="middle" fontSize="22" fontWeight="700" fill={color} fontFamily="JetBrains Mono">{wqi}</text>
        <text x="60" y="68" textAnchor="middle" fontSize="8" fill="#6b7280" fontFamily="JetBrains Mono">WQI</text>
      </svg>
      <span className="text-xs font-mono font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

// ── ML Score Gauge ─────────────────────────────────────────
function MLScoreGauge({ score, confidence, prediction }: {
  score: number;
  confidence: string;
  prediction: string;
}) {
  const color  = score >= 60 ? "#f87171" : score >= 40 ? "#fbbf24" : "#34d399";
  const deg    = (score / 100) * 180;
  const confColor = confidence === 'Tinggi' ? 'text-emerald-400'
                  : confidence === 'Sedang' ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="120" height="68" viewBox="0 0 120 68">
        <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="hsl(222 18% 18%)" strokeWidth="10" strokeLinecap="round" />
        <path
          d="M10 60 A50 50 0 0 1 110 60"
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray="157" strokeDashoffset={157 - (deg / 180) * 157}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text x="60" y="54" textAnchor="middle" fontSize="20" fontWeight="700" fill={color} fontFamily="JetBrains Mono">{score.toFixed(0)}%</text>
        <text x="60" y="66" textAnchor="middle" fontSize="7" fill="#6b7280" fontFamily="JetBrains Mono">Tdk Layak</text>
      </svg>
      <div className="text-center">
        <p className="text-xs font-mono font-bold" style={{ color }}>{prediction}</p>
        <p className={cn("text-[10px] font-mono", confColor)}>Keyakinan: {confidence}</p>
      </div>
    </div>
  );
}

// ── Model Comparison Card ─────────────────────────────────
function ModelComparisonCard({ mlData }: { mlData: MLAccuracy }) {
  const modelColors: Record<string, string> = {
    'Random Forest': 'text-emerald-500',
    'Decision Tree': 'text-sky-500',
    'Naive Bayes'  : 'text-purple-500',
  };
  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-500" />
            Perbandingan Model ML
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
            {mlData.total_data} data training
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {mlData.models.map((m) => (
          <div key={m.key} className={cn(
            "rounded-lg p-3 border transition-all",
            m.is_best ? "border-purple-500/40 bg-purple-500/5" : "border-border/40 bg-muted/20"
          )}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={cn("text-xs font-semibold", modelColors[m.name] ?? 'text-foreground')}>
                  {m.name}
                </span>
                {m.is_best && (
                  <Badge className="text-[9px] px-1.5 py-0 bg-purple-600 hover:bg-purple-700">Terbaik</Badge>
                )}
              </div>
              <span className="text-sm font-mono font-bold">{m.accuracy}%</span>
            </div>
            <Progress value={m.accuracy} className="h-1.5 mb-2" indicatorColor="bg-primary" />
            <div className="grid grid-cols-3 gap-2">
              {[
                ['Precision', m.precision],
                ['Recall',    m.recall],
                ['F1-Score',  m.f1_score],
              ].map(([label, val]) => (
                <div key={String(label)} className="text-center">
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="text-[11px] font-mono font-semibold">{val}%</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Feature Importance Bar ─────────────────────────────────
const FEAT_COLORS: Record<string, string> = {
  ph       : "hsl(180 75% 48%)",
  kekeruhan: "hsl(38 95% 52%)",
  tds      : "hsl(270 65% 65%)",
};
const FEAT_LABELS: Record<string, string> = {
  ph: "pH", kekeruhan: "Kekeruhan (NTU)", tds: "TDS (ppm)"
};

function FeatureImportanceBar({ data }: { data: FeatureImportance[] }) {
  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-sky-500" />
          Kontribusi Fitur Sensor
          <span className="text-[10px] text-muted-foreground ml-1 font-normal">(Random Forest)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((item) => (
          <div key={item.feature}>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {FEAT_LABELS[item.feature] ?? item.feature}
              </span>
              <span className="text-xs font-mono font-semibold">{item.importance.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${item.importance}%`,
                  background: FEAT_COLORS[item.feature] ?? "hsl(215 60% 60%)",
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function DashboardPage() {
  const [current, setCurrent]         = useState<SensorData | null>(null);
  const [history, setHistory]         = useState<SensorHistory[]>([]);
  const [lastUpdate, setLastUpdate]   = useState<Date | null>(null);
  const [refreshing, setRefreshing]   = useState(false);
  const [activeChart, setActiveChart] = useState<"ph" | "turbidity" | "tds">("ph");
  // ML state
  const [mlAccuracy, setMlAccuracy]   = useState<MLAccuracy | null>(null);
  const [mlFeatures, setMlFeatures]   = useState<FeatureImportance[]>([]);

  const fetchData = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const data = await apiService.getSensors();
      setCurrent(data.current);
      setHistory(data.history);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Gagal mengambil data sensor:", error);
    } finally {
      if (manual) setTimeout(() => setRefreshing(false), 600);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 5000);

    // Muat data ML (akurasi + feature importance) sekali saat pertama load
    apiService.getMLAccuracy().then(d => { if (d) setMlAccuracy(d); });
    apiService.getFeatureImportance().then(d => { if (d.length) setMlFeatures(d); });

    return () => clearInterval(interval);
  }, [fetchData]);

  if (!current) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-2 border-primary/30 animate-ping absolute inset-0" />
          <div className="h-16 w-16 rounded-full border-2 border-primary flex items-center justify-center">
            <Activity className="h-6 w-6 text-primary animate-pulse" />
          </div>
        </div>
        <p className="text-muted-foreground font-mono text-sm animate-pulse tracking-widest">
          MENGHUBUNGKAN KE SENSOR...
        </p>
        <p className="text-muted-foreground/50 font-mono text-xs">Pastikan backend berjalan di {import.meta.env.VITE_API_URL}</p>
      </div>
    );
  }

  const isLayak = current.status === "Layak";

  const chartConfigs = {
    ph:        { color: "hsl(180 75% 48%)", name: "pH",           ref: { min: 6.5, max: 8.5 } },
    turbidity: { color: "hsl(38 95% 52%)",  name: "Kekeruhan",    ref: { min: 0,   max: 25   } },
    tds:       { color: "hsl(270 65% 65%)", name: "TDS",          ref: { min: 0,   max: 500  } },
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header row ── */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard Monitoring</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {lastUpdate ? `Terakhir diperbarui: ${lastUpdate.toLocaleTimeString("id-ID")}` : "Menunggu data..."}
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors border rounded-md px-3 py-1.5 shadow-sm"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* ── Status Banner ── */}
      <div className={cn(
        "flex items-center gap-4 rounded-xl border p-4 transition-all duration-500",
        isLayak
          ? "border-emerald-500/25 bg-emerald-500/8 glow-success"
          : "border-red-500/25 bg-red-500/8 glow-destructive"
      )}>
        <div className={cn("rounded-full p-2", isLayak ? "bg-emerald-500/15" : "bg-red-500/15")}>
          {isLayak
            ? <CheckCircle className="h-7 w-7 text-emerald-400" />
            : <AlertTriangle className="h-7 w-7 text-red-400 animate-pulse" />
          }
        </div>
        <div className="flex-1">
          <p className="font-mono font-bold tracking-wider text-base">
            STATUS AIR:{" "}
            <span className={isLayak ? "text-emerald-400" : "text-red-400"}>
              {current.status.toUpperCase()}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isLayak
              ? "Semua parameter dalam batas normal. Sistem berjalan optimal."
              : "⚠ Kualitas air di bawah standar — Solenoid Valve terbuka otomatis."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <WQIGauge current={current} />
          {current.solenoidActive && (
            <Badge variant="destructive" className="font-mono text-xs animate-pulse bg-orange-600/90 border-orange-500">
              🚨 SOLENOID BUKA
            </Badge>
          )}
        </div>
      </div>

      {/* ── Sensor Cards ── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <SensorCard sensorKey="ph"        value={current.ph}        history={history} icon={Droplets} color="sky"    sparkColor="hsl(180 75% 48%)" />
        <SensorCard sensorKey="turbidity" value={current.turbidity} history={history} icon={Waves}    color="amber"  sparkColor="hsl(38 95% 52%)"  />
        <SensorCard sensorKey="tds"       value={current.tds}       history={history} icon={Zap}      color="purple" sparkColor="hsl(270 65% 65%)"  />
        <SensorCard sensorKey="battery"   value={current.battery}   history={history} icon={Battery}  color="emerald" sparkColor="hsl(148 68% 42%)" />
      </div>

      {/* ── ML Section ── */}
      {(current.ml || mlAccuracy) && (
        <div className="space-y-4">
          {/* Header ML */}
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-400" />
            <h2 className="text-sm font-mono font-semibold text-muted-foreground tracking-wider uppercase">
              Prediksi Machine Learning
            </h2>
            <Badge variant="outline" className="text-[10px] font-mono border-purple-500/40 text-purple-400">
              {mlAccuracy?.best_model ?? 'ML'} Active
            </Badge>
          </div>

          {/* ML Score + Model Comparison + Feature Importance */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">

            {/* ML Score Gauge Card */}
            {current.ml && (
              <Card className={cn(
                "border transition-all duration-500",
                current.ml.score >= 60
                  ? "border-red-500/30 bg-red-50/50 dark:bg-red-500/10"
                  : current.ml.score >= 40
                  ? "border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/10"
                  : "border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10"
              )}>
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-sm font-mono text-muted-foreground tracking-wider flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-400" />
                    PREDIKSI ML REAL-TIME
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 flex flex-col items-center gap-3">
                  <MLScoreGauge
                    score={current.ml.score}
                    confidence={current.ml.confidence}
                    prediction={current.ml.prediction}
                  />
                  {/* Skor dari tiap model */}
                  {current.ml.detail?.rf && (
                    <div className="w-full space-y-1.5 text-xs font-mono">
                      {[
                        { label: 'Random Forest', key: 'rf', color: 'hsl(148 68% 42%)' },
                        { label: 'Decision Tree', key: 'dt', color: 'hsl(204 86% 53%)' },
                        { label: 'Naive Bayes',   key: 'nb', color: 'hsl(270 65% 65%)' },
                      ].map(({ label, key, color }) => {
                        const m = (current.ml!.detail as any)[key];
                        if (!m) return null;
                        return (
                          <div key={key} className="flex items-center gap-2">
                            <span className="w-24 text-muted-foreground text-[10px]">{label}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${m.score}%`, background: color }} />
                            </div>
                            <span className="w-10 text-right text-[10px] text-foreground">{m.score}%</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Model Comparison (akurasi dari training) */}
            {mlAccuracy && <ModelComparisonCard mlData={mlAccuracy} />}

            {/* Feature Importance */}
            {mlFeatures.length > 0 && <FeatureImportanceBar data={mlFeatures} />}
          </div>
        </div>
      )}

      {/* ── Chart ── */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-sm font-mono text-muted-foreground tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              GRAFIK REAL-TIME — {history.length} titik data
            </CardTitle>
            <div className="flex gap-1">
              {(["ph", "turbidity", "tds"] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveChart(key)}
                  className={cn(
                    "px-3 py-1 text-xs font-mono rounded-md border transition-all",
                    activeChart === key
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                  )}
                >
                  {key === "ph" ? "pH" : key === "turbidity" ? "Turbidity" : "TDS"}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 18% 18%)" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fill: "hsl(215 15% 50%)", fontSize: 10, fontFamily: "JetBrains Mono" }}
                  tickLine={false} axisLine={false}
                  interval={Math.floor(history.length / 8)}
                />
                <YAxis
                  tick={{ fill: "hsl(215 15% 50%)", fontSize: 10, fontFamily: "JetBrains Mono" }}
                  tickLine={false} axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={chartConfigs[activeChart].ref.max}
                  stroke="hsl(0 75% 58% / 0.4)"
                  strokeDasharray="4 4"
                  label={{ value: "MAX", fill: "hsl(0 75% 58%)", fontSize: 9, fontFamily: "JetBrains Mono" }}
                />
                {activeChart === "ph" && (
                  <ReferenceLine
                    y={chartConfigs.ph.ref.min}
                    stroke="hsl(0 75% 58% / 0.4)"
                    strokeDasharray="4 4"
                    label={{ value: "MIN", fill: "hsl(0 75% 58%)", fontSize: 9, fontFamily: "JetBrains Mono" }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey={activeChart}
                  stroke={chartConfigs[activeChart].color}
                  strokeWidth={2}
                  dot={false}
                  name={chartConfigs[activeChart].name}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── Stats Row ── */}
      {history.length > 1 && (
        <div className="grid grid-cols-3 gap-3">
          {(["ph", "turbidity", "tds"] as const).map((key) => {
            const vals = history.map(h => (h as any)[key] as number).filter(Boolean);
            const avg  = vals.reduce((a, b) => a + b, 0) / vals.length;
            const min  = Math.min(...vals);
            const max  = Math.max(...vals);
            return (
              <Card key={key} className="border-border px-4 py-3 shadow-sm">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">
                  {key === "ph" ? "pH" : key === "turbidity" ? "Turbidity" : "TDS"} — Statistik
                </p>
                <div className="grid grid-cols-3 gap-1 text-center">
                  {[["AVG", avg], ["MIN", min], ["MAX", max]].map(([lbl, v]) => (
                    <div key={String(lbl)}>
                      <p className="text-[9px] text-muted-foreground">{lbl}</p>
                      <p className="text-sm font-mono font-bold">
                        {(v as number).toFixed(key === "tds" ? 0 : 2)}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
