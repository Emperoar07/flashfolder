"use client";

import {
  FolderKanban,
  Link2,
  Settings,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "My files", icon: FolderKanban },
  { href: "/share/flash-demo-share", label: "Shared", icon: Link2 },
  { href: "/vault", label: "Vault", icon: Shield },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function WorkspaceNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${
              active
                ? "bg-[#c8392b] text-[#f0ede6]"
                : "bg-[rgba(255,255,255,0.03)] text-[rgba(240,237,230,0.55)] hover:bg-[rgba(255,255,255,0.06)]"
            }`}
            href={item.href}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
