"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Componentes shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ClipboardList,
  Wrench,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function PainelTecnicoPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalChamados: 0,
    abertos: 0,
    emAndamento: 0,
    resolvidos: 0,
    equipamentosManutencao: 0
  });
  const [recentes, setRecentes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    carregarDados();
  }, [router]);

  async function carregarDados() {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const [resChamados, resEquipamentos] = await Promise.all([
        fetch(`${API_URL}/chamados`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/equipamentos`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const dataChamados = await resChamados.json();
      const dataEquipamentos = await resEquipamentos.json();

      if (dataChamados.sucesso && dataEquipamentos.sucesso) {
        const chamados = dataChamados.dados;
        const equipamentos = dataEquipamentos.dados;

        setStats({
          totalChamados: chamados.length,
          abertos: chamados.filter(c => c.status === "aberto").length,
          emAndamento: chamados.filter(c => c.status === "em_atendimento").length,
          resolvidos: chamados.filter(c => c.status === "resolvido").length,
          equipamentosManutencao: equipamentos.filter(e => e.status === "em_manutencao").length
        });

        setRecentes(chamados.slice(0, 5));
      }
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Painel Técnico</h1>
            <p className="text-slate-500">Bem-vindo ao centro de operações techRent.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/inventario">
              <Button variant="outline">Ver Inventário</Button>
            </Link>
            <Link href="/chamados">
              <Button>Gerenciar Chamados</Button>
            </Link>
          </div>
        </div>

        {/* Cards de Métricas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <CardMetric
            title="Chamados Abertos"
            value={stats.abertos}
            icon={<AlertCircle className="text-blue-600" />}
            loading={loading}
          />
          <CardMetric
            title="Em Atendimento"
            value={stats.emAndamento}
            icon={<Wrench className="text-amber-600" />}
            loading={loading}
          />
          <CardMetric
            title="Resolvidos"
            value={stats.resolvidos}
            icon={<CheckCircle2 className="text-green-600" />}
            loading={loading}
          />
          <CardMetric
            title="Em Manutenção"
            value={stats.equipamentosManutencao}
            icon={<ClipboardList className="text-slate-600" />}
            loading={loading}
          />
        </div>

        {/* Conteúdo Principal */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* Lista de Chamados Recentes */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Chamados Recentes</CardTitle>
              <Link href="/chamados" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                Ver todos <ArrowRight size={14} />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
                ) : recentes.length > 0 ? (
                  recentes.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">#{c.id} - {c.titulo}</p>
                        <div className="flex gap-2 items-center">
                          <Badge variant="outline" className="text-[10px]">{c.prioridade}</Badge>
                          <span className="text-xs text-slate-500">ID Equip: {c.equipamento_id}</span>
                        </div>
                      </div>
                      <Badge className={c.status === "aberto" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}>
                        {c.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-500 py-4">Nenhum chamado recente.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Links Rápidos */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button variant="outline" className="justify-start gap-2 w-full" asChild>
                <Link href="/inventario">
                  <Wrench size={16} /> Corrigir Equipamentos
                </Link>
              </Button>
              <Button variant="outline" className="justify-start gap-2 w-full" asChild>
                <Link href="/chamados">
                  <AlertCircle size={16} /> Atender Chamados
                </Link>
              </Button>
              <Separator />
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-1">Dica do Sistema</p>
                <p className="text-sm text-blue-700">Mantenha o status dos equipamentos atualizados para evitar conflitos de reserva.</p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </main>
  );
}

// Sub-componente para os cards de métricas
function CardMetric({ title, value, icon, loading }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{value}</div>}
      </CardContent>
    </Card>
  );
}