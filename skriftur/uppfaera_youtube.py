#!/usr/bin/env python3
"""Uppfærir data/kennarar.js með nýjustu myndböndum af YouTube-rásum kennara.

- Aðeins kennarar sem hafa "youtube" (slóð á rás) eru uppfærðir; aðrir haldast óbreyttir.
- Hver spilunarlisti heldur þeim flokki sem hann hefur í kennarar.js. Nýir listar fá "annad"
  þar til einhver breytir flokknum í kennarar.js (sú breyting helst við næstu uppfærslu).
- Myndbönd sem eru ekki í neinum lista fara í „Önnur myndbönd“.
- Ef eitthvað bregst (net, YouTube, grunsamlega fá myndbönd) er skránni ekki breytt.

Keyrsla:  python3 skriftur/uppfaera_youtube.py      (þarf yt-dlp)
Keyrt sjálfvirkt á hverri nóttu: .github/workflows/uppfaera-myndbond.yml
"""
import json
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

SKRA = Path(__file__).resolve().parent.parent / "data" / "kennarar.js"
MERKI = "window.STRAUMUR = "
LAGMARKS_HLUTFALL = 0.8  # hætta við ef kennari missir meira en 20% myndbanda í einu


def yt(slod):
    r = subprocess.run(
        ["yt-dlp", "--flat-playlist", "-J", "--extractor-retries", "3", slod],
        capture_output=True, text=True, timeout=300)
    if r.returncode != 0:
        raise RuntimeError(f"yt-dlp mistókst fyrir {slod}:\n{r.stderr.strip()[-800:]}")
    return json.loads(r.stdout)


def hreinsa(texti):
    return " ".join((texti or "").split())


def myndband(e):
    return {"id": e["id"], "title": hreinsa(e["title"]), "sek": int(e["duration"])}


def saekja_kennara(k):
    ras = k["youtube"].rstrip("/").removesuffix("/playlists").removesuffix("/videos")
    gamlir_flokkar = {l["id"]: l.get("flokkur", "annad") for l in k["listar"]}

    yfirlit = yt(ras + "/playlists")
    audkenni = [e["id"] for e in yfirlit["entries"]]
    with ThreadPoolExecutor(6) as ex:
        gogn = list(ex.map(lambda i: yt(f"https://www.youtube.com/playlist?list={i}"), audkenni))
    oll = yt(ras + "/videos")["entries"]

    listar, i_lista = [], set()
    for d in gogn:
        # Myndbönd án lengdar eru einkamyndbönd eða eydd
        vids = [myndband(e) for e in d["entries"] if e.get("duration")]
        if not vids:
            continue
        i_lista.update(v["id"] for v in vids)
        listar.append({
            "id": d["id"],
            "titill": hreinsa(d["title"]).rstrip(".").strip(),
            "lysing": hreinsa(d.get("description")),
            "flokkur": gamlir_flokkar.get(d["id"], "annad"),
            "myndbond": vids,
        })
    utan = [myndband(e) for e in oll if e.get("duration") and e["id"] not in i_lista]
    if utan:
        listar.append({"id": "onnur", "titill": "Önnur myndbönd",
                       "lysing": "Myndbönd sem eru ekki í neinum spilunarlista.",
                       "flokkur": gamlir_flokkar.get("onnur", "annad"), "myndbond": utan})
    return listar


def main():
    texti = SKRA.read_text(encoding="utf-8")
    haus, _, json_hluti = texti.partition(MERKI)
    gogn = json.loads(json_hluti.strip().removesuffix(";"))

    for k in gogn["kennarar"]:
        if not k.get("youtube"):
            continue
        fyrir = sum(len(l["myndbond"]) for l in k["listar"])
        nyir = saekja_kennara(k)
        eftir = sum(len(l["myndbond"]) for l in nyir)
        if eftir < fyrir * LAGMARKS_HLUTFALL:
            sys.exit(f"Hætti við: {k['nafn']} fór úr {fyrir} í {eftir} myndbönd. Skránni ekki breytt.")
        nyir_listar = [l["titill"] for l in nyir if l["id"] not in {x["id"] for x in k["listar"]}]
        print(f"{k['nafn']}: {fyrir} → {eftir} myndbönd, {len(nyir)} listar")
        for t in nyir_listar:
            print(f"  Nýr listi (flokkur 'annad', breyttu í kennarar.js ef þarf): {t}")
        k["listar"] = nyir

    nytt = haus + MERKI + json.dumps(gogn, ensure_ascii=False, indent=1) + ";\n"
    if nytt == texti:
        print("Engar breytingar.")
    else:
        SKRA.write_text(nytt, encoding="utf-8")
        print(f"Uppfærði {SKRA.relative_to(SKRA.parent.parent)}")


if __name__ == "__main__":
    main()
