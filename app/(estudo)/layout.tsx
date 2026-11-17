import { StudyFrame } from "@/components/estudo/study-frame";
import { StudyProvider } from "@/lib/study-store";

export default function LayoutEstudo({ children }: { children: React.ReactNode }) {
  return (
    <StudyProvider>
      <StudyFrame>{children}</StudyFrame>
    </StudyProvider>
  );
}
