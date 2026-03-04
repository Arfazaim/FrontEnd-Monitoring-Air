import { useEffect, useState, useCallback } from "react";
import { Download, FlaskConical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiService, type DosingLog } from "@/services/apiService";

export default function ChemicalLogsPage() {
  const [logs, setLogs] = useState<DosingLog[]>([]);

  const fetchLogs = useCallback(async () => {
    const data = await apiService.getLogs();
    setLogs(data);
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const exportCSV = () => {
    const header = "ID,Medication Name,Duration (s),Timestamp\n";
    const rows = logs.map(l => `${l.id},"${l.medicationName}",${l.duration},"${l.timestamp}"`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dosing_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chemical Dosing Logs</h1>
          <p className="text-sm text-muted-foreground">PAC (Poly Aluminium Chloride) usage history</p>
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
                <TableHead className="font-mono text-xs">Medication Name</TableHead>
                <TableHead className="font-mono text-xs">Duration (s)</TableHead>
                <TableHead className="font-mono text-xs">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">{log.id}</TableCell>
                  <TableCell className="text-sm">{log.medicationName}</TableCell>
                  <TableCell className="font-mono text-sm">{log.duration}s</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{log.timestamp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
