"use client";

// =============================================
// PÁGINA DE DASHBOARD — /dashboard
// =============================================
// Responsabilidades:
//   1. Buscar resumo via GET /dashboard/admin
//   2. Exibir 3 cards de métricas (equipamentos, chamados, pendentes)
//   3. Exibir tabela dos últimos chamados
//   4. Valores são estáticos enquanto a API não responde,
//      e atualizados automaticamente quando os dados chegam
// =============================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Componentes shadcn/ui
import { Button } from "@/components/ui/button";
import { Badge }  from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ── Valores padrão enquanto a API não responde ────────
// Isso evita que os cards apareçam vazios durante o carregamento
const METRICAS_PADRAO = {
  total_equipamentos: 0,
  total_chamados:     0,
  chamados_abertos:   0,
  chamados_resolvidos: 0,
  equipamentos_operacionais: 0,
  equipamentos_manutencao:   0,
};

// ── Componente de card de métrica ─────────────────────
function CardMetrica({ titulo, valor, descricao, carregando }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{titulo}</CardDescription>
        <CardTitle className="text-4xl">
          {carregando ? <Skeleton className="h-10 w-16" /> : valor}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{descricao}</p>
      </CardContent>
    </Card>
  );
}

// Formata timestamp
function formatarData(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

const STATUS_BADGE = {
  aberto:         "default",
  em_atendimento: "secondary",
  resolvido:      "outline",
  cancelado:      "destructive",
};

export default function DashboardPage() {
  const router = useRouter();

  // ── Estados ───────────────────────────────────────────
  const [metricas, setMetricas]         = useState(METRICAS_PADRAO);
  const [ultimosChamados, setUltimosChamados] = useState([]);
  const [carregando, setCarregando]     = useState(true);
  const [erro, setErro]                 = useState("");
  const [nomeUsuario, setNomeUsuario]   = useState("Usuário");

  // ── Lê o nome do usuário do localStorage ─────────────
  useEffect(() => {
    const raw = localStorage.getItem("usuario");
    if (raw) {
      try {
        const usuario = JSON.parse(raw);
        setNomeUsuario(usuario.nome ?? "Usuário");
      } catch (_) {}
    }
  }, []);

  // ── Busca dados do dashboard ──────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    async function buscarDashboard() {
      setCarregando(true);
      setErro("");

      try {
        // Dispara as duas requisições em paralelo para economizar tempo
        const [resResumo, resChamados] = await Promise.all([
          fetch(`${API_URL}/dashboard/admin`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/chamados`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        // Verifica autenticação
        if (resResumo.status === 401 || resChamados.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        // Processa resumo de métricas
        if (resResumo.ok) {
          const dadosResumo = await resResumo.json();
          if (dadosResumo.sucesso && dadosResumo.dados) {
            // A API retorna um objeto com os totais; mescla com o padrão
            // para garantir que campos ausentes não quebrem os cards
            setMetricas((prev) => ({ ...prev, ...dadosResumo.dados }));
          }
        }

        // Processa lista de chamados (pega só os 5 mais recentes)
        if (resChamados.ok) {
          const dadosChamados = await resChamados.json();
          if (dadosChamados.sucesso) {
            setUltimosChamados(dadosChamados.dados.slice(0, 5));
          }
        }

      } catch (err) {
        setErro("Não foi possível carregar o dashboard. Verifique a conexão.");
        console.error("Erro no dashboard:", err);
      } finally {
        setCarregando(false);
      }
    }

    buscarDashboard();
  }, [router]);

  // ── Handler de logout ─────────────────────────────────
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    router.push("/login");
  }

  // ── Render ────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-slate-50">

      {/* Barra superior */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Olá, {nomeUsuario}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/inventario">
            <Button variant="outline" size="sm">Inventário</Button>
          </Link>
          <Link href="/chamados">
            <Button variant="outline" size="sm">Chamados</Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8">

        {/* Alerta de erro */}
        {erro && (
          <Alert variant="destructive">
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        {/* ── Cards de métricas ── */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Visão geral
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <CardMetrica
              titulo="Total de equipamentos"
              valor={metricas.total_equipamentos}
              descricao={`${metricas.equipamentos_operacionais} operacionais · ${metricas.equipamentos_manutencao} em manutenção`}
              carregando={carregando}
            />

            <CardMetrica
              titulo="Total de chamados"
              valor={metricas.total_chamados}
              descricao={`${metricas.chamados_resolvidos} resolvidos`}
              carregando={carregando}
            />

            <CardMetrica
              titulo="Chamados abertos"
              valor={metricas.chamados_abertos}
              descricao="Aguardando atendimento ou em andamento"
              carregando={carregando}
            />

          </div>
        </section>

        {/* ── Últimos chamados ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Últimos chamados
            </h2>
            <Link href="/chamados">
              <Button variant="link" size="sm" className="text-xs">
                Ver todos →
              </Button>
            </Link>
          </div>

          <div className="rounded-md border bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {/* Skeleton */}
                {carregando &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))}

                {/* Vazio */}
                {!carregando && ultimosChamados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhum chamado registrado ainda.
                    </TableCell>
                  </TableRow>
                )}

                {/* Dados */}
                {!carregando &&
                  ultimosChamados.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-muted-foreground text-sm">{c.id}</TableCell>
                      <TableCell className="font-medium">{c.titulo}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[c.status] ?? "outline"}>
                          {c.status?.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatarData(c.aberto_em)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </section>

      </div>
    </main>
  );
}