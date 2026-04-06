import { useEffect, useState, useCallback } from "react";
import { Download, FlaskConical, Search, RefreshCw, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiService, type DosingLog } from "@/services/apiService";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

function StatusBadge({ text }: { text: string }) {
  const lower = text.toLowerCase();
  const isActive  = lower.includes("aktif") || lower.includes("on") || lower.includes("inject");
  const isWarning = lower.includes("waspada") || lower.includes("warning") || lower.includes("tinggi");
  const isDanger  = lower.includes("bahaya") || lower.includes("tidak layak") || lower.includes("kritis");

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-mono border px-2 py-0.5",
        isDanger  ? "border-red-500/30 bg-red-500/10 text-red-400" :
        isWarning ? "border-amber-500/30 bg-amber-500/10 text-amber-400" :
        isActive  ? "border-blue-500/30 bg-blue-500/10 text-blue-400" :
                    "border-border text-muted-foreground"
      )}
    >
      {text}
    </Badge>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="card-glass rounded-xl border border-border/40 px-4 py-3">
      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
      <p className={cn("text-2xl font-mono font-bold", color ?? "text-foreground")}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{sub}</p>}
    </div>
  );
}

export default function ChemicalLogsPage() {
  const [logs, setLogs]           = useState<DosingLog[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [page, setPage]           = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const data = await apiService.getLogs();
      setLogs(data || []);
    } catch (error) {
      console.error("Gagal mengambil log:", error);
    } finally {
      setLoading(false);
      if (manual) setTimeout(() => setRefreshing(false), 600);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => fetchLogs(), 10000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  // Filter
  const filtered = logs.filter(l =>
    [l.nama_aktuator, l.obat_digunakan, l.keterangan]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCSV = () => {
    if (logs.length === 0) return alert("Data log kosong!");
    const header = "ID,Nama Aktuator,Obat Digunakan,Keterangan,Waktu\n";
    const rows = logs.map(l =>
      `${l.id},"${l.nama_aktuator}","${l.obat_digunakan}","${l.keterangan}","${l.created_at}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `Log_PAC_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stats
  const uniqueChemicals = [...new Set(logs.map(l => l.obat_digunakan))].length;
  const today = new Date().toLocaleDateString("id-ID");
  const todayCount = logs.filter(l =>
    new Date(l.created_at).toLocaleDateString("id-ID") === today
  ).length;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Riwayat Penggunaan Obat</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Sistem monitoring injeksi PAC (Poly Aluminium Chloride)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(true)}
            className="gap-1.5 font-mono text-xs border-border/60"
          >
            <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            className="gap-1.5 font-mono text-xs border-border/60"
          >
            <Download className="h-3 w-3" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Log"        value={logs.length}    sub="semua waktu" />
        <StatCard label="Hari Ini"         value={todayCount}     sub="injeksi aktif" color="text-primary" />
        <StatCard label="Jenis Chemical"   value={uniqueChemicals} sub="berbeda digunakan" />
        <StatCard
          label="Status"
          value={loading ? "—" : logs.length > 0 ? "Aktif" : "Kosong"}
          sub="sistem monitoring"
          color={logs.length > 0 ? "text-emerald-400" : "text-muted-foreground"}
        />
      </div>

      {/* Table Card */}
      <Card className="card-glass border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-sm font-mono text-muted-foreground tracking-wider flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-primary" />
              DOSING RECORDS — {filtered.length} entri
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari log..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-8 h-8 text-xs font-mono w-52 bg-background/50 border-border/60"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70 w-12">ID</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">Timestamp</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">Aktuator</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">Chemical</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-border/30">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-muted/40 rounded animate-pulse w-3/4" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginated.length > 0 ? (
                  paginated.map((log, i) => (
                    <TableRow
                      key={log.id}
                      className="border-border/30 hover:bg-muted/20 transition-colors animate-slide-in"
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">#{log.id}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString("id-ID", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit", second: "2-digit"
                        })}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-foreground">{log.nama_aktuator}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className="font-mono text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20 border hover:bg-blue-500/15">
                          {log.obat_digunakan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge text={log.keterangan} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <FlaskConical className="h-8 w-8 opacity-30" />
                        <p className="text-sm font-mono">
                          {search ? "Tidak ada hasil pencarian." : "Belum ada riwayat penggunaan PAC."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
              <span className="text-[10px] font-mono text-muted-foreground">
                Halaman {page} dari {totalPages} · {filtered.length} entri
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = page <= 3 ? i + 1 : page - 2 + i;
                  if (p < 1 || p > totalPages) return null;
                  return (
                    <Button
                      key={p} variant={p === page ? "default" : "ghost"}
                      size="icon" className="h-7 w-7 text-xs font-mono"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  );
                })}
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
