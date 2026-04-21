"use client";

// =============================================
// LISTA DE CHAMADOS — /chamados
// =============================================
// Clientes veem apenas os seus.
// Admins e Técnicos veem todos.
// Botão de excluir apenas para Admin.
// Linha clicável leva à página de detalhes.

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, Search, FilterX, Eye } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const STATUS_BADGE = {
  aberto: "default",
  em_atendimento: "secondary",
  resolvido: "outline",
  cancelado: "destructive",
};

const PRIORIDADE_BADGE = {
  baixa: "outline",
  media: "secondary",
  alta: "destructive",
};

function formatarData(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ChamadosPage() {
  const router = useRouter();

  const [chamados, setChamados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [nivelAcesso, setNivelAcesso] = useState("");

  // Filtros
  const [pesquisa, setPesquisa] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroPrioridade, setFiltroPrioridade] = useState("todos");

  // Modal criar/editar
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({
    equipamento_id: "",
    titulo: "",
    descricao: "",
    prioridade: "media",
    status: "aberto",
  });
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRaw = localStorage.getItem("usuario");
    if (!token) { router.push("/login"); return; }
    if (userRaw) {
      const u = JSON.parse(userRaw);
      setNivelAcesso(u.nivel_acesso);
    }
    buscarChamados();
  }, [router]);

  async function buscarChamados() {
    setCarregando(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/chamados`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dados = await res.json();
      if (dados.sucesso) setChamados(dados.dados);
      else setErro(dados.erro);
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setCarregando(false);
    }
  }

  const abrirEdicao = (chamado) => {
    setEditandoId(chamado.id);
    setForm({
      equipamento_id: chamado.equipamento_id,
      titulo: chamado.titulo,
      descricao: chamado.descricao || "",
      prioridade: chamado.prioridade,
      status: chamado.status,
    });
    setMostrarForm(true);
  };

  async function handleSalvarChamado(e) {
    e.preventDefault();
    setEnviando(true);
    const token = localStorage.getItem("token");
    const metodo = editandoId ? "PUT" : "POST";
    const url = editandoId
      ? `${API_URL}/chamados/${editandoId}`
      : `${API_URL}/chamados`;

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setMostrarForm(false);
        setEditandoId(null);
        setForm({ equipamento_id: "", titulo: "", descricao: "", prioridade: "media", status: "aberto" });
        buscarChamados();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEnviando(false);
    }
  }

  // ⚠️ Corrigido: somente admins chamam DELETE
  async function handleExcluir(id) {
    if (nivelAcesso !== "admin") return;
    if (!confirm("Tem certeza que deseja excluir este chamado?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/chamados/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setChamados((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert("Erro ao excluir.");
    }
  }

  const chamadosFiltrados = chamados.filter((c) => {
    const searchMatch =
      c.titulo.toLowerCase().includes(pesquisa.toLowerCase()) ||
      c.id.toString() === pesquisa;
    const statusMatch = filtroStatus === "todos" || c.status === filtroStatus;
    const prioridadeMatch = filtroPrioridade === "todos" || c.prioridade === filtroPrioridade;
    return searchMatch && statusMatch && prioridadeMatch;
  });

  // Técnicos podem editar status mas não criar chamados nem excluir
  const podeEditar = nivelAcesso === "admin" || nivelAcesso === "tecnico";
  const podeCriar = nivelAcesso === "admin" || nivelAcesso === "cliente";

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Gestão de Chamados</h1>
        <div className="flex gap-2">
          {podeCriar && (
            <Button
              size="sm"
              onClick={() => {
                setEditandoId(null);
                setForm({ equipamento_id: "", titulo: "", descricao: "", prioridade: "media", status: "aberto" });
                setMostrarForm(true);
              }}
            >
              + Novo chamado
            </Button>
          )}
          <Link href="/inventario">
            <Button variant="outline" size="sm">Inventário</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">Dashboard</Button>
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg border shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Pesquisar por ID ou Título..."
              className="pl-9"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
            />
          </div>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Status</SelectItem>
              <SelectItem value="aberto">Aberto</SelectItem>
              <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
              <SelectItem value="resolvido">Resolvido</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroPrioridade} onValueChange={setFiltroPrioridade}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas Prioridades</SelectItem>
              <SelectItem value="baixa">Baixa</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setPesquisa("");
              setFiltroStatus("todos");
              setFiltroPrioridade("todos");
            }}
          >
            <FilterX size={20} />
          </Button>
        </div>

        {/* Tabela */}
        <div className="rounded-md border bg-white overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carregando ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : chamadosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Nenhum chamado encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                chamadosFiltrados.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">#{c.id}</TableCell>
                    <TableCell className="font-medium">{c.titulo}</TableCell>
                    <TableCell>
                      <Badge variant={PRIORIDADE_BADGE[c.prioridade]}>{c.prioridade}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE[c.status]}>
                        {c.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatarData(c.aberto_em)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {/* Ver detalhes — disponível para todos */}
                        <Link href={`/chamados/${c.id}`}>
                          <Button variant="ghost" size="icon" title="Ver detalhes">
                            <Eye size={16} />
                          </Button>
                        </Link>

                        {/* Editar status — técnico e admin */}
                        {podeEditar && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => abrirEdicao(c)}
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </Button>
                        )}

                        {/* Excluir — SOMENTE admin */}
                        {nivelAcesso === "admin" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleExcluir(c.id)}
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal editar */}
      <Dialog open={mostrarForm} onOpenChange={setMostrarForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editandoId ? "Editar Chamado" : "Novo Chamado"}</DialogTitle>
            <DialogDescription>Preencha os dados do chamado abaixo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSalvarChamado} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID Equipamento</Label>
                <Input
                  type="number"
                  required
                  value={form.equipamento_id}
                  onChange={(e) => setForm({ ...form, equipamento_id: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={form.prioridade}
                  onValueChange={(v) => setForm({ ...form, prioridade: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {editandoId && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aberto">Aberto</SelectItem>
                    <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                    <SelectItem value="resolvido">Resolvido</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                required
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                rows={3}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMostrarForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={enviando}>
                {enviando ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}