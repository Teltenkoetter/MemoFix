# MemoFix – KI-Briefing für neue Kartensets

**Für dich:** Diese Datei ist ein fertiger Prompt für den Start eines neuen Chats mit **jeder KI** (ChatGPT, Gemini, Claude, …) — bevor du dein eigentliches Thema nennst. Er gibt der KI das komplette MemoFix-Datenmodell und die wichtigsten Baukonventionen mit, damit du das nicht jedes Mal neu erklären musst.

**So geht's:**
1. Neuen Chat öffnen
2. Alles ab „PROMPT START" unten kopieren und einfügen
3. Ganz am Ende dein Thema ergänzen (z. B. „Ich möchte ein Set zu Vogelarten bauen, ca. 40 Karten, Quelle: eigene Fotos + Wikipedia")
4. Die KI sollte jetzt gezielt nachfragen statt zu raten

---

## PROMPT START — ab hier kopieren

Du hilfst mir, Lernkarten für die App **MemoFix** zu erstellen (aktives Wiederholen, spaced-repetition-ähnlich). Der Import läuft über eine JSON-Datei im **Schema Version 2**. Halte dich strikt an folgende Struktur und Regeln.

### Datenmodell (3 Ebenen)

Sammlung → Gruppe → Karte (Feld `studenten`)

```json
{
  "version": 2,
  "exportiert": "<ISO-Zeitstempel>",
  "sammlungen": [
    { "id": "<sammlung-id>", "name": "<Anzeigename>", "erstellt": "<ISO-Zeitstempel>" }
  ],
  "gruppen": [
    { "id": "<gruppe-id>", "sammlungId": "<sammlung-id>", "name": "<Anzeigename>", "erstellt": "<ISO-Zeitstempel>" }
  ],
  "studenten": [
    {
      "id": "<karten-id>",
      "gruppeId": "<gruppe-id>",
      "modus": "text",
      "name": "<= vorderseite>",
      "vorderseite": "<Text auf der Vorderseite, Markdown-fett mit ** möglich>",
      "notiz": "<Erklärung/Kontext, erscheint sichtbar neben der Vorderseite>",
      "merke": "<optional: Kernaussage in 1–2 Sätzen, erscheint als farbiger Kasten unter der Notiz>",
      "links": ["<https://... optional, wenige, nur stabile Quellen>"],
      "videoId": null,
      "videoTitel": null,
      "foto": null,
      "erstellt": "<ISO-Zeitstempel>"
    }
  ]
}
```

### Nicht verhandelbare Regeln

1. **Sortierung läuft über die ID, nicht über `name` oder `vorderseite`.** Ohne manuelle Reihenfolge zeigt MemoFix Sammlungen, Gruppen und Karten alphabetisch nach ID an (die Datenbank liefert sie in dieser Schlüsselreihenfolge — die Reihenfolge im JSON-Array spielt dafür keine Rolle). Jede Gruppen- und Karten-ID braucht deshalb eine zweistellige, führende Null (01, 02 … 10) — sonst sortiert „10" zwischen „1" und „2". Nur wenn der Nutzer in der App selbst per Pfeil umsortiert, gilt seine manuelle Reihenfolge.
2. **ID-Schema vor dem ersten Import festlegen — danach nie mehr ändern.** Eine spätere ID-Änderung matcht nicht mehr mit bereits importierten Karten und erzeugt Dubletten. Empfohlenes Muster: `<Präfix>-<Thema>-<NN>-<Kürzel>` für Gruppen, `<Gruppen-ID>-<NN>` für Karten (die zweistellige Nummer bestimmt zugleich die Anzeigereihenfolge, siehe Regel 1).
3. **`modus: "text"` als Standard.** Zeigt `vorderseite` garantiert als Text an. `"foto"` nur wählen, wenn die Karte bewusst über ein Bild erkannt/abgefragt werden soll — das Bild wird dann manuell in der App nachgetragen, `foto` bleibt beim Import `null`.
4. **Addon-Importe** (Ergänzung einer bestehenden Sammlung): Immer alle drei Top-Level-Arrays befüllt lassen, auch wenn nur Karten hinzukommen. MemoFix matcht Sammlungen/Gruppen über die ID — bestehende IDs werden nicht dupliziert, neue Karten hängen sich einfach an.
5. **`vorderseite`-Formatierung:** Eine einzelne Zeile wird als Fließtext angezeigt. Mehrere Zeilen (`\n`) werden automatisch als Aufzählungsliste (Bullet-Points) dargestellt — das bei der Formulierung bewusst einplanen. Mit `**Text**` als eigene Zeile lässt sich eine fett hervorgehobene Zwischenüberschrift innerhalb der Liste erzeugen.
6. **`merke` (optional):** Eigenes Feld für die Kernaussage der Karte (1–2 Sätze, fett per `**…**` möglich). Es erscheint als farbig hinterlegter Kasten unter der Notiz; der Titel „Merke:" wird von der App ergänzt und gehört nicht in den Text. Für neue Sets `merke` statt `> **Merke:** …` in der Notiz verwenden.
7. **`notiz`-Formatierung:** Einfaches Markdown wird dargestellt: `**fett**`, Leerzeile (`\n\n`) = neuer Absatz, einfacher Zeilenumbruch bleibt erhalten, Zeilen mit `- ` werden zu einer Aufzählung, ein Absatz mit `> ` wird als farbiger Kasten hervorgehoben (für die Kernaussage besser das Feld `merke` nutzen). Bei reinen Abfrage-/Vokabelkarten: `notiz` leer lassen, da sie sichtbar neben der Vorderseite steht und die Antwort vorwegnehmen würde.
8. **Quellen/Links:** Nur stabile, dauerhafte Quellen verlinken (offizielle Seiten, Institutionsdatenbanken, etablierte Fachpresse). Keinen Link erzwingen, wenn nichts Verlässliches auffindbar ist — lieber weglassen als ein wackliger oder toter Link. Ein Link pro Karte reicht in der Regel.
9. **Dateibenennung:** `<Thema>_<Jahr>_<Nummer>.json`, z. B. `Vogelarten_2026_01.json`.

### Bilder: vorn oder hinten

- **`modus: "foto"`** = Bild vorn, Begriff beim Aufdecken. Nur verwenden, wenn das Erkennen des Bildes die Lernaufgabe ist.
- **`modus: "text"` mit `fotos`** = Begriff vorn, beim Aufdecken `vorderseite`, Notiz und Bilder. **Verwenden, wenn das Bild die Antwort verrät** (z. B. ein Befehl, ein Material, ein Fachbegriff mit Abbildung).
- `merke` nur schreiben, wenn es einen Inhalt gibt (kein leeres `""`). An die `notiz` keinen Zusatz wie „ · <Name>" anhängen.

### Zweisprachige Karten (optional, Deutsch/Englisch)

Alle Felder sind **optional und additiv** — Dateien ohne sie bleiben gültig. Der Sprachschalter der App (DE/EN) steuert damit auch den Karteninhalt:

```json
"sammlungen": [{ "id": "…", "name": "Grundwissen", "name_en": "Basics", "zweisprachig_inhalt": false }],
"gruppen":    [{ "id": "…", "sammlungId": "…", "name": "Licht", "name_en": "Light" }],
"studenten":  [{ "id": "…", "gruppeId": "…", "modus": "text",
                 "name": "Lumen", "name_en": "Lumen",
                 "vorderseite": "Lumen", "vorderseite_en": "Lumen (luminous flux)",
                 "notiz": "…", "notiz_en": "…",
                 "merke": "…", "merke_en": "…" }]
```

- **Anzeige:** Bei Englisch zeigt die App die `*_en`-Felder. Fehlt ein englisches Feld, erscheint der deutsche Text mit kleinem „DE"-Label — so bleiben unübersetzte Karten sichtbar. Kein Zwang, dass jede Karte Englisch hat.
- **`name_en`** hat bei Textkarten dieselbe Funktion wie `vorderseite_en` (der Begriff); bei Fotokarten ist es der englische Begriff.
- **`zweisprachig_inhalt: true`** (an der Sammlung) bedeutet: Der Inhalt ist bereits zweisprachig (z. B. Rhino Commands mit `**DE:**` und `**EN:**` in der Notiz). Der Sprachschalter ändert dann **nichts** am Karteninhalt, es erscheint kein „DE"-Label. Nur Sammlungs- und Gruppennamen dürfen über `name_en` wechseln. Diese Notizen nicht in `*_en` überführen.
- **Import:** Fehlen `*_en` oder `zweisprachig_inhalt` in einer Datei, werden vorhandene Werte auf dem Gerät **nicht gelöscht** und nicht überschrieben; fehlende Werte werden ergänzt.
- **Callout:** Ein Absatz in `notiz`/`notiz_en`, der mit `> ` beginnt, wird als farbiger Kasten dargestellt. Das Label ist frei wählbar, z. B. `> **Merke:** …` oder `> **Key point:** …`. Für die Kernaussage besser das Feld `merke` / `merke_en` nutzen.
- `links` sind sprachunabhängig und gelten für beide Sprachen.

### Kurssets & Updates (nur zur Information)

Fertige Sets können über die App-Domain verteilt werden (Ordner `kurssets/` mit `manifest.json`, erzeugt durch das Werkzeug `index-erzeugen`). Die App zeigt je Set einen Status: ● rot = noch nicht geladen, ✓ grün = aktuell, ↻ orange = Update verfügbar. Beim Update gleicht die App Karten über die **ID** ab: neue Karten werden ergänzt, geänderte überschrieben, Lernstand und Favoriten bleiben. Daraus folgt:

- **IDs nach der Verteilung nie ändern** — sonst gelten Karten als „neu" und die alten als „entfallen".
- **Eine Sammlungs-ID pro Set**, mit eigenem ID-Präfix. Ein großes Set darf auf mehrere Dateien mit derselben Sammlungs-ID verteilt sein.
- **Karten, die du entfernst**, werden bei den Teilnehmenden erst nach Rückfrage gelöscht; **Karten, die Teilnehmende selbst geändert haben**, werden nicht stillschweigend überschrieben.
- **Kartennamen möglichst stabil halten:** Die Lernstatistik hängt am Kartennamen, nicht an der ID.
- Das Set-Format selbst (siehe oben) bleibt unverändert.

### Arbeitsweise

- Frag mich **zuerst**: Thema, ungefähre Kartenzahl, gewünschte Gruppenstruktur, Quellenlage, Sprache(n) auf der Karte.
- Baue **1–2 Gruppen exemplarisch**, bevor du den Rest im Batch erstellst — so kann ich Format und Ton gegenlesen, bevor viel Arbeit investiert ist.
- Liefere am Ende **fertige, valide JSON-Dateien** zum Download, keine Teilausschnitte oder Beschreibungen von Karten.

---

**Mein Thema für dieses Set:** _[hier ergänzen]_

## PROMPT ENDE
