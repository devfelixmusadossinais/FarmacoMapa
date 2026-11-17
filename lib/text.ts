/** Comparação sem acento, para a busca `?q=`. */
export function fold(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function primeiroNome(nome: string) {
  const parte = nome.trim().split(/\s+/)[0];
  if (!parte) return "estudante";
  return parte.charAt(0).toUpperCase() + parte.slice(1);
}

export function hojeLocal() {
  const data = new Date();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

export function pluralMapas(quantidade: number) {
  return quantidade === 1 ? "1 mapa" : `${quantidade} mapas`;
}
