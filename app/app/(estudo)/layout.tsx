import { StudyFrame } from "@/components/estudo/study-frame";
import { catalogoDoAluno } from "@/lib/catalogo-aluno";
import { CatalogoProvider } from "@/lib/catalogo-cliente";
import { StudyProvider } from "@/lib/study-store";

export default async function LayoutEstudo({ children }: { children: React.ReactNode }) {
  const dados = await catalogoDoAluno();
  return (
    <CatalogoProvider value={{ areas: dados.areas, itens: dados.publicos }}>
    <StudyProvider planoInicial={dados.plano} slugsLiberados={dados.slugsLiberados}>
      <StudyFrame>{children}</StudyFrame>
    </StudyProvider>
    </CatalogoProvider>
  );
}
