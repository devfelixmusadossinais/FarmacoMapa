/**
 * Copia a landing (os .html da raiz do repositório + css, img, js, assets)
 * para public/ antes do build. Assim a landing continua editável na raiz,
 * como antes, e o Next serve ela em / enquanto o app fica em /app.
 * public/ é gerada: não edite lá, edite os arquivos da raiz.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

const raiz = process.cwd();
const destino = path.join(raiz, "public");
rmSync(destino, { recursive: true, force: true });
mkdirSync(destino, { recursive: true });

const paginas = readdirSync(raiz).filter((f) => f.endsWith(".html"));
if (!paginas.includes("index.html")) {
  console.error("Landing sem index.html na raiz do repositório.");
  process.exit(1);
}
for (const f of paginas) cpSync(path.join(raiz, f), path.join(destino, f));
for (const pasta of ["css", "img", "js", "assets"]) {
  const origem = path.join(raiz, pasta);
  if (existsSync(origem)) cpSync(origem, path.join(destino, pasta), { recursive: true });
}
console.log(`Landing copiada para public/: ${paginas.join(", ")}`);