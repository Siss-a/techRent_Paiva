"use client";

// =============================================
// PÁGINA NOVO CHAMADO — /chamados/novo
// =============================================
// Recebe query params opcionais:
//   ?equipamento_id=3&nome=Monitor+Dell
// Pré-preenche o formulário quando vindo do inventário.

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
import { ArrowLeft, CheckCircle2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Inner component that uses useSearchParams (must be inside Suspense)
function NovoChamadoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const equipamentoIdParam = searchParams.get("equipamento_id") || "";
  const nomeParam = searchParams.get("nome") || "";

  const [form, setForm] = useState({
    equipamento_id: equipamentoIdParam,
    titulo: nomeParam ? `Problema com ${nomeParam}` : "",
    descricao: "",
    prioridade: "media",
  });

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!form.equipamento_id || !form.titulo.trim()) {
      setErro("ID do equipamento e título são obrigatórios.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

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
    } catch (err) {
      setErro("Erro de conexão com o servidor.");
      console.error(err);
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

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg flex flex-col gap-4">

        {/* Breadcrumb / voltar */}
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
              {nomeParam
                ? `Equipamento selecionado: ${nomeParam}`
                : "Informe o equipamento com problema e descreva a situação."}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="flex flex-col gap-4">

              {erro && (
                <Alert variant="destructive">
                  <AlertDescription>{erro}</AlertDescription>
                </Alert>
              )}

              {/* ID do equipamento */}
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
                  onChange={handleChange}
                />
                {!equipamentoIdParam && (
                  <p className="text-xs text-muted-foreground">
                    Você pode ver os IDs na página de{" "}
                    <Link href="/inventario" className="underline">
                      Inventário
                    </Link>
                    .
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
              <Button type="submit" disabled={enviando}>
                {enviando ? "Enviando…" : "Abrir Chamado"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}

// Wrapper with Suspense required for useSearchParams in Next.js App Router
export default function NovoChamadoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <NovoChamadoForm />
    </Suspense>
  );
}