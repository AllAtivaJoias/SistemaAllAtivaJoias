import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAppSettings } from "@/lib/app-settings-query";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defesa em profundidade: além do middleware, garantimos a sessão aqui.
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const settings = await getAppSettings();

  return <AdminShell storeName={settings.storeName}>{children}</AdminShell>;
}
