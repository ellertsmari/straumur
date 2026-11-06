# Straumur – kennslumyndbönd

Kyrrstæð vefsíða (HTML/CSS/JS, ekkert byggingarskref). Á forsíðunni er einn reitur (íkon)
fyrir hvert fag/kennara, t.d. „Rafmagn – Sigurður“ og „Rafmagn – Orri“. Reitur vísar beint
á spilunarlista kennarans á YouTube eða á myndbandsskrá. Fög sem eiga engin myndbönd ennþá
birtast sem gráir reitir merktir „Væntanlegt“.

## Skrár
- `index.html`, `style.css`, `app.js` – síðan sjálf
- `data/kennarar.js` – reitirnir
- `myndbond/` – myndbönd sem eru ekki á YouTube (t.d. frá Orra)

## Prófa á eigin vél
```sh
git clone https://github.com/ellertsmari/straumur.git
cd straumur
python3 -m http.server 8000
# opna http://localhost:8000
```

## Bæta við reit
Bættu nýjum hlut í `reitir` í `data/kennarar.js`:
```js
{ "fag": "Málmsuða", "nafn": "Jóna Jónsdóttir", "takn": "suda",
  "slod": "https://www.youtube.com/@rásin-hennar/playlists" }
```
- `fag` er stóra heitið á reitnum og `nafn` er kennarinn (má sleppa).
- `takn` er íkoninn: `rafmagn`, `suda`, `mur`, `kayak` eða `myndband`. Nýjum íkonum má bæta við í `TAKN` í `app.js`.
- `slod` er hvert reiturinn vísar: YouTube-rás, spilunarlisti eða skrá eins og `myndbond/jona/x.mp4`.
  Reitur án `slod` verður grár og merktur „Væntanlegt“. Þegar myndböndin koma þarf bara að bæta `slod` við.
