"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const Icons = {
  Menu: ({ fill = false }) => (
    <span className={`material-symbols-rounded text-[24px] transition-all ${fill ? "[font-variation-settings:'FILL'_1]" : ""}`}>
      menu
    </span>
  ),
  X: ({ fill = false }) => (
    <span className={`material-symbols-rounded text-[24px] transition-all ${fill ? "[font-variation-settings:'FILL'_1]" : ""}`}>
      close
    </span>
  ),
  Dashboard: ({ fill = false }) => (
    <span className={`material-symbols-rounded text-[20px] transition-all ${fill ? "[font-variation-settings:'FILL'_1]" : ""}`}>
      grid_view
    </span>
  ),
  Ticket: ({ fill = false }) => (
    <span className={`material-symbols-rounded text-[20px] transition-all ${fill ? "[font-variation-settings:'FILL'_1]" : ""}`}>
      confirmation_number
    </span>
  ),
  Box: ({ fill = false }) => (
    <span className={`material-symbols-rounded text-[20px] transition-all ${fill ? "[font-variation-settings:'FILL'_1]" : ""}`}>
      inventory_2
    </span>
  ),
  Wrench: ({ fill = false }) => (
    <span className={`material-symbols-rounded text-[20px] transition-all ${fill ? "[font-variation-settings:'FILL'_1]" : ""}`}>
      build
    </span>
  ),
  Panel: ({ fill = false }) => (
    <span className={`material-symbols-rounded text-[20px] transition-all ${fill ? "[font-variation-settings:'FILL'_1]" : ""}`}>
      admin_panel_settings
    </span>
  ),
  LogOut: ({ fill = false }) => (
    <span className={`material-symbols-rounded text-[20px] transition-all ${fill ? "[font-variation-settings:'FILL'_1]" : ""}`}>
      logout
    </span>
  ),
  ChevronDown: ({ fill = false }) => (
    <span className={`material-symbols-rounded text-[18px] transition-all ${fill ? "[font-variation-settings:'FILL'_1]" : ""}`}>
      expand_more
    </span>
  ),
};

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

const ROLE_COLORS = {
  admin: "bg-blue-600 text-white border-transparent",
  tecnico: "bg-slate-800 text-white border-transparent",
  cliente: "bg-white/50 text-slate-600 border-slate-200/50",
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
      try { setUsuario(JSON.parse(raw)); } catch { }
    }
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setUserDropdown(false);
  }, [pathname]);

  function handleLogout() {
    localStorage.clear();
    router.push("/login");
  }

  const nivel = usuario?.nivel_acesso || "cliente";
  const links = NAV_LINKS[nivel] || NAV_LINKS.cliente;

  return (
    <div className="min-h-screen flex flex-col selection:bg-blue-600 selection:text-white">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />

      {/* Header com Efeito Glassmorphism */}
      <header className="sticky top-0 z-50 w-full border-b border-white/30 bg-white/40 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            <div className="flex items-center gap-10">
              <Link href={nivel === "tecnico" ? "/painel-tecnico" : nivel === "admin" ? "/dashboard" : "/chamados"}>
                <div className="group flex items-center gap-2">
                  <div className="w-2.5 h-6 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.3)]" />
                  <span className="font-black text-slate-900 text-xl tracking-tighter">
                    Tech<span className="text-blue-600">Rent</span>
                  </span>
                </div>
              </Link>

              <nav className="hidden lg:flex items-center gap-1">
                {links.map((link) => {
                  const IconComp = Icons[link.icon];
                  const active = pathname === link.href || pathname?.startsWith(link.href + "/");

                  return (
                    <Link key={link.href} href={link.href}>
                      <span className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${active
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                          : "text-slate-600 hover:bg-white/50 hover:text-blue-600"
                        }`}>
                        {IconComp && <IconComp fill={active} />}
                        {link.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {usuario && (
                <div className="relative hidden md:block">
                  <button
                    onClick={() => setUserDropdown(!userDropdown)}
                    className={`flex items-center gap-3 pl-1.5 pr-3 py-1.5 rounded-2xl border transition-all duration-200 ${userDropdown ? "bg-white border-white shadow-md" : "border-transparent hover:bg-white/50"}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-[11px] shadow-inner">
                      {usuario.nome?.[0] || "U"}
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-[13px] font-black text-slate-900 leading-none">{usuario.nome?.split(" ")[0]}</p>
                      <span className={`text-[9px] font-black uppercase tracking-wider mt-1 px-1.5 py-0.5 rounded border inline-block ${ROLE_COLORS[nivel]}`}>
                        {nivel}
                      </span>
                    </div>
                    <Icons.ChevronDown />
                  </button>

                  {userDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserDropdown(false)} />
                      <div className="absolute right-0 mt-3 w-60 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white p-2 z-20 animate-in fade-in zoom-in duration-150">
                        <div className="px-3 py-3 border-b border-slate-100 mb-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Conta Conectada</p>
                          <p className="text-sm font-bold text-slate-700 truncate">{usuario.email}</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:text-white hover:bg-red-500 transition-all group"
                        >
                          <Icons.LogOut />
                          Sair do sistema
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-2.5 rounded-xl bg-white/50 text-slate-600 border border-white transition-colors"
              >
                {menuOpen ? <Icons.X /> : <Icons.Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {menuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white/90 backdrop-blur-2xl border-b border-white shadow-2xl overflow-hidden animate-in slide-in-from-top duration-200">
            <div className="px-4 py-6 space-y-2">
              {links.map((link) => {
                const IconComp = Icons[link.icon];
                const active = pathname === link.href;
                return (
                  <Link key={link.href} href={link.href}>
                    <span className={`flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-black transition-all ${active ? "bg-blue-600 text-white shadow-lg" : "text-slate-600 hover:bg-white"}`}>
                      {IconComp && <IconComp fill={active} />}
                      {link.label}
                    </span>
                  </Link>
                );
              })}
              <div className="mt-4 pt-4 border-t border-slate-200/50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-black text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Icons.LogOut />
                  Encerrar Sessão
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content - Mantém o fundo dinâmico visível */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </div>
      </main>

      {/* Footer Minimalista */}
      <footer className="py-8 border-t border-white/20 bg-white/10 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
            TechRent Asset Intelligence • {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}