import { LogoutButton } from "@/components/LogoutButton";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-4 px-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          SGM Music Lab
        </h1>
        <p className="max-w-md text-zinc-600 dark:text-zinc-400">
          Sesión iniciada. El flujo de generación de canciones se construye
          en los siguientes pasos.
        </p>
        <LogoutButton />
      </main>
    </div>
  );
}
