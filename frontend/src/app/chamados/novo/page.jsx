"use client";

// =============================================
// PÁGINA NOVO CHAMADO — /chamados/novo
// =============================================
// Busca equipamentos operacionais via GET /equipamentos
// (filtrando status=operacional, equivalente à view_equipamentos_operacionais)
// e exibe em um Select para o usuário escolher.
// Pré-seleciona se vier query param ?equipamento_id=X

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle2, Package } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function NovoChamadoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const equipamentoIdParam = searchParams.get("equipamento_id") || "";
  const nomeParam = searchParams.get("nome") || "";

  // ── Lista de equipamentos operacionais ─────────────────
  const [equipamentos, setEquipamentos] = useState([]);
  const [carregandoEquip, setCarregandoEquip] = useState(true);
  const [erroEquip, setErroEquip] = useState("");

  // ── Formulário ─────────────────────────────────────────
  const [form, setForm] = useState({
    equipamento_id: equipamentoIdParam,
    titulo: nomeParam ? `Problema com ${nomeParam}` : "",
    descricao: "",
    prioridade: "media",
  });

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  // ── Busca equipamentos operacionais ────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    async function buscarEquipamentos() {
      setCarregandoEquip(true);
      try {
        const res = await fetch(`${API_URL}/equipamentos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dados = await res.json();
        if (dados.sucesso) {
          // Filtra apenas os operacionais — espelha a view_equipamentos_operacionais
          const operacionais = dados.dados.filter(
            (e) => e.status === "operacional"
          );
          setEquipamentos(operacionais);

          // Se veio por query param e ainda está operacional, mantém
          // Se não veio param, pré-seleciona o primeiro disponível
          if (!equipamentoIdParam && operacionais.length > 0) {
            setForm((prev) => ({
              ...prev,
              equipamento_id: String(operacionais[0].id),
              titulo: prev.titulo || `Problema com ${operacionais[0].nome}`,
            }));
          }
        } else {
          setErroEquip("Não foi possível carregar a lista de equipamentos.");
        }
      } catch {
        setErroEquip("Erro de conexão ao buscar equipamentos.");
      } finally {
        setCarregandoEquip(false);
      }
    }

    buscarEquipamentos();
  }, []);

  // Atualiza o título sugerido ao mudar o equipamento no Select
  function handleEquipamentoChange(value) {
    const equip = equipamentos.find((e) => String(e.id) === value);
    setForm((prev) => ({
      ...prev,
      equipamento_id: value,
      titulo: equip ? `Problema com ${equip.nome}` : prev.titulo,
    }));
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!form.equipamento_id || !form.titulo.trim()) {
      setErro("Selecione um equipamento e informe o título.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    setEnviando(true);
    try {
      const resposta = await fetch(`${API_URL}/chamados`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          equipamento_id: Number(form.equipamento_id),
          titulo: form.titulo.trim(),
          descricao: form.descricao.trim(),
          prioridade: form.prioridade,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok || !dados.sucesso) {
        setErro(dados.erro || "Erro ao criar chamado. Tente novamente.");
        return;
      }

      setSucesso(true);
      setTimeout(() => router.push("/chamados"), 2000);
    } catch {
      setErro("Erro de conexão com o servidor.");
    } finally {
      setEnviando(false);
    }
  }

  if (sucesso) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center shadow-md">
          <CardContent className="pt-8 pb-6 flex flex-col items-center gap-4">
            <CheckCircle2 className="text-green-500" size={48} />
            <div>
              <h2 className="text-xl font-semibold">Chamado criado!</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Redirecionando para a lista de chamados…
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Equipamento pré-selecionado (vindo do inventário)
  const equipamentoPreSelecionado =
    equipamentoIdParam
      ? equipamentos.find((e) => String(e.id) === equipamentoIdParam)
      : null;

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg flex flex-col gap-4">

        <Link
          href="/inventario"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit"
        >
          <ArrowLeft size={16} />
          Voltar ao Inventário
        </Link>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Abrir Chamado</CardTitle>
            <CardDescription>
              Selecione o equipamento com problema e descreva a situação.
              Apenas equipamentos <strong>operacionais</strong> estão disponíveis.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="flex flex-col gap-4">

              {erro && (
                <Alert variant="destructive">
                  <AlertDescription>{erro}</AlertDescription>
                </Alert>
              )}

              {erroEquip && (
                <Alert variant="destructive">
                  <AlertDescription>{erroEquip}</AlertDescription>
                </Alert>
              )}

              {/* Select de equipamento — usa view_equipamentos_operacionais */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="equipamento_id">Equipamento</Label>

                {carregandoEquip ? (
                  <Skeleton className="h-8 w-full rounded-lg" />
                ) : equipamentos.length === 0 ? (
                  <Alert>
                    <Package size={16} />
                    <AlertDescription>
                      Nenhum equipamento operacional disponível no momento.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Select
                    value={form.equipamento_id}
                    onValueChange={handleEquipamentoChange}
                    required
                  >
                    <SelectTrigger id="equipamento_id" className="w-full">
                      <SelectValue placeholder="Selecione o equipamento…" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipamentos.map((e) => (
                        <SelectItem key={e.id} value={String(e.id)}>
                          <span className="font-medium">#{e.id}</span>
                          {" — "}
                          {e.nome}
                          {e.categoria && (
                            <span className="text-muted-foreground ml-1">
                              ({e.categoria})
                            </span>
                          )}
                          {e.patrimonio && (
                            <span className="text-muted-foreground ml-1 font-mono text-xs">
                              · {e.patrimonio}
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {equipamentoPreSelecionado && (
                  <p className="text-xs text-muted-foreground">
                    Pré-selecionado: <strong>{equipamentoPreSelecionado.nome}</strong>
                  </p>
                )}
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
                  onChange={handleChange}
                />
              </div>

              {/* Prioridade */}
              <div className="flex flex-col gap-1.5">
                <Label>Prioridade</Label>
                <Select
                  value={form.prioridade}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, prioridade: v }))}
                >
                  <SelectTrigger className="w-40">
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
                  rows={4}
                  value={form.descricao}
                  onChange={handleChange}
                />
              </div>

            </CardContent>

            <CardFooter className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={enviando}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={enviando || carregandoEquip || equipamentos.length === 0}
              >
                {enviando ? "Enviando…" : "Abrir Chamado"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}

export default function NovoChamadoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <NovoChamadoForm />
    </Suspense>
  );
}