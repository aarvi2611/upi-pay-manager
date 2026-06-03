import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions).catch((error) => {
    console.error("Failed to read admin session", error);
    return null;
  });

  if (!session) {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar user={session.user} />
      <main className="flex-1 p-8 ml-64 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
