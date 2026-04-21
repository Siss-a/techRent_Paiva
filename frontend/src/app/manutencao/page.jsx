"use client";
// Lista todos os registros de reparo.
// Acessível a Técnicos e Admins.

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ArrowLeft, Wrench, Search, ClipboardList } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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

export default function ManutencaoPage() {
  const router = useRouter();

  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [pesquisa, setPesquisa] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    buscarHistorico(token);
  }, [router]);

  async function buscarHistorico(token) {
    setCarregando(true);
    setErro("");
    try {
      const res = await fetch(`${API_URL}/manutencao`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      if (res.status === 403) {
        setErro("Acesso negado. Apenas técnicos e administradores podem ver o histórico.");
        setCarregando(false);
        return;
      }

      const dados = await res.json();
      if (dados.sucesso) {
        setHistorico(dados.dados);
      } else {
        setErro(dados.erro || "Erro ao carregar histórico.");
      }
    } catch {
      setErro("Erro de conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  }

  const historicoFiltrado = historico.filter((h) => {
    const busca = pesquisa.toLowerCase();
    return (
      h.descricao?.toLowerCase().includes(busca) ||
      String(h.chamado_id).includes(busca) ||
      String(h.equipamento_id).includes(busca) ||
      String(h.tecnico_id).includes(busca) ||
      String(h.id).includes(busca)
    );
  });

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/painel-tecnico"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Painel Técnico
          </Link>
          <span className="text-muted-foreground/40">|</span>
          <h1 className="text-base font-semibold flex items-center gap-2">
            <Wrench size={18} />
            Histórico de Manutenção
          </h1>
        </div>
        <div className="flex gap-2">
          <Link href="/chamados">
            <Button variant="outline" size="sm">Chamados</Button>
          </Link>
          <Link href="/inventario">
            <Button variant="outline" size="sm">Inventário</Button>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">

        {/* Resumo */}
        {!carregando && historico.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total de Reparos</p>
                <p className="text-3xl font-bold mt-1">{historico.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Equipamentos Atendidos</p>
                <p className="text-3xl font-bold mt-1">
                  {new Set(historico.map((h) => h.equipamento_id)).size}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Técnicos Envolvidos</p>
                <p className="text-3xl font-bold mt-1">
                  {new Set(historico.map((h) => h.tecnico_id)).size}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {erro && (
          <Alert variant="destructive">
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        {/* Pesquisa */}
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Pesquisar por ID, chamado, equipamento, técnico ou descrição..."
              className="pl-9"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
            />
          </div>
        </div>

        {/* Tabela */}
        <div className="rounded-md border bg-white overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-14">#</TableHead>
                <TableHead className="w-24">Chamado</TableHead>
                <TableHead className="w-28">Equipamento</TableHead>
                <TableHead className="w-24">Técnico</TableHead>
                <TableHead>Descrição do Reparo</TableHead>
                <TableHead className="w-36">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carregando ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : historicoFiltrado.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <ClipboardList className="mx-auto mb-2 text-slate-300" size={36} />
                    {pesquisa
                      ? "Nenhum registro encontrado para essa pesquisa."
                      : "Nenhum reparo registrado ainda."}
                  </TableCell>
                </TableRow>
              ) : (
                historicoFiltrado.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{h.id}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/chamados/${h.chamado_id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        #{h.chamado_id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/inventario`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        #{h.equipamento_id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Téc. #{h.tecnico_id}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700 max-w-xs">
                      <p className="line-clamp-2" title={h.descricao}>
                        {h.descricao}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatarData(h.registrado_em)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Contador de resultados */}
        {!carregando && historicoFiltrado.length > 0 && (
          <p className="text-xs text-muted-foreground text-right">
            Exibindo {historicoFiltrado.length} de {historico.length} registros
          </p>
        )}
      </div>
    </main>
  );
}