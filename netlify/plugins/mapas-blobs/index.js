/**
 * Plugin local: depois do build, copia os 170 JPGs de content/mapas para o
 * upload de blobs do deploy, com a chave "mapas/<arquivo>.jpg" (loja do deploy,
 * sem nome). A rota /api/mapas/[slug]/imagem lê essa chave só depois do cookie.
 *
 * Roda em onPostBuild, depois do @netlify/plugin-nextjs, e grava na mesma pasta
 * que ele usou (.netlify/deploy/v1/blobs/deploy nas versões novas do build,
 * .netlify/blobs/deploy nas antigas). Se não achar nenhuma, grava nas duas.
 */
const { cpSync, existsSync, mkdirSync, readdirSync } = require("node:fs");
const path = require("node:path");

module.exports = {
  onPostBuild({ utils, packagePath }) {
    const base = path.resolve(process.cwd(), packagePath || "");
    const origem = path.join(base, "content", "mapas");
    const candidatas = [
      path.join(base, ".netlify", "deploy", "v1", "blobs", "deploy"),
      path.join(base, ".netlify", "blobs", "deploy"),
    ];
    const existentes = candidatas.filter((d) => existsSync(d));
    const destinos = existentes.length ? [existentes[0]] : candidatas;

    const arquivos = readdirSync(origem).filter((f) => f.toLowerCase().endsWith(".jpg"));
    if (arquivos.length !== 170) {
      utils.build.failBuild(`Esperava 170 JPGs em content/mapas e achei ${arquivos.length}.`);
      return;
    }
    for (const destinoBase of destinos) {
      const destino = path.join(destinoBase, "mapas");
      mkdirSync(destino, { recursive: true });
      for (const f of arquivos) cpSync(path.join(origem, f), path.join(destino, f));
      console.log(`[mapas-blobs] ${arquivos.length} mapas em ${path.relative(base, destino)}`);
    }
  },
};