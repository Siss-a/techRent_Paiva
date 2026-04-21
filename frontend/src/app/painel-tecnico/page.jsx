"use client";

// Usa GET /dashboard/tecnico que consulta a view_painel_tecnico,
// retornando apenas chamados com status 'aberto' ou 'em_atendimento',
// ordenados por prioridade e data de abertura.

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ClipboardList,
  Wrench,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Package,
  Clock,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const PRIORIDADE_BADGE = {
  baixa: "outline",
  media: "secondary",
  alta: "destructive",
};

const STATUS_BADGE = {
  aberto: "default",
  em_atendimento: "secondary",
};

function formatarData(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CardMetric({ title, value, icon, loading, highlight }) {
  return (
    <Card className={highlight ? "border-primary/30 bg-primary/5" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-12" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PainelTecnicoPage() {
  const router = useRouter();

  // ── Dados da view_painel_tecnico ───────────────────────
  const [painel, setPainel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("Técnico");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRaw = localStorage.getItem("usuario");

    if (!token) {
      router.push("/login");
      return;
    }

    if (userRaw) {
      try {
        const u = JSON.parse(userRaw);
        setNomeUsuario(u.nome ?? "Técnico");
      } catch {}
    }

    carregarPainel(token);
  }, [router]);

  async function carregarPainel(token) {
    setLoading(true);
    setErro("");
    try {
      // Usa a view_painel_tecnico via endpoint dedicado
      const res = await fetch(`${API_URL}/dashboard/tecnico`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      const dados = await res.json();

      if (dados.sucesso) {
        setPainel(dados.dados);
      } else {
        setErro(dados.erro || "Erro ao carregar painel.");
      }
    } catch (err) {
      setErro("Erro de conexão com o servidor.");
      console.error("Erro painel técnico:", err);
    } finally {
      setLoading(false);
    }
  }

  // ── Métricas calculadas a partir dos dados da view ─────
  const totalAbertos = painel.filter((c) => c.status === "aberto").length;
  const totalEmAndamento = painel.filter((c) => c.status === "em_atendimento").length;
  const totalAlta = painel.filter((c) => c.prioridade === "alta").length;
  const semTecnico = painel.filter((c) => !c.tecnico_responsavel).length;

  function handleLogout() {
    localStorage.clear();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Painel Técnico</h1>
          <p className="text-xs text-muted-foreground">Olá, {nomeUsuario} — Chamados pendentes em tempo real</p>
        </div>
        <div className="flex gap-2">
          <Link href="/inventario">
            <Button variant="outline" size="sm">Inventário</Button>
          </Link>
          <Link href="/chamados">
            <Button variant="outline" size="sm">Todos os Chamados</Button>
          </Link>
          <Link href="/manutencao">
            <Button variant="outline" size="sm">Histórico</Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>Sair</Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8">

        {erro && (
          <Alert variant="destructive">
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        {/* ── Cards de Métricas ── */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
            Visão Geral — view_painel_tecnico
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CardMetric
              title="Chamados Abertos"
              value={totalAbertos}
              icon={<AlertCircle className="text-blue-500" size={18} />}
              loading={loading}
            />
            <CardMetric
              title="Em Atendimento"
              value={totalEmAndamento}
              icon={<Wrench className="text-amber-500" size={18} />}
              loading={loading}
            />
            <CardMetric
              title="Prioridade Alta"
              value={totalAlta}
              icon={<AlertCircle className="text-red-500" size={18} />}
              loading={loading}
              highlight={totalAlta > 0}
            />
            <CardMetric
              title="Sem Técnico"
              value={semTecnico}
              icon={<ClipboardList className="text-slate-500" size={18} />}
              loading={loading}
            />
          </div>
        </section>

        {/* ── Tabela de Chamados Pendentes (da view) ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Chamados Pendentes — ordenados por prioridade e data
            </h2>
            <Link href="/chamados">
              <Button variant="link" size="sm" className="text-xs gap-1">
                Ver todos <ArrowRight size={13} />
              </Button>
            </Link>
          </div>

          <div className="rounded-md border bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Técnico</TableHead>
                  <TableHead>Aberto em</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : painel.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      <CheckCircle2 className="mx-auto mb-2 text-green-400" size={32} />
                      Nenhum chamado pendente. Tudo em dia!
                    </TableCell>
                  </TableRow>
                ) : (
                  painel.map((c) => (
                    <TableRow
                      key={c.chamado_id}
                      className={c.prioridade === "alta" ? "bg-red-50/40" : ""}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{c.chamado_id}
                      </TableCell>
                      <TableCell className="font-medium max-w-[180px] truncate">
                        {c.titulo}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{c.solicitante}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{c.equipamento}</span>
                          {c.patrimonio && (
                            <span className="text-xs text-muted-foreground font-mono">
                              {c.patrimonio}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={PRIORIDADE_BADGE[c.prioridade]}>
                          {c.prioridade}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[c.status]}>
                          {c.status?.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.tecnico_responsavel ?? (
                          <span className="text-muted-foreground italic text-xs">
                            Não atribuído
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatarData(c.aberto_em)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/chamados/${c.chamado_id}`}>
                          <Button size="sm" variant="outline" className="gap-1">
                            Atender <ArrowRight size={13} />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* ── Atalhos ── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/chamados/novo">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-3 pt-5">
                <ClipboardList className="text-primary" size={22} />
                <div>
                  <p className="font-medium text-sm">Abrir Chamado</p>
                  <p className="text-xs text-muted-foreground">Registrar novo problema</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/inventario">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-3 pt-5">
                <Package className="text-primary" size={22} />
                <div>
                  <p className="font-medium text-sm">Inventário</p>
                  <p className="text-xs text-muted-foreground">Ver equipamentos</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/manutencao">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-3 pt-5">
                <Clock className="text-primary" size={22} />
                <div>
                  <p className="font-medium text-sm">Histórico</p>
                  <p className="text-xs text-muted-foreground">Reparos realizados</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </section>
      </div>
    </main>
  );
}