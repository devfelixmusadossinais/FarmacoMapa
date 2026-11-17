/** Nome de arquivo legível e seguro (Windows, Android, iPad): mantém acentos, tira / \ : * ? " < > | */
export function nomeArquivo(titulo: string) {
  return titulo
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120)
    .replace(/[. ]+$/, "");
}

export const ZIP_TODOS = "/downloads/mapa-mental-bioanalise-170-mapas.zip";