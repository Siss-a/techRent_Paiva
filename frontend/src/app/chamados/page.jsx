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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const STATUS_STYLES = {
  aberto: "bg-blue-50 text-blue-700 border border-blue-200",
  em_atendimento: "bg-amber-50 text-amber-700 border border-amber-200",
  resolvido: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelado: "bg-red-50 text-red-700 border border-red-200",
};

const PRIORIDADE_STYLES = {
  baixa: "bg-slate-100 text-slate-600",
  media: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  alta: "bg-red-50 text-red-700 border border-red-200",
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
  }, []);

  async function buscarChamados() {
    setCarregando(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/chamados`, { headers: { Authorization: `Bearer ${token}` } });
      const dados = await res.json();
      if (dados.sucesso) setChamados(dados.dados);
      else setErro(dados.erro);
    } catch { setErro("Erro de conexão."); }
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
      const res = await fetch(url, { method: editandoId ? "PUT" : "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
      if (res.ok) { setMostrarForm(false); setEditandoId(null); buscarChamados(); }
    } catch {} finally { setEnviando(false); }
  }

  async function handleExcluir(id) {
    if (nivelAcesso !== "admin") return;
    if (!confirm("Excluir este chamado?")) return;
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Chamados</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {nivelAcesso === "cliente" ? "Suas solicitações de suporte" : "Gerencie todos os chamados do sistema"}
          </p>
        </div>
        {podeCriar && (
          <Link href="/chamados/novo">
            <Button className="bg-slate-900 hover:bg-slate-800 text-white font-semibold gap-2">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Novo Chamado
            </Button>
          </Link>
        )}
      </div>

      {erro && <Alert variant="destructive" className="mb-6"><AlertDescription>{erro}</AlertDescription></Alert>}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4 mb-6 flex flex-col md:flex-row gap-3 shadow-sm">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <Input placeholder="Pesquisar por ID ou título..." className="pl-9 bg-slate-50 border-slate-200 focus:bg-white" value={pesquisa} onChange={e => setPesquisa(e.target.value)} />
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-full md:w-44 bg-slate-50 border-slate-200"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Status</SelectItem>
            <SelectItem value="aberto">Aberto</SelectItem>
            <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
            <SelectItem value="resolvido">Resolvido</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroPrioridade} onValueChange={setFiltroPrioridade}>
          <SelectTrigger className="w-full md:w-44 bg-slate-50 border-slate-200"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            <SelectItem value="baixa">Baixa</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
          </SelectContent>
        </Select>
        {(pesquisa || filtroStatus !== "todos" || filtroPrioridade !== "todos") && (
          <Button variant="ghost" size="sm" onClick={() => { setPesquisa(""); setFiltroStatus("todos"); setFiltroPrioridade("todos"); }} className="text-slate-500 hover:text-slate-900">
            Limpar
          </Button>
        )}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {carregando ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-slate-400">
                <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
              </svg>
            </div>
            <p className="text-slate-500 font-medium">Nenhum chamado encontrado</p>
            <p className="text-slate-400 text-sm mt-1">Tente ajustar os filtros</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[60px_1fr_120px_120px_140px_120px] px-6 py-3 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              <span>#</span><span>Título</span><span>Prioridade</span><span>Status</span><span>Data</span><span className="text-right">Ações</span>
            </div>
            <div className="divide-y divide-slate-100">
              {filtrados.map((c) => (
                <div key={c.id} className="group px-6 py-4 hover:bg-slate-50/60 transition-colors">
                  <div className="hidden md:grid grid-cols-[60px_1fr_120px_120px_140px_120px] items-center gap-4">
                    <span className="text-xs font-mono text-slate-400 font-semibold">#{c.id}</span>
                    <Link href={`/chamados/${c.id}`}>
                      <span className="font-semibold text-slate-800 hover:text-slate-600 cursor-pointer text-sm">{c.titulo}</span>
                    </Link>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${PRIORIDADE_STYLES[c.prioridade]}`}>{c.prioridade}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${STATUS_STYLES[c.status]}`}>{c.status?.replace("_", " ")}</span>
                    <span className="text-xs text-slate-400">{formatarData(c.aberto_em)}</span>
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/chamados/${c.id}`}>
                        <Button variant="ghost" size="icon" className="w-8 h-8" title="Ver">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </Button>
                      </Link>
                      {podeEditar && (
                        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => abrirEdicao(c)}>
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </Button>
                      )}
                      {nivelAcesso === "admin" && (
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleExcluir(c.id)}>
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Mobile */}
                  <div className="md:hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-slate-400">#{c.id}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORIDADE_STYLES[c.prioridade]}`}>{c.prioridade}</span>
                        </div>
                        <Link href={`/chamados/${c.id}`}>
                          <p className="font-semibold text-slate-800 text-sm">{c.titulo}</p>
                        </Link>
                        <p className="text-xs text-slate-400 mt-1">{formatarData(c.aberto_em)}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_STYLES[c.status]}`}>{c.status?.replace("_", " ")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-400">{filtrados.length} de {chamados.length} chamados</p>
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={mostrarForm} onOpenChange={setMostrarForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editandoId ? "Editar Chamado" : "Novo Chamado"}</DialogTitle>
            <DialogDescription>Preencha os dados do chamado.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSalvar} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">ID Equipamento</Label>
                <Input type="number" required value={form.equipamento_id} onChange={e => setForm({...form, equipamento_id: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Prioridade</Label>
                <Select value={form.prioridade} onValueChange={v => setForm({...form, prioridade: v})}>
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
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
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
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Título</Label>
              <Input required value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Descrição</Label>
              <Textarea rows={3} value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMostrarForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={enviando} className="bg-slate-900 hover:bg-slate-800">
                {enviando ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}