/**
 * Na Netlify, copia os JPGs para o upload de blobs do deploy.
 * A função da rota de imagem não leva os 120 MB: o zip de uma Lambda
 * estoura o limite de 50 MB. O cookie continua obrigatório na rota.
 *
 * Fora da Netlify o script não faz nada. `next dev` e `next start`
 * leem content/mapas direto do disco.
 */
import { cpSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";

if (process.env.NETLIFY !== "true") {
  console.log("Fora da Netlify: as imagens ficam em content/mapas e a rota lê o disco.");
  process.exit(0);
}

const origem = path.join(process.cwd(), "content", "mapas");
const destino = path.join(process.cwd(), ".netlify", "blobs", "deploy", "mapas");
mkdirSync(destino, { recursive: true });

let total = 0;
for (const arquivo of readdirSync(origem)) {
  if (!arquivo.endsWith(".jpg")) continue;
  cpSync(path.join(origem, arquivo), path.join(destino, arquivo));
  total += 1;
}

if (total !== 170) {
  console.error(`Esperava 170 JPGs para o blob e copiei ${total}.`);
  process.exit(1);
}

console.log(`170 mapas copiados para .netlify/blobs/deploy/mapas (loja de deploy "mapas").`);
