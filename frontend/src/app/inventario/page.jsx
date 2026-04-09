"use client";

// =============================================
// PÁGINA DE INVENTÁRIO — /inventario
// =============================================
// Responsabilidades:
//   1. Buscar lista de equipamentos via GET /equipamentos
//   2. Exibir em tabela: Nome, Categoria, Patrimônio, Status
//   3. Filtro client-side por status
//   4. Botão "Abrir chamado" por equipamento operacional
//   5. Redirecionar para /login se não houver token
// =============================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Componentes shadcn/ui
import { Button } from "@/components/ui/button";
import { Badge }  from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ── Helpers de status ─────────────────────────────────
// Mapeia o valor do ENUM do banco para um rótulo legível e cor do Badge
const STATUS_MAP = {
  operacional:    { label: "Operacional",     variant: "default"     },
  em_manutencao:  { label: "Em manutenção",   variant: "secondary"   },
  desativado:     { label: "Desativado",       variant: "outline"     },
};

function BadgeStatus({ status }) {
  const cfg = STATUS_MAP[status] ?? { label: status, variant: "outline" };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export default function InventarioPage() {
  const router = useRouter();

  // ── Estados ───────────────────────────────────────────
  const [equipamentos, setEquipamentos] = useState([]);  // dados brutos da API
  const [filtroStatus, setFiltroStatus] = useState("todos"); // filtro ativo
  const [carregando, setCarregando]     = useState(true);
  const [erro, setErro]                 = useState("");

  // ── Busca inicial dos equipamentos ────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");

    // Sem token, volta para o login
    if (!token) {
      router.push("/login");
      return;
    }

    async function buscarEquipamentos() {
      setCarregando(true);
      setErro("");

      try {
        const resposta = await fetch(`${API_URL}/equipamentos`, {
          headers: {
            // O backend espera "Bearer <token>"
            Authorization: `Bearer ${token}`,
          },
        });

        // Token expirado ou inválido
        if (resposta.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
          setErro(dados.erro || "Erro ao carregar equipamentos.");
          return;
        }

        setEquipamentos(dados.dados);
      } catch (err) {
        setErro("Sem conexão com o servidor.");
        console.error("Erro ao buscar equipamentos:", err);
      } finally {
        setCarregando(false);
      }
    }

    buscarEquipamentos();
  }, [router]); // roda uma única vez na montagem

  // ── Filtro client-side ────────────────────────────────
  // Nenhuma nova requisição — só filtra o array já carregado
  const equipamentosFiltrados =
    filtroStatus === "todos"
      ? equipamentos
      : equipamentos.filter((e) => e.status === filtroStatus);

  // ── Render ────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-slate-50">

      {/* Barra superior */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Inventário de Equipamentos</h1>
        <div className="flex items-center gap-3">
          <Link href="/chamados">
            <Button variant="outline" size="sm">Meus chamados</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">Dashboard</Button>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">

        {/* Filtro por status */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Filtrar por status:</span>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="operacional">Operacional</SelectItem>
              <SelectItem value="em_manutencao">Em manutenção</SelectItem>
              <SelectItem value="desativado">Desativado</SelectItem>
            </SelectContent>
          </Select>

          {/* Contador de resultados */}
          <span className="text-sm text-muted-foreground ml-auto">
            {equipamentosFiltrados.length} equipamento(s)
          </span>
        </div>

        {/* Erro de rede */}
        {erro && (
          <Alert variant="destructive">
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        {/* Tabela */}
        <div className="rounded-md border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Patrimônio</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {/* Estado: carregando — mostra linhas de esqueleto */}
              {carregando &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {/* Estado: sem dados após carregar */}
              {!carregando && equipamentosFiltrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum equipamento encontrado.
                  </TableCell>
                </TableRow>
              )}

              {/* Estado: dados carregados */}
              {!carregando &&
                equipamentosFiltrados.map((eq) => (
                  <TableRow key={eq.id}>
                    <TableCell className="font-medium">{eq.nome}</TableCell>
                    <TableCell>{eq.categoria ?? "—"}</TableCell>
                    <TableCell className="font-mono text-sm">{eq.patrimonio ?? "—"}</TableCell>
                    <TableCell>
                      <BadgeStatus status={eq.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {/* Só permite abrir chamado em equipamentos operacionais */}
                      {eq.status === "operacional" ? (
                        <Link href={`/chamados/novo?equipamento_id=${eq.id}&nome=${encodeURIComponent(eq.nome)}`}>
                          <Button size="sm">Abrir chamado</Button>
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">Indisponível</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>

      </div>
    </main>
  );
}