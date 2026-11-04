# Straumur – myndbandasafn fyrir rafmagnsnema

Kyrrstæð vefsíða (HTML/CSS/JS, ekkert byggingarskref) sem birtir kennslumyndbönd frá
mörgum kennurum. Nemendur velja kennara („möppu“), sía eftir efnisflokki og lengd,
leita (leitin hunsar kommur og broddstafi: `thettir` finnur „Þéttir“) og spila myndbönd
í spilara með spilunarlistanum til hliðar. Hvað nemandi hefur skoðað er geymt í vafranum hans.

## Skrár
- `index.html`, `style.css`, `app.js` – síðan sjálf
- `data/kennarar.js` – öll gögn: kennarar → spilunarlistar → myndbönd
- `myndbond/` – myndbönd sem eru ekki á YouTube (t.d. frá Orra)

## Prófa á eigin vél
```sh
cd straumur
python3 -m http.server 8000
# opna http://localhost:8000
```

## Bæta við kennara
Bættu nýjum hlut aftast í `kennarar` í `data/kennarar.js`:
```js
{ "id": "jona", "nafn": "Jóna Jónsdóttir", "lysing": "Kennari í …",
  "listar": [
    { "id": "PL…", "titill": "Heiti lista", "lysing": "", "flokkur": "grunnur",
      "myndbond": [ { "id": "YouTube-auðkenni", "title": "Heiti", "sek": 312 } ] } ] }
```
`flokkur` er einn af lyklunum í `flokkar` efst í skránni. Ný flokka má bæta við þar.
Myndband sem skrá: `{ "skra": "myndbond/jona/x.mp4", "mynd": "myndbond/jona/x.jpg", "title": "…", "sek": 490 }`.
YouTube-myndbönd sem eru „Unlisted“ virka líka – þau þarf bara auðkennið úr slóðinni.

## Sjálfvirk uppfærsla af YouTube
GitHub Action (`.github/workflows/uppfaera-myndbond.yml`) keyrir `skriftur/uppfaera_youtube.py`
á hverri nóttu. Skriftan sækir alla spilunarlista og myndbönd af rás hvers kennara sem hefur
`"youtube"` í `data/kennarar.js` og vistar breytingar ef einhverjar eru.

- Nýtt myndband í **núverandi** spilunarlista birtist sjálfkrafa í réttum flokki.
- **Nýr** spilunarlisti lendir í flokknum „Annað“. Breyttu `"flokkur"` hans í `data/kennarar.js`;
  skriftan heldur þeirri breytingu.
- Myndbönd utan spilunarlista fara í „Önnur myndbönd“.
- Ef YouTube skilar villu eða grunsamlega fáum myndböndum er engu breytt og keyrslan merkt sem misheppnuð.

Keyra handvirkt: á GitHub undir *Actions → Uppfæra myndbönd → Run workflow*, eða á eigin vél:
```sh
pip install --upgrade yt-dlp
python3 skriftur/uppfaera_youtube.py
```
