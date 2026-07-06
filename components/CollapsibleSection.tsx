"use client";

import { useState, type ReactNode } from "react";

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-between text-left"
        aria-expanded={open}
      >
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">{title}</h2>
        <span className="text-zinc-500">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="flex flex-col gap-4">{children}</div>}
    </section>
  );
}
