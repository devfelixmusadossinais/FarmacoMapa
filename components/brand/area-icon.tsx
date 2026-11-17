import {
  Activity,
  Beaker,
  Bug,
  ClipboardCheck,
  Droplet,
  Droplets,
  FlaskConical,
  Gauge,
  HeartPulse,
  Microscope,
  Shield,
  ShieldAlert,
  Syringe,
  TestTube,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";

const icones: Record<string, LucideIcon> = {
  syringe: Syringe,
  "test-tube": TestTube,
  droplet: Droplet,
  activity: Activity,
  "flask-conical": FlaskConical,
  beaker: Beaker,
  microscope: Microscope,
  bug: Bug,
  shield: Shield,
  "shield-alert": ShieldAlert,
  droplets: Droplets,
  "heart-pulse": HeartPulse,
  gauge: Gauge,
  "clipboard-check": ClipboardCheck,
};

export function AreaIcon({
  nome,
  className,
  iconeClassName,
}: {
  nome?: string;
  className?: string;
  iconeClassName?: string;
}) {
  const Icone = (nome && icones[nome]) || Beaker;
  return (
    <span className={cn("inline-flex size-10 items-center justify-center rounded-2xl bg-white/10 text-teal-bright", className)}>
      <Icone className={cn("size-[18px]", iconeClassName)} />
    </span>
  );
}
