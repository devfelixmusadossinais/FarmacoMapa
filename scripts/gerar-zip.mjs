/**
 * Monta o ZIP com todos os mapas (prebuild): public/downloads/mapa-mental-bioanalise-170-mapas.zip
 * Pastas por área ("01 Coleta de amostras/Título do mapa.jpg"). Sem compressão (JPG já é
 * comprimido), datas fixas: o arquivo sai igual a cada build e a Netlify não sobe de novo.
 * Quem protege o download é a edge function netlify/edge-functions/downloads.ts (cookie).
 */
import { closeSync, mkdirSync, openSync, readFileSync, statSync, writeSync } from "node:fs";
import path from "node:path";

const raiz = process.cwd();
const catalogo = JSON.parse(readFileSync(path.join(raiz, "data", "catalogo.json"), "utf8"));
const destinoDir = path.join(raiz, "public", "downloads");
const destino = path.join(destinoDir, "mapa-mental-bioanalise-170-mapas.zip");
mkdirSync(destinoDir, { recursive: true });

const limpar = (t) =>
  t.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120).replace(/[. ]+$/, "");

const TABELA = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = TABELA[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// 2026-01-01 00:00 em formato DOS
const DOS_HORA = 0;
const DOS_DATA = ((2026 - 1980) << 9) | (1 << 5) | 1;

const entradas = [];
const usados = new Set();
catalogo.areas.forEach((area, i) => {
  const pasta = `${String(i + 1).padStart(2, "0")} ${limpar(area.nome)}`;
  for (const mapa of catalogo.mapas.filter((m) => m.area === area.id && m.image)) {
    let nome = `${pasta}/${limpar(mapa.titulo) || mapa.slug}.jpg`;
    for (let n = 2; usados.has(nome.toLowerCase()); n++) nome = `${pasta}/${limpar(mapa.titulo)} (${n}).jpg`;
    usados.add(nome.toLowerCase());
    entradas.push({ nome, arquivo: path.join(raiz, "content", "mapas", mapa.image) });
  }
});
const semArea = catalogo.mapas.filter((m) => m.image && !catalogo.areas.some((a) => a.id === m.area));
for (const mapa of semArea) entradas.push({ nome: `Outros/${limpar(mapa.titulo)}.jpg`, arquivo: path.join(raiz, "content", "mapas", mapa.image) });

const fd = openSync(destino, "w");
let offset = 0;
const central = [];
const escrever = (buf) => {
  writeSync(fd, buf);
  offset += buf.length;
};
for (const e of entradas) {
  const dados = readFileSync(e.arquivo);
  const nome = Buffer.from(e.nome, "utf8");
  const crc = crc32(dados);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x0800, 6); // nomes em UTF-8
  local.writeUInt16LE(0, 8); // store
  local.writeUInt16LE(DOS_HORA, 10);
  local.writeUInt16LE(DOS_DATA, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(dados.length, 18);
  local.writeUInt32LE(dados.length, 22);
  local.writeUInt16LE(nome.length, 26);
  local.writeUInt16LE(0, 28);
  const inicio = offset;
  escrever(local);
  escrever(nome);
  escrever(dados);
  const c = Buffer.alloc(46);
  c.writeUInt32LE(0x02014b50, 0);
  c.writeUInt16LE(20, 4);
  c.writeUInt16LE(20, 6);
  c.writeUInt16LE(0x0800, 8);
  c.writeUInt16LE(0, 10);
  c.writeUInt16LE(DOS_HORA, 12);
  c.writeUInt16LE(DOS_DATA, 14);
  c.writeUInt32LE(crc, 16);
  c.writeUInt32LE(dados.length, 20);
  c.writeUInt32LE(dados.length, 24);
  c.writeUInt16LE(nome.length, 28);
  c.writeUInt32LE(inicio, 42);
  central.push(Buffer.concat([c, nome]));
}
const inicioCentral = offset;
for (const c of central) escrever(c);
const fim = Buffer.alloc(22);
fim.writeUInt32LE(0x06054b50, 0);
fim.writeUInt16LE(entradas.length, 8);
fim.writeUInt16LE(entradas.length, 10);
fim.writeUInt32LE(offset - inicioCentral, 12);
fim.writeUInt32LE(inicioCentral, 16);
escrever(fim);
closeSync(fd);
console.log(`ZIP: ${entradas.length} mapas, ${(statSync(destino).size / 1e6).toFixed(1)} MB`);