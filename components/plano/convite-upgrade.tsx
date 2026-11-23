"use client";

import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { URL_UPGRADE } from "@/lib/plano-cliente";

export function BotaoUpgrade() {
  return <Button asChild className="mt-4 h-12 rounded-2xl"><a href={URL_UPGRADE} target="_blank" rel="noopener">Upgrade R$27</a></Button>;
}
export function ConviteUpgrade({ open, onOpenChange }: { open?: boolean; onOpenChange?: (open: boolean) => void }) {
  if (open !== undefined) return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Conteúdo fora do seu plano</DialogTitle><DialogDescription>Premium: 170 mapas + 5 bônus.</DialogDescription></DialogHeader><BotaoUpgrade /></DialogContent></Dialog>;
  return <section className="mt-5 rounded-[24px] bg-white p-5 ring-1 ring-black/5"><LockKeyhole className="size-5 text-teal" aria-label="Bloqueado" /><h2 className="mt-2 font-heading text-2xl text-ink">Conteúdo fora do seu plano</h2><p className="mt-2 text-sm text-ink/65">Premium: 170 mapas + 5 bônus.</p><BotaoUpgrade /></section>;
}
