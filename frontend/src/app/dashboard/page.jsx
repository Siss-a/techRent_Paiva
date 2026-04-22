"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const METRICAS_PADRAO = {
  total_equipamentos: 0,
  total_chamados: 0,
  chamados_abertos: 0,
  chamados_resolvidos: 0,
  equipamentos_operacionais: 0,
  equipamentos_manutencao: 0,
};

const STATUS_BADGE = {
  aberto: "default",
  em_atendimento: "secondary",
  resolvido: "outline",
  cancelado: "destructive",
};

const STATUS_STYLES = {
  aberto: "bg-blue-50 text-blue-700 border border-blue-200",
  em_atendimento: "bg-amber-50 text-amber-700 border border-amber-200",
  resolvido: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelado: "bg-red-50 text-red-700 border border-red-200",
};

function formatarData(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function MetricCard({ titulo, valor, descricao, icon, cor, carregando }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cor}`}>
          {icon}
        </div>
      </div>
      {carregando ? (
        <Skeleton className="h-9 w-20 mb-1" />
      ) : (
        <p className="text-3xl font-bold text-slate-900 tracking-tight">{valor}</p>
      )}
      <p className="text-sm font-medium text-slate-700 mt-1">{titulo}</p>
      <p className="text-xs text-slate-400 mt-0.5">{descricao}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [metricas, setMetricas] = useState(METRICAS_PADRAO);
  const [ultimosChamados, setUltimosChamados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("Usuário");
  const [nivelAcesso, setNivelAcesso] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("usuario");
    if (raw) {
      try {
        const u = JSON.parse(raw);
        setNomeUsuario(u.nome ?? "Usuário");
        setNivelAcesso(u.nivel_acesso ?? "cliente");
      } catch {}
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    if (!nivelAcesso) return;

    async function buscarDashboard() {
      setCarregando(true);
      setErro("");
      try {
        const promises = [
          fetch(`${API_URL}/chamados`, { headers: { Authorization: `Bearer ${token}` } })
        ];
        if (nivelAcesso === "admin") {
          promises.push(fetch(`${API_URL}/dashboard/admin`, { headers: { Authorization: `Bearer ${token}` } }));
        }
        const [resChamados, resResumo] = await Promise.all(promises);
        if (resChamados.status === 401) { localStorage.removeItem("token"); router.push("/login"); return; }

        if (resChamados.ok) {
          const d = await resChamados.json();
          if (d.sucesso) setUltimosChamados(d.dados.slice(0, 5));
        }
        if (resResumo && resResumo.ok) {
          const r = await resResumo.json();
          if (r.sucesso && r.dados) {
            const { chamados, equipamentos } = r.dados;
            setMetricas({
              total_chamados: (chamados || []).reduce((acc, c) => acc + (Number(c.total) || 0), 0),
              total_equipamentos: (equipamentos || []).reduce((acc, e) => acc + (Number(e.total) || 0), 0),
              chamados_abertos: (chamados || []).find(c => c.status === "aberto")?.total || 0,
              chamados_resolvidos: (chamados || []).find(c => c.status === "resolvido")?.total || 0,
              equipamentos_operacionais: (equipamentos || []).find(e => e.status === "operacional")?.total || 0,
              equipamentos_manutencao: (equipamentos || []).find(e => e.status === "em_manutencao")?.total || 0,
            });
          }
        }
      } catch {
        setErro("Erro de conexão com a API.");
      } finally {
        setCarregando(false);
      }
    }
    buscarDashboard();
  }, [router, nivelAcesso]);

  const primeiroNome = nomeUsuario.split(" ")[0];
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {saudacao}, {primeiroNome} 👋
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          {nivelAcesso === "admin" && "Aqui está um resumo geral do sistema."}
          {nivelAcesso === "tecnico" && "Confira os chamados que precisam da sua atenção."}
          {nivelAcesso === "cliente" && "Acompanhe o status das suas solicitações."}
        </p>
      </div>

      {erro && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      {/* Metrics — Admin only */}
      {nivelAcesso === "admin" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            titulo="Total de Chamados"
            valor={metricas.total_chamados}
            descricao={`${metricas.chamados_resolvidos} resolvidos`}
            cor="bg-blue-50 text-blue-600"
            icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>}
            carregando={carregando}
          />
          <MetricCard
            titulo="Pendentes"
            valor={metricas.chamados_abertos}
            descricao="Aguardando atendimento"
            cor="bg-amber-50 text-amber-600"
            icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
            carregando={carregando}
          />
          <MetricCard
            titulo="Equipamentos"
            valor={metricas.total_equipamentos}
            descricao={`${metricas.equipamentos_operacionais} operacionais`}
            cor="bg-emerald-50 text-emerald-600"
            icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>}
            carregando={carregando}
          />
          <MetricCard
            titulo="Em Manutenção"
            valor={metricas.equipamentos_manutencao}
            descricao="Equipamentos parados"
            cor="bg-rose-50 text-rose-600"
            icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>}
            carregando={carregando}
          />
        </div>
      )}

      {/* Quick Actions */}
      {nivelAcesso === "cliente" && (
        <div className="mb-8 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
          <h2 className="font-semibold text-lg mb-1">Precisa de suporte?</h2>
          <p className="text-slate-400 text-sm mb-4">Abra um chamado para um equipamento com problema.</p>
          <Link href="/chamados/novo">
            <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100 font-semibold">
              Abrir Chamado
            </Button>
          </Link>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Atividade Recente</h2>
          <Link href="/chamados">
            <span className="text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors">Ver todos →</span>
          </Link>
        </div>

        {carregando ? (
          <div className="p-6 space-y-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </div>
        ) : ultimosChamados.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-slate-400">
                <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
              </svg>
            </div>
            <p className="text-slate-500 text-sm">Nenhum chamado registrado ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {ultimosChamados.map((c) => (
              <Link key={c.id} href={`/chamados/${c.id}`}>
                <div className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-slate-500">#{c.id}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{c.titulo}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatarData(c.aberto_em)}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[c.status] || "bg-slate-100 text-slate-600"}`}>
                    {c.status?.replace("_", " ")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}