import { useEffect, useState, useCallback } from "react";
import { Download, FlaskConical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiService, type DosingLog } from "@/services/apiService";

export default function ChemicalLogsPage() {
  const [logs, setLogs] = useState<DosingLog[]>([]);

  const fetchLogs = useCallback(async () => {
    try {
      const data = await apiService.getLogs();
      setLogs(data || []);
    } catch (error) {
      console.error("Gagal mengambil log:", error);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000); // Polling setiap 10 detik
    return () => clearInterval(interval);
  }, [fetchLogs]);

  // Perbaikan Export CSV menyesuaikan database MySQL
  const exportCSV = () => {
    if (logs.length === 0) return alert("Data log kosong!");
    
    const header = "ID,Nama Aktuator,Obat Digunakan,Keterangan,Waktu\n";
    const rows = logs.map(l => `${l.id},"${l.nama_aktuator}","${l.obat_digunakan}","${l.keterangan}","${l.created_at}"`).join("\n");
    
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Log_Penggunaan_PAC_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Riwayat Penggunaan Obat</h1>
          <p className="text-sm text-muted-foreground">Sistem monitoring injeksi PAC (Poly Aluminium Chloride)</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FlaskConical className="h-4 w-4" /> Dosing Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-mono text-xs">ID</TableHead>
                <TableHead className="font-mono text-xs">Waktu (Timestamp)</TableHead>
                <TableHead className="font-mono text-xs">Nama Aktuator</TableHead>
                <TableHead className="font-mono text-xs">Chemical / Obat</TableHead>
                <TableHead className="font-mono text-xs">Keterangan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">#{log.id}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{log.nama_aktuator}</TableCell>
                    <TableCell className="text-sm text-blue-600 font-semibold">{log.obat_digunakan}</TableCell>
                    <TableCell className="text-sm text-red-500">{log.keterangan}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center p-6 text-muted-foreground">
                    Belum ada riwayat penggunaan PAC.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}