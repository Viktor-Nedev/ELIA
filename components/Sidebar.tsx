"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, PlusCircle, BarChart3, TargetIcon, Users, Award, LogOut, Menu, X, Map,
  User,
  BookOpen,
  ChevronRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { sustainabilityService } from "@/lib/sustainability.service";

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
    if(user){
      getUserProfile();
    }
    
  }, [pathname, user]);

  const getUserProfile = async () => {
    if(user?.uid){
      const data = await sustainabilityService.getUserProfile(user.uid);
      setProfile(data);
    }
  }

  const navItems = [
    { href: "/", icon: <Home size={20} />, label: "Dashboard" },
    { href: "/journal", icon: <PlusCircle size={20} />, label: "Daily Journal" },
    { href: "/analytics", icon: <BarChart3 size={20} />, label: "Analytics" },
    { href: "/map", icon: <Map size={20} />, label: "Map" },
    { href: "/challenges", icon: <TargetIcon size={20} />, label: "Challenges" },
    { href: "/community", icon: <Users size={20} />, label: "Community" },
    { href: "/achievements", icon: <Award size={20} />, label: "Achievements" },
    { href: "/study", icon: <BookOpen size={20} />, label: "Study" },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full p-6">
      {/* Sidebar Logo */}
    <div className="mb-8">
  <div className="flex items-center gap-3">
    
     
      <img 
        src="/image.png" 
        alt="ELIA Logo" 
        className="w-full h-full object-contain rounded-lg"
        onError={(e) => {
          // Fallback if image doesn't exist
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = document.createElement('div');
          fallback.className = 'w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg';
          fallback.innerHTML = '<span class="text-white font-black text-sm">E</span>';
          target.parentNode?.appendChild(fallback);
        }}
      />
    </div>

</div>
      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto pr-2 sidebar-scroll">
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
          icon={profile?.photoURL ? <img src={profile.photoURL} alt="Profile" className="w-5 h-5 rounded-full object-cover" /> : <User size={20} />} 
          label="Profile" 
          active={pathname === "/profile"}
        />
        <button 
          onClick={signOut}
          className="w-full flex items-center gap-3 p-3 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300 group relative overflow-hidden"
        >
          <div className="p-2 rounded-lg bg-zinc-800/50 group-hover:bg-red-500/20 transition-colors z-10">
            <LogOut size={20} />
          </div>
          <span className="text-sm font-bold z-10">Logout</span>
          <ChevronRight className="ml-auto w-4 h-4 text-zinc-700 group-hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-6 left-6 z-[60] p-3 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform"
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
          <div className="ml-auto w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]" />
        )}
      </motion.div>
    </Link>
  );
}