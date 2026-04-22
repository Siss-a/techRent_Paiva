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
import { 
  Plus, 
  Search, 
  Monitor, 
  Pencil, 
  TicketPlus, 
  FilterX 
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const STATUS_STYLES = {
  operacional: "bg-emerald-50 text-emerald-700 border-emerald-100",
  em_manutencao: "bg-amber-50 text-amber-700 border-amber-100",
  desativado: "bg-slate-100 text-slate-500 border-slate-200",
};

const STATUS_LABELS = {
  operacional: "Operacional",
  em_manutencao: "Manutenção",
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventário de Ativos</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestão e controle de hardware e periféricos.
          </p>
        </div>
        {nivelAcesso === "admin" && (
          <Button onClick={abrirModalNovo} className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg h-10 gap-2">
            <Plus size={18} strokeWidth={2.5} />
            Novo Equipamento
          </Button>
        )}
      </div>

      {/* Status Cards - Minimalistas */}
      {!carregando && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { key: "operacional", label: "Operacionais", dot: "bg-emerald-500" },
            { key: "em_manutencao", label: "Em Manutenção", dot: "bg-amber-500" },
            { key: "desativado", label: "Desativados", dot: "bg-slate-400" },
          ].map(({ key, label, dot }) => (
            <button
              key={key}
              onClick={() => setFiltroStatus(filtroStatus === key ? "todos" : key)}
              className={`relative rounded-xl p-5 border text-left transition-all bg-white shadow-sm hover:border-slate-300 ${
                filtroStatus === key ? "border-slate-900 ring-1 ring-slate-900" : "border-slate-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{counts[key]}</p>
              {filtroStatus === key && <div className="absolute top-2 right-2 text-slate-400"><FilterX size={14}/></div>}
            </button>
          ))}
        </div>
      )}

      {erro && <Alert variant="destructive" className="mb-6 rounded-xl"><AlertDescription>{erro}</AlertDescription></Alert>}

      {/* Search Area */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input 
            placeholder="Pesquisar por patrimônio, nome ou categoria..." 
            className="pl-10 bg-slate-50/50 border-slate-200 focus:bg-white rounded-lg transition-all" 
            value={busca} 
            onChange={e => setBusca(e.target.value)} 
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-sm">
        {carregando ? (
          <div className="p-6 space-y-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Monitor className="text-slate-200" size={32} />
            </div>
            <p className="text-slate-400 font-medium tracking-tight">Nenhum equipamento listado nesta categoria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-20">ID</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Equipamento</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Patrimônio</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrados.map((eq) => (
                  <tr key={eq.id} className="group hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-[10px] font-bold text-slate-300 group-hover:text-slate-400 transition-colors">
                      #{eq.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 tracking-tight">{eq.nome}</span>
                        <span className="text-[11px] text-slate-400 font-medium">{eq.categoria || "Periférico / Outros"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {eq.patrimonio || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tighter border ${STATUS_STYLES[eq.status]}`}>
                        {STATUS_LABELS[eq.status]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2 items-center">
                        {eq.status === "operacional" && (
                          <Link href={`/chamados/novo?equipamento_id=${eq.id}&nome=${encodeURIComponent(eq.nome)}`}>
                            <Button size="sm" variant="outline" className="h-8 text-[11px] font-bold border-slate-200 hover:bg-slate-900 hover:text-white transition-all gap-1.5">
                              <TicketPlus size={14} />
                              ABRIR CHAMADO
                            </Button>
                          </Link>
                        )}
                        {nivelAcesso === "admin" && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-slate-900" 
                            onClick={() => abrirModalEditar(eq)}
                          >
                            <Pencil size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/30">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                 {filtrados.length} de {equipamentos.length} itens no total
               </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal - Ajustado para o tema */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">
              {editandoId ? `Editar Ativo #${editandoId}` : "Cadastrar Novo Ativo"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={salvarEquipamento} className="space-y-5 pt-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome do Equipamento</Label>
              <Input 
                value={formData.nome} 
                onChange={e => setFormData({...formData, nome: e.target.value})} 
                required 
                className="rounded-lg bg-slate-50/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoria</Label>
                <Input 
                  value={formData.categoria} 
                  onChange={e => setFormData({...formData, categoria: e.target.value})} 
                  placeholder="Ex: Notebook" 
                  className="rounded-lg bg-slate-50/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nº Patrimônio</Label>
                <Input 
                  value={formData.patrimonio} 
                  onChange={e => setFormData({...formData, patrimonio: e.target.value})} 
                  placeholder="123456" 
                  className="rounded-lg bg-slate-50/50"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Inicial</Label>
              <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                <SelectTrigger className="rounded-lg bg-slate-50/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="operacional">Operacional</SelectItem>
                  <SelectItem value="em_manutencao">Em Manutenção</SelectItem>
                  <SelectItem value="desativado">Desativado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setModalAberto(false)} className="rounded-lg font-semibold text-slate-500">
                Cancelar
              </Button>
              <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-8 font-semibold">
                Salvar Ativo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}