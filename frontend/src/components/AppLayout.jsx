"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

// Icons inline SVG para evitar dependências extras
const Icons = {
  Menu: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  X: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Dashboard: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  ),
  Ticket: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
    </svg>
  ),
  Box: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
    </svg>
  ),
  Wrench: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  Panel: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
    </svg>
  ),
  LogOut: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  User: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
};

// Definição de nav por nível de acesso
const NAV_LINKS = {
  admin: [
    { href: "/dashboard", label: "Dashboard", icon: "Dashboard" },
    { href: "/chamados", label: "Chamados", icon: "Ticket" },
    { href: "/inventario", label: "Inventário", icon: "Box" },
    { href: "/manutencao", label: "Manutenção", icon: "Wrench" },
    { href: "/painel-tecnico", label: "Painel Técnico", icon: "Panel" },
  ],
  tecnico: [
    { href: "/painel-tecnico", label: "Painel Técnico", icon: "Panel" },
    { href: "/chamados", label: "Chamados", icon: "Ticket" },
    { href: "/inventario", label: "Inventário", icon: "Box" },
    { href: "/manutencao", label: "Manutenção", icon: "Wrench" },
  ],
  cliente: [
    { href: "/chamados", label: "Meus Chamados", icon: "Ticket" },
    { href: "/inventario", label: "Equipamentos", icon: "Box" },
  ],
};

const ROLE_LABELS = {
  admin: "Administrador",
  tecnico: "Técnico",
  cliente: "Cliente",
};

const ROLE_COLORS = {
  admin: "bg-violet-100 text-violet-700",
  tecnico: "bg-sky-100 text-sky-700",
  cliente: "bg-emerald-100 text-emerald-700",
};

export default function AppLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [usuario, setUsuario] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("usuario");
    if (raw) {
      try { setUsuario(JSON.parse(raw)); } catch {}
    }
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function handleLogout() {
    localStorage.clear();
    router.push("/login");
  }

  const nivel = usuario?.nivel_acesso || "cliente";
  const links = NAV_LINKS[nivel] || NAV_LINKS.cliente;

  return (
    <div className="min-h-screen bg-[#F7F8FC]" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href={nivel === "tecnico" ? "/painel-tecnico" : nivel === "admin" ? "/dashboard" : "/chamados"}>
              <div className="flex items-center gap-2 select-none">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                  <span className="text-white font-black text-sm tracking-tighter">T</span>
                </div>
                <span className="font-bold text-slate-900 text-lg tracking-tight">tech<span className="text-slate-400 font-light">Rent</span></span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {links.map((link) => {
                const IconComp = Icons[link.icon];
                const active = pathname === link.href || pathname?.startsWith(link.href + "/");
                return (
                  <Link key={link.href} href={link.href}>
                    <span className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}>
                      {IconComp && <IconComp />}
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Right: User + Mobile Menu */}
            <div className="flex items-center gap-2">
              {/* User Dropdown Desktop */}
              {usuario && (
                <div className="relative hidden md:block">
                  <button
                    onClick={() => setUserDropdown(!userDropdown)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
                      <span className="text-slate-700 font-semibold text-xs uppercase">
                        {usuario.nome?.[0] || "U"}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-800 leading-none">{usuario.nome?.split(" ")[0]}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[nivel]}`}>
                      {ROLE_LABELS[nivel]}
                    </span>
                    <Icons.ChevronDown />
                  </button>

                  {userDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserDropdown(false)} />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20">
                        <div className="px-4 py-2 border-b border-slate-100">
                          <p className="text-xs text-slate-500">{usuario.email}</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Icons.LogOut />
                          Sair da conta
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
              >
                {menuOpen ? <Icons.X /> : <Icons.Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-1">
            {links.map((link) => {
              const IconComp = Icons[link.icon];
              const active = pathname === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <span className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                  }`}>
                    {IconComp && <IconComp />}
                    {link.label}
                  </span>
                </Link>
              );
            })}
            <div className="mt-2 pt-2 border-t border-slate-200">
              {usuario && (
                <div className="flex items-center gap-3 px-3 py-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                    <span className="text-slate-700 font-semibold text-xs uppercase">{usuario.nome?.[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{usuario.nome}</p>
                    <p className="text-xs text-slate-500">{ROLE_LABELS[nivel]}</p>
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <Icons.LogOut />
                Sair da conta
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}