import { useEffect, useState, useCallback } from "react";
import { Save, RotateCcw, Info, Wifi, WifiOff, FlaskConical, Settings2, Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { apiService, type SensorConfig } from "@/services/apiService";
import { cn } from "@/lib/utils";

const DEFAULTS: SensorConfig = {
  offset_ph: 0,
  offset_tds: 0,
  offset_kekeruhan: 0,
};

function OffsetField({
  id, label, description, value, step, unit, onChange
}: {
  id: string; label: string; description: string;
  value: number; step: number; unit: string;
  onChange: (v: number) => void;
}) {
  const isNonZero = value !== 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs font-mono font-medium text-foreground">{label}</Label>
        {isNonZero && (
          <Badge variant="outline" className="text-[9px] font-mono border-amber-500/30 text-amber-400 px-1.5 py-0">
            OFFSET AKTIF
          </Badge>
        )}
      </div>
      <div className="relative flex items-center">
        <Input
          id={id}
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={cn(
            "font-mono pr-14 bg-background/50 border-border/60 focus:border-primary/50 transition-colors",
            isNonZero && "border-amber-500/40"
          )}
        />
        <span className="absolute right-3 text-xs text-muted-foreground font-mono pointer-events-none">{unit}</span>
      </div>
      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
        <Info className="h-3 w-3 shrink-0" />
        {description}
      </p>
    </div>
  );
}

export default function SettingsPage() {
  const [config, setConfig]   = useState<SensorConfig>({ ...DEFAULTS });
  const [pump, setPump]       = useState(false);
  const [saving, setSaving]   = useState(false);
  const [apiUrl]              = useState(import.meta.env.VITE_API_URL ?? "—");
  const [connected, setConnected] = useState<boolean | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const data = await apiService.getConfig();
      setConfig(data);
    } catch {
      // silently fail — defaults stay
    }
  }, []);

  const checkConn = useCallback(async () => {
    const ok = await apiService.checkConnection();
    setConnected(ok);
  }, []);

  useEffect(() => {
    fetchConfig();
    checkConn();
    const t = setInterval(checkConn, 10000);
    return () => clearInterval(t);
  }, [fetchConfig, checkConn]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.updateConfig(config);
      toast.success("Konfigurasi berhasil disimpan", {
        description: "Sensor akan menggunakan offset baru mulai sekarang.",
      });
    } catch {
      toast.error("Gagal menyimpan konfigurasi", {
        description: "Periksa koneksi ke backend.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig({ ...DEFAULTS });
    toast.info("Offset direset ke nol");
  };

  const hasChanges = JSON.stringify(config) !== JSON.stringify(DEFAULTS);

  return (
    <div className="space-y-5 max-w-2xl animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          Pengaturan Sistem
        </h1>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">
          Kalibrasi sensor & kontrol pompa PAC
        </p>
      </div>

      {/* Connection Info */}
      <Card className="card-glass border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground tracking-wider flex items-center gap-2">
            <Wifi className="h-4 w-4 text-primary" />
            STATUS KONEKSI API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/40">
            <div>
              <p className="text-xs font-mono text-muted-foreground mb-0.5">API Endpoint</p>
              <p className="text-sm font-mono text-foreground">{apiUrl}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                connected === null ? "bg-muted-foreground animate-pulse" :
                connected ? "bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.6)]" :
                "bg-red-500"
              )} />
              <span className={cn(
                "text-xs font-mono font-medium",
                connected === null ? "text-muted-foreground" :
                connected ? "text-emerald-400" : "text-red-400"
              )}>
                {connected === null ? "MEMERIKSA..." : connected ? "TERHUBUNG" : "TERPUTUS"}
              </span>
            </div>
          </div>
          {connected === false && (
            <p className="text-[11px] text-red-400/80 font-mono flex items-center gap-1.5 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
              <WifiOff className="h-3 w-3 shrink-0" />
              Backend tidak merespons. Pastikan server berjalan di <code>{apiUrl}</code>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Calibration */}
      <Card className="card-glass border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground tracking-wider flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            KALIBRASI SENSOR
          </CardTitle>
          <CardDescription className="text-xs">
            Offset ditambahkan ke pembacaan raw sensor. Gunakan nilai positif atau negatif untuk koreksi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <OffsetField
              id="ph"
              label="Offset pH"
              description="Rentang ideal: 6.5 – 8.5 pH"
              value={config.offset_ph}
              step={0.01}
              unit="pH"
              onChange={(v) => setConfig(c => ({ ...c, offset_ph: v }))}
            />
            <OffsetField
              id="tds"
              label="Offset TDS"
              description="Batas maksimal: 500 ppm"
              value={config.offset_tds}
              step={1}
              unit="ppm"
              onChange={(v) => setConfig(c => ({ ...c, offset_tds: v }))}
            />
            <OffsetField
              id="kekeruhan"
              label="Offset Kekeruhan"
              description="Batas maksimal: 25 NTU"
              value={config.offset_kekeruhan}
              step={0.1}
              unit="NTU"
              onChange={(v) => setConfig(c => ({ ...c, offset_kekeruhan: v }))}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="ghost" size="sm"
              onClick={handleReset}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground font-mono"
            >
              <RotateCcw className="h-3 w-3" />
              Reset ke nol
            </Button>
            {hasChanges && (
              <Badge variant="outline" className="text-[9px] font-mono border-amber-500/30 text-amber-400 px-1.5">
                ADA PERUBAHAN
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pump Control */}
      <Card className={cn("card-glass border transition-all duration-300", pump ? "border-red-500/30 bg-red-500/5" : "border-border/50")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground tracking-wider flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" />
            KONTROL POMPA PAC
          </CardTitle>
          <CardDescription className="text-xs">
            Override operasi pompa otomatis. Gunakan dengan hati-hati.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/40">
            <div>
              <p className="text-sm font-medium text-foreground">Manual Pump Toggle</p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {pump
                  ? "⚡ Pompa sedang aktif secara manual"
                  : "Pompa mengikuti logika otomatis (berdasarkan status sensor)"}
              </p>
            </div>
            <Switch
              checked={pump}
              onCheckedChange={setPump}
              className="data-[state=checked]:bg-red-500"
            />
          </div>
          {pump && (
            <p className="text-[11px] text-red-400/80 font-mono flex items-center gap-1.5 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2 mt-3">
              ⚠ Mode manual aktif — pompa akan terus menyala sampai dimatikan secara manual.
            </p>
          )}
        </CardContent>
      </Card>

      <Separator className="border-border/40" />

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={saving || !connected}
          className="gap-2 font-mono text-sm min-w-36"
        >
          <Save className="h-4 w-4" />
          {saving ? "Menyimpan..." : "Simpan Konfigurasi"}
        </Button>
        {!connected && (
          <p className="text-xs text-muted-foreground font-mono">
            Tidak dapat menyimpan — backend terputus.
          </p>
        )}
      </div>
    </div>
  );
}
