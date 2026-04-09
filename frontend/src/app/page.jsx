"use client";

// =============================================
// PÁGINA DE CHAMADOS — /chamados
// =============================================
// Responsabilidades:
//   1. Listar chamados do usuário via GET /chamados
//   2. Formulário inline para criar novo chamado
//   3. POST /chamados ao submeter o formulário
//   4. Atualizar a lista localmente após criação (sem reload)
//   5. Badge de prioridade e status em cada linha
// =============================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Componentes shadcn/ui
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge }    from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Separator } from "@/components/ui/separator";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ── Helpers de badge ──────────────────────────────────
const STATUS_BADGE = {
  aberto:         "default",
  em_atendimento: "secondary",
  resolvido:      "outline",
  cancelado:      "destructive",
};

const PRIORIDADE_BADGE = {
  baixa: "outline",
  media: "secondary",
  alta:  "destructive",
};

// Formata timestamp ISO em dd/mm/aaaa hh:mm
function formatarData(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ChamadosPage() {
  const router = useRouter();

  // ── Estados ───────────────────────────────────────────
  const [chamados, setChamados]   = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro]           = useState("");

  // Controla visibilidade do formulário de criação
  const [mostrarForm, setMostrarForm] = useState(false);

  // Estado do formulário de novo chamado
  const [form, setForm] = useState({
    equipamento_id: "",
    titulo:         "",
    descricao:      "",
    prioridade:     "media",
  });
  const [enviando, setEnviando]   = useState(false);
  const [erroForm, setErroForm]   = useState("");
  const [sucessoForm, setSucessoForm] = useState("");

  // ── Busca inicial dos chamados ────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    async function buscarChamados() {
      setCarregando(true);
      setErro("");
      try {
        const resposta = await fetch(`${API_URL}/chamados`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (resposta.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        const dados = await resposta.json();
        if (!resposta.ok || !dados.sucesso) {
          setErro(dados.erro || "Erro ao carregar chamados.");
          return;
        }
        setChamados(dados.dados);
      } catch (err) {
        setErro("Sem conexão com o servidor.");
        console.error(err);
      } finally {
        setCarregando(false);
      }
    }

    buscarChamados();
  }, [router]);

  // ── Handler do formulário de criação ─────────────────
  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSelectChange(campo) {
    return (valor) => setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleCriarChamado(e) {
    e.preventDefault();
    setErroForm("");
    setSucessoForm("");

    // Validação mínima
    if (!form.equipamento_id || !form.titulo.trim()) {
      setErroForm("ID do equipamento e título são obrigatórios.");
      return;
    }

    const token = localStorage.getItem("token");
    setEnviando(true);

    try {
      const resposta = await fetch(`${API_URL}/chamados`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          equipamento_id: Number(form.equipamento_id), // garante que é número
          titulo:         form.titulo.trim(),
          descricao:      form.descricao.trim(),
          prioridade:     form.prioridade,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok || !dados.sucesso) {
        setErroForm(dados.erro || "Erro ao criar chamado.");
        return;
      }

      // Adiciona o novo chamado ao topo da lista sem recarregar a página
      setChamados((prev) => [dados.dados, ...prev]);
      setSucessoForm("Chamado criado com sucesso!");

      // Reseta o formulário
      setForm({ equipamento_id: "", titulo: "", descricao: "", prioridade: "media" });

      // Fecha o formulário após 1.5s
      setTimeout(() => {
        setMostrarForm(false);
        setSucessoForm("");
      }, 1500);
    } catch (err) {
      setErroForm("Erro de conexão ao criar chamado.");
      console.error(err);
    } finally {
      setEnviando(false);
    }
  }

  // ── Render ────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-slate-50">

      {/* Barra superior */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Meus Chamados</h1>
        <div className="flex items-center gap-3">
          <Link href="/inventario">
            <Button variant="outline" size="sm">Inventário</Button>
          </Link>
          <Button
            size="sm"
            onClick={() => { setMostrarForm((v) => !v); setErroForm(""); setSucessoForm(""); }}
          >
            {mostrarForm ? "Cancelar" : "+ Novo chamado"}
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">

        {/* ── Formulário de novo chamado (colapsável) ── */}
        {mostrarForm && (
          <Card>
            <CardHeader>
              <CardTitle>Novo chamado</CardTitle>
              <CardDescription>
                Informe o ID do equipamento com problema e descreva o que está acontecendo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCriarChamado} className="flex flex-col gap-4">

                {erroForm && (
                  <Alert variant="destructive">
                    <AlertDescription>{erroForm}</AlertDescription>
                  </Alert>
                )}
                {sucessoForm && (
                  <Alert className="border-green-500 text-green-700 bg-green-50">
                    <AlertDescription>{sucessoForm}</AlertDescription>
                  </Alert>
                )}

                {/* ID do equipamento — em produção substituir por Select populado */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="equipamento_id">ID do equipamento</Label>
                  <Input
                    id="equipamento_id"
                    name="equipamento_id"
                    type="number"
                    min="1"
                    placeholder="Ex: 3"
                    required
                    value={form.equipamento_id}
                    onChange={handleFormChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Você pode ver os IDs na página de{" "}
                    <Link href="/inventario" className="underline">Inventário</Link>.
                  </p>
                </div>

                {/* Título */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="titulo">Título</Label>
                  <Input
                    id="titulo"
                    name="titulo"
                    type="text"
                    placeholder="Ex: Monitor não liga"
                    required
                    value={form.titulo}
                    onChange={handleFormChange}
                  />
                </div>

                {/* Prioridade */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="prioridade">Prioridade</Label>
                  <Select value={form.prioridade} onValueChange={handleSelectChange("prioridade")}>
                    <SelectTrigger id="prioridade" className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Descrição */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="descricao">Descrição (opcional)</Label>
                  <Textarea
                    id="descricao"
                    name="descricao"
                    placeholder="Detalhe o problema encontrado…"
                    rows={3}
                    value={form.descricao}
                    onChange={handleFormChange}
                  />
                </div>

                <Button type="submit" className="w-full sm:w-auto self-end" disabled={enviando}>
                  {enviando ? "Enviando…" : "Criar chamado"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Erro de rede na listagem */}
        {erro && (
          <Alert variant="destructive">
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        {/* ── Tabela de chamados ── */}
        <div className="rounded-md border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aberto em</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {/* Skeleton durante carregamento */}
              {carregando &&
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))}

              {/* Sem chamados */}
              {!carregando && chamados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    Nenhum chamado encontrado. Crie o primeiro clicando em "+ Novo chamado".
                  </TableCell>
                </TableRow>
              )}

              {/* Dados */}
              {!carregando &&
                chamados.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-muted-foreground text-sm">{c.id}</TableCell>
                    <TableCell className="font-medium">{c.titulo}</TableCell>
                    <TableCell>
                      <Badge variant={PRIORIDADE_BADGE[c.prioridade] ?? "outline"}>
                        {c.prioridade}
                      </Badge>
                    </TableCell>
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

      </div>
    </main>
  );
}