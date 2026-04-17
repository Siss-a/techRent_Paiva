"use client";

// =============================================
// PÁGINA RAIZ — /
// =============================================
// Redireciona para /login.
// Se o usuário já tiver token válido, o /login
// pode redirecionar para o dashboard — mas a raiz
// não deve ter conteúdo próprio.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Usuário já autenticado: vai para o dashboard
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  // Tela em branco enquanto o redirect acontece
  return null;
}