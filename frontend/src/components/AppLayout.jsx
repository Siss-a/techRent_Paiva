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

const ROLE_LABELS = {
  admin: "Admin",
  tecnico: "Técnico",
  cliente: "Cliente",
};

const ROLE_COLORS = {
  admin: "bg-slate-900 text-white border-slate-900",
  tecnico: "bg-slate-100 text-slate-600 border-slate-200",
  cliente: "bg-white text-slate-400 border-slate-200",
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-slate-900 selection:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Importante: Adicione este link no seu layout.js principal ou aqui para carregar os ícones */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />

      {/* Header Minimalista */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Esquerda: Logo e Nav Desktop */}
            <div className="flex items-center gap-10">
              <Link href={nivel === "tecnico" ? "/painel-tecnico" : nivel === "admin" ? "/dashboard" : "/chamados"}>
                <div className="group flex items-center gap-1.5">
                  {/* Um pequeno detalhe geométrico em vez do quadrado sólido */}
                  <div className="w-2 h-5 bg-slate-900 rounded-full transition-all group-hover:h-6 group-hover:bg-slate-700" />

                  <span className="font-black text-slate-900 text-xl tracking-tighter">
                    tech<span className="text-slate-400 font-light">rent</span>
                  </span>
                </div>
              </Link>

              <nav className="hidden lg:flex items-center gap-1">
                {links.map((link) => {
                  const IconComp = Icons[link.icon];
                  const active = pathname === link.href || pathname?.startsWith(link.href + "/");

                  return (
                    <Link key={link.href} href={link.href}>
                      <span className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${active
                          ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        }`}>
                        {IconComp && <IconComp fill={active} />}
                        {link.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Direita: User Menu */}
            <div className="flex items-center gap-3">
              {usuario && (
                <div className="relative hidden md:block">
                  <button
                    onClick={() => setUserDropdown(!userDropdown)}
                    className={`flex items-center gap-3 pl-1.5 pr-3 py-1 rounded-2xl border transition-all duration-200 ${userDropdown ? "bg-white border-slate-300 shadow-sm" : "border-transparent hover:bg-slate-100"
                      }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shadow-inner text-slate-600 font-bold text-[11px]">
                      {usuario.nome?.[0] || "U"}
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-[13px] font-bold text-slate-900 leading-none">{usuario.nome?.split(" ")[0]}</p>
                      <span className={`text-[9px] font-bold uppercase tracking-wider mt-1 px-1.5 py-0.5 rounded border inline-block ${ROLE_COLORS[nivel]}`}>
                        {ROLE_LABELS[nivel]}
                      </span>
                    </div>
                    <Icons.ChevronDown />
                  </button>

                  {userDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserDropdown(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-20 animate-in fade-in zoom-in duration-150">
                        <div className="px-4 py-3 border-b border-slate-50 mb-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Conta Ativa</p>
                          <p className="text-sm font-medium text-slate-700 truncate">{usuario.email}</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50/50 transition-all group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-rose-100/50 flex items-center justify-center transition-colors">
                            <Icons.LogOut />
                          </div>
                          Sair do sistema
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Botão Mobile Toggle */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-2.5 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 transition-colors"
              >
                {menuOpen ? <Icons.X /> : <Icons.Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {menuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-xl overflow-hidden animate-in slide-in-from-top duration-200">
            <div className="px-4 py-4 space-y-1 bg-slate-50/50">
              {links.map((link) => {
                const IconComp = Icons[link.icon];
                const active = pathname === link.href;
                return (
                  <Link key={link.href} href={link.href}>
                    <span className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${active ? "bg-slate-900 text-white shadow-md shadow-slate-300" : "text-slate-600 hover:bg-white border border-transparent hover:border-slate-200"
                      }`}>
                      {IconComp && <IconComp fill={active} />}
                      {link.label}
                    </span>
                  </Link>
                );
              })}

              <div className="mt-4 pt-4 border-t border-slate-200/60 px-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-xl text-sm font-bold text-slate-500 hover:text-rose-600 transition-colors"
                >
                  <Icons.LogOut />
                  Encerrar Sessão
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-in fade-in duration-500">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            techRent Asset Intelligence • {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}