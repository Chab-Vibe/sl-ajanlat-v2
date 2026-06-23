"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Plus,
  Package,
  Users,
  LogOut,
  Palette,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { UserProfile } from "@/types";

interface SidebarProps {
  user: UserProfile;
}

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Új ajánlat",
    href: "/quotes/new",
    icon: Plus,
  },
  {
    label: "Ajánlatok",
    href: "/quotes",
    icon: FileText,
  },
];

const adminItems = [
  {
    label: "Termékek",
    href: "/admin/products",
    icon: Package,
  },
  {
    label: "Szín-palettók",
    href: "/admin/palettes",
    icon: Palette,
  },
  {
    label: "Felhasználók",
    href: "/admin/users",
    icon: Users,
  },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
    toast.success("Kijelentkezve");
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 flex flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground font-bold text-sm shrink-0">
          SL
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">SL Lemezkereskedés</p>
          <p className="text-xs text-muted-foreground truncate">Ajánlatkezelő</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  pathname === item.href || (item.href !== "/dashboard" && item.href !== "/quotes/new" && pathname.startsWith(item.href))
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
                {(pathname === item.href || (item.href !== "/dashboard" && item.href !== "/quotes/new" && pathname.startsWith(item.href))) && (
                  <ChevronRight className="ml-auto h-3 w-3" />
                )}
              </Link>
            </li>
          ))}
        </ul>

        {user.role === "admin" && (
          <>
            <Separator className="my-4" />
            <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Admin
            </p>
            <ul className="space-y-0.5">
              {adminItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      pathname.startsWith(item.href)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                    {pathname.startsWith(item.href) && (
                      <ChevronRight className="ml-auto h-3 w-3" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      {/* User + Logout */}
      <div className="border-t p-3">
        <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
          <div className="w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Kijelentkezés
        </Button>
      </div>
    </aside>
  );
}
