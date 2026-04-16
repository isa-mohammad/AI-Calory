"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { LayoutDashboard, Camera, Calendar, LineChart, User as UserIcon, LogOut, Menu, X, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const supabase = createClient();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/");
      } else {
        setUser(user);
      }
    });
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const navItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: "Overview", href: "/dashboard" },
    { icon: <Camera className="w-5 h-5" />, label: "Log Meal", href: "/log-meal" },
    { icon: <Calendar className="w-5 h-5" />, label: "Meal Plan", href: "/meal-plan" },
    { icon: <LineChart className="w-5 h-5" />, label: "Progress", href: "/progress" },
    { icon: <UserIcon className="w-5 h-5" />, label: "Profile", href: "/profile" },
  ];

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden font-inter">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 w-72 bg-black/20 backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 rounded-none
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white font-black italic">AC</div>
            <div className="text-2xl font-black italic tracking-tight text-white">AI <span className="text-accent">Cal</span></div>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium
                    ${isActive
                      ? "bg-white text-green-800 shadow-lg font-bold"
                      : "text-white/70 hover:bg-white/10 hover:text-white"}
                  `}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/10">
            <div className="flex items-center gap-3 px-2 mb-6">
              <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center text-sm font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-white">{user.email?.split("@")[0]}</p>
                <p className="text-xs text-white/50 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-500/20 transition-all font-medium"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 border-b border-white/10 bg-black/10 backdrop-blur-2xl z-30">
          <button
            className="p-2 lg:hidden text-white/70"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-xs text-white/50 font-bold uppercase tracking-widest">Daily Target</span>
              <span className="text-sm font-black text-white">2,400 kcal</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-accent" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <section className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </section>
      </main>
    </div>
  );
}
