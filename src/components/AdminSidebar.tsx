"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, User, LogOut, PlusCircle } from "lucide-react";
import { signOut } from "next-auth/react";
import { tabSessionKey } from "@/components/SessionLifecycle";

export default function AdminSidebar({ user }: { user: any }) {
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/transactions", label: "Transactions", icon: Receipt },
    { href: "/admin/transactions/new", label: "Create Link", icon: PlusCircle },
    { href: "/admin/profile", label: "Business Profile", icon: User },
  ];

  return (
    <div className="w-64 bg-white border-r h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-gray-800">UPI Pay Manager</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon size={20} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t">
        <div className="mb-4 px-4">
          <p className="text-sm font-medium text-gray-800">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
        <button
          onClick={() => {
            sessionStorage.removeItem(tabSessionKey);
            signOut({ callbackUrl: "/login" });
          }}
          className="flex w-full items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
