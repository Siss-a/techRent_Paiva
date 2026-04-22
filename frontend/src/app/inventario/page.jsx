"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const STATUS_STYLES = {
  operacional: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  em_manutencao: "bg-amber-50 text-amber-700 border border-amber-200",
  desativado: "bg-slate-100 text-slate-500",
};

const STATUS_LABELS = {
  operacional: "Operacional",
  em_manutencao: "Em Manutenção",
  desativado: "Desativado",
};

export default function InventarioPage() {
  const router = useRouter();
  const [equipamentos, setEquipamentos] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [nivelAcesso, setNivelAcesso] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState({ nome: "", categoria: "", patrimonio: "", status: "operacional" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRaw = localStorage.getItem("usuario");
    if (!token) { router.push("/login"); return; }
    if (userRaw) { const u = JSON.parse(userRaw); setNivelAcesso(u.nivel_acesso); }
    buscarEquipamentos();
  }, []);

  async function buscarEquipamentos() {
    setCarregando(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/equipamentos`, { headers: { Authorization: `Bearer ${token}` } });
      const dados = await res.json();
      if (dados.sucesso) setEquipamentos(dados.dados);
    } catch { setErro("Erro ao buscar equipamentos."); }
    finally { setCarregando(false); }
  }

  const abrirModalNovo = () => {
    setEditandoId(null);
    setFormData({ nome: "", categoria: "", patrimonio: "", status: "operacional" });
    setModalAberto(true);
  };

  const abrirModalEditar = (eq) => {
    setEditandoId(eq.id);
    setFormData({ nome: eq.nome, categoria: eq.categoria || "", patrimonio: eq.patrimonio || "", status: eq.status });
    setModalAberto(true);
  };

  const salvarEquipamento = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const method = editandoId ? "PUT" : "POST";
    const url = editandoId ? `${API_URL}/equipamentos/${editandoId}` : `${API_URL}/equipamentos`;
    const payload = { ...formData, categoria: formData.categoria || null, patrimonio: formData.patrimonio || null };
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      if (res.ok) { setModalAberto(false); buscarEquipamentos(); }
      else alert("Erro ao salvar.");
    } catch {}
  };

  const filtrados = equipamentos.filter(e => {
    const q = busca.toLowerCase();
    return (filtroStatus === "todos" || e.status === filtroStatus) &&
      (e.nome?.toLowerCase().includes(q) || e.id?.toString().includes(q) || e.patrimonio?.toLowerCase().includes(q) || e.categoria?.toLowerCase().includes(q));
  });

  const counts = {
    operacional: equipamentos.filter(e => e.status === "operacional").length,
    em_manutencao: equipamentos.filter(e => e.status === "em_manutencao").length,
    desativado: equipamentos.filter(e => e.status === "desativado").length,
  };

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventário</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {equipamentos.length} equipamentos cadastrados
          </p>
        </div>
        {nivelAcesso === "admin" && (
          <Button onClick={abrirModalNovo} className="bg-slate-900 hover:bg-slate-800 text-white font-semibold gap-2">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo Equipamento
          </Button>
        )}
      </div>

      {/* Status Summary */}
      {!carregando && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { key: "operacional", label: "Operacionais", color: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
            { key: "em_manutencao", label: "Manutenção", color: "bg-amber-50 border-amber-200", dot: "bg-amber-500" },
            { key: "desativado", label: "Desativados", color: "bg-slate-50 border-slate-200", dot: "bg-slate-400" },
          ].map(({ key, label, color, dot }) => (
            <button
              key={key}
              onClick={() => setFiltroStatus(filtroStatus === key ? "todos" : key)}
              className={`rounded-xl p-3 border text-left transition-all hover:shadow-sm ${color} ${filtroStatus === key ? "ring-2 ring-slate-900 ring-offset-1" : ""}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${dot}`} />
                <span className="text-xs font-semibold text-slate-600">{label}</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{counts[key]}</p>
            </button>
          ))}
        </div>
      )}

      {erro && <Alert variant="destructive" className="mb-6"><AlertDescription>{erro}</AlertDescription></Alert>}

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4 mb-6 flex gap-3 shadow-sm">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <Input placeholder="Buscar por nome, patrimônio ou categoria..." className="pl-9 bg-slate-50 border-slate-200 focus:bg-white" value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {carregando ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-slate-400">
                <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <p className="text-slate-500 font-medium">Nenhum equipamento encontrado</p>
          </div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-[60px_1fr_140px_160px_140px_120px] px-6 py-3 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              <span>#</span><span>Nome</span><span>Categoria</span><span>Patrimônio</span><span>Status</span><span className="text-right">Ações</span>
            </div>
            <div className="divide-y divide-slate-100">
              {filtrados.map((eq) => (
                <div key={eq.id} className="group px-6 py-4 hover:bg-slate-50/60 transition-colors">
                  <div className="hidden md:grid grid-cols-[60px_1fr_140px_160px_140px_120px] items-center gap-4">
                    <span className="text-xs font-mono text-slate-400 font-semibold">#{eq.id}</span>
                    <span className="font-semibold text-slate-800 text-sm">{eq.nome}</span>
                    <span className="text-sm text-slate-500">{eq.categoria || "—"}</span>
                    <span className="text-sm font-mono text-slate-500">{eq.patrimonio || "—"}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${STATUS_STYLES[eq.status]}`}>
                      {STATUS_LABELS[eq.status]}
                    </span>
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {nivelAcesso === "admin" && (
                        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => abrirModalEditar(eq)}>
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </Button>
                      )}
                      {eq.status === "operacional" && (
                        <Link href={`/chamados/novo?equipamento_id=${eq.id}&nome=${encodeURIComponent(eq.nome)}`}>
                          <Button size="sm" className="h-8 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold">Chamado</Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Mobile */}
                  <div className="md:hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-slate-400">#{eq.id}</span>
                          {eq.categoria && <span className="text-xs text-slate-400">{eq.categoria}</span>}
                        </div>
                        <p className="font-semibold text-slate-800 text-sm">{eq.nome}</p>
                        {eq.patrimonio && <p className="text-xs font-mono text-slate-400 mt-0.5">{eq.patrimonio}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[eq.status]}`}>
                          {STATUS_LABELS[eq.status]}
                        </span>
                        {eq.status === "operacional" && (
                          <Link href={`/chamados/novo?equipamento_id=${eq.id}&nome=${encodeURIComponent(eq.nome)}`}>
                            <Button size="sm" className="h-7 bg-slate-900 text-white text-xs">Chamado</Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-400">{filtrados.length} de {equipamentos.length} equipamentos</p>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editandoId ? `Editar Equipamento #${editandoId}` : "Novo Equipamento"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={salvarEquipamento} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Nome</Label>
              <Input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Categoria</Label>
                <Input value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Patrimônio</Label>
                <Input value={formData.patrimonio} onChange={e => setFormData({...formData, patrimonio: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</Label>
              <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="operacional">Operacional</SelectItem>
                  <SelectItem value="em_manutencao">Em Manutenção</SelectItem>
                  <SelectItem value="desativado">Desativado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>Cancelar</Button>
              <Button type="submit" className="bg-slate-900 hover:bg-slate-800">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}