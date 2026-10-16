# MemoFix – KI-Briefing für Rate-Fragen (🎯 Raten-Modus in MemoDive)

**Für dich:** Diese Datei ist ein fertiger Prompt, mit dem eine **KI** (ChatGPT, Gemini, Claude, …) zu deinen eigenen Karten Multiple-Choice-Fragen für den Raten-Modus erzeugt. Die Fragen werden in deinen Karten gespeichert und bleiben auf deinem Gerät. Du musst nichts hochladen.

**So geht's:**
1. In MemoFix: **Sicherung → Exportieren**, Karten oder Gruppen wählen, **„Ohne Bilder"** anhaken (die Fragen brauchen keine Bilder, die Datei bleibt klein). Du erhältst eine JSON-Datei.
2. Neuen KI-Chat öffnen, alles ab „PROMPT START" unten kopieren und einfügen, die JSON-Datei anhängen oder einfügen.
3. Die KI liefert dieselbe Datei zurück, jede Karte um das Feld `raten` ergänzt. Als Datei speichern.
4. In MemoFix: **Sicherung → Importieren → „Hinzufügen"**. Deine Karten bleiben unverändert (auch Bilder und Lernstand), nur das Feld `raten` wird ergänzt.
5. Im Spiel: **🤿 MemoDive** starten, in der oberen Leiste das **🎯** antippen (aus → 1 = nur diese Karte → ∞ = immer).

---

## PROMPT START — ab hier kopieren

Du hilfst mir, zu Lernkarten der App **MemoFix** Multiple-Choice-Fragen für den **Raten-Modus** zu erstellen. In diesem Modus sieht eine Gruppe pro Karte eine Frage mit vier Antworten, stimmt per Handzeichen ab und die Lehrperson tippt die Mehrheits-Antwort an.

Ich gebe dir eine MemoFix-Exportdatei (JSON, Schema Version 2). Gib dieselbe Datei **vollständig und unverändert** zurück, nur mit einem zusätzlichen Feld `raten` an jeder Karte (Eintrag im Array `studenten`). Ändere keine IDs, Namen, Texte oder andere Felder.

### Format des Feldes `raten`

```json
"raten": {
  "f": "Frage auf Deutsch?",
  "o": ["richtige Antwort", "falsche Antwort 1", "falsche Antwort 2", "falsche Antwort 3"],
  "fe": "Question in English?",
  "oe": ["correct answer", "wrong answer 1", "wrong answer 2", "wrong answer 3"]
}
```

- **`o[0]` ist immer die richtige Antwort.** Die App mischt die Reihenfolge selbst.
- `fe` und `oe` (Englisch) sind optional. Erstelle sie nur, wenn ich es verlange; dann in gleicher Reihenfolge wie `o`.
- Genau vier Antworten, alle verschieden.
- Karten, zu denen sich keine gute Frage stellen lässt, bekommen **kein** `raten`. Nenne sie mir am Ende kurz mit Grund.

### Regeln für gute Fragen

1. **Verstehen und Erkennen statt Zahlenwissen.** Keine Rechenaufgaben, keine auswendig gelernten Einzelwerte. Zahlen nur, wenn man sie einschätzen kann (z. B. warm oder kalt, Weitwinkel oder Tele).
2. **Drei plausible Missverständnisse als falsche Antworten**: typische Verwechslungen, Nachbarbegriffe, häufige Fehlvorstellungen. Keine albernen Antworten, kein „alle/keine der genannten", kein „sowohl … als auch".
3. **Gleiche Form der Antworten.** Ähnliche Länge, gleicher Satzbau. Die richtige Antwort ist nicht die längste, genaueste oder auffälligste.
4. **Eindeutig.** Es darf genau eine Antwort richtig sein, auch wenn man den Begriff in der Praxis anders nutzt. Prüfe jede Frage mit der Gegenfrage: „Könnte jemand mit gutem Grund eine falsche Antwort wählen und recht haben?" Dann umformulieren oder die Karte weglassen.
5. **Ohne die Karte verständlich.** Die Frage nennt, worum es geht, ohne die Antwort zu verraten.
6. **Nur Inhalt der Karte.** Erfinde keine Fakten, die nicht auf der Karte stehen oder sicheres Fachwissen zum Thema sind.
7. **Kurz und klar.** Die Frage hat höchstens zwei Sätze, jede Antwort höchstens eine Zeile. Sie wird auf einem Beamer oder Handy-Bildschirm gelesen.
8. **Typische Fragearten:**
   - Begriff oder Befehl: „Was macht/bedeutet X?" mit ähnlichen Begriffen als falsche Antworten.
   - Prinzip: „Warum …?" oder „Was passiert, wenn …?"
   - Bildkarten: „Welches Prinzip steckt hinter diesem Bild?"
   - Abgrenzung: „Was unterscheidet X von Y?"

### Arbeitsweise

- Frag mich **zuerst**, falls etwas unklar ist: Zielgruppe und Niveau, ob Englisch gewünscht ist, ob Karten mit Bildern (`modus: "foto"`) eine Frage zum Bild bekommen sollen.
- Erstelle **zuerst 3 Beispielfragen** und zeige sie mir. Erst nach meiner Freigabe machst du den Rest.
- Prüfe am Ende **jede Frage selbst** (Regel 4) und nenne mir Fragen, bei denen du unsicher bist.
- Liefere die **vollständige, gültige JSON-Datei** zum Download, keine Ausschnitte.

---

**Meine Datei und mein Thema:** _[Datei anhängen und hier ergänzen]_

## PROMPT ENDE
