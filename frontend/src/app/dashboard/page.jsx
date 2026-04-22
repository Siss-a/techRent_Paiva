"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";

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

const STATUS_STYLES = {
  aberto: "bg-slate-100 text-slate-700 border border-slate-300",
  em_atendimento: "bg-slate-200 text-slate-800 border border-slate-400",
  resolvido: "bg-slate-50 text-slate-500 border border-slate-200",
  cancelado: "bg-gray-100 text-gray-400 border border-gray-200 line-through",
};

function formatarData(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// Atualizado para usar Material Icons
function MetricCard({ titulo, valor, descricao, iconName, carregando }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50 text-slate-400 border border-slate-100">
          <span className="material-symbols-rounded text-[22px]">{iconName}</span>
        </div>
      </div>
      {carregando ? (
        <Skeleton className="h-9 w-20 mb-1" />
      ) : (
        <p className="text-3xl font-bold text-slate-900 tracking-tight">{valor}</p>
      )}
      <p className="text-sm font-semibold text-slate-700 mt-1">{titulo}</p>
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
        setErro("Não foi possível conectar ao servidor.");
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {saudacao}, {primeiroNome}
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          {nivelAcesso === "admin" && "Resumo operacional da plataforma."}
          {nivelAcesso === "tecnico" && "Gerencie seus chamados e manutenções."}
          {nivelAcesso === "cliente" && "Acompanhe suas solicitações ativas."}
        </p>
      </div>

      {erro && (
        <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-800 rounded-xl">
          <span className="material-symbols-rounded text-[20px] mr-2">warning</span>
          <AlertDescription className="font-medium">{erro}</AlertDescription>
        </Alert>
      )}

      {nivelAcesso === "admin" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            titulo="Total Chamados"
            valor={metricas.total_chamados}
            descricao={`${metricas.chamados_resolvidos} resolvidos`}
            iconName="confirmation_number"
            carregando={carregando}
          />
          <MetricCard
            titulo="Pendentes"
            valor={metricas.chamados_abertos}
            descricao="Aguardando ação"
            iconName="schedule"
            carregando={carregando}
          />
          <MetricCard
            titulo="Equipamentos"
            valor={metricas.total_equipamentos}
            descricao={`${metricas.equipamentos_operacionais} ativos`}
            iconName="inventory_2"
            carregando={carregando}
          />
          <MetricCard
            titulo="Em Reparo"
            valor={metricas.equipamentos_manutencao}
            descricao="Setor técnico"
            iconName="build"
            carregando={carregando}
          />
        </div>
      )}

      {nivelAcesso === "cliente" && (
        <div className="mb-8 bg-slate-900 rounded-xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="font-bold text-xl mb-1">Precisa de ajuda técnica?</h2>
            <p className="text-slate-400 text-sm mb-6 max-w-md">Nossos técnicos estão prontos para resolver problemas em seus equipamentos.</p>
            <Link href="/chamados/novo">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-8 rounded-xl shadow-lg shadow-black/20">
                Abrir Novo Chamado
              </Button>
            </Link>
          </div>
          <span className="material-symbols-rounded absolute -right-4 -bottom-4 text-[120px] text-white/5 pointer-events-none">support_agent</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            Atividade Recente
          </h2>
          <Link href="/chamados" className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
            Ver tudo
          </Link>
        </div>

        {carregando ? (
          <div className="p-6 space-y-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : ultimosChamados.length === 0 ? (
          <div className="py-20 text-center">
            <span className="material-symbols-rounded text-slate-200 text-[48px] mb-2">inbox</span>
            <p className="text-slate-400 text-sm font-medium">Nenhuma atividade encontrada.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {ultimosChamados.map((c) => (
              <Link key={c.id} href={`/chamados/${c.id}`}>
                <div className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/80 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100 group-hover:bg-white transition-colors">
                      <span className="text-[11px] font-black text-slate-400">#{c.id}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 group-hover:text-slate-900">{c.titulo}</p>
                      <p className="text-[11px] font-medium text-slate-400 mt-0.5">{formatarData(c.aberto_em)}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] uppercase tracking-tighter font-black px-2.5 py-1 rounded-md border ${STATUS_STYLES[c.status] || "bg-slate-100 text-slate-600"}`}>
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