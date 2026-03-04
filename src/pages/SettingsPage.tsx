import { useEffect, useState, useCallback } from "react";
import { Save, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { apiService, type SensorConfig } from "@/services/apiService";

export default function SettingsPage() {
  const [config, setConfig] = useState<SensorConfig>({
    phOffset: 0,
    turbidityOffset: 0,
    tdsOffset: 0,
    pumpManual: false,
  });
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    const data = await apiService.getConfig();
    setConfig(data);
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.updateConfig(config);
      toast.success("Configuration saved successfully");
    } catch {
      toast.error("Failed to save configuration");
    }
    setSaving(false);
  };

  const handleReset = () => {
    setConfig({ phOffset: 0, turbidityOffset: 0, tdsOffset: 0, pumpManual: false });
    toast.info("Offsets reset to zero");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Sensor calibration & pump control</p>
      </div>

      {/* Calibration */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-sm">Sensor Calibration Offsets</CardTitle>
          <CardDescription>Adjust offsets to calibrate sensor readings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="ph" className="text-xs font-mono">pH Offset</Label>
              <Input
                id="ph"
                type="number"
                step="0.01"
                value={config.phOffset}
                onChange={(e) => setConfig(c => ({ ...c, phOffset: +e.target.value }))}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="turb" className="text-xs font-mono">Turbidity Offset</Label>
              <Input
                id="turb"
                type="number"
                step="0.1"
                value={config.turbidityOffset}
                onChange={(e) => setConfig(c => ({ ...c, turbidityOffset: +e.target.value }))}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tds" className="text-xs font-mono">TDS Offset</Label>
              <Input
                id="tds"
                type="number"
                step="1"
                value={config.tdsOffset}
                onChange={(e) => setConfig(c => ({ ...c, tdsOffset: +e.target.value }))}
                className="font-mono"
              />
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1 text-xs text-muted-foreground">
            <RotateCcw className="h-3 w-3" /> Reset to zero
          </Button>
        </CardContent>
      </Card>

      {/* Pump Control */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-sm">PAC Pump Manual Control</CardTitle>
          <CardDescription>Override automatic pump operation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Manual Pump Toggle</p>
              <p className="text-xs text-muted-foreground">
                {config.pumpManual ? "Pump is manually ON" : "Pump follows automatic logic"}
              </p>
            </div>
            <Switch
              checked={config.pumpManual}
              onCheckedChange={(checked) => setConfig(c => ({ ...c, pumpManual: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        <Save className="h-4 w-4" />
        {saving ? "Saving..." : "Save Configuration"}
      </Button>
    </div>
  );
}
