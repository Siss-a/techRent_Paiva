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
  const vantaRef = useRef(null);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    nivel_acesso: "cliente",
  });
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
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
    return () => { if (vantaEffect) vantaEffect.destroy(); };
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleNivelChange(valor) {
    setForm((prev) => ({ ...prev, nivel_acesso: valor }));
  }

  function validar() {
    if (!form.nome.trim()) return "O nome é obrigatório.";
    if (!form.email.trim()) return "O e-mail é obrigatório.";
    if (form.senha.length < 6) return "A senha deve ter ao menos 6 caracteres.";
    if (form.senha !== form.confirmarSenha) return "As senhas não coincidem.";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");
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
          nome: form.nome.trim(),
          email: form.email.trim(),
          senha: form.senha,
          nivel_acesso: form.nivel_acesso,
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok || !dados.sucesso) {
        setErro(dados.erro || "Não foi possível criar a conta.");
        return;
      }
      setSucesso("Conta criada com sucesso! Redirecionando...");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setErro("Erro de conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main ref={vantaRef} className="min-h-screen flex items-center justify-center px-4 py-10 relative">
      <Card className="w-full max-w-[450px] border-white/30 bg-white/40 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] ring-1 ring-white/20">
        <CardHeader className="space-y-1 pb-6 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">TechRent</CardTitle>
          <CardDescription className="text-slate-600 font-medium">Crie sua conta para começar</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4 pb-6">
            {erro && (
              <Alert variant="destructive" className="py-2 bg-red-500/10 border-red-500/20 text-red-600">
                <AlertDescription className="text-xs font-semibold text-center">{erro}</AlertDescription>
              </Alert>
            )}
            {sucesso && (
              <Alert className="py-2 border-green-500/50 text-green-700 bg-green-500/10">
                <AlertDescription className="text-xs font-semibold text-center">{sucesso}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="nome" className="text-slate-700 font-semibold">Nome completo</Label>
              <Input id="nome" name="nome" placeholder="João Silva" required value={form.nome} onChange={handleChange} className="bg-white/60 border-slate-200/50 focus:bg-white transition-all shadow-sm" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email" className="text-slate-700 font-semibold">E-mail</Label>
              <Input id="email" name="email" type="email" placeholder="seu@email.com" required value={form.email} onChange={handleChange} className="bg-white/60 border-slate-200/50 focus:bg-white transition-all shadow-sm" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nivel_acesso" className="text-slate-700 font-semibold">Perfil de acesso</Label>
              <Select value={form.nivel_acesso} onValueChange={handleNivelChange}>
                <SelectTrigger className="bg-white/60 border-slate-200/50">
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="senha" className="text-slate-700 font-semibold">Senha</Label>
                <Input id="senha" name="senha" type="password" placeholder="••••••" required value={form.senha} onChange={handleChange} className="bg-white/60 border-slate-200/50 focus:bg-white transition-all shadow-sm" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="confirmarSenha" className="text-slate-700 font-semibold">Repetir</Label>
                <Input id="confirmarSenha" name="confirmarSenha" type="password" placeholder="••••••" required value={form.confirmarSenha} onChange={handleChange} className="bg-white/60 border-slate-200/50 focus:bg-white transition-all shadow-sm" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-4 pb-8">
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]" disabled={carregando}>
              {carregando ? "Processando..." : "Finalizar Cadastro"}
            </Button>
            <div className="text-sm text-slate-500 font-medium">
              Já possui uma conta?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-800 underline-offset-4 hover:underline">
                Faça login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}