"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Componentes shadcn/ui
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, PlusCircle, Search } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const STATUS_MAP = {
  operacional: { label: "Operacional", variant: "default" },
  em_manutencao: { label: "Em manutenção", variant: "secondary" },
  desativado: { label: "Desativado", variant: "outline" },
};

function BadgeStatus({ status }) {
  const cfg = STATUS_MAP[status] ?? { label: status, variant: "outline" };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export default function InventarioPage() {
  const router = useRouter();

  // ── Estados ───────────────────────────────────────────
  const [equipamentos, setEquipamentos] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [buscaId, setBuscaId] = useState(""); // Estado para busca por ID
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [nivelAcesso, setNivelAcesso] = useState("");

  // Estados para Modal de Adicionar/Editar
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState({
    nome: "",
    categoria: "",
    patrimonio: "",
    status: "operacional",
  });

  // ── Busca inicial ──────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRaw = localStorage.getItem("usuario");

    if (!token) {
      router.push("/login");
      return;
    }

    if (userRaw) {
      const user = JSON.parse(userRaw);
      setNivelAcesso(user.nivel_acesso);
    }

    buscarEquipamentos();
  }, [router]);

  async function buscarEquipamentos() {
    setCarregando(true);
    const token = localStorage.getItem("token");
    try {
      const resposta = await fetch(`${API_URL}/equipamentos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dados = await resposta.json();
      if (dados.sucesso) setEquipamentos(dados.dados);
    } catch (err) {
      setErro("Erro ao buscar equipamentos.");
    } finally {
      setCarregando(false);
    }
  }

  // ── Ações de Admin ─────────────────────────────────────
  const abrirModalNovo = () => {
    setEditandoId(null);
    setFormData({ nome: "", categoria: "", patrimonio: "", status: "operacional" });
    setModalAberto(true);
  };

  const abrirModalEditar = (eq) => {
    setEditandoId(eq.id);
    setFormData({
      nome: eq.nome,
      categoria: eq.categoria || "",
      patrimonio: eq.patrimonio || "",
      status: eq.status,
    });
    setModalAberto(true);
  };

  const salvarEquipamento = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const metodo = editandoId ? "PUT" : "POST";
    const url = editandoId ? `${API_URL}/equipamentos/${editandoId}` : `${API_URL}/equipamentos`;

    // Garantir que campos vazios sejam enviados como null para o backend não crashar
    const payload = {
      ...formData,
      categoria: formData.categoria || null,
      patrimonio: formData.patrimonio || null,
    };

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setModalAberto(false);
        buscarEquipamentos();
      } else {
        alert("Erro ao salvar equipamento.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ── Filtro Combinado (Status + Pesquisa por ID) ────────
  const equipamentosFiltrados = equipamentos.filter((e) => {
    const matchesStatus = filtroStatus === "todos" || e.status === filtroStatus;
    const matchesId = e.id.toString().includes(buscaId);
    return matchesStatus && matchesId;
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">techRent</h1>
        <div className="flex items-center gap-3">
          {nivelAcesso === "admin" && (
            <Button onClick={abrirModalNovo} className="gap-2">
              <PlusCircle size={18} /> Novo Equipamento
            </Button>
          )}
          <Link href="/dashboard">
            <Button variant="outline">Dashboard</Button>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">
        
        {/* Barra de Busca e Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-lg border shadow-sm">
          <div className="relative col-span-1 md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Pesquisar por ID..." 
              className="pl-10"
              value={buscaId}
              onChange={(e) => setBuscaId(e.target.value)}
            />
          </div>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="operacional">Operacional</SelectItem>
              <SelectItem value="em_manutencao">Em manutenção</SelectItem>
              <SelectItem value="desativado">Desativado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {erro && (
          <Alert variant="destructive">
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        <div className="rounded-md border bg-white overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Patrimônio</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carregando ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : equipamentosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Nenhum equipamento encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                equipamentosFiltrados.map((eq) => (
                  <TableRow key={eq.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">#{eq.id}</TableCell>
                    <TableCell className="font-medium">{eq.nome}</TableCell>
                    <TableCell>{eq.categoria || "—"}</TableCell>
                    <TableCell className="font-mono text-sm">{eq.patrimonio || "—"}</TableCell>
                    <TableCell><BadgeStatus status={eq.status} /></TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      {nivelAcesso === "admin" && (
                        <Button variant="ghost" size="icon" onClick={() => abrirModalEditar(eq)}>
                          <Pencil size={16} />
                        </Button>
                      )}
                      {eq.status === "operacional" && (
                        <Link href={`/chamados/novo?equipamento_id=${eq.id}&nome=${encodeURIComponent(eq.nome)}`}>
                          <Button size="sm">Chamado</Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* MODAL ADICIONAR/EDITAR */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editandoId ? `Editar #${editandoId}` : "Novo Equipamento"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={salvarEquipamento} className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Equipamento</Label>
              <Input 
                id="nome" 
                value={formData.nome} 
                onChange={(e) => setFormData({...formData, nome: e.target.value})} 
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Input 
                  id="categoria" 
                  value={formData.categoria} 
                  onChange={(e) => setFormData({...formData, categoria: e.target.value})} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="patrimonio">Patrimônio</Label>
                <Input 
                  id="patrimonio" 
                  value={formData.patrimonio} 
                  onChange={(e) => setFormData({...formData, patrimonio: e.target.value})} 
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(v) => setFormData({...formData, status: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operacional">Operacional</SelectItem>
                  <SelectItem value="em_manutencao">Em manutenção</SelectItem>
                  <SelectItem value="desativado">Desativado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>Cancelar</Button>
              <Button type="submit">Salvar Equipamento</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}