"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Wrench, 
  AlertCircle, 
  ClipboardList, 
  Clock, 
  Package, 
  ArrowRight,
  CheckCircle2 
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Estilos padronizados com o Dashboard principal
const STATUS_STYLES = {
  aberto: "bg-slate-100 text-slate-700 border border-slate-300",
  em_atendimento: "bg-slate-200 text-slate-800 border border-slate-400",
  resolvido: "bg-slate-50 text-slate-500 border border-slate-200",
};

const PRIORIDADE_STYLES = {
  baixa: "bg-slate-50 text-slate-500",
  media: "bg-amber-50 text-amber-700 border-amber-200",
  alta: "bg-red-50 text-red-700 border-red-200",
};

function formatarData(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
  });
}

function MetricCard({ titulo, valor, icon, carregando, destaque }) {
  return (
    <div className={`bg-white rounded-lg p-6 border shadow-sm transition-shadow ${destaque ? 'border-red-200 bg-red-50/10' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-md flex items-center justify-center bg-slate-100 text-slate-600">
          {icon}
        </div>
      </div>
      {carregando ? (
        <Skeleton className="h-9 w-12 mb-1" />
      ) : (
        <p className="text-3xl font-bold text-slate-900 tracking-tight">{valor}</p>
      )}
      <p className="text-sm font-medium text-slate-700 mt-1">{titulo}</p>
    </div>
  );
}

export default function PainelTecnicoPage() {
  const router = useRouter();
  const [painel, setPainel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("Técnico");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRaw = localStorage.getItem("usuario");

    if (!token) { router.push("/login"); return; }
    if (userRaw) {
      try {
        const u = JSON.parse(userRaw);
        setNomeUsuario(u.nome?.split(" ")[0] ?? "Técnico");
      } catch {}
    }
    carregarPainel(token);
  }, [router]);

  async function carregarPainel(token) {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/dashboard/tecnico`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { router.push("/login"); return; }
      const dados = await res.json();
      if (dados.sucesso) setPainel(dados.dados);
    } catch (err) {
      setErro("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  const totalAbertos = painel.filter((c) => c.status === "aberto").length;
  const totalEmAndamento = painel.filter((c) => c.status === "em_atendimento").length;
  const totalAlta = painel.filter((c) => c.prioridade === "alta").length;
  const semTecnico = painel.filter((c) => !c.tecnico_responsavel).length;

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Painel Técnico</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Olá, {nomeUsuario}. Gerencie os chamados pendentes em tempo real.
          </p>
        </div>
        <div className="flex gap-2">
           <Link href="/inventario">
             <Button variant="outline" size="sm" className="text-xs">Inventário</Button>
           </Link>
           <Link href="/manutencao">
             <Button variant="outline" size="sm" className="text-xs">Histórico</Button>
           </Link>
        </div>
      </div>

      {erro && (
        <Alert variant="destructive" className="mb-6 rounded-lg">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard 
          titulo="Abertos" 
          valor={totalAbertos} 
          icon={<AlertCircle size={20} />} 
          carregando={loading} 
        />
        <MetricCard 
          titulo="Em Atendimento" 
          valor={totalEmAndamento} 
          icon={<Wrench size={20} />} 
          carregando={loading} 
        />
        <MetricCard 
          titulo="Urgentes" 
          valor={totalAlta} 
          icon={<AlertCircle size={20} className={totalAlta > 0 ? "text-red-500" : ""} />} 
          carregando={loading}
          destaque={totalAlta > 0}
        />
        <MetricCard 
          titulo="Sem Técnico" 
          valor={semTecnico} 
          icon={<ClipboardList size={20} />} 
          carregando={loading} 
        />
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Fila de Atendimento</h2>
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Prioridade & Data</span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-20 px-6">ID</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Equipamento</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right px-6">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
                ))
              ) : painel.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <CheckCircle2 className="mx-auto mb-3 text-slate-200" size={40} />
                    <p className="text-slate-400 text-sm">Tudo em dia! Nenhum chamado pendente.</p>
                  </TableCell>
                </TableRow>
              ) : (
                painel.map((c) => (
                  <TableRow key={c.chamado_id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="px-6 font-mono text-xs text-slate-400">#{c.chamado_id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800">{c.titulo}</span>
                        <span className="text-[11px] text-slate-400">{c.solicitante} • {formatarData(c.aberto_em)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="font-medium text-slate-700">{c.equipamento}</span>
                        <span className="text-slate-400 font-mono">{c.patrimonio}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${PRIORIDADE_STYLES[c.prioridade]}`}>
                        {c.prioridade}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${STATUS_STYLES[c.status]}`}>
                        {c.status?.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <Link href={`/chamados/${c.chamado_id}`}>
                        <Button size="sm" variant="outline" className="h-8 border-slate-200 hover:bg-slate-900 hover:text-white transition-all">
                          Atender <ArrowRight className="ml-2" size={14} />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Quick Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: "/chamados/novo", icon: <ClipboardList size={20} />, label: "Novo Chamado", sub: "Registrar problema" },
          { href: "/inventario", icon: <Package size={20} />, label: "Inventário", sub: "Equipamentos" },
          { href: "/manutencao", icon: <Clock size={20} />, label: "Histórico", sub: "Reparos concluídos" },
        ].map((item, idx) => (
          <Link key={idx} href={item.href}>
            <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group">
              <div className="w-10 h-10 rounded bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-colors">
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-400">{item.sub}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AppLayout>
  );
}