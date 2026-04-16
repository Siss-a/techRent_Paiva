"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Componentes shadcn/ui
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const METRICAS_PADRAO = {
  total_equipamentos: 0,
  total_chamados: 0,
  chamados_abertos: 0,
  chamados_resolvidos: 0,
  equipamentos_operacionais: 0,
  equipamentos_manutencao: 0,
};

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

function formatarData(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

const STATUS_BADGE = {
  aberto: "default",
  em_atendimento: "secondary",
  resolvido: "outline",
  cancelado: "destructive",
};

export default function DashboardPage() {
  const router = useRouter();

  // --- Estados ---
  const [metricas, setMetricas] = useState(METRICAS_PADRAO);
  const [ultimosChamados, setUltimosChamados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("Usuário");
  const [nivelAcesso, setNivelAcesso] = useState(""); // Captura o nível (admin, cliente, tecnico)

  // 1. Lê os dados do usuário do localStorage ao carregar
  useEffect(() => {
    const raw = localStorage.getItem("usuario");
    if (raw) {
      try {
        const usuario = JSON.parse(raw);
        setNomeUsuario(usuario.nome ?? "Usuário");
        setNivelAcesso(usuario.nivel_acesso ?? "cliente");
      } catch (e) {
        console.error("Erro ao ler usuário:", e);
      }
    }
  }, []);

  // 2. Busca dados baseados no nível de acesso
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    // Só dispara a busca se já soubermos o nível de acesso
    if (!nivelAcesso) return;

    async function buscarDashboard() {
      setCarregando(true);
      setErro("");

      try {
        // Criamos o array de promessas. Todos buscam chamados.
        const promises = [
          fetch(`${API_URL}/chamados`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ];

        // SÓ adiciona a busca administrativa se for ADMIN
        if (nivelAcesso === "admin") {
          promises.push(
            fetch(`${API_URL}/dashboard/admin`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          );
        }

        const [resChamados, resResumo] = await Promise.all(promises);

        // Verifica expiração de Token (401)
        if (resChamados.status === 401 || (resResumo && resResumo.status === 401)) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        // Processa Chamados (Para todos os níveis)
        if (resChamados.ok) {
          const dadosChamados = await resChamados.json();
          if (dadosChamados.sucesso) {
            setUltimosChamados(dadosChamados.dados.slice(0, 5));
          }
        }

        // Processa Resumo de Métricas (Apenas para ADMIN)
        if (resResumo && resResumo.ok) {
          const responseResumo = await resResumo.json();
          if (responseResumo.sucesso && responseResumo.dados) {
            const { chamados, equipamentos } = responseResumo.dados;

            setMetricas({
              total_chamados: (chamados || []).reduce((acc, curr) => acc + (Number(curr.total) || 0), 0),
              total_equipamentos: (equipamentos || []).reduce((acc, curr) => acc + (Number(curr.total) || 0), 0),
              chamados_abertos: (chamados || []).find(c => c.status === 'aberto')?.total || 0,
              chamados_resolvidos: (chamados || []).find(c => c.status === 'resolvido')?.total || 0,
              equipamentos_operacionais: (equipamentos || []).find(e => e.status === 'operacional')?.total || 0,
              equipamentos_manutencao: (equipamentos || []).find(e => e.status === 'em_manutencao')?.total || 0,
            });
          }
        }

      } catch (err) {
        setErro("Erro de conexão com a API.");
        console.error("Erro dashboard:", err);
      } finally {
        setCarregando(false);
      }
    }

    buscarDashboard();
  }, [router, nivelAcesso]);

  function handleLogout() {
    localStorage.clear();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-semibold italic text-slate-800">techRent</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-tight">Olá, {nomeUsuario} ({nivelAcesso})</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/inventario">
            <Button variant="outline" size="sm">Inventário</Button>
          </Link>
          <Link href="/chamados">
            <Button variant="outline" size="sm">Chamados</Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>Sair</Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8 w-full">
        {erro && (
          <Alert variant="destructive">
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        {/* --- VISÃO GERAL: APENAS ADMIN --- */}
        {nivelAcesso === "admin" ? (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
              Visão geral (Administrador)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <CardMetrica
                titulo="Total de equipamentos"
                valor={metricas.total_equipamentos}
                descricao={`${metricas.equipamentos_operacionais} operacionais`}
                carregando={carregando}
              />
              <CardMetrica
                titulo="Total de chamados"
                valor={metricas.total_chamados}
                descricao={`${metricas.chamados_resolvidos} resolvidos`}
                carregando={carregando}
              />
              <CardMetrica
                titulo="Pendentes"
                valor={metricas.chamados_abertos}
                descricao="Aguardando atendimento"
                carregando={carregando}
              />
            </div>
          </section>
        ) : (
          <Alert className="bg-white">
            <AlertDescription className="text-slate-600">
              Bem-vindo ao portal de suporte techRent. Abaixo você confere o status das suas solicitações.
            </AlertDescription>
          </Alert>
        )}

        {/* --- ÚLTIMOS CHAMADOS: PARA TODOS --- */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Atividades Recentes
            </h2>
            <Link href="/chamados">
              <Button variant="link" size="sm" className="text-xs">Ver histórico →</Button>
            </Link>
          </div>

          <div className="rounded-md border bg-white overflow-hidden shadow-sm">
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
                {carregando ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}><Skeleton className="h-4 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : ultimosChamados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhum chamado registrado ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  ultimosChamados.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-muted-foreground text-xs">{c.id}</TableCell>
                      <TableCell className="font-medium text-slate-700">{c.titulo}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[c.status] ?? "outline"}>
                          {c.status?.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatarData(c.aberto_em)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </main>
  );
}