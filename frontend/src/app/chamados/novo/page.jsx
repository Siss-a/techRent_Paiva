"use client";

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

  const [equipamentos, setEquipamentos] = useState([]);
  const [carregandoEquip, setCarregandoEquip] = useState(true);
  const [erroEquip, setErroEquip] = useState("");

  const [form, setForm] = useState({
    equipamento_id: equipamentoIdParam,
    titulo: nomeParam ? `Problema com ${nomeParam}` : "",
    descricao: "",
    prioridade: "media",
  });

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

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
          const operacionais = dados.dados.filter(
            (e) => e.status === "operacional"
          );
          setEquipamentos(operacionais);

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
  }, [router, equipamentoIdParam]);

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
        {/* Alterado para rounded-lg e cores neutras */}
        <Card className="w-full max-w-md text-center shadow-sm border-slate-200 rounded-lg">
          <CardContent className="pt-8 pb-6 flex flex-col items-center gap-4">
            <CheckCircle2 className="text-slate-900" size={40} />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Chamado criado!</h2>
              <p className="text-slate-500 text-sm mt-1">
                Redirecionando para a lista de chamados…
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  const equipamentoPreSelecionado =
    equipamentoIdParam
      ? equipamentos.find((e) => String(e.id) === equipamentoIdParam)
      : null;

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg flex flex-col gap-4">

        <Link
          href="/inventario"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 w-fit transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar ao Inventário
        </Link>

        {/* Alterado para rounded-lg e bordas mais suaves */}
        <Card className="shadow-sm border-slate-200 rounded-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900">Abrir Chamado</CardTitle>
            <CardDescription className="text-slate-500">
              Descreva o problema encontrado no equipamento operacional selecionado.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="flex flex-col gap-5">

              {erro && (
                <Alert variant="destructive" className="rounded-md">
                  <AlertDescription>{erro}</AlertDescription>
                </Alert>
              )}

              {erroEquip && (
                <Alert variant="destructive" className="rounded-md">
                  <AlertDescription>{erroEquip}</AlertDescription>
                </Alert>
              )}

              {/* Select de equipamento */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="equipamento_id" className="text-slate-700 font-medium">Equipamento</Label>

                {carregandoEquip ? (
                  <Skeleton className="h-10 w-full rounded-md" />
                ) : equipamentos.length === 0 ? (
                  <Alert className="bg-slate-100 border-slate-200 rounded-md">
                    <AlertDescription className="text-slate-600">
                      Nenhum equipamento operacional disponível.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Select
                    value={form.equipamento_id}
                    onValueChange={handleEquipamentoChange}
                    required
                  >
                    <SelectTrigger id="equipamento_id" className="w-full rounded-md border-slate-200">
                      <SelectValue placeholder="Selecione o equipamento…" />
                    </SelectTrigger>
                    <SelectContent className="rounded-md">
                      {equipamentos.map((e) => (
                        <SelectItem key={e.id} value={String(e.id)}>
                          <span className="font-semibold text-slate-900">#{e.id}</span>
                          {" — "}
                          {e.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Título */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="titulo" className="text-slate-700 font-medium">Título do Problema</Label>
                <Input
                  id="titulo"
                  name="titulo"
                  type="text"
                  placeholder="Ex: Teclado falhando"
                  className="rounded-md border-slate-200"
                  required
                  value={form.titulo}
                  onChange={handleChange}
                />
              </div>

              {/* Prioridade */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-slate-700 font-medium">Prioridade</Label>
                <Select
                  value={form.prioridade}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, prioridade: v }))}
                >
                  <SelectTrigger className="w-40 rounded-md border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-md">
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Descrição */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="descricao" className="text-slate-700 font-medium">Descrição</Label>
                <Textarea
                  id="descricao"
                  name="descricao"
                  placeholder="Descreva detalhadamente o ocorrido..."
                  className="rounded-md border-slate-200 min-h-[100px]"
                  value={form.descricao}
                  onChange={handleChange}
                />
              </div>

            </CardContent>

            <CardFooter className="flex gap-2 justify-end border-t border-slate-100 pt-6 mt-2">
              <Button
                type="button"
                variant="ghost"
                className="text-slate-500 hover:text-slate-900 rounded-md"
                onClick={() => router.back()}
                disabled={enviando}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-slate-900 text-white hover:bg-slate-800 rounded-md px-6"
                disabled={enviando || carregandoEquip || equipamentos.length === 0}
              >
                {enviando ? "Processando..." : "Abrir Chamado"}
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