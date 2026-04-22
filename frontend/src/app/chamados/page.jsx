"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Plus, 
  FilterX, 
  MoreHorizontal, 
  Eye, 
  Pencil, 
  Trash2,
  Inbox
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Estilos baseados em tons de cinza/slate conforme o Dashboard
const STATUS_STYLES = {
  aberto: "bg-slate-100 text-slate-700 border-slate-200",
  em_atendimento: "bg-slate-800 text-white border-slate-800",
  resolvido: "bg-slate-50 text-slate-400 border-slate-200",
  cancelado: "bg-white text-slate-300 border-slate-100 line-through",
};

const PRIORIDADE_STYLES = {
  baixa: "bg-slate-50 text-slate-500 border-slate-100",
  media: "bg-amber-50 text-amber-700 border-amber-100",
  alta: "bg-red-50 text-red-700 border-red-100",
};

function formatarData(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function ChamadosPage() {
  const router = useRouter();
  const [chamados, setChamados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [nivelAcesso, setNivelAcesso] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroPrioridade, setFiltroPrioridade] = useState("todos");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({ equipamento_id: "", titulo: "", descricao: "", prioridade: "media", status: "aberto" });
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRaw = localStorage.getItem("usuario");
    if (!token) { router.push("/login"); return; }
    if (userRaw) { const u = JSON.parse(userRaw); setNivelAcesso(u.nivel_acesso); }
    buscarChamados();
  }, [router]);

  async function buscarChamados() {
    setCarregando(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/chamados`, { headers: { Authorization: `Bearer ${token}` } });
      const dados = await res.json();
      if (dados.sucesso) setChamados(dados.dados);
      else setErro(dados.erro);
    } catch { setErro("Erro de conexão com a API."); }
    finally { setCarregando(false); }
  }

  const abrirEdicao = (c) => {
    setEditandoId(c.id);
    setForm({ equipamento_id: c.equipamento_id, titulo: c.titulo, descricao: c.descricao || "", prioridade: c.prioridade, status: c.status });
    setMostrarForm(true);
  };

  async function handleSalvar(e) {
    e.preventDefault();
    setEnviando(true);
    const token = localStorage.getItem("token");
    const url = editandoId ? `${API_URL}/chamados/${editandoId}` : `${API_URL}/chamados`;
    try {
      const res = await fetch(url, { 
        method: editandoId ? "PUT" : "POST", 
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, 
        body: JSON.stringify(form) 
      });
      if (res.ok) { setMostrarForm(false); setEditandoId(null); buscarChamados(); }
    } catch { setErro("Erro ao salvar chamado."); } 
    finally { setEnviando(false); }
  }

  async function handleExcluir(id) {
    if (nivelAcesso !== "admin") return;
    if (!confirm("Deseja realmente excluir este chamado?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/chamados/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setChamados(prev => prev.filter(c => c.id !== id));
    } catch { alert("Erro ao excluir."); }
  }

  const filtrados = chamados.filter((c) => {
    const q = pesquisa.toLowerCase();
    return (c.titulo.toLowerCase().includes(q) || String(c.id) === pesquisa) &&
      (filtroStatus === "todos" || c.status === filtroStatus) &&
      (filtroPrioridade === "todos" || c.prioridade === filtroPrioridade);
  });

  const podeCriar = nivelAcesso === "admin" || nivelAcesso === "cliente";
  const podeEditar = nivelAcesso === "admin" || nivelAcesso === "tecnico";

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Chamados</h1>
          <p className="text-slate-500 text-sm mt-1">
            {nivelAcesso === "cliente" ? "Gerencie suas solicitações de suporte." : "Monitoramento geral de tickets do sistema."}
          </p>
        </div>
        {podeCriar && (
          <Link href="/chamados/novo">
            <Button className="bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg px-5 shadow-sm transition-all active:scale-95">
              <Plus className="mr-2 h-4 w-4 stroke-[3]" />
              Abrir Chamado
            </Button>
          </Link>
        )}
      </div>

      {erro && <Alert variant="destructive" className="mb-6 rounded-xl border-red-100 bg-red-50/50"><AlertDescription>{erro}</AlertDescription></Alert>}

      {/* Advanced Filters Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input 
              placeholder="Pesquisar por ID ou título..." 
              className="pl-10 bg-slate-50/50 border-slate-200 focus:bg-white rounded-lg transition-all" 
              value={pesquisa} 
              onChange={e => setPesquisa(e.target.value)} 
            />
          </div>
          <div className="flex flex-wrap md:flex-nowrap gap-3">
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full md:w-44 bg-slate-50/50 rounded-lg"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                <SelectItem value="aberto">Aberto</SelectItem>
                <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                <SelectItem value="resolvido">Resolvido</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroPrioridade} onValueChange={setFiltroPrioridade}>
              <SelectTrigger className="w-full md:w-44 bg-slate-50/50 rounded-lg"><SelectValue placeholder="Prioridade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas Prioridades</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
              </SelectContent>
            </Select>
            {(pesquisa || filtroStatus !== "todos" || filtroPrioridade !== "todos") && (
              <Button variant="ghost" onClick={() => { setPesquisa(""); setFiltroStatus("todos"); setFiltroPrioridade("todos"); }} className="text-slate-400 hover:text-slate-900 rounded-lg">
                <FilterX className="h-4 w-4 mr-2" /> Limpar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all">
        {carregando ? (
          <div className="p-6 space-y-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Inbox className="text-slate-300 h-8 w-8" />
            </div>
            <p className="text-slate-500 font-semibold text-lg">Nada encontrado</p>
            <p className="text-slate-400 text-sm mt-1">Ajuste os termos de busca ou filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-20">ID</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Detalhes do Chamado</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-32">Prioridade</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-32">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-40 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrados.map((c) => (
                  <tr key={c.id} className="group hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono font-bold text-slate-300 group-hover:text-slate-500 transition-colors">#{c.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <Link href={`/chamados/${c.id}`} className="font-semibold text-slate-800 hover:text-slate-600 transition-colors text-sm mb-0.5">
                          {c.titulo}
                        </Link>
                        <span className="text-[11px] text-slate-400 flex items-center gap-2">
                          {formatarData(c.aberto_em)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${PRIORIDADE_STYLES[c.prioridade]}`}>
                        {c.prioridade}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${STATUS_STYLES[c.status]}`}>
                        {c.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                        <Link href={`/chamados/${c.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900"><Eye size={16} /></Button>
                        </Link>
                        {podeEditar && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900" onClick={() => abrirEdicao(c)}><Pencil size={16} /></Button>
                        )}
                        {nivelAcesso === "admin" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-300 hover:text-red-600 hover:bg-red-50" onClick={() => handleExcluir(c.id)}><Trash2 size={16} /></Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-3 bg-slate-50/30 border-t border-slate-100">
              <p className="text-[11px] text-slate-400 font-medium">{filtrados.length} chamados encontrados de {chamados.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal - Modernized */}
      <Dialog open={mostrarForm} onOpenChange={setMostrarForm}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">{editandoId ? "Atualizar Chamado" : "Novo Registro"}</DialogTitle>
            <DialogDescription className="text-slate-500">Ajuste as informações necessárias do ticket.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSalvar} className="space-y-5 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Equipamento (ID)</Label>
                <Input type="number" required className="rounded-lg bg-slate-50 focus:bg-white" value={form.equipamento_id} onChange={e => setForm({...form, equipamento_id: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Prioridade</Label>
                <Select value={form.prioridade} onValueChange={v => setForm({...form, prioridade: v})}>
                  <SelectTrigger className="rounded-lg bg-slate-50"><SelectValue /></SelectTrigger>
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
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Status do Processo</Label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                  <SelectTrigger className="rounded-lg bg-slate-50"><SelectValue /></SelectTrigger>
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
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Título Resumido</Label>
              <Input required className="rounded-lg bg-slate-50 focus:bg-white" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Descrição Detalhada</Label>
              <Textarea rows={4} className="rounded-lg bg-slate-50 focus:bg-white resize-none" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setMostrarForm(false)} className="rounded-lg">Descartar</Button>
              <Button type="submit" disabled={enviando} className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-8">
                {enviando ? "Processando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}