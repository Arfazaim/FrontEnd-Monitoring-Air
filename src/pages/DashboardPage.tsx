import { useEffect, useState, useCallback } from "react";
import {
  Droplets, Waves, Zap, Battery, AlertTriangle, CheckCircle,
  TrendingUp, TrendingDown, Minus, Activity, Clock, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, AreaChart, Area
} from "recharts";
import { apiService, type SensorData, type SensorHistory } from "@/services/apiService";
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
  good:    "text-emerald-400",
  warning: "text-amber-400",
  danger:  "text-red-400",
};
const statusBg = {
  good:    "border-emerald-500/20 bg-emerald-500/5",
  warning: "border-amber-500/20 bg-amber-500/5",
  danger:  "border-red-500/20 bg-red-500/5",
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

  return (
    <Card className={cn("relative overflow-hidden border transition-all duration-500 animate-fade-in", statusBg[st])}>
      <CardHeader className="flex flex-row items-start justify-between pb-1 pt-4 px-4">
        <div className="flex items-center gap-2">
          <div className={cn("rounded-md p-1.5", `bg-${color}-500/10`)}>
            <Icon className={cn("h-4 w-4", `text-${color}-400`)} />
          </div>
          <span className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
            {t.label}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <TrendIcon history={history} dataKey={sensorKey === "turbidity" ? "turbidity" : sensorKey} />
          <Badge
            variant="outline"
            className={cn("text-[10px] font-mono px-1.5 py-0 border-0 font-semibold", statusColors[st])}
          >
            {st === "good" ? "NORMAL" : st === "warning" ? "WASPADA" : "BAHAYA"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="flex items-baseline gap-1 mb-1">
  <span className="font-mono text-3xl font-bold tracking-tight text-foreground">
    {/* Kita bungkus value dengan Number() untuk memastikan tipe datanya angka */}
    {(() => {
      const numValue = Number(value || 0); 
      return sensorKey === "ph" ? numValue.toFixed(2)
        : sensorKey === "battery" ? numValue.toFixed(1)
        : sensorKey === "tds" ? numValue.toFixed(0)
        : numValue.toFixed(1);
    })()}
  </span>
  <span className="text-sm text-muted-foreground font-mono">{t.unit}</span>
</div>
        <div className="mb-2">
          <Progress
            value={pct}
            className="h-1"
            style={{ ["--progress-color" as any]: st === "good" ? "hsl(148 68% 42%)" : st === "warning" ? "hsl(38 95% 52%)" : "hsl(0 75% 58%)" }}
          />
          <div className="flex justify-between mt-0.5">
            <span className="text-[9px] font-mono text-muted-foreground/60">{t.min}{t.unit}</span>
            <span className="text-[9px] font-mono text-muted-foreground/60">{t.max}{t.unit}</span>
          </div>
        </div>
        <Sparkline data={history} dataKey={sensorKey === "turbidity" ? "turbidity" : sensorKey} color={sparkColor} />
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

// ── Main Page ──────────────────────────────────────────────────
export default function DashboardPage() {
  const [current, setCurrent]         = useState<SensorData | null>(null);
  const [history, setHistory]         = useState<SensorHistory[]>([]);
  const [lastUpdate, setLastUpdate]   = useState<Date | null>(null);
  const [refreshing, setRefreshing]   = useState(false);
  const [activeChart, setActiveChart] = useState<"ph" | "turbidity" | "tds">("ph");

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
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Dashboard Monitoring</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5 flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            {lastUpdate ? `Update: ${lastUpdate.toLocaleTimeString("id-ID")}` : "Menunggu data..."}
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md px-3 py-1.5 bg-card/50 hover:bg-card"
        >
          <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
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
              : "⚠ Kualitas air di bawah standar — PAC Dosing Pump aktif secara otomatis."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <WQIGauge current={current} />
          {current.pumpActive && (
            <Badge variant="destructive" className="font-mono text-xs animate-pulse bg-red-600/90 border-red-500">
              ⚡ PUMP ON
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

      {/* ── Chart ── */}
      <Card className="card-glass border-border/50">
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
              <Card key={key} className="card-glass border-border/40 px-4 py-3">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">
                  {key === "ph" ? "pH" : key === "turbidity" ? "Turbidity" : "TDS"} — Statistik
                </p>
                <div className="grid grid-cols-3 gap-1 text-center">
                  {[["AVG", avg], ["MIN", min], ["MAX", max]].map(([lbl, v]) => (
                    <div key={String(lbl)}>
                      <p className="text-[9px] text-muted-foreground/60 font-mono">{lbl}</p>
                      <p className="text-sm font-mono font-bold text-foreground">
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
