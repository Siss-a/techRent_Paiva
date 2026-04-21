"use client";

// Exibe os dados completos de um chamado.
// Técnicos e Admins podem registrar manutenção (POST /manutencao),
// o que encerra o chamado e libera o equipamento.

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Wrench,
  User,
  Package,
  CalendarDays,
  AlertTriangle,
} from "lucide-react";

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
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">
        <Icon size={16} />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function DetalhesChamadoPage() {
  const router = useRouter();
  const { id } = useParams();

  const [chamado, setChamado] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [nivelAcesso, setNivelAcesso] = useState("");
  const [usuarioId, setUsuarioId] = useState(null);

  // Form de manutenção
  const [descricaoReparo, setDescricaoReparo] = useState("");
  const [enviandoReparo, setEnviandoReparo] = useState(false);
  const [erroReparo, setErroReparo] = useState("");
  const [reparoConcluido, setReparoConcluido] = useState(false);

  // Atualização de status
  const [novoStatus, setNovoStatus] = useState("");
  const [atualizandoStatus, setAtualizandoStatus] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRaw = localStorage.getItem("usuario");
    if (!token) { router.push("/login"); return; }
    if (userRaw) {
      const u = JSON.parse(userRaw);
      setNivelAcesso(u.nivel_acesso);
      setUsuarioId(u.id);
    }
    buscarDados();
  }, [id]);

  async function buscarDados() {
    setCarregando(true);
    const token = localStorage.getItem("token");
    try {
      const [resChamado, resManutencao] = await Promise.all([
        fetch(`${API_URL}/chamados/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/manutencao`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const dadosChamado = await resChamado.json();
      if (dadosChamado.sucesso) {
        setChamado(dadosChamado.dados);
        setNovoStatus(dadosChamado.dados.status);
      }

      // Histórico de manutenção: filtra pelo chamado atual
      if (resManutencao.ok) {
        const dadosManut = await resManutencao.json();
        if (dadosManut.sucesso) {
          setHistorico(
            dadosManut.dados.filter((m) => m.chamado_id === Number(id))
          );
        }
      }
    } catch (err) {
      console.error("Erro ao buscar chamado:", err);
    } finally {
      setCarregando(false);
    }
  }

  async function handleRegistrarManutencao(e) {
    e.preventDefault();
    setErroReparo("");

    if (!descricaoReparo.trim()) {
      setErroReparo("Descreva o que foi realizado no reparo.");
      return;
    }

    if (!chamado) return;

    setEnviandoReparo(true);
    const token = localStorage.getItem("token");
    try {
      const resposta = await fetch(`${API_URL}/manutencao`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chamado_id: chamado.id,
          equipamento_id: chamado.equipamento_id,
          descricao: descricaoReparo.trim(),
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok || !dados.sucesso) {
        setErroReparo(dados.erro || "Erro ao registrar manutenção.");
        return;
      }

      setReparoConcluido(true);
      setTimeout(() => router.push("/chamados"), 2500);
    } catch (err) {
      setErroReparo("Erro de conexão com o servidor.");
    } finally {
      setEnviandoReparo(false);
    }
  }

  async function handleAtualizarStatus() {
    if (!novoStatus || novoStatus === chamado?.status) return;
    setAtualizandoStatus(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/chamados/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: novoStatus }),
      });
      if (res.ok) {
        await buscarDados();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAtualizandoStatus(false);
    }
  }

  const podeTecnico = nivelAcesso === "tecnico" || nivelAcesso === "admin";
  const chamadoAtivo = chamado && ["aberto", "em_atendimento"].includes(chamado.status);

  // ── Tela de Sucesso ────────────────────────────────────
  if (reparoConcluido) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center shadow-md">
          <CardContent className="pt-10 pb-8 flex flex-col items-center gap-4">
            <CheckCircle2 className="text-green-500" size={52} />
            <div>
              <h2 className="text-xl font-semibold">Manutenção Registrada!</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Chamado resolvido e equipamento liberado. Redirecionando…
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <Link
          href="/chamados"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Voltar aos Chamados
        </Link>
        <h1 className="text-base font-semibold text-slate-700">
          {carregando ? "Carregando…" : `Chamado #${chamado?.id}`}
        </h1>
        <div className="w-32" />
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Coluna Principal ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Detalhes do Chamado */}
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {carregando ? (
                    <Skeleton className="h-6 w-48" />
                  ) : (
                    <CardTitle className="text-lg">{chamado?.titulo}</CardTitle>
                  )}
                  <CardDescription className="mt-1">
                    {carregando ? (
                      <Skeleton className="h-4 w-32 mt-2" />
                    ) : (
                      `Aberto em ${formatarData(chamado?.aberto_em)}`
                    )}
                  </CardDescription>
                </div>
                {!carregando && chamado && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Badge variant={PRIORIDADE_BADGE[chamado.prioridade]}>
                      {chamado.prioridade}
                    </Badge>
                    <Badge variant={STATUS_BADGE[chamado.status]}>
                      {chamado.status?.replace("_", " ")}
                    </Badge>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {carregando ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <>
                  {chamado?.descricao && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Descrição
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {chamado.descricao}
                      </p>
                    </div>
                  )}
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow
                      icon={Package}
                      label="Equipamento ID"
                      value={`#${chamado?.equipamento_id}`}
                    />
                    <InfoRow
                      icon={User}
                      label="Solicitante ID"
                      value={`#${chamado?.cliente_id}`}
                    />
                    <InfoRow
                      icon={CalendarDays}
                      label="Última atualização"
                      value={formatarData(chamado?.atualizado_em)}
                    />
                    <InfoRow
                      icon={Wrench}
                      label="Técnico ID"
                      value={chamado?.tecnico_id ? `#${chamado.tecnico_id}` : "Não atribuído"}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Histórico de Manutenção */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList size={18} />
                Histórico de Manutenção
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historico.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum reparo registrado para este chamado.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {historico.map((h) => (
                    <div
                      key={h.id}
                      className="border rounded-lg p-4 bg-slate-50 flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">
                          Técnico #{h.tecnico_id}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatarData(h.registrado_em)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{h.descricao}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Coluna Lateral ── */}
        <div className="flex flex-col gap-6">

          {/* Atualizar Status (Técnico/Admin) */}
          {podeTecnico && chamado && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Atualizar Status</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Select value={novoStatus} onValueChange={setNovoStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aberto">Aberto</SelectItem>
                    <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                    <SelectItem value="resolvido">Resolvido</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={atualizandoStatus || novoStatus === chamado.status}
                  onClick={handleAtualizarStatus}
                >
                  {atualizandoStatus ? "Atualizando…" : "Salvar Status"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Registrar Manutenção (Técnico/Admin, chamado ativo) */}
          {podeTecnico && chamadoAtivo && (
            <Card className="border-2 border-primary/20 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wrench size={18} />
                  Registrar Reparo
                </CardTitle>
                <CardDescription>
                  Descreva o que foi feito. O chamado será marcado como{" "}
                  <strong>resolvido</strong> e o equipamento voltará para{" "}
                  <strong>operacional</strong>.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegistrarManutencao} className="flex flex-col gap-3">
                  {erroReparo && (
                    <Alert variant="destructive">
                      <AlertDescription>{erroReparo}</AlertDescription>
                    </Alert>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="descricaoReparo">Descrição do Reparo</Label>
                    <Textarea
                      id="descricaoReparo"
                      rows={4}
                      placeholder="Ex: Substituído HD defeituoso por SSD 480GB. Testado e funcionando normalmente."
                      value={descricaoReparo}
                      onChange={(e) => setDescricaoReparo(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={enviandoReparo}>
                    {enviandoReparo ? "Registrando…" : "Finalizar & Registrar"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Aviso se o chamado já foi resolvido */}
          {chamado?.status === "resolvido" && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="text-green-600" size={16} />
              <AlertDescription className="text-green-700">
                Este chamado já foi resolvido.
              </AlertDescription>
            </Alert>
          )}

          {/* Aviso se o chamado foi cancelado */}
          {chamado?.status === "cancelado" && (
            <Alert variant="destructive">
              <AlertTriangle size={16} />
              <AlertDescription>Este chamado foi cancelado.</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </main>
  );
}