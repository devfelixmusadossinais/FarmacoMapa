"use client";

import { Suspense, useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh overflow-hidden lg:block">
        <Suspense fallback={<div className="h-full bg-pine" />}>
          <Sidebar />
        </Suspense>
      </aside>
      <div className="min-w-0">
        <Suspense fallback={<div className="h-16 border-b border-black/5 bg-paper" />}>
          <Topbar onMenu={() => setAberto(true)} />
        </Suspense>
        <main className="mx-auto w-full max-w-6xl px-4 pt-4 pb-16 lg:px-8 lg:pt-6">{children}</main>
      </div>

      <Sheet open={aberto} onOpenChange={setAberto}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[min(22rem,88vw)] gap-0 border-none bg-pine p-0 text-white sm:max-w-[22rem]"
        >
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Suspense fallback={null}>
            <Sidebar onFechar={() => setAberto(false)} />
          </Suspense>
        </SheetContent>
      </Sheet>
    </div>
  );
}
