"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FOG from "vanta/dist/vanta.fog.min";
import * as THREE from "three";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function LoginPage() {
  const router = useRouter();
  const vantaRef = useRef(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    let vantaEffect = null;
    if (vantaRef.current) {
      vantaEffect = FOG({
        el: vantaRef.current,
        THREE: THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        highlightColor: 0x3b82f6,
        midtoneColor: 0x94a3b8,
        lowlightColor: 0xf1f5f9,
        baseColor: 0xffffff,
        speed: 1.8,
        zoom: 1.0
      });
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, []);

  function redirecionarPorNivel(nivel) {
    const rotas = {
      admin: "/dashboard",
      tecnico: "/painel-tecnico",
      cliente: "/chamados",
    };
    router.push(rotas[nivel] ?? "/chamados");
  }

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
      if (!resposta.ok || !dados.sucesso) {
        setErro(dados.erro || "Credenciais inválidas.");
        return;
      }
      localStorage.setItem("token", dados.dados.token);
      localStorage.setItem("usuario", JSON.stringify(dados.dados.usuario));
      redirecionarPorNivel(dados.dados.usuario.nivel_acesso);
    } catch (err) {
      setErro("Falha na conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main ref={vantaRef} className="min-h-screen flex items-center justify-center px-4 relative">
      <Card className="w-full max-w-[400px] border-white/30 bg-white/40 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] ring-1 ring-white/20">
        <CardHeader className="space-y-1 pb-6 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">TechRent</CardTitle>
          <CardDescription className="text-slate-600 font-medium">Acesse sua conta corporativa</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-5 pb-6">
            {erro && (
              <Alert variant="destructive" className="py-2 bg-red-500/10 border-red-500/20 text-red-600">
                <AlertDescription className="text-xs font-semibold">{erro}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-slate-700 font-semibold">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@empresa.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/60 border-slate-200/50 focus:bg-white transition-all shadow-sm"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="senha" className="text-slate-700 font-semibold">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="••••••••"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="bg-white/60 border-slate-200/50 focus:bg-white transition-all shadow-sm"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-4 pb-8">
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]" disabled={carregando}>
              {carregando ? "Autenticando..." : "Entrar no Sistema"}
            </Button>
            <div className="text-sm text-slate-500 font-medium">
              Novo por aqui?{" "}
              <Link href="/registro" className="text-blue-600 hover:text-blue-800 underline-offset-4 hover:underline">
                Crie uma conta
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}