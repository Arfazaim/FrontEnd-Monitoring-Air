import { useEffect, useState, useCallback } from "react";
import { Droplets, Waves, Zap, Battery, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { apiService, type SensorData, type SensorHistory } from "@/services/apiService";

function SensorCard({ title, value, unit, icon: Icon, color, subtitle }: {
  title: string; value: string; unit: string; icon: any; color: string; subtitle?: string;
}) {
  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="font-mono text-3xl font-bold tracking-tight">
          {value}
          <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
        </div>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [current, setCurrent] = useState<SensorData | null>(null);
  const [history, setHistory] = useState<SensorHistory[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const data = await apiService.getSensors();
      setCurrent(data.current);
      setHistory(data.history);
    } catch (error) {
      console.error("Gagal mengambil data sensor:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (!current) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground font-mono animate-pulse">Loading sensors... (Pastikan Backend Menyala)</div>
      </div>
    );
  }

  // Perbaikan: Mencocokkan dengan data dari Backend ("Layak" bukan "LAYAK")
  const isLayak = current.status === "Layak";

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={`flex items-center gap-3 rounded-lg border p-4 ${
        isLayak 
          ? "border-green-500/30 bg-green-500/10" 
          : "border-red-500/30 bg-red-500/10"
      }`}>
        {isLayak ? (
          <CheckCircle className="h-6 w-6 text-green-500" />
        ) : (
          <AlertTriangle className="h-6 w-6 text-red-500 animate-pulse" />
        )}
        <div>
          <p className="font-mono text-lg font-bold tracking-wider">
            Status: <span className={isLayak ? "text-green-500" : "text-red-500"}>{current.status}</span>
          </p>
          {!isLayak && (
            <p className="text-sm text-red-500/80">
              ⚠ PAC Dosing Pump is ACTIVE — Kualitas air di bawah standar
            </p>
          )}
        </div>
        {current.pumpActive && (
          <Badge variant="destructive" className="ml-auto font-mono animate-pulse bg-red-600">
            PUMP ON
          </Badge>
        )}
      </div>

      {/* Sensor Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SensorCard
          title="pH Level"
          value={current.ph.toFixed(2)}
          unit="pH"
          icon={Droplets}
          color="text-blue-500"
          subtitle="Target: 6.5 – 8.5"
        />
        <SensorCard
          title="Turbidity"
          value={current.turbidity.toFixed(1)}
          unit="NTU"
          icon={Waves}
          color="text-orange-500"
          subtitle="Maksimal: 25 NTU"
        />
        <SensorCard
          title="TDS"
          value={current.tds.toFixed(0)}
          unit="ppm"
          icon={Zap}
          color="text-purple-500"
          subtitle="Maksimal: 500 ppm"
        />
        <SensorCard
          title="Battery Voltage"
          value={current.battery.toFixed(1)}
          unit="V"
          icon={Battery}
          color="text-emerald-500"
          subtitle="ESP32 Power Supply"
        />
      </div>

      {/* Chart */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Sensor History (Real-time)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="timestamp" tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f2937", color: "#f9fafb", borderRadius: "8px", border: "none" }}
                  itemStyle={{ color: "#e5e7eb" }}
                />
                <Legend />
                <Line type="monotone" dataKey="ph" stroke="#3b82f6" strokeWidth={2} dot={false} name="pH" />
                <Line type="monotone" dataKey="turbidity" stroke="#f97316" strokeWidth={2} dot={false} name="Turbidity (NTU)" />
                <Line type="monotone" dataKey="tds" stroke="#8b5cf6" strokeWidth={2} dot={false} name="TDS (ppm)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}