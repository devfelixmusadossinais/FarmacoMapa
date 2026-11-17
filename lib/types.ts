export type Area = {
  id: string;
  slug: string;
  nome: string;
  icone: string;
  linha: string;
};

export type EntradaCatalogo = {
  id: string;
  slug: string;
  titulo: string;
  area: string | null;
  keywords: string[];
  image: string | null;
  resumo: string;
  pontosChave: string[];
};

export type ItemCatalogo = EntradaCatalogo & {
  tipo: "mapa" | "bonus";
};

export type MetaDiaria = 2 | 3 | 5;

export type Perfil = {
  nome: string;
  areaFoco: string;
  metaDiaria: MetaDiaria;
};

export type Progresso = {
  revisados: string[];
  dia: string;
  revisadosHoje: string[];
  ultimoSlug: string | null;
};

export type Sugestao = {
  id: string;
  nome: string;
  email: string;
  area: string;
  mensagem: string;
  criadaEm: string;
};
