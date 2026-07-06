import { LogoutButton } from "@/components/LogoutButton";
import { LyricsGenerator } from "@/components/LyricsGenerator";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 dark:bg-black">
      <header className="flex w-full max-w-3xl items-center justify-between px-6 pt-6">
        <h1 className="text-xl font-semibold tracking-tight text-black dark:text-zinc-50">
          SGM Music Lab
        </h1>
        <LogoutButton />
      </header>
      <LyricsGenerator />
    </div>
  );
}
