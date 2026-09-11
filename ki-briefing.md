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

1. **Sortierung läuft über die Reihenfolge im JSON-Array, nicht über die ID.** MemoFix sortiert Sammlungen, Gruppen und Karten standardmäßig weder alphabetisch noch nach ID — es gilt die Reihenfolge, in der sie im jeweiligen Array stehen (bzw. später eine manuelle Reihenfolge, die der Nutzer per Drag in der App setzt). Ordne die Arrays `gruppen` und `studenten` deshalb bereits in der gewünschten Anzeigereihenfolge an. IDs müssen nur eindeutig und stabil sein — keine Nummerierung für Sortierzwecke nötig.
2. **ID-Schema vor dem ersten Import festlegen — danach nie mehr ändern.** Eine spätere ID-Änderung matcht nicht mehr mit bereits importierten Karten und erzeugt Dubletten. Empfohlenes Muster: `<Präfix>-<Thema>-<NN>-<Kürzel>` für Gruppen, `<Gruppen-ID>-<NN>` für Karten (die Nummer dient hier nur der eindeutigen, lesbaren Benennung, nicht der Sortierung).
3. **`modus: "text"` als Standard.** Zeigt `vorderseite` garantiert als Text an. `"foto"` nur wählen, wenn die Karte bewusst über ein Bild erkannt/abgefragt werden soll — das Bild wird dann manuell in der App nachgetragen, `foto` bleibt beim Import `null`.
4. **Addon-Importe** (Ergänzung einer bestehenden Sammlung): Immer alle drei Top-Level-Arrays befüllt lassen, auch wenn nur Karten hinzukommen. MemoFix matcht Sammlungen/Gruppen über die ID — bestehende IDs werden nicht dupliziert, neue Karten hängen sich einfach an.
5. **`vorderseite`-Formatierung:** Eine einzelne Zeile wird als Fließtext angezeigt. Mehrere Zeilen (`\n`) werden automatisch als Aufzählungsliste (Bullet-Points) dargestellt — das bei der Formulierung bewusst einplanen. Mit `**Text**` als eigene Zeile lässt sich eine fett hervorgehobene Zwischenüberschrift innerhalb der Liste erzeugen.
6. **`notiz`-Formatierung:** Reiner Text ohne Markdown-Rendering — `**fett**` würde als wörtliche Sternchen angezeigt, nicht als Fettschrift. Bei mehreren Themen/Absätzen `\n\n` als Trenner nutzen (Zeilenumbrüche bleiben sichtbar erhalten). Bei reinen Abfrage-/Vokabelkarten: `notiz` leer lassen, da sie sichtbar neben der Vorderseite steht und die Antwort vorwegnehmen würde.
7. **Quellen/Links:** Nur stabile, dauerhafte Quellen verlinken (offizielle Seiten, Institutionsdatenbanken, etablierte Fachpresse). Keinen Link erzwingen, wenn nichts Verlässliches auffindbar ist — lieber weglassen als ein wackliger oder toter Link. Ein Link pro Karte reicht in der Regel.
8. **Dateibenennung:** `<Thema>_<Jahr>_<Nummer>.json`, z. B. `Vogelarten_2026_01.json`.

### Arbeitsweise

- Frag mich **zuerst**: Thema, ungefähre Kartenzahl, gewünschte Gruppenstruktur, Quellenlage, Sprache(n) auf der Karte.
- Baue **1–2 Gruppen exemplarisch**, bevor du den Rest im Batch erstellst — so kann ich Format und Ton gegenlesen, bevor viel Arbeit investiert ist.
- Liefere am Ende **fertige, valide JSON-Dateien** zum Download, keine Teilausschnitte oder Beschreibungen von Karten.

---

**Mein Thema für dieses Set:** _[hier ergänzen]_

## PROMPT ENDE
