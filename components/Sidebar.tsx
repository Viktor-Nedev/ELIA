"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, PlusCircle, BarChart3, TargetIcon, Users, Award, 
  Settings, LogOut, Leaf, Menu, X 
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navItems = [
    { href: "/", icon: <Home size={20} />, label: "Dashboard" },
    { href: "/journal", icon: <PlusCircle size={20} />, label: "Daily Journal" },
    { href: "/analytics", icon: <BarChart3 size={20} />, label: "Analytics" },
    { href: "/challenges", icon: <TargetIcon size={20} />, label: "Challenges" },
    { href: "/community", icon: <Users size={20} />, label: "Community" },
    { href: "/achievements", icon: <Award size={20} />, label: "Achievements" },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full p-6">
      {/* Sidebar Logo */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Leaf size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase italic tracking-tight">
              ELIA<span className="text-emerald-500">.</span>
            </h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Sustainability</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
        {navItems.map((item) => (
          <NavItem 
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={pathname === item.href}
          />
        ))}
      </nav>

      {/* Bottom Actions - Sticky at bottom */}
      <div className="mt-auto pt-6 border-t border-zinc-800/50 space-y-2">
        <NavItem 
          href="/profile" 
          icon={<Settings size={20} />} 
          label="Settings" 
          active={pathname === "/settings"}
        />
        <button 
          onClick={signOut}
          className="w-full flex items-center gap-3 p-3 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300 group"
        >
          <div className="p-2 rounded-lg bg-zinc-800/50 group-hover:bg-red-500/20 transition-colors">
            <LogOut size={20} />
          </div>
          <span className="text-sm font-bold">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-6 left-6 z-[60] p-3 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl flex items-center justify-center text-white"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-72 flex-col bg-zinc-950 border-r border-zinc-900 z-50">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[50]"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-72 bg-zinc-950 border-r border-zinc-900 z-[55] shadow-2xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function NavItem({ href, icon, label, active }: { 
  href: string, 
  icon: React.ReactNode, 
  label: string, 
  active?: boolean 
}) {
  return (
    <Link href={href} className="block">
      <motion.div
        whileHover={{ scale: 1.02, x: 5 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group ${
          active 
            ? 'bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 text-white shadow-lg shadow-emerald-500/5' 
            : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
        }`}
      >
        <div className={`p-2 rounded-lg transition-all duration-300 ${
          active 
            ? 'bg-gradient-to-br from-emerald-500 to-blue-500 text-white shadow-lg shadow-emerald-500/20' 
            : 'bg-zinc-900 group-hover:bg-zinc-800 text-zinc-500 group-hover:text-emerald-400'
        }`}>
          {icon}
        </div>
        <span className={`text-sm font-bold tracking-tight ${active ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-200'}`}>
          {label}
        </span>
        {active && (
          <motion.div 
            layoutId="active-nav-glow"
            className="ml-auto w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"
          />
        )}
      </motion.div>
    </Link>
  );
}
