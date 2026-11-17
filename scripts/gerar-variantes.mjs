/**
 * Gera as versões leves de cada mapa (rodar no PC depois de trocar/adicionar JPG):
 *   node scripts/gerar-variantes.mjs
 * - content/variantes/<arquivo>.thumb.webp  (640 px, para os cartões da lista)
 * - content/variantes/<arquivo>.md.webp     (largura original, WebP, para o visualizador)
 * - data/imagens.json: largura, altura, hash (versão do cache) e um blur minúsculo.
 * O JPG original continua sendo o "full" (zoom alto / tela cheia).
 */
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const raiz = process.cwd();
const origem = path.join(raiz, "content", "mapas");
const destino = path.join(raiz, "content", "variantes");
mkdirSync(destino, { recursive: true });

const indicePath = path.join(raiz, "data", "imagens.json");
const anterior = existsSync(indicePath) ? JSON.parse(readFileSync(indicePath, "utf8")) : {};
const indice = {};
const arquivos = readdirSync(origem).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();

for (const arquivo of arquivos) {
  const bytes = readFileSync(path.join(origem, arquivo));
  const hash = createHash("sha1").update(bytes).digest("hex").slice(0, 10);
  const thumb = path.join(destino, `${arquivo}.thumb.webp`);
  const md = path.join(destino, `${arquivo}.md.webp`);
  if (anterior[arquivo]?.hash === hash && existsSync(thumb) && existsSync(md)) {
    indice[arquivo] = anterior[arquivo];
    continue;
  }
  const meta = await sharp(bytes).metadata();
  await sharp(bytes).resize({ width: 640, withoutEnlargement: true }).webp({ quality: 70 }).toFile(thumb);
  await sharp(bytes).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toFile(md);
  const blur = await sharp(bytes).resize({ width: 16 }).webp({ quality: 30 }).toBuffer();
  indice[arquivo] = {
    w: meta.width,
    h: meta.height,
    hash,
    blur: `data:image/webp;base64,${blur.toString("base64")}`,
  };
  console.log("gerado", arquivo);
}

writeFileSync(indicePath, `${JSON.stringify(indice, null, 1)}\n`);
console.log(`${arquivos.length} mapas indexados em data/imagens.json`);