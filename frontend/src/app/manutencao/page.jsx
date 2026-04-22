"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";

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
} from "@/components/ui/card";
import { 
  Wrench, 
  Search, 
  ClipboardList, 
  ArrowUpRight, 
  Settings2,
  CalendarDays
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function formatarData(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
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
    <AppLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="h-6 w-6 text-slate-400" />
            Histórico de Manutenção
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Registros detalhados de todos os reparos e intervenções técnicas.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/inventario">
            <Button variant="outline" size="sm" className="rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50">
              Ver Inventário
            </Button>
          </Link>
        </div>
      </div>

      {erro && (
        <Alert variant="destructive" className="mb-6 rounded-xl border-red-100 bg-red-50/50">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards - Removido a borda inferior preta */}
      {!carregando && historico.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="rounded-xl border-slate-200 shadow-sm overflow-hidden">
            <CardContent className="pt-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total de Reparos</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{historico.length}</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-slate-200 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Equipamentos Atendidos</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {new Set(historico.map((h) => h.equipamento_id)).size}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-slate-200 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Equipe Técnica</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {new Set(historico.map((h) => h.tecnico_id)).size}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters Area */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            placeholder="Pesquisar por ID, chamado, descrição..."
            className="pl-10 bg-slate-50/50 border-slate-200 focus:bg-white rounded-lg transition-all"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-20 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6">ID</TableHead>
              <TableHead className="w-32 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ref. Chamado</TableHead>
              <TableHead className="w-32 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Equipamento</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6">Relatório Técnico</TableHead>
              <TableHead className="w-48 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right px-6">Data do Registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {carregando ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5} className="px-6 py-4">
                    <Skeleton className="h-6 w-full rounded-md" />
                  </TableCell>
                </TableRow>
              ))
            ) : historicoFiltrado.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20">
                  <div className="flex flex-col items-center justify-center opacity-40">
                    <ClipboardList className="mb-3 text-slate-300" size={48} />
                    <p className="text-slate-500 font-medium">Nenhum registro encontrado</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              historicoFiltrado.map((h) => (
                <TableRow key={h.id} className="group hover:bg-slate-50/40 transition-colors">
                  <TableCell className="px-6 py-4 font-mono text-[10px] font-bold text-slate-300 group-hover:text-slate-500">
                    #{h.id}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/chamados/${h.chamado_id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                    >
                      #{h.chamado_id}
                      <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/inventario`}
                      className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1.5"
                    >
                      <Settings2 size={12} />
                      EQP-{h.equipamento_id}
                    </Link>
                  </TableCell>
                  <TableCell className="px-6">
                    <div className="flex flex-col gap-1 py-1">
                      <p className="text-sm text-slate-700 leading-relaxed max-w-lg line-clamp-2" title={h.descricao}>
                        {h.descricao}
                      </p>
                      <div className="flex items-center gap-2">
                         <Badge variant="outline" className="text-[9px] uppercase tracking-tighter h-5 bg-slate-50 text-slate-500 border-slate-200">
                           Técnico #{h.tecnico_id}
                         </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 text-right">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-[11px] font-bold text-slate-700">{formatarData(h.registrado_em).split(' às ')[0]}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase tracking-tight font-medium">
                        <CalendarDays size={10} />
                        {formatarData(h.registrado_em).split(' às ')[1]}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer Info */}
      {!carregando && historicoFiltrado.length > 0 && (
        <div className="mt-4 flex justify-end">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Mostrando {historicoFiltrado.length} de {historico.length} registros
          </p>
        </div>
      )}
    </AppLayout>
  );
}