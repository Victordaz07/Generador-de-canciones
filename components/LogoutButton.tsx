"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300"
    >
      Cerrar sesión
    </button>
  );
}
