"use client";

//Renderizar formulário: nome, e-mail, senha, confirmação
//Validar campos antes de enviar (client-side simples)
//Enviar POST /auth/registro com fetch nativo
//Redirecionar para /login após sucesso


import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Componentes shadcn/ui
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function RegistroPage() {
  const router = useRouter();

  // Estado do formulário 
  const [form, setForm] = useState({
    nome:             "",
    email:            "",
    senha:            "",
    confirmarSenha:   "",
    nivel_acesso:     "cliente", // valor padrão
  });
  const [erro, setErro]         = useState("");
  const [sucesso, setSucesso]   = useState("");
  const [carregando, setCarregando] = useState(false);

  // ── Atualiza qualquer campo do form de uma vez ────────
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // Tratamento especial para o Select do shadcn (não usa e.target)
  function handleNivelChange(valor) {
    setForm((prev) => ({ ...prev, nivel_acesso: valor }));
  }

  // ── Validação client-side ─────────────────────────────
  function validar() {
    if (!form.nome.trim())  return "O nome é obrigatório.";
    if (!form.email.trim()) return "O e-mail é obrigatório.";
    if (form.senha.length < 6) return "A senha deve ter ao menos 6 caracteres.";
    if (form.senha !== form.confirmarSenha) return "As senhas não coincidem.";
    return null; // sem erros
  }

  // ── Handler de envio ─────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    // Para antes de chamar a API se houver erro local
    const erroLocal = validar();
    if (erroLocal) {
      setErro(erroLocal);
      return;
    }

    setCarregando(true);

    try {
      const resposta = await fetch(`${API_URL}/auth/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome:         form.nome.trim(),
          email:        form.email.trim(),
          senha:        form.senha,
          nivel_acesso: form.nivel_acesso,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok || !dados.sucesso) {
        setErro(dados.erro || "Não foi possível criar a conta.");
        return;
      }

      setSucesso("Conta criada com sucesso! Redirecionando…");

      // Aguarda 1.5s para o usuário ler o feedback antes de redirecionar
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setErro("Erro de conexão. Verifique se o servidor está rodando.");
      console.error("Erro no registro:", err);
    } finally {
      setCarregando(false);
    }
  }

  // ── Render ────────────────────────────────────────────
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <Card className="w-full max-w-sm shadow-md">

        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Criar conta</CardTitle>
          <CardDescription>Preencha os dados abaixo para se cadastrar</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-4">

            {/* Alertas de feedback */}
            {erro && (
              <Alert variant="destructive">
                <AlertDescription>{erro}</AlertDescription>
              </Alert>
            )}
            {sucesso && (
              <Alert className="border-green-500 text-green-700 bg-green-50">
                <AlertDescription>{sucesso}</AlertDescription>
              </Alert>
            )}

            {/* Nome completo */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                name="nome"
                type="text"
                placeholder="João Silva"
                autoComplete="name"
                required
                value={form.nome}
                onChange={handleChange}
              />
            </div>

            {/* E-mail */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
              />
            </div>

            {/* Nível de acesso */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nivel_acesso">Perfil de acesso</Label>
              <Select
                value={form.nivel_acesso}
                onValueChange={handleNivelChange}
              >
                <SelectTrigger id="nivel_acesso">
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Senha */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                name="senha"
                type="password"
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                required
                value={form.senha}
                onChange={handleChange}
              />
            </div>

            {/* Confirmar senha */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmarSenha">Confirmar senha</Label>
              <Input
                id="confirmarSenha"
                name="confirmarSenha"
                type="password"
                placeholder="Repita a senha"
                autoComplete="new-password"
                required
                value={form.confirmarSenha}
                onChange={handleChange}
              />
            </div>

          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={carregando}>
              {carregando ? "Criando conta…" : "Criar conta"}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Já tem conta?{" "}
              <Link href="/login" className="underline hover:text-foreground">
                Faça login
              </Link>
            </p>
          </CardFooter>
        </form>

      </Card>
    </main>
  );
}