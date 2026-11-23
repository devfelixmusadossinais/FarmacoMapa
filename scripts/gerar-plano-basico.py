"""Distribui 80 mapas por maior resto, com desempate pela ordem das áreas."""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
TOTAL = 80


def main():
    catalogo = json.loads((RAIZ / "data/catalogo.json").read_text(encoding="utf-8"))
    areas = [area["id"] for area in catalogo["areas"]]
    mapas = catalogo["mapas"]
    tamanhos = {area: sum(m["area"] == area for m in mapas) for area in areas}
    assert all(tamanhos.values()) and len(areas) <= TOTAL <= len(mapas)
    cotas = {area: max(1, TOTAL * tamanhos[area] // len(mapas)) for area in areas}
    # Restos inteiros evitam diferenças de arredondamento entre plataformas.
    ordem = sorted(areas, key=lambda area: -(TOTAL * tamanhos[area] % len(mapas)))
    while sum(cotas.values()) < TOTAL:
        for area in ordem:
            if cotas[area] < tamanhos[area]:
                cotas[area] += 1
                if sum(cotas.values()) == TOTAL:
                    break
    assert sum(cotas.values()) == TOTAL
    assert all(1 <= cotas[area] <= tamanhos[area] for area in areas)
    slugs = [m["slug"] for area in areas
             for m in [m for m in mapas if m["area"] == area][:cotas[area]]]
    assert len(slugs) == len(set(slugs)) == TOTAL
    resultado = {"total": TOTAL, "cotas": cotas, "slugs": slugs}
    (RAIZ / "data/plano-basico.json").write_text(
        json.dumps(resultado, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for area in areas:
        print(f"{area}: {cotas[area]}/{tamanhos[area]}")
    print(f"Total: {sum(cotas.values())}; mínimo 1 e cotas <= tamanho: OK")


if __name__ == "__main__":
    main()
