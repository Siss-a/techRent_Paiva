"use client";

// =============================================
// PÁGINA DE LOGIN — /login
// =============================================
// Responsabilidades:
//   1. Renderizar formulário de e-mail + senha
//   2. Enviar POST /api/login com fetch nativo
//   3. Salvar o token JWT no localStorage
//   4. Redirecionar o usuário conforme nivel_acesso
// =============================================

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

// URL base da API — ajuste conforme .env.local
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function LoginPage() {
  const router = useRouter();

  // ── Estado do formulário ──────────────────────────────
  const [email, setEmail]       = useState("");
  const [senha, setSenha]       = useState("");
  const [erro, setErro]         = useState("");       // mensagem de erro visível
  const [carregando, setCarregando] = useState(false); // desabilita botão durante requisição

  // ── Redirecionamento por perfil ───────────────────────
  function redirecionarPorNivel(nivel) {
    const rotas = {
      admin:   "/dashboard",
      tecnico: "/painel-tecnico",
      cliente: "/chamados",
    };
    // Fallback para /chamados se o nível for desconhecido
    router.push(rotas[nivel] ?? "/chamados");
  }

  // ── Handler de envio ─────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const resposta = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const dados = await resposta.json();

      // A API retorna sucesso: false em erros de negócio (ex: senha errada)
      if (!resposta.ok || !dados.sucesso) {
        setErro(dados.erro || "Credenciais inválidas. Tente novamente.");
        return;
      }

      // Persiste o token e os dados básicos do usuário
      localStorage.setItem("token", dados.dados.token);
      localStorage.setItem("usuario", JSON.stringify(dados.dados.usuario));

      redirecionarPorNivel(dados.dados.usuario.nivel_acesso);
    } catch (err) {
      // Erro de rede (servidor offline, CORS, etc.)
      setErro("Não foi possível conectar ao servidor. Tente novamente.");
      console.error("Erro no login:", err);
    } finally {
      // Sempre reabilita o botão, independente do resultado
      setCarregando(false);
    }
  }

  // ── Render ────────────────────────────────────────────
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-sm shadow-md">

        {/* Cabeçalho */}
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">TechRent</CardTitle>
          <CardDescription>Entre com sua conta para continuar</CardDescription>
        </CardHeader>

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-4">

            {/* Alerta de erro — só aparece quando há mensagem */}
            {erro && (
              <Alert variant="destructive">
                <AlertDescription>{erro}</AlertDescription>
              </Alert>
            )}

            {/* Campo e-mail */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Campo senha */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

          </CardContent>

          {/* Rodapé — botão + link para cadastro */}
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={carregando}>
              {carregando ? "Entrando…" : "Entrar"}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Não tem conta?{" "}
              <Link href="/registro" className="underline hover:text-foreground">
                Cadastre-se
              </Link>
            </p>
          </CardFooter>
        </form>

      </Card>
    </main>
  );
}