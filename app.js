/* MemoMe
   Keine Leistungs-App: sammeln statt fordern, zeigen was da war, nie was fehlt. */
'use strict';

// ── Grunddaten ─────────────────────────────────────────
// Gruppen liegen in S (selbst anlegbar, sortierbar). GRUPPEN ist daraus gebaut: id → Name, in der eingestellten Reihenfolge.
const START_GRUPPEN = [ { id: 'family', name: 'Family' }, { id: 'metime', name: 'Me-Time' }, { id: 'social', name: 'Social' } ];
let GRUPPEN = {};
function gruppenAktualisieren() {
  GRUPPEN = {}; for (const g of S.gruppen) GRUPPEN[g.id] = g.name;
}
const MODI = { akt: 'Aktivierung', reg: 'Regeneration', beides: 'aktiv für mich' };
// Rahmen des Tages: drei gefühlte Werte, oben der eine Pol, unten der andere. Keine Wertung, keine Ampel.
const WAHL = {
  schlaf:  { name: 'Schlaf',  icon: 'schlaf',  werte: [['erholt', 'erholt'], ['mittel', 'mittel'], ['kurz', 'kurz']] },
  essen:   { name: 'Essen',   icon: 'essen',   werte: [['frisch', 'frisch'], ['gemischt', 'gemischt'], ['gegoennt', 'gegönnt']] },
  trinken: { name: 'Trinken', icon: 'trinken', werte: [['viel', 'reichlich'], ['mittel', 'mittel'], ['wenig', 'wenig']] },   // Schlüssel bleibt 'viel', angezeigt „reichlich“
  // Arbeit: eine Skala für alle Tage (gefühlt). Keine eigene Spalte, gewählt im Arbeitsfenster.
  arbeit:  { name: 'Arbeit',  icon: 'feierabend', frei: true, werte: [['etwas', 'etwas'], ['halb', 'halb'], ['normal', 'normal'], ['viel', 'viel']] },
};
const TAGE_KURZ = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const istArbeitstag = d => (S.einstellungen.arbeitstage || [1, 2, 3, 4, 5]).includes(d.getDay());
const WAHL_TEXT = (art, w) => (WAHL[art].werte.find(x => x[0] === w) || [w, w])[1];
const wahlAn = art => S.einstellungen['zeige_' + art] !== false;

// Piktogramme: 24er-Raster, Linie 1.75, runde Enden, currentColor (wie im MemoMe Design System)
const PIKTO = {"kaffee":"<path d=\"M4 9h12v4.5A5.5 5.5 0 0 1 10.5 19h-1A5.5 5.5 0 0 1 4 13.5Z\"/><path d=\"M16 10.5h1.5a2.75 2.75 0 0 1 0 5.5H16\"/><path d=\"M8 3.5v2.5M12 3.5v2.5\"/><path d=\"M3 21.5h14\"/>","cello":"<path d=\"M12 7.4C9.8 7.4 8.4 8.5 8.4 10.3c0 1.2 1 1.8 1 2.8s-2 1.7-2 3.9c0 2.4 2 3.7 4.6 3.7s4.6-1.3 4.6-3.7c0-2.2-2-2.9-2-3.9s1-1.6 1-2.8c0-1.8-1.4-2.9-3.6-2.9Z\"/><path d=\"M12 16.2V1.8M10.9 3.4h2.2M10.4 16.2h3.2M12 20.7v2.3\"/>","sport":"<circle cx=\"15.5\" cy=\"4.2\" r=\"1.9\"/><path d=\"M13.6 8 10.6 13.6\"/><path d=\"M13.6 8l2.8 2.6 2.4-1.4\"/><path d=\"M13.6 8 10.2 8.6 8 10.8\"/><path d=\"M10.6 13.6l3.4 2.8-1 4.8\"/><path d=\"M10.6 13.6 8.4 17.2 4.6 17.6\"/>","meditation":"<circle cx=\"12\" cy=\"4.6\" r=\"2\"/><path d=\"M12 8.4v6.2\"/><path d=\"M12 9.6l-4.4 4.6 3 2.2M12 9.6l4.4 4.6-3 2.2\"/><path d=\"M4 19.5c2.4-2.6 5.2-3.2 8-3.2s5.6.6 8 3.2Z\"/>","spaziergang":"<circle cx=\"12.6\" cy=\"4.2\" r=\"1.9\"/><path d=\"M12.2 8l-.8 6.2\"/><path d=\"M11.4 14.2l2.4 3.2.6 3.6M11.4 14.2l-1.8 3.4-1.4 3.4\"/><path d=\"M12.2 8.6l2.6 3.2M12.2 8.6 9.6 11.6\"/><path d=\"M17.4 11v10\"/>","lesen":"<path d=\"M3 5.6c3-1 6-1 9 1 3-2 6-2 9-1v13c-3-1-6-1-9 1-3-2-6-2-9-1Z\"/><path d=\"M12 6.6v13\"/>","offline":"<rect x=\"7\" y=\"2.5\" width=\"10\" height=\"19\" rx=\"2.6\"/><path d=\"M10.6 5h2.8\"/><path d=\"M4 4l16 16\"/>","familie":"<circle cx=\"7\" cy=\"6\" r=\"2.2\"/><circle cx=\"17\" cy=\"6\" r=\"2.2\"/><circle cx=\"12\" cy=\"12.6\" r=\"1.4\"/><path d=\"M3.5 20.5v-6a3.5 3.5 0 0 1 7 0v6M13.5 20.5v-6a3.5 3.5 0 0 1 7 0v6M10.6 20.5v-3a1.4 1.4 0 0 1 2.8 0v3\"/>","zuzweit":"<circle cx=\"9\" cy=\"12\" r=\"5.6\"/><circle cx=\"15\" cy=\"12\" r=\"5.6\"/>","email":"<rect x=\"3\" y=\"5.5\" width=\"18\" height=\"13\" rx=\"2.2\"/><path d=\"M3.8 7.2l8.2 6.3 8.2-6.3\"/>","freunde":"<g transform=\"rotate(-12 7.5 13)\"><path d=\"M4.6 8h5.8l-.9 10a1.4 1.4 0 0 1-1.4 1.3H6.9a1.4 1.4 0 0 1-1.4-1.3Z\"/></g><g transform=\"rotate(12 16.5 13)\"><path d=\"M13.6 8h5.8l-.9 10a1.4 1.4 0 0 1-1.4 1.3h-1.2a1.4 1.4 0 0 1-1.4-1.3Z\"/></g><path d=\"M12 2.5v2.2M9.4 3.3l.9 1.6M14.6 3.3l-.9 1.6\"/>","coding":"<path d=\"M8 7l-5 5 5 5M16 7l5 5-5 5M13.6 5l-3.2 14\"/>","brot":"<path d=\"M3 14c0-4 4-6.5 9-6.5s9 2.5 9 6.5c0 2-1.5 3.5-3.5 3.5h-11C4.5 17.5 3 16 3 14Z\"/><path d=\"M8 9.4l1.4 3.2M12 8.8v3.6M16 9.4l-1.4 3.2\"/><path d=\"M5 20.5h14\"/>","feierabend":"<path d=\"M5.5 21.5V3\"/><path d=\"M5.5 3.8h12.5l-2.6 4.2 2.6 4.2H5.5\"/>","schlaf":"<path d=\"M19.5 14.6A8 8 0 1 1 9.4 4.5a6.4 6.4 0 0 0 10.1 10.1Z\"/>","kultur":"<path d=\"M4 9.5 12 4l8 5.5\"/><path d=\"M5 20.5h14M6.5 10.5v8M10 10.5v8M14 10.5v8M17.5 10.5v8\"/>","gruene":"<path d=\"M6 19c0-8 5-13 13-13 0 8-5 13-13 13Z\"/><path d=\"M4 21l9-9\"/>","kinder":"<circle cx=\"8\" cy=\"4.6\" r=\"1.9\"/><path d=\"M8 8.2v7.3M8 15.5l-2.2 5.5M8 15.5l2.2 5.5M8 10.2l4.6 2.8\"/><circle cx=\"16.5\" cy=\"10.8\" r=\"1.5\"/><path d=\"M16.5 13.6v4.2M16.5 17.8l-1.6 3.2M16.5 17.8l1.6 3.2M16.5 14.6l-3.9-1.6\"/>","orga":"<rect x=\"5\" y=\"4.5\" width=\"14\" height=\"16.5\" rx=\"2.5\"/><rect x=\"8.5\" y=\"2.6\" width=\"7\" height=\"3.8\" rx=\"1.3\"/><path d=\"M8.6 11.2h.4M11.8 11.2h3.8M8.6 14.6h.4M11.8 14.6h3.8M8.6 18h.4M11.8 18h3.8\"/>","haus":"<path d=\"M12 2.5v9\"/><path d=\"M7.5 11.5h9l1.6 9H5.9Z\"/><path d=\"M9.6 15v5.5M12 15v5.5M14.4 15v5.5\"/>","kraft":"<path d=\"M7 12h10\"/><rect x=\"3.5\" y=\"7.5\" width=\"3.5\" height=\"9\" rx=\"1.2\"/><rect x=\"17\" y=\"7.5\" width=\"3.5\" height=\"9\" rx=\"1.2\"/><path d=\"M2 10.5v3M22 10.5v3\"/>","musik":"<path d=\"M4 15v-3a8 8 0 0 1 16 0v3\"/><rect x=\"3\" y=\"14\" width=\"4.2\" height=\"6.5\" rx=\"1.8\"/><rect x=\"16.8\" y=\"14\" width=\"4.2\" height=\"6.5\" rx=\"1.8\"/>","wlanaus":"<path d=\"M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0\"/><circle cx=\"12\" cy=\"19.4\" r=\".9\"/><path d=\"M4 4l16 16\"/>","buehne":"<path d=\"M5 3.5h14v7.5a7 7 0 0 1-14 0Z\"/><path d=\"M8.3 9.2c.6-.8 1.6-.8 2.2 0M13.5 9.2c.6-.8 1.6-.8 2.2 0\"/><path d=\"M8.8 13.6a3.6 3.6 0 0 0 6.4 0\"/>","tee":"<path d=\"M4 10.5h16c0 4.7-3.6 8.5-8 8.5s-8-3.8-8-8.5Z\"/><path d=\"M9 19l-.6 2h7.2l-.6-2\"/><path d=\"M9.5 3.5c-1 1.2 1 2 0 3.3M14.5 3.5c-1 1.2 1 2 0 3.3\"/>","essen":"<circle cx=\"14\" cy=\"12.5\" r=\"6.8\"/><circle cx=\"14\" cy=\"12.5\" r=\"3.6\"/><path d=\"M2.8 3.5v4.2a1.7 1.7 0 0 0 3.4 0V3.5M4.5 3.5v17\"/>","trinken":"<path d=\"M5.5 3.5h13l-1.7 16.3a1.8 1.8 0 0 1-1.8 1.6H9a1.8 1.8 0 0 1-1.8-1.6Z\"/><path d=\"M6.4 11.2c1.9-.9 3.7-.9 5.6 0s3.7.9 5.6 0\"/>","gespraech":"<path d=\"M4.5 4h9a2 2 0 0 1 2 2v4.5a2 2 0 0 1-2 2H8.5L5.5 15v-2.5h-1a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z\"/><path d=\"M18 9h1.5a2 2 0 0 1 2 2v4.5a2 2 0 0 1-2 2h-1V20l-3-2.5h-4a2 2 0 0 1-2-1.6\"/>","urlaub":"<circle cx=\"12\" cy=\"9\" r=\"3.5\"/><path d=\"M12 2.5v1.5M6.3 4.3l1 1M17.7 4.3l-1 1M4 9h1.5M18.5 9H20\"/><path d=\"M3 15.5c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1\"/><path d=\"M6 19.5c1.2 0 1.2-.8 2.4-.8s1.2.8 2.4.8 1.2-.8 2.4-.8 1.2.8 2.4.8 1.2-.8 2.4-.8\"/>","telefon":"<path d=\"M6.6 3.5h2.6l1.6 4.2-2.1 1.5a11.5 11.5 0 0 0 6.1 6.1l1.5-2.1 4.2 1.6v2.6a2.1 2.1 0 0 1-2.2 2.1A16.4 16.4 0 0 1 4.5 5.7a2.1 2.1 0 0 1 2.1-2.2Z\"/>","nixtun":"<path d=\"M3 4v16.5M21 4v16.5\"/><path d=\"M3 6.5l3.2 4.8M21 6.5l-3.2 4.8\"/><path d=\"M6.2 11.3Q12 17.2 17.8 11.3\"/><circle cx=\"8.6\" cy=\"9.4\" r=\"1.6\"/><path d=\"M10.6 11.6Q13.6 13.4 16.4 10.9\"/>","abklatschen":"<circle cx=\"6.5\" cy=\"4.6\" r=\"1.9\"/><path d=\"M6.5 8.2v7.3M6.5 15.5l-2 5.5M6.5 15.5l2 5.5M6.5 10.2l4.9-3.4\"/><circle cx=\"17.5\" cy=\"4.6\" r=\"1.9\"/><path d=\"M17.5 8.2v7.3M17.5 15.5l-2 5.5M17.5 15.5l2 5.5M17.5 10.2l-4.9-3.4\"/><path d=\"M12 2v1.6M10.2 2.6l.6 1M13.8 2.6l-.6 1\"/>"};
// nicht mehr in der Auswahl (bleiben für Schlaf, Arbeit und ältere Momente erhalten)
const PIKTO_VERSTECKT = ['gruene', 'feierabend', 'schlaf', 'zuzweit'];   // nur noch sichtbar, wenn ein Moment es schon nutzt
function pikto(name, cls = 'pikto', strich = 1.75) {
  const p = PIKTO[name]; if (!p) return '';
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strich}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}
// Hilfe: schlichte Liniensymbole, wo vorhanden aus den Piktogrammen der App
const HZ = {"browser": "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M3.5 12h17M12 3.5c2.6 2.4 3.8 5.2 3.8 8.5S14.6 18.1 12 20.5M12 3.5C9.4 5.9 8.2 8.7 8.2 12s1.2 6.1 3.8 8.5\"/>", "installieren": "<rect x=\"7\" y=\"2.5\" width=\"10\" height=\"19\" rx=\"2.5\"/><path d=\"M12 8v6M9 11h6\"/>", "heute": "<rect x=\"4\" y=\"4\" width=\"7\" height=\"7\" rx=\"2\"/><rect x=\"13\" y=\"4\" width=\"7\" height=\"7\" rx=\"2\"/><rect x=\"4\" y=\"13\" width=\"7\" height=\"7\" rx=\"2\"/><rect x=\"13\" y=\"13\" width=\"7\" height=\"7\" rx=\"2\"/>", "tippen": "<circle cx=\"12\" cy=\"12\" r=\"2.5\"/><circle cx=\"12\" cy=\"12\" r=\"7.5\"/>", "halten": "<path d=\"M4.5 12a7.5 7.5 0 1 0 2.2-5.3\"/><path d=\"M4.5 4.5v4h4\"/>", "runden": "<path d=\"M16.5 3l3 3-3 3\"/><path d=\"M4.5 11V9.5A3.5 3.5 0 0 1 8 6h11.5\"/><path d=\"M7.5 21l-3-3 3-3\"/><path d=\"M19.5 13v1.5A3.5 3.5 0 0 1 16 18H4.5\"/>", "rahmen": "<rect x=\"3.5\" y=\"5\" width=\"4\" height=\"14\" rx=\"1.5\"/><rect x=\"10\" y=\"5\" width=\"4\" height=\"14\" rx=\"1.5\"/><rect x=\"16.5\" y=\"5\" width=\"4\" height=\"14\" rx=\"1.5\"/>", "frei": "<circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4\"/>", "herz": "<path d=\"M12 19.5s-7-4.3-7-9.6A3.9 3.9 0 0 1 12 7.6a3.9 3.9 0 0 1 7 2.3c0 5.3-7 9.6-7 9.6Z\"/>", "balance": "<path d=\"M12 4v16M7 20h10M5.5 8h13\"/><path d=\"M5.5 8l-2.5 6a2.5 2.5 0 0 0 5 0Z\"/><path d=\"M18.5 8l-2.5 6a2.5 2.5 0 0 0 5 0Z\"/>", "wischen": "<path d=\"M12 3.5v12\"/><path d=\"M7.5 11l4.5 4.5 4.5-4.5\"/><path d=\"M5 20.5h14\"/>", "woche": "<rect x=\"3.5\" y=\"5\" width=\"17\" height=\"15\" rx=\"2.5\"/><path d=\"M3.5 10h17M8 3v4M16 3v4\"/>", "gruppen": "<path d=\"M4 7h11M4 12h16M4 17h7\"/>", "licht": "<path d=\"M12 3.5l2 5.5 5.5 2-5.5 2-2 5.5-2-5.5-5.5-2 5.5-2Z\"/>", "wolke": "<ellipse cx=\"12\" cy=\"12\" rx=\"4.5\" ry=\"8\"/><circle cx=\"12\" cy=\"12\" r=\"0.9\"/>", "filter": "<path d=\"M4 5.5h16l-6 7v5.5l-4 2v-7.5Z\"/>", "zoom": "<circle cx=\"10.5\" cy=\"10.5\" r=\"6.5\"/><path d=\"M15.5 15.5l5 5M10.5 8v5M8 10.5h5\"/>", "druck": "<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21\"/>", "schirm": "<path d=\"M3.5 11.5a8.5 8.5 0 0 1 17 0Z\"/><path d=\"M12 11.5v7a2 2 0 0 1-4 0\"/>", "abschluss": "<path d=\"M5 12.5l4.5 4.5L19 7.5\"/>", "rueckschau": "<path d=\"M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5Z\"/><path d=\"M5 20.5v-15M19 18v3H7.5\"/>", "zahnrad": "<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1\"/>", "modus": "<circle cx=\"12\" cy=\"12\" r=\"8\"/><path d=\"M12 4a8 8 0 0 1 0 16Z\" fill=\"currentColor\" stroke=\"none\" opacity=\"0.45\"/>", "dauer": "<circle cx=\"12\" cy=\"12\" r=\"8\"/><path d=\"M12 7.5V12l3 2\"/>", "leuchtturm": "<path d=\"M10 21l.9-11h2.2l.9 11Z\"/><path d=\"M8.5 21h7M10.5 10V7.5h3V10M12 7.5V5.5\"/><path d=\"M4.5 6l3.5 1.5M19.5 6L16 7.5\"/>", "geraet": "<rect x=\"7\" y=\"2.5\" width=\"10\" height=\"19\" rx=\"2.5\"/><path d=\"M11 18.5h2\"/>", "sichern": "<path d=\"M12 3.5v10.5\"/><path d=\"M8 10l4 4 4-4\"/><path d=\"M4.5 15v3.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V15\"/>", "laden": "<path d=\"M12 14V3.5\"/><path d=\"M8 7.5l4-4 4 4\"/><path d=\"M4.5 15v3.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V15\"/>", "update": "<path d=\"M19.5 12a7.5 7.5 0 1 1-2.2-5.3\"/><path d=\"M19.5 4.5v4h-4\"/>", "loeschen": "<path d=\"M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13\"/>", "werkzeug": "<path d=\"M14.5 4a5 5 0 0 0-4.3 7.2L4 17.4V20h2.6l6.2-6.2A5 5 0 0 0 20 9.5l-2.8 1.1-2-2L16.3 5.8A5 5 0 0 0 14.5 4Z\"/>"};
const hzIcon = name => { const p = HZ[name] || PIKTO[name]; return p ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>` : ''; };
// Herz für „Angebot für andere“: Umriss grau = offen, gefüllt = angekommen
const HERZ = '<svg class="herz" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.3s-7.6-4.7-7.6-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.6 2.7c0 5.5-7.6 10.2-7.6 10.2Z"/></svg>';
const herzHTML = (voll, extra = '') => `<span class="herz-wrap${voll ? ' voll' : ''}${extra}">${HERZ}</span>`;
const wochenKey = d => `${d.getFullYear()}-W${kw(d)}`;
// ältere Einträge ohne gespeicherten Start: Montag der Woche aus dem Schlüssel „2026-W47“
function wocheAusKey(k) {
  const [j, w] = k.split('-W').map(Number);
  const jan4 = new Date(j, 0, 4), mo = wocheStart(jan4);
  mo.setDate(mo.getDate() + (w - 1) * 7);
  return mo.getTime();
}

// Piktogramm, sonst eigenes Zeichen
// Piktogramm; ältere Momente können noch ein eigenes Zeichen haben; „kein Piktogramm“ zeigt nichts
const hatSymbol = m => !!((m.icon && PIKTO[m.icon]) || (m.icon !== 'kein' && m.symbol));
const symbolHTML = (m, strich) => (m.icon && PIKTO[m.icon]) ? pikto(m.icon, 'pikto', strich) : (m.icon !== 'kein' && m.symbol) ? `<span class="zeichen">${esc(m.symbol)}</span>` : '';

// Startpaket für neue Nutzer: nur eine Starthilfe. Bestehende Daten bleiben bei Updates unberührt.
// Alle drei Arten sind dabei (erholsam, aktiv für mich, aktiv), keine Richtwerte, keine Bedeutung, kein Tagesmoment.
const START_MOMENTE = [
  { id: 'familie',     name: 'Familienzeit',    icon: 'familie',     gruppe: 'family', modus: 'reg',    dauer: 60 },
  { id: 'zuzweit',     name: 'Zeit zu zweit',   icon: 'zuzweit',     gruppe: 'family', modus: 'reg',    dauer: 60 },
  { id: 'kinder',      name: 'Mit den Kindern', icon: 'kinder',      gruppe: 'family', modus: 'beides', dauer: 30 },
  { id: 'haushalt',    name: 'Haushalt',        icon: 'haus',        gruppe: 'family', modus: 'akt',    dauer: 30 },
  { id: 'spaziergang', name: 'Spaziergang',     icon: 'spaziergang', gruppe: 'metime', modus: 'reg',    dauer: 20 },
  { id: 'lesen',       name: 'Lesen',           icon: 'lesen',       gruppe: 'metime', modus: 'reg',    dauer: 20 },
  { id: 'sport',       name: 'Sport',           icon: 'sport',       gruppe: 'metime', modus: 'beides', dauer: 30 },
  { id: 'nichtstun',   name: 'Nichts tun',      icon: 'nixtun',      gruppe: 'metime', modus: 'reg',    dauer: 10 },
  { id: 'kaffee',      name: 'Kaffeepause',     icon: 'kaffee',      gruppe: 'social', modus: 'reg',    dauer: 15 },
  { id: 'freunde',     name: 'Freunde treffen', icon: 'abklatschen', gruppe: 'social', modus: 'beides', dauer: 60 },
  { id: 'telefonat',   name: 'Telefonat',       icon: 'telefon',   gruppe: 'social', modus: 'reg',    dauer: 20 },
];
// frühere Startmomente: nur noch für die Umstellung sehr alter Daten (Piktogramme nachtragen)
const FRUEHERE_MOMENTE = [
  { id: 'kaffee',      name: 'Kaffeepause',          symbol: '☕', icon: 'kaffee', gruppe: 'social', modus: 'reg',    dauer: 15 },
  { id: 'cello',       name: 'Cello',                symbol: '🎻', icon: 'cello', gruppe: 'metime', modus: 'reg',    dauer: 30 },
  { id: 'sport',       name: 'Sport / Joggen',       symbol: '🏃', icon: 'sport', gruppe: 'metime', modus: 'beides', dauer: 30 },
  { id: 'meditation',  name: 'Meditation',           symbol: '🧘', icon: 'meditation', gruppe: 'metime', modus: 'reg',    dauer: 10 },
  { id: 'spaziergang', name: 'Spaziergang',          symbol: '🚶', icon: 'spaziergang', gruppe: 'metime', modus: 'reg',    dauer: 20 },
  { id: 'lesen',       name: 'Lesen',                symbol: '📖', icon: 'lesen', gruppe: 'metime', modus: 'reg',    dauer: 20 },
  { id: 'offline',     name: 'Offline',              symbol: '📵', icon: 'offline', gruppe: 'metime', modus: 'reg',    dauer: 60 },
  { id: 'familie',     name: 'Familienzeit',         symbol: '👨‍👩‍👧', icon: 'familie', gruppe: 'family', modus: 'reg',    dauer: 60 },
  { id: 'zuzweit',     name: 'Zeit zu zweit',        symbol: '💑', icon: 'zuzweit', gruppe: 'family', modus: 'reg',    dauer: 60 },
  { id: 'freunde',     name: 'Freunde treffen',      symbol: '🍻', icon: 'freunde', gruppe: 'social', modus: 'beides', dauer: 60 },
  { id: 'vibe',        name: 'Vibe Coding',          symbol: '💻', icon: 'coding', gruppe: 'metime', modus: 'beides', dauer: 30, genugTag: 120 },
];

function startZustand() {
  return {
    version: 1,
    stand: 6,            // Datenstand: 6 = Arbeit mit einer Skala (etwas · halb · normal · viel) und Zeitblöcken
    gruppen: START_GRUPPEN.map(g => ({ ...g })),
    momente: START_MOMENTE.map(m => ({ ...m })),
    taps: [],            // { id, mid, ts, min }
    feierabend: {},      // 'JJJJ-MM-TT' → 'HH:MM'
    schlaf: {},          // 'JJJJ-MM-TT' → 'erholt' | 'mittel' | 'kurz'
    essen: {},           // 'JJJJ-MM-TT' → 'frisch' | 'gemischt' | 'gegoennt'
    trinken: {},         // 'JJJJ-MM-TT' → 'viel' | 'mittel' | 'wenig'
    arbeit: {},          // früher: freie Tage (etwas | halb | ganz), seit Stand 6 in arbeitStufe
    arbeitStufe: {},     // 'JJJJ-MM-TT' → 'etwas' | 'halb' | 'normal' | 'viel' (Arbeitstag ohne Wahl = normal, freier Tag ohne Wahl = frei)
    arbeitZeit: {},      // 'JJJJ-MM-TT' → [{ von: 'HH:MM' | '', bis: 'HH:MM' | '' }] (mehrere Blöcke, alles freiwillig)
    wochen: {},          // 'JJJJ-Wkw' → { angebote: { mid: { an, mir } }, satz, abgeschlossen }
    einstellungen: { korridorVon: '17:30', korridorBis: '19:00', balanceStil: 'band', modus: 'einfach', zeige_schlaf: true, zeige_essen: true, zeige_trinken: true, arbeitstage: [1, 2, 3, 4, 5], arbeitGewicht: 3, arbeitInBalance: true, tagWechsel: 4 },
  };
}

// ── Speicher (IndexedDB, Notfall: localStorage) ────────
const DB_NAME = 'memome', STORE = 'kv', KEY = 'zustand';
let dbP = null;
function db() {
  if (!dbP) dbP = new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return dbP;
}
async function laden() {
  try {
    const d = await db();
    return await new Promise((res, rej) => {
      const t = d.transaction(STORE).objectStore(STORE).get(KEY);
      t.onsuccess = () => res(t.result || null);
      t.onerror = () => rej(t.error);
    });
  } catch {
    try { return JSON.parse(localStorage.getItem('memome-' + KEY)); } catch { return null; }
  }
}
let speicherTimer = null;
function speichern() {
  clearTimeout(speicherTimer);
  speicherTimer = setTimeout(async () => {
    try {
      const d = await db();
      d.transaction(STORE, 'readwrite').objectStore(STORE).put(S, KEY);
    } catch {
      try { localStorage.setItem('memome-' + KEY, JSON.stringify(S)); } catch {}
    }
  }, 150);
}

let S = startZustand();

// ── Hilfen ─────────────────────────────────────────────
const $ = s => document.querySelector(s);
const pad = n => String(n).padStart(2, '0');
const tagKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// Tageswechsel: Ein Tag geht bis 4 Uhr nachts (einstellbar). Kino bis 0:30 gehört noch zum Abend davor.
const WECHSEL_H = () => S.einstellungen.tagWechsel ?? 4;
const logTag = (t = Date.now()) => { const d = new Date(+t - WECHSEL_H() * 3600000); d.setHours(0, 0, 0, 0); return d; };
// Heute kann auch gestern zeigen (Datum antippen)
let heuteVersatz = 0;
const ansichtDatum = () => { const d = logTag(); d.setDate(d.getDate() + heuteVersatz); return d; };
const heuteKey = () => tagKey(ansichtDatum());
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const moment = id => S.momente.find(m => m.id === id);
const zuMin = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const zuHHMM = min => `${pad(Math.floor(min / 60) % 24)}:${pad(Math.round(min % 60))}`;

function fmtDauer(min) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), r = min % 60;
  if (r === 0) return `${h} h`;
  if (r === 30) return `${h}½ h`;
  return `${h} h ${r}`;
}

// Tagesmomente (Dauer in Tagen, z. B. Urlaub): eine Eigenschaft des Tages, keine Dauer im Tag.
// Sie zählen nicht in die Balance, erscheinen in „Über den Tag“ als Schleier mit leisem Nachklang.
const EINHEIT = { min: ['min', 1], std: ['Std', 60], tag: ['Tage', 1440] };
const istTagesmoment = m => m?.einheit === 'tag';
const tageText = n => n === 1 ? '1 Tag' : `${n} Tage`;
const dauerText = m => istTagesmoment(m) ? tageText(Math.max(1, Math.round((m.dauer || 1440) / 1440))) : fmtDauer(m.dauer);
const tagMit = (mid, d) => { const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() + WECHSEL_H() * 3600000, b = a + 86400000; return S.taps.some(t => t.mid === mid && t.ts >= a && t.ts < b); };
// der wievielte Tag in Folge (für „Tag 3“ auf der Kachel)
function tagInFolge(mid, d) {
  let n = 0; const x = new Date(d);
  while (tagMit(mid, x) && n < 400) { n++; x.setDate(x.getDate() - 1); }
  return n;
}
const tagesmomentAn = d => S.momente.some(m => istTagesmoment(m) && tagMit(m.id, d));

function wocheStart(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
function kw(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const tag = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - tag);
  const j = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t - j) / 86400000 + 1) / 7);
}

// Einstieg: der früheste Tag mit irgendeinem Eintrag (oder das gespeicherte Startdatum). Davor gibt es keine Wochen.
function einstiegTag() {
  let t = S.seit ? new Date(S.seit + 'T12:00').getTime() : Date.now();
  for (const x of S.taps) if (x.ts < t) t = x.ts;
  for (const art of ['feierabend', 'schlaf', 'essen', 'trinken', 'arbeit', 'arbeitStufe', 'arbeitZeit'])
    for (const k of Object.keys(S[art] || {})) { const d = new Date(k + 'T12:00').getTime(); if (d < t) t = d; }
  return new Date(t - WECHSEL_H() * 3600000);
}
const minWocheVersatz = () => Math.min(0, Math.round((wocheStart(einstiegTag()).getTime() - wocheStart(new Date()).getTime()) / (7 * 86400000)));

function tapsZwischen(von, bis) {
  const h = WECHSEL_H() * 3600000, a = von.getTime() + h, b = bis.getTime() + h;   // Tage laufen bis zum Tageswechsel
  return S.taps.filter(t => t.ts >= a && t.ts < b && moment(t.mid));
}
// Runden: gezählt werden Zeitabschnitte, nicht Tipps. Ein Tipp gehört zur vorigen Runde desselben Moments,
// wenn er innerhalb seiner Dauer danach kommt (die Zeiten überlappen), mindestens aber innerhalb von 3 Minuten.
// Die Dauer zählt voll: dreimal 15 min hintereinander = eine Runde mit 45 min. Gespeichert bleiben die einzelnen Tipps.
function runden(taps) {
  const letzte = {}, aus = [];
  [...taps].sort((a, b) => a.ts - b.ts).forEach(t => {
    const r = letzte[t.mid], fenster = Math.max(t.min || 0, 3) * 60000;
    if (r && t.ts - r.ts <= fenster) { r.ts = t.ts; r.min += t.min || 0; r.tipps++; return; }
    aus.push(letzte[t.mid] = { mid: t.mid, ts: t.ts, min: t.min || 0, tipps: 1 });
  });
  return aus;
}
function tapsHeute() {
  const von = ansichtDatum();
  const bis = new Date(von); bis.setDate(bis.getDate() + 1);
  return tapsZwischen(von, bis);
}

// Arbeit in der Balance: gefühlt (etwas · halb · normal · viel), gedämpft gewichtet (Regler in den Einstellungen).
// Die Uhrzeiten zählen nie mit, sie sind nur das Bild. Arbeitstag ohne Wahl = normal (heute erst, wenn etwas eingetragen ist),
// freier Tag ohne Wahl = frei; mit Zeiten, aber ohne Wahl = etwas.
const ARBEIT_STUFE = { etwas: 1 / 3, halb: 1 / 2, normal: 1, viel: 4 / 3 };
const STUFEN = ['etwas', 'halb', 'normal', 'viel'];
// Arbeitszeiten als Blöcke je Tag; Feierabend = Ende des letzten Blocks (für Korridor und Rahmen)
const arbeitBloecke = k => (S.arbeitZeit || {})[k] || (S.feierabend[k] ? [{ von: '', bis: S.feierabend[k] }] : []);
const zeitH = z => { const h = zuMin(z) / 60; return h < WECHSEL_H() ? h + 24 : h; };   // nach Mitternacht: 24, 25 …
function arbeitSetzen(k, bl) {
  bl = bl.filter(b => b.von || b.bis).map(b => ({ von: b.von || '', bis: b.bis || '' }))
    .sort((a, b) => zeitH(a.von || a.bis) - zeitH(b.von || b.bis));
  S.arbeitZeit ||= {};
  if (bl.length) S.arbeitZeit[k] = bl; else delete S.arbeitZeit[k];
  const letzt = bl[bl.length - 1];
  if (letzt && letzt.bis) S.feierabend[k] = letzt.bis; else delete S.feierabend[k];
}
const freierTag = d => !(istArbeitstag(d) && !tagesmomentAn(d));
const arbeitMitzaehlen = () => S.einstellungen.arbeitInBalance !== false;
const stundenText = h => `${String(h).replace('.', ',')} ${h === 1 ? 'Stunde' : 'Stunden'}`;
const gewichtText = n => { const r = f => stundenText(Math.round(n * f * 2) / 2); return `Ein normaler Arbeitstag zählt wie ${stundenText(n)} Aktivität, ein halber wie ${r(1 / 2)}, etwas Arbeit wie ${r(1 / 3)}, viel Arbeit wie ${r(4 / 3)}. Mehr Einfluss heißt: Arbeit wiegt in der Balance schwerer.`; };
function arbeitMin(d) {
  const heute = logTag();
  if (d > heute) return 0;
  const k = tagKey(d), N = (S.einstellungen.arbeitGewicht ?? 3) * 60;
  const st = (S.arbeitStufe || {})[k], hat = arbeitBloecke(k).length > 0;
  if (!freierTag(d)) {
    if (k === tagKey(heute) && !st && !hat) return 0;
    return N * (ARBEIT_STUFE[st] ?? 1);
  }
  if (st) return N * (ARBEIT_STUFE[st] ?? 1);
  return hat ? N * ARBEIT_STUFE.etwas : 0;
}
function balance(taps, tage) {
  let akt = 0, reg = 0;
  const arbeit = tage && arbeitMitzaehlen() ? tage.reduce((n, d) => n + arbeitMin(d), 0) : 0;
  akt += arbeit;
  for (const t of taps) {
    const m = moment(t.mid); if (!m || istTagesmoment(m)) continue;   // Tagesmomente zählen nicht in die Balance
    const w = t.min || 10; // Momente ohne Dauer zählen leicht mit
    if (m.modus === 'akt') akt += w;
    else if (m.modus === 'reg') reg += w;
    else { akt += w / 2; reg += w / 2; }
  }
  const sum = akt + reg;
  let wort = 'Noch offen';
  if (sum > 0) {
    const r = reg / sum;
    wort = r > 0.62 ? 'eher regenerativ' : r < 0.38 ? 'eher aktiv' : 'ausgeglichen';
  }
  return { akt, reg, sum, wort, arbeit };
}

// ── Balance-Darstellung ────────────────────────────────
function balanceHTML(b, stil, titel) {
  const kopf = `<div class="balance-kopf"><span class="label">${esc(titel)}</span>
    <span class="balance-wort${b.sum ? '' : ' leer'}">${esc(b.wort)}</span></div>`;
  // nur noch das Band: die Waage kippt und wirkt wie eine Wertung
  const a = b.sum ? b.akt : 1, r = b.sum ? b.reg : 1;
  const leer = b.sum ? '' : ' style="opacity:.35"';
  return kopf + `<div class="band" role="img" aria-label="Balance: ${esc(b.wort)}"${leer}>
      <div class="band-akt" style="flex-grow:${a}"></div><div class="band-reg" style="flex-grow:${r}"></div>
      <div class="band-mitte"></div></div>
    <div class="band-legende"><span class="akt">Aktivität</span><span class="reg">Regeneration</span></div>`;
}


// ── HEUTE ──────────────────────────────────────────────
function renderHeute() {
  const tagD = ansichtDatum();
  $('#heute-datum').textContent = tagD.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
  $('#heute-datum').setAttribute('aria-label', heuteVersatz ? 'Gestern. Antippen: zurück zu heute' : 'Heute. Antippen: gestern ansehen');
  $('#heute-sub').innerHTML = heuteVersatz ? '<button type="button" class="link-heute" id="zu-heute">Gestern · zurück zu heute ›</button>' : 'Kann, nicht muss.';
  document.documentElement.classList.toggle('heute-gestern', !!heuteVersatz);
  if ($('#zu-heute')) $('#zu-heute').onclick = () => { heuteVersatz = 0; renderHeute(); };
  const taps = tapsHeute();
  $('#balance-heute').innerHTML = balanceHTML(balance(taps, [tagD]), S.einstellungen.balanceStil, heuteVersatz ? 'Balance gestern' : 'Balance heute');

  // Sonderkacheln
  const k = heuteKey();
  const spalte = art => {
    const w = (S[art] ||= {})[k];
    const ton = { schlaf: 'reg ton', arbeit: 'akt ton' }[art] || 'neutral';
    return `<div class="kachel rahmen spalte ${ton}${w ? ' gefuellt' : ''}" data-sonder="${art}">
      <span class="kachel-name">${WAHL[art].name}</span>
      <div class="wahl" role="group" aria-label="${WAHL[art].name}, gefühlt">
        ${WAHL[art].werte.map(([v, t]) => `<button type="button" data-wahl="${art}" data-wert="${v}" class="${w === v ? 'an' : ''}" aria-pressed="${w === v}">${t}</button>`).join('')}
      </div></div>`;
  };
  const arten = Object.keys(WAHL).filter(a => !WAHL[a].frei && wahlAn(a));
  const arbeitstag = istArbeitstag(tagD) && !tagesmomentAn(tagD);   // Urlaub & Co.: Arbeit wie an freien Tagen
  const sonder = $('#sonder-kacheln');
  sonder.style.setProperty('--spalten', arten.length + 1);
  // Spalte „Arbeit“: Tippen = Start, nochmal = Ende, danach wieder Start (mehrere Blöcke). Halten = Arbeitsfenster.
  const bl = arbeitBloecke(k), letzt = bl[bl.length - 1], offen = !!(letzt && letzt.von && !letzt.bis);
  const st = (S.arbeitStufe || {})[k];
  const stufeZeile = st && !(arbeitstag && st === 'normal') ? `<span class="spalte-leise">${st}</span>` : '';
  const arbeitWert = !bl.length ? `<span class="spalte-leise">${arbeitstag ? 'Start tippen' : 'frei'}</span>${stufeZeile}`
    : offen ? `<span class="arbeit-zeiten"><span class="spalte-leise">seit</span><span class="kachel-zahl arbeit-zeit">${letzt.von}</span><span class="spalte-leise">Ende tippen</span></span>`
    : `<span class="arbeit-zeiten">${bl[0].von ? `<span class="kachel-zahl arbeit-zeit">${bl[0].von}</span><span class="spalte-leise">bis</span>` : ''}<span class="kachel-zahl arbeit-zeit">${letzt.bis}</span>${stufeZeile}</span>`;
  const arbeitLabel = !bl.length ? 'Start tippen' : offen ? `seit ${letzt.von}, Ende tippen` : `${bl[0].von ? bl[0].von + ' bis ' : 'Ende '}${letzt.bis}`;
  const arbeitSpalte = `
    <button class="kachel rahmen spalte akt ton${bl.length || st ? ' gefuellt' : ''}${offen ? ' laeuft' : ''}" data-sonder="feierabend" type="button" aria-label="Arbeit, ${arbeitLabel}">
      <span class="kachel-name">Arbeit</span>
      <span class="kachel-wert">${arbeitWert}</span>
      ${ringSVG()}
    </button>`;
  // Reihenfolge: Schlaf (die Nacht davor), dann der laufende Tag: Arbeit, Essen, Trinken
  const nachArbeit = arten.filter(a => a !== 'schlaf');
  sonder.innerHTML = (arten.includes('schlaf') ? spalte('schlaf') : '') + arbeitSpalte + nachArbeit.map(spalte).join('');

  // Momente
  const proMoment = {};
  for (const t of runden(taps)) { const p = proMoment[t.mid] ||= { n: 0, min: 0 }; p.n++; p.min += t.min; }
  const kachel = m => {
    const p = proMoment[m.id];
    let wert = '', zusatz = '';
    if (p && istTagesmoment(m)) {
      wert = `<span class="kachel-zahl">Tag ${tagInFolge(m.id, tagD)}</span>`;
    } else if (p) {
      wert = m.dauer > 0
        ? `<span class="kachel-zahl">${fmtDauer(p.min)}</span><span class="kachel-dauer">${p.n}×</span>`
        : `<span class="kachel-zahl">${p.n}×</span>`;
      if (m.genugTag && p.min >= m.genugTag) zusatz = '<span class="kachel-genug">genug für heute</span>';
    }
    return `<button class="kachel ${m.modus}${p ? ' gefuellt' : ''}${hatSymbol(m) ? '' : ' ohne-pikto'}" data-mid="${esc(m.id)}" type="button" aria-label="${esc(m.name)}${p ? ', heute ' + p.n + ' mal' : ''}">
      <span class="kachel-symbol" aria-hidden="true">${symbolHTML(m, 1.4)}</span>
      <span class="kachel-wert">${wert}</span>
      <span><span class="kachel-name">${esc(m.name)}${m.angebot ? herzHTML(false, ' kachel-herz') : ''}</span>${zusatz ? '<br>' + zusatz : ''}</span>
      ${ringSVG()}
    </button>`;
  };
  $('#start-hinweis').classList.toggle('hidden', !istStartpaket());
  $('#moment-kacheln').innerHTML = [...Object.keys(GRUPPEN), ''].map(g => {
    const liste = S.momente.filter(m => g ? m.gruppe === g : !GRUPPEN[m.gruppe]);
    if (!liste.length) return '';
    const titel = g ? GRUPPEN[g] : 'Ohne Gruppe';
    return `<section class="gruppe-block" aria-label="${esc(titel)}">
      <div class="label gruppe-label">${esc(titel)}</div>
      <div class="kachel-raster">${liste.map(kachel).join('')}</div></section>`;
  }).join('');
}
// Starthilfe-Satz: nur solange Gruppen und Momente noch genau das Startpaket sind
const istStartpaket = () => JSON.stringify(S.gruppen.map(g => [g.id, g.name])) === JSON.stringify(START_GRUPPEN.map(g => [g.id, g.name]))
  && JSON.stringify(S.momente.map(m => [m.id, m.name, m.gruppe, m.modus, m.dauer, m.icon])) === JSON.stringify(START_MOMENTE.map(m => [m.id, m.name, m.gruppe, m.modus, m.dauer, m.icon]));
const ringSVG = () => `<svg class="kachel-ring" viewBox="0 0 64 64" aria-hidden="true"><circle class="spur" cx="32" cy="32" r="28"/><circle class="fuell" cx="32" cy="32" r="28"/></svg>`;

function puls(el) { el.classList.remove('puls'); void el.offsetWidth; el.classList.add('puls'); }

function zaehlen(mid) {
  const m = moment(mid); if (!m) return;
  if (heuteVersatz) return momentZeitSheet(mid, -heuteVersatz);   // gestern: nachtragen statt „jetzt“ zählen
  // Tagesmoment (z. B. Urlaub): Tippen schaltet den Tag an und wieder aus
  if (istTagesmoment(m)) {
    const heute = new Set(tapsHeute().filter(t => t.mid === mid).map(t => t.id));
    if (heute.size) {
      const vorher = [...S.taps];
      S.taps = S.taps.filter(t => !heute.has(t.id));
      speichern(); renderHeute();
      toast(`${m.name}: heute aus`, () => { S.taps = vorher; speichern(); renderHeute(); toast('Wiederhergestellt'); });
      return;
    }
  }
  const neu = { id: uid(), mid, ts: Date.now(), min: m.dauer || 0 };
  S.taps.push(neu);
  speichern(); renderHeute();
  // kurz „Rückgängig“ anbieten, falls daneben getippt
  toast(m.name, () => { S.taps = S.taps.filter(t => t.id !== neu.id); speichern(); renderHeute(); toast('Zurückgenommen'); });
  const el = document.querySelector(`.kachel[data-mid="${CSS.escape(mid)}"]`);
  if (el) puls(el);
  if (navigator.vibrate) navigator.vibrate(8);
}

function zuruecknehmen(mid) {
  const heute = new Set(tapsHeute().filter(t => t.mid === mid).map(t => t.id));
  if (!heute.size) return false;
  let idx = -1;
  for (let i = S.taps.length - 1; i >= 0; i--) if (heute.has(S.taps[i].id)) { idx = i; break; }
  const [weg] = S.taps.splice(idx, 1);
  speichern(); renderHeute();
  const m = moment(mid);
  toast(`${m.name}: zurückgenommen`, () => { S.taps.splice(idx, 0, weg); speichern(); renderHeute(); toast('Wiederhergestellt'); });
  return true;
}

function arbeitTippen() {
  const d = new Date(), k = heuteKey(), z = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const vorher = arbeitBloecke(k).map(b => ({ ...b })), bl = vorher.map(b => ({ ...b }));
  const letzt = bl[bl.length - 1], offen = !!(letzt && letzt.von && !letzt.bis);
  if (offen) letzt.bis = z; else bl.push({ von: z, bis: '' });
  arbeitSetzen(k, bl); speichern(); renderHeute();
  puls(document.querySelector('[data-sonder="feierabend"]'));
  toast(offen ? `Arbeit Ende ${z}` : `Arbeit Start ${z}`, () => { arbeitSetzen(k, vorher); speichern(); renderHeute(); });
}

// Arbeitsfenster (langer Druck): Zeiten als Blöcke ändern oder nachtragen, dazu gefühlt, wie der Tag war
function arbeitSheet() {
  const tage = [];
  for (let i = 0; i < 7; i++) {
    const d = logTag(); d.setDate(d.getDate() - i);
    tage.push([tagKey(d), i === 0 ? 'heute' : i === 1 ? 'gestern' : d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'numeric' })]);
  }
  sheet('Arbeit', `
    <p class="card-text">Start und Ende sind freiwillig. Mehrere Blöcke gehen, etwa 9–12 und 15–18. Nur das Ende? Start leer lassen.</p>
    <div class="form-group"><label for="ar-tag">Tag</label>
      <select id="ar-tag">${tage.map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select></div>
    <div class="form-group"><label>Zeiten</label><div id="ar-bloecke" class="block-liste"></div>
      <button class="btn-klein" id="ar-plus" type="button">+ Block</button></div>
    <div class="form-group"><label>Der Tag war</label><div class="seg klein" id="ar-stufe"></div>
      <p class="form-hinweis" id="ar-hinweis"></p></div>
    <div class="btn-reihe">
      <button class="btn-primary" id="ar-ok" type="button">Übernehmen</button>
      <button class="btn-leise" id="ar-weg" type="button">Alles für diesen Tag entfernen</button>
    </div>`);
  const tagSel = $('#ar-tag'); tagSel.value = heuteKey();
  let bl = [], stufe = '';
  const datum = () => { const [j, mo, t] = tagSel.value.split('-').map(Number); return new Date(j, mo - 1, t); };
  const zeichnen = () => {
    const frei = freierTag(datum());
    $('#ar-bloecke').innerHTML = bl.map((b, i) => `<div class="block-zeile">
      <input type="time" data-i="${i}" data-f="von" value="${b.von}" aria-label="Start">
      <span class="block-bis">–</span>
      <input type="time" data-i="${i}" data-f="bis" value="${b.bis}" aria-label="Ende">
      <button type="button" class="eintrag-weg" data-weg="${i}" aria-label="Block entfernen">✕</button></div>`).join('');
    document.querySelectorAll('#ar-bloecke input').forEach(inp => inp.oninput = () => { bl[+inp.dataset.i][inp.dataset.f] = inp.value; });
    document.querySelectorAll('#ar-bloecke [data-weg]').forEach(b => b.onclick = () => { bl.splice(+b.dataset.weg, 1); if (!bl.length) bl.push({ von: '', bis: '' }); zeichnen(); });
    const opts = frei ? ['', ...STUFEN] : STUFEN, an = stufe || (frei ? '' : 'normal');
    $('#ar-stufe').innerHTML = opts.map(w => `<button type="button" data-wert="${w}" class="${w === an ? 'an' : ''}">${w || 'frei'}</button>`).join('');
    document.querySelectorAll('#ar-stufe button').forEach(b => b.onclick = () => { stufe = b.dataset.wert; zeichnen(); });
    $('#ar-hinweis').textContent = frei ? 'Gefühlt, keine Stunden. Freier Tag: ohne Wahl frei.' : 'Gefühlt, keine Stunden. Ohne Wahl gilt normal.';
  };
  const laden = () => {
    const k = tagSel.value;
    bl = arbeitBloecke(k).map(b => ({ ...b })); if (!bl.length) bl.push({ von: '', bis: '' });
    stufe = (S.arbeitStufe || {})[k] || '';
    $('#ar-weg').classList.toggle('hidden', !arbeitBloecke(k).length && !stufe);
    zeichnen();
  };
  tagSel.onchange = laden; laden();
  $('#ar-plus').onclick = () => { bl.push({ von: '', bis: '' }); zeichnen(); };
  $('#ar-ok').onclick = () => {
    const k = tagSel.value, s2 = (S.arbeitStufe ||= {});
    arbeitSetzen(k, bl);
    if (!stufe || (stufe === 'normal' && !freierTag(datum()))) delete s2[k]; else s2[k] = stufe;
    speichern(); sheetZu(); renderAlles(); toast('Arbeit gespeichert');
  };
  $('#ar-weg').onclick = () => {
    const k = tagSel.value; arbeitSetzen(k, []); delete (S.arbeitStufe || {})[k];
    speichern(); sheetZu(); renderAlles(); toast('Eintrag entfernt');
  };
}

// Langer Druck auf einen Moment: mehr zu diesem Moment. Nachtragen (Ende, Dauer, heute/gestern),
// die Einträge des Tages ändern oder entfernen, den letzten zurücknehmen. Keine versteckte Wischgeste.
function momentZeitSheet(mid, startTag = 0) {
  const m = moment(mid); if (!m) return;
  const tagesm = istTagesmoment(m);
  const fak = EINHEIT[m.einheit === 'std' ? 'std' : 'min'][1], einh = fak === 60 ? 'Std' : 'min';
  const jetzt = new Date(), hhmm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  let tag = startTag, bearbeite = null;   // 0 = heute, 1 = gestern
  const tagBeginn = () => { const d = logTag(); d.setDate(d.getDate() - tag); return d; };
  const eintraege = () => { const a = tagBeginn(), b = new Date(a); b.setDate(b.getDate() + 1); return tapsZwischen(a, b).filter(t => t.mid === mid).sort((x, y) => x.ts - y.ts); };
  sheet(m.name, `
    <div class="form-group"><label>Tag</label><div class="seg klein" id="nz-tag"><button type="button" data-wert="0" class="${tag ? '' : 'an'}">heute</button><button type="button" data-wert="1" class="${tag ? 'an' : ''}">gestern</button></div></div>
    ${tagesm ? '' : `<div class="form-group"><label>Nachtragen · Ende</label>
      <div class="chip-reihe" id="nz-chips">${[[0, 'jetzt'], [30, 'vor 30 min'], [60, 'vor 1 h'], [120, 'vor 2 h']].map(([v, t]) => `<button type="button" class="btn-klein${v ? '' : ' an'}" data-vor="${v}">${t}</button>`).join('')}</div>
      <div class="form-reihe" style="margin-top:0.55rem">
        <div class="form-group"><label for="nz-zeit">Uhrzeit</label><input type="time" id="nz-zeit" value="${hhmm(jetzt)}"></div>
        <div class="form-group"><label for="nz-dauer">Dauer (${einh})</label><input type="number" id="nz-dauer" min="0" step="any" inputmode="decimal" value="${+((m.dauer || 0) / fak).toFixed(2)}"></div>
      </div></div>`}
    <div class="btn-reihe"><button class="btn-primary" id="nz-ok" type="button">${tagesm ? 'Diesen Tag eintragen' : 'Nachtragen'}</button></div>
    <div class="label" id="nz-titel" style="margin-top:1.1rem">Heute bisher</div>
    <div class="eintrag-liste" id="nz-liste"></div>
    <button class="btn-leise" id="nz-zurueck" type="button">Letzten zurücknehmen</button>`);
  const formZuruecksetzen = () => {
    bearbeite = null; $('#nz-ok').textContent = tagesm ? 'Diesen Tag eintragen' : 'Nachtragen';
    if (!tagesm) { $('#nz-zeit').value = hhmm(new Date()); $('#nz-dauer').value = +((m.dauer || 0) / fak).toFixed(2); document.querySelectorAll('#nz-chips [data-vor]').forEach(x => x.classList.toggle('an', x.dataset.vor === '0')); }
  };
  const liste = () => {
    const e = eintraege();
    $('#nz-titel').textContent = tag ? 'Gestern' : 'Heute bisher';
    $('#nz-liste').innerHTML = e.length ? e.map(t => {
      const von = new Date(t.ts - (t.min || 0) * 60000), bis = new Date(t.ts);
      const zeit = tagesm ? 'ganzer Tag' : `${t.min ? hhmm(von) + '–' : ''}${hhmm(bis)}${t.min ? ' · ' + fmtDauer(t.min) : ''}`;
      return `<div class="eintrag${bearbeite === t.id ? ' an' : ''}"><button type="button" class="eintrag-zeit" data-aendern="${t.id}"${tagesm ? ' disabled' : ''}>${zeit}</button>
        <button type="button" class="eintrag-weg" data-weg="${t.id}" aria-label="Eintrag ${zeit} entfernen">✕</button></div>`;
    }).join('') : '<p class="form-hinweis">Noch nichts.</p>';
    $('#nz-zurueck').classList.toggle('hidden', !e.length);
    document.querySelectorAll('#nz-liste [data-aendern]').forEach(b => b.onclick = () => {
      const t = S.taps.find(x => x.id === b.dataset.aendern); if (!t) return;
      bearbeite = t.id; $('#nz-zeit').value = hhmm(new Date(t.ts)); $('#nz-dauer').value = +((t.min || 0) / fak).toFixed(2);
      $('#nz-ok').textContent = 'Änderung speichern'; document.querySelectorAll('#nz-chips [data-vor]').forEach(x => x.classList.remove('an')); liste();
    });
    document.querySelectorAll('#nz-liste [data-weg]').forEach(b => b.onclick = () => entfernen(b.dataset.weg));
  };
  const entfernen = id => {
    const i = S.taps.findIndex(t => t.id === id); if (i < 0) return;
    const [weg] = S.taps.splice(i, 1); speichern(); renderHeute(); if (bearbeite === id) formZuruecksetzen(); liste();
    toast(`${m.name}: Eintrag entfernt`, () => { S.taps.splice(i, 0, weg); speichern(); renderHeute(); if ($('#nz-liste')) liste(); toast('Wiederhergestellt'); });
  };
  document.querySelectorAll('#nz-tag button').forEach(b => b.onclick = () => {
    tag = +b.dataset.wert; document.querySelectorAll('#nz-tag button').forEach(x => x.classList.toggle('an', x === b));
    formZuruecksetzen(); liste();
  });
  // Chips: sichtbar wählen und die Uhrzeit kurz aufleuchten lassen, damit klar ist, was passiert
  const chipsAn = b => document.querySelectorAll('#nz-chips [data-vor]').forEach(x => x.classList.toggle('an', x === b));
  document.querySelectorAll('#nz-chips [data-vor]').forEach(b => b.onclick = () => {
    const z = $('#nz-zeit'); z.value = hhmm(new Date(Date.now() - b.dataset.vor * 60000)); chipsAn(b);
    z.classList.remove('blitz'); void z.offsetWidth; z.classList.add('blitz');
    $('#nz-ok').textContent = `${bearbeite ? 'Änderung speichern' : 'Nachtragen'} · ${z.value}`;
  });
  if (!tagesm) $('#nz-zeit').addEventListener('input', () => { chipsAn(null); $('#nz-ok').textContent = `${bearbeite ? 'Änderung speichern' : 'Nachtragen'} · ${$('#nz-zeit').value}`; });
  $('#nz-ok').onclick = () => {
    let ts, min;
    if (tagesm) {
      if (eintraege().length) { toast(`${m.name} ist an diesem Tag schon eingetragen`); return; }
      const d = tagBeginn(); d.setHours(12); ts = d.getTime(); min = m.dauer || 1440;
    } else {
      const [h, mi] = ($('#nz-zeit').value || hhmm(new Date())).split(':').map(Number);
      const d = tagBeginn(); d.setHours(h, mi, 0, 0);
      if (h < WECHSEL_H()) d.setDate(d.getDate() + 1);   // 0:30 gehört noch zu diesem Abend
      ts = d.getTime();
      min = Math.max(0, Math.round((parseFloat(String($('#nz-dauer').value).replace(',', '.')) || 0) * fak));
    }
    if (bearbeite) {
      const t = S.taps.find(x => x.id === bearbeite); const alt = { ...t };
      Object.assign(t, { ts, min }); speichern(); renderHeute(); sheetZu();
      toast(`${m.name}: geändert`, () => { Object.assign(t, alt); speichern(); renderHeute(); toast('Wiederhergestellt'); });
      return;
    }
    const neu = { id: uid(), mid, ts, min };
    S.taps.push(neu); speichern(); renderHeute(); sheetZu();
    toast(`${m.name} nachgetragen${tagesm ? '' : ' · ' + hhmm(new Date(ts))}`, () => { S.taps = S.taps.filter(t => t.id !== neu.id); speichern(); renderHeute(); toast('Zurückgenommen'); });
  };
  $('#nz-zurueck').onclick = () => { const e = eintraege(); if (e.length) entfernen(e.reduce((a, b) => (a.ts > b.ts ? a : b)).id); };
  liste();
}

// Tippen und langer Druck
const DRUCK_MS = 1100;   // Ring: 0,2 s warten + 0,8 s füllen, dann kurz voll stehen lassen;   // langer Druck: Moment-Fenster (Nachtragen, ändern, zurücknehmen) bzw. Feierabend anpassen
let druck = null;
function druckStart(e) {
  const el = e.target.closest('.kachel[data-mid], .kachel[data-sonder="feierabend"]');
  if (!el || (e.button !== undefined && e.button !== 0)) return;
  const mid = el.dataset.mid;
  const kannZurueck = true;   // langer Druck öffnet immer das Fenster, auch ohne Eintrag (zum Nachtragen)
  druck = { el, mid, x: e.clientX, y: e.clientY, lang: false };
  if (kannZurueck) {
    el.classList.add('drueckt');
    druck.timer = setTimeout(() => {
      druck.lang = true; el.classList.remove('drueckt');
      if (navigator.vibrate) navigator.vibrate(15);
      if (mid) momentZeitSheet(mid); else arbeitSheet();
    }, DRUCK_MS);
  }
}
function druckAbbruch() { if (!druck) return; clearTimeout(druck.timer); druck.el.classList.remove('drueckt'); druck = null; }
function druckEnde(e) {
  if (!druck) return;
  const d = druck; clearTimeout(d.timer); d.el.classList.remove('drueckt'); druck = null;
  if (d.lang) return;
  if (d.mid) zaehlen(d.mid);
  else if (heuteVersatz) arbeitSheet();
  else arbeitTippen();
}
function druckBewegt(e) { if (druck && Math.hypot(e.clientX - druck.x, e.clientY - druck.y) > 12) druckAbbruch(); }

// ── WOCHE ──────────────────────────────────────────────
let wocheVersatz = 0;
const SCHLOSS = '<svg class="schloss" viewBox="0 0 24 24" aria-hidden="true"><rect x="5.5" y="10.5" width="13" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg>';
// Blättern mit kurzem Gleiten: die alte Woche schiebt sich hinaus, die neue kommt von der anderen Seite
function wocheGehe(r, schon = 0) {
  const ziel = wocheVersatz + r, inh = $('#woche-inhalt');
  if (ziel > 0 || ziel < minWocheVersatz()) { inh.style.transition = 'transform .25s ease'; inh.style.transform = ''; inh.style.opacity = ''; return; }
  const w = innerWidth;
  inh.style.transition = 'transform .18s ease-in, opacity .18s ease-in';
  inh.style.transform = `translateX(${r < 0 ? w * 0.6 : -w * 0.6}px)`; inh.style.opacity = '0';
  setTimeout(() => {
    wocheVersatz = ziel; renderWoche();
    inh.style.transition = 'none'; inh.style.transform = `translateX(${r < 0 ? -w * 0.3 : w * 0.3}px)`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      inh.style.transition = 'transform .24s ease-out, opacity .24s ease-out'; inh.style.transform = ''; inh.style.opacity = '';
    }));
  }, schon ? 120 : 170);
}
// Wischen nach links/rechts im Verlauf. Nicht auf der Nachtkarte (eigene Gesten) und nur bei klar waagrechter Bewegung.
function wocheWischen() {
  const v = $('#view-woche'), inh = $('#woche-inhalt'); let w = null;
  v.addEventListener('touchstart', e => {
    w = null;
    if (e.touches.length !== 1 || e.target.closest('#tag-karte, input, textarea, select')) return;
    w = { x: e.touches[0].clientX, y: e.touches[0].clientY, dx: 0, an: false };
  }, { passive: true });
  v.addEventListener('touchmove', e => {
    if (!w) return;
    const dx = e.touches[0].clientX - w.x, dy = e.touches[0].clientY - w.y;
    if (!w.an) {
      if (Math.abs(dy) > 10 && Math.abs(dy) >= Math.abs(dx)) { w = null; return; }   // senkrecht: normales Scrollen
      if (Math.abs(dx) < 14 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      w.an = true;
    }
    const geht = dx > 0 ? wocheVersatz > minWocheVersatz() : wocheVersatz < 0;
    w.dx = geht ? dx : dx * 0.2;   // am Rand nur leicht nachgeben
    inh.style.transition = 'none'; inh.style.transform = `translateX(${w.dx}px)`;
    inh.style.opacity = geht ? String(1 - Math.min(Math.abs(dx) / 700, 0.35)) : '';
  }, { passive: true });
  const ende = () => {
    if (!w || !w.an) { w = null; return; }
    const dx = w.dx; w = null;
    if (Math.abs(dx) > 70) wocheGehe(dx > 0 ? -1 : 1, true);
    else { inh.style.transition = 'transform .25s ease, opacity .25s ease'; inh.style.transform = ''; inh.style.opacity = ''; }
  };
  v.addEventListener('touchend', ende); v.addEventListener('touchcancel', ende);
}
function renderWoche() {
  wocheVersatz = Math.max(minWocheVersatz(), Math.min(0, wocheVersatz));
  document.body.classList.toggle('archiv', ansicht === 'woche' && wocheVersatz < 0);   // vergangene Woche: Archiv-Look
  const gesperrt = wocheVersatz <= -2;   // nur die letzte Woche bleibt änderbar, ältere sind abgeschlossen
  const band = $('#archiv-band');
  if (band) {
    band.classList.toggle('hidden', wocheVersatz >= 0);
    band.innerHTML = gesperrt ? `${SCHLOSS}<span>Archiv · abgeschlossen</span>` : '<span>Archiv · letzte Woche, noch änderbar</span>';
  }
  const wochenende = [0, 6].includes(new Date().getDay());
  $('#woche-heute').classList.toggle('hidden', wocheVersatz === 0);
  $('#woche-zurueck').disabled = wocheVersatz <= minWocheVersatz();
  const start = wocheStart(new Date()); start.setDate(start.getDate() + wocheVersatz * 7);
  const ende = new Date(start); ende.setDate(ende.getDate() + 7);
  const letzter = new Date(ende); letzter.setDate(letzter.getDate() - 1);
  $('#woche-kw').textContent = `KW ${kw(start)}`;
  const f = { day: 'numeric', month: 'long' };
  const anf = start.getMonth() === letzter.getMonth() ? `${start.getDate()}.` : start.toLocaleDateString('de-DE', f);
  $('#woche-spanne').textContent = `${anf} – ${letzter.toLocaleDateString('de-DE', f)}${wocheVersatz === 0 ? ' · diese Woche' : wocheVersatz === -1 ? ' · letzte Woche' : ''}`;
  $('#woche-vor').disabled = wocheVersatz >= 0;

  const taps = tapsZwischen(start, ende);
  const tage = []; for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(d.getDate() + i); tage.push(d); }
  const b = balance(taps, tage);
  const wk = wochenKey(start);
  const notiz = (S.wochen ||= {})[wk] || {};
  const abende = tage.map(d => ({ d, z: S.feierabend[tagKey(d)] })).filter(x => x.z && !freierTag(x.d));   // freie Tage stehen unten als Notiz
  const gefuehlt = Object.keys(WAHL).some(art => tage.some(d => (S[art] || {})[tagKey(d)]));

  const teile = [];
  const gesamtMin = taps.reduce((s, t) => s + (istTagesmoment(moment(t.mid)) ? 0 : t.min || 0), 0);
  teile.push(`<div class="card">${balanceHTML(b, S.einstellungen.balanceStil, 'Balance der Woche')}
    <div class="seg klein arbeit-schalter" role="group" aria-label="Arbeit in der Balance">
      <button type="button" data-arbeit="1" class="${arbeitMitzaehlen() ? 'an' : ''}">mit Arbeit</button><button type="button" data-arbeit="0" class="${arbeitMitzaehlen() ? '' : 'an'}">ohne Arbeit</button></div></div>`);

  if (!taps.length && !abende.length && !gefuehlt) {
    teile.push(`<div class="card"><p class="leer-text">In dieser Woche ist noch nichts gesammelt. Das ist in Ordnung.</p></div>`);
  }

  // Über den Tag: wann die Momente lagen (Leuchtpunkte, Größe = Dauer, Strich = Feierabend)
  if (taps.length) teile.push(`<div class="card"><div class="card-header"><h2>Über den Tag</h2><button type="button" class="btn-klein rechts btn-voll" id="tag-voll-auf" aria-label="Über den Tag im Vollbild">⤢</button></div>
      <div class="tag-filter" role="group" aria-label="Momente zeigen">
        ${[['erholsam', 'erholsam', 'reg'], ['fuermich', 'für mich', 'mich'], ['aktiv', 'aktiv', 'akt']].map(([k, t, c]) => `<button type="button" class="btn-klein filter-${c}${heatFilter[k] ? ' an' : ''}" data-filter="${k}" aria-pressed="${heatFilter[k]}">${t}</button>`).join('')}
        <button type="button" class="btn-klein filter-alle${alleAn() ? ' an' : ''}" data-filter="alle" aria-pressed="${alleAn()}">Alle</button></div>
      <div id="tag-karte">${tagKarte(taps, tage)}</div>
      <p class="tag-legende">Länge = Dauer · Schleier = Arbeit · Strich = Ende</p>
      <p class="tag-legende leise">Mehr sehen: antippen · zwei Finger · lange drücken</p></div>`);


  if (taps.length) {
    const pm = {};
    for (const t of runden(taps)) { const p = pm[t.mid] ||= { n: 0, min: 0 }; p.n++; p.min += t.min; }
    // gleiche Ordnung wie auf Heute: Gruppen in ihrer Reihenfolge, darin die Momente in ihrer Reihenfolge
    const zeile = m => {
      const p = pm[m.id];
      const rgb = m.modus === 'akt' ? 'var(--akt-rgb)' : 'var(--reg-rgb)';
      let band = '';
      if (m.etwa) {
        const zEnde = m.genugWoche && m.genugWoche > m.etwa ? m.genugWoche : m.etwa;
        const max = Math.max(p.n, zEnde) + 1.5;
        const pos = v => Math.min(100, (v / max) * 100);
        const zAnf = Math.max(0, m.etwa - 0.5);
        band = `<div class="richtband" style="--m-rgb:${rgb}" aria-hidden="true">
            <div class="richtband-zone" style="left:${pos(zAnf)}%;width:${pos(zEnde + 0.5) - pos(zAnf)}%"></div>
            <div class="richtband-punkt" style="left:${pos(p.n)}%"></div></div>
          <div class="richtband-text">Richtwert etwa ${m.etwa} × pro Woche</div>`;
      }
      return `<div class="summe">
        <button type="button" class="summe-symbol${licht.has(m.id) ? ' licht' : ''}" data-licht="${esc(m.id)}" aria-pressed="${licht.has(m.id)}" aria-label="${esc(m.name)} in „Über den Tag“ hervorheben">${symbolHTML(m) || '<span class="summe-punkt"></span>'}</button>
        <span class="summe-name">${esc(m.name)}${m.angebot ? herzHTML(['angekommen', 'getragen'].includes(notiz.angebote?.[m.id]?.an), ' summe-herz') : ''}</span>
        <span class="summe-wert">${istTagesmoment(m) ? `<strong>${tage.filter(d => tagMit(m.id, d)).length}</strong> ${tage.filter(d => tagMit(m.id, d)).length === 1 ? 'Tag' : 'Tage'}` : `<strong>${p.n} ×</strong>${p.min ? ' · ' + fmtDauer(p.min) : ''}`}</span>
        ${band}</div>`;
    };
    // je Gruppe: aktiver und regenerativer Anteil (beides halb/halb)
    const pg = {};
    for (const t of taps) {
      const m = moment(t.mid), w = istTagesmoment(m) ? 0 : t.min || 10, g = GRUPPEN[m.gruppe] ? m.gruppe : '';
      const e = pg[g] ||= { akt: 0, reg: 0, min: 0 };
      if (istTagesmoment(m)) continue;   // sichtbar in der Liste, aber ohne Gewicht im Balken
      if (m.modus === 'akt') e.akt += w; else if (m.modus === 'reg') e.reg += w; else { e.akt += w / 2; e.reg += w / 2; }
      e.min += t.min || 0;
    }
    const maxG = Math.max(1, ...Object.values(pg).map(e => e.akt + e.reg));
    // Gruppen in der eingestellten Reihenfolge, geschlossen; darin die Momente in ihrer Reihenfolge
    const gz = [...Object.keys(GRUPPEN), ''].filter(g => pg[g]).map(g => {
      const e = pg[g], breite = e.akt + e.reg ? Math.max(6, (e.akt + e.reg) / maxG * 100) : 0;
      const liste = S.momente.filter(m => pm[m.id] && (g ? m.gruppe === g : !GRUPPEN[m.gruppe]));
      return `<details class="wgruppe"><summary class="gruppe-zeile">
        <span class="gruppe-name">${esc(g ? GRUPPEN[g] : 'Ohne Gruppe')}<span class="gruppe-anzahl">${liste.length === 1 ? '1 Moment' : liste.length + ' Momente'}</span></span>
        <span class="gruppe-spur"><span class="gruppe-fuell" style="width:${breite}%" role="img" aria-label="${e.akt > e.reg ? 'eher aktiv' : e.reg > e.akt ? 'eher regenerativ' : 'ausgeglichen'}">
          <span class="teil-akt" style="flex-grow:${e.akt}"></span><span class="teil-reg" style="flex-grow:${e.reg}"></span></span></span>
        <span class="gruppe-wert">${e.min ? fmtDauer(e.min) : ''}</span><span class="auf" aria-hidden="true">›</span></summary>
        <div class="wgruppe-momente">${liste.map(zeile).join('')}</div></details>`;
    }).join('');
    teile.push(`<div class="card"><div class="card-header"><h2>Momente<span class="h2-sub">${runden(taps).length} Momente${gesamtMin ? ` · ${fmtDauer(gesamtMin)}` : ''}</span></h2><button class="btn-klein rechts btn-alle" type="button" aria-expanded="false" aria-label="Alle Zeilen öffnen"><span class="dreieck" aria-hidden="true">▸</span> Alle</button></div><div class="gruppen">${gz}</div>
      <div class="band-legende"><span class="akt">aktiv</span><span class="reg">regenerativ</span></div></div>`);
  }

  // Rahmen des Tages: je eine schmale Grafik direkt in der Zeile, ohne Aufklappen
  // Reihenfolge wie auf Heute: Schlaf, dann Arbeit (Feierabend, an freien Tagen als Notiz), Essen, Trinken
  const rahmen = [];
  const gefuehltZeile = art => {
    const werte = tage.map(d => (S[art] || {})[tagKey(d)]).filter(Boolean);
    if (!werte.length) return;
    const pos = w => { const i = WAHL[art].werte.findIndex(x => x[0] === w); return i < 0 ? 0.5 : 1 - i / 2; };
    const mitte = werte.reduce((n, w) => n + pos(w), 0) / werte.length;
    const wort = WAHL[art].werte[mitte >= 0.75 ? 0 : mitte <= 0.25 ? 2 : 1][1];
    rahmen.push(`<div class="rahmen-zeile"><span class="rahmen-name">${WAHL[art].name}</span>${skala(art, werte, pos, mitte, wort)}<span class="rahmen-kurz">${werte.length > 1 ? 'eher ' : ''}${wort}</span></div>`);
  };
  gefuehltZeile('schlaf');
  if (abende.length) {
    const kurz = abende.length > 1 ? `meist ${median(abende.map(a => zuMin(a.z)))}` : abende[0].z;
    rahmen.push(`<div class="rahmen-zeile"><span class="rahmen-name">Feierabend</span>${abendMini(abende)}<span class="rahmen-kurz">${kurz}</span></div>`);
  }
  // Arbeit an freien Tagen: nur eine kleine Notiz, keine Summe
  const FREI_TEXT = { etwas: 'etwas gearbeitet', halb: 'halber Tag', normal: 'ganzer Tag', viel: 'viel gearbeitet' };
  const freiArbeit = tage.filter(freierTag).map(d => { const k = tagKey(d); return { d, w: (S.arbeitStufe || {})[k] || (arbeitBloecke(k).length ? 'etwas' : '') }; })
    .filter(x => x.w).map(({ d, w }) => `<span class="nowrap">${TAGE_KURZ[d.getDay()]} · ${FREI_TEXT[w] || w}</span>`);
  if (freiArbeit.length) rahmen.push(`<div class="rahmen-zeile"><span class="rahmen-name">Arbeit am freien Tag</span><span class="rahmen-notiz breit">${freiArbeit.join(', ')}</span></div>`);
  gefuehltZeile('essen');
  gefuehltZeile('trinken');
  if (rahmen.length) teile.push(`<div class="card"><div class="card-header"><h2>Rahmen des Tages</h2></div><div class="rahmen-liste">${rahmen.join('')}</div></div>`);

  // Woche abschließen: der eine Ort zum Nachdenken. Angebote nur, wenn es diese Woche welche gab.
  const angebote = S.momente.filter(m => m.angebot && taps.some(t => t.mid === m.id));
  const seg = (mid, feld, optionen) => `<div class="seg klein" data-mid="${esc(mid)}" data-feld="${feld}">${optionen.map(([w, t]) =>
    `<button type="button" data-wert="${w}" class="${notiz.angebote?.[mid]?.[feld] === w ? 'an' : ''}"${gesperrt ? ' disabled' : ''}>${t}</button>`).join('')}</div>`;
  const tagesM = S.momente.find(m => istTagesmoment(m) && tage.some(d => tagMit(m.id, d)));
  const frage = tagesM ? `Was möchtest du von „${esc(tagesM.name)}“ in die nächsten Tage mitnehmen?` : REFLEXION[kw(start) % REFLEXION.length];
  // Sichtbar: in dieser Woche nur am Wochenende, in der letzten Woche immer (änderbar), davor nur lesend und nur mit Inhalt
  const hatNotiz = !!(notiz.satz || notiz.abgeschlossen || Object.values(notiz.angebote || {}).some(a => a && (a.an || a.mir)));
  const zeigeAbschluss = wocheVersatz === -1 || (wocheVersatz === 0 && wochenende) || (gesperrt && hatNotiz);
  if (zeigeAbschluss) teile.push(`<div class="card${gesperrt ? ' gesperrt' : ''}"><details class="wgruppe abschluss"><summary class="gruppe-zeile rueck-zeile">
      <span class="gruppe-name">${gesperrt ? 'Wochenabschluss' : 'Woche abschließen'}</span><span class="rahmen-kurz" id="abschluss-stand">${gesperrt ? SCHLOSS : ''}${notiz.abgeschlossen ? 'abgeschlossen' : ''}</span><span class="auf" aria-hidden="true">›</span></summary>
    <div class="abschluss-inhalt">
      ${angebote.length ? `<div class="label">Angebote</div>${angebote.map(m => `<div class="angebot" data-angebot="${esc(m.id)}">
        <div class="angebot-name">${herzHTML(['angekommen', 'getragen'].includes(notiz.angebote?.[m.id]?.an))} ${esc(m.name)}</div>
        <div class="angebot-frage">Wie kam es an?</div>${seg(m.id, 'an', [['offen', 'offen'], ['angekommen', 'angekommen'], ['getragen', 'hat getragen']])}
        <div class="angebot-frage">Hat es mir auch etwas gegeben?</div>${seg(m.id, 'mir', [['wenig', 'wenig'], ['etwas', 'etwas'], ['viel', 'viel']])}
      </div>`).join('')}` : ''}
      <div class="label">Eine Frage</div>
      <p class="reflexion">${gesperrt && notiz.frage ? notiz.frage : frage}</p>
      ${gesperrt ? (notiz.satz ? `<p class="abschluss-satz-fest">${esc(notiz.satz)}</p>` : '') : `<textarea id="abschluss-satz" rows="3" maxlength="400" placeholder="Wenn du magst, ein Satz. Kann auch leer bleiben.">${esc(notiz.satz || '')}</textarea>
      <button class="btn-primary" id="btn-abschluss" type="button">${notiz.abgeschlossen ? 'Gespeichert' : 'Woche abschließen'}</button>`}
    </div></details></div>`);

  // Rückschau: die eigenen Sätze aus „Woche abschließen“, neueste zuerst. Wochen ohne Satz fehlen einfach.
  const saetze = Object.entries(S.wochen || {}).filter(([, n]) => n.satz).map(([k, n]) => ({ k, n, st: n.start || wocheAusKey(k) })).sort((a, b) => b.st - a.st);
  if (saetze.length && (wocheVersatz < 0 || wochenende)) teile.push(`<div class="card"><details class="wgruppe rueckschau"><summary class="gruppe-zeile rueck-zeile">
      <span class="gruppe-name">Rückschau<span class="gruppe-anzahl">${saetze.length === 1 ? 'ein Satz' : saetze.length + ' Sätze'}</span></span><span class="auf" aria-hidden="true">›</span></summary>
    <div class="rueckschau-liste">${saetze.map(({ k, n, st }) => {
      const a = new Date(st), e = new Date(st); e.setDate(e.getDate() + 6);
      const f = { day: 'numeric', month: 'short' };
      return `<button type="button" class="rueckschau-eintrag${k === wk ? ' diese' : ''}" data-woche="${st}">
        <span class="rueckschau-kw">KW ${kw(a)} · ${a.toLocaleDateString('de-DE', f)} – ${e.toLocaleDateString('de-DE', f)}</span>
        <span class="rueckschau-frage">${n.frage || REFLEXION[kw(a) % REFLEXION.length]}</span>
        <span class="rueckschau-satz">${esc(n.satz)}</span></button>`;
    }).join('')}</div></details></div>`);

  $('#woche-inhalt').innerHTML = teile.join('');
  // Eintrag antippen: zu dieser Woche springen
  document.querySelectorAll('#woche-inhalt [data-woche]').forEach(b => b.onclick = () => {
    wocheVersatz = Math.round((+b.dataset.woche - wocheStart(new Date()).getTime()) / (7 * 86400000));
    renderWoche(); window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  const vollAuf = () => tagVollbild(taps, tage, $('#woche-kw').textContent + ' · ' + $('#woche-spanne').textContent);
  if ($('#tag-karte')) { $('#tag-karte')._wolken = tagWolken; tagKarteGesten($('#tag-karte'), { antippen: vollAuf }); }
  if ($('#tag-voll-auf')) $('#tag-voll-auf').onclick = vollAuf;
  document.querySelectorAll('#woche-inhalt [data-arbeit]').forEach(b => b.onclick = () => {
    S.einstellungen.arbeitInBalance = b.dataset.arbeit === '1'; speichern(); renderWoche(); renderHeute();
  });

  // Über den Tag: erholsam / aktiv ein- und ausblenden (ohne die übrigen Karten neu zu zeichnen)
  const karteNeu = () => { const s = $('#tag-karte .tag-svg'); if (s) { s.outerHTML = tagKarte(taps, tage); $('#tag-karte')._wolken = tagWolken; $('#tag-karte')._setzen?.(); } };
  document.querySelectorAll('#woche-inhalt [data-filter]').forEach(btn => btn.onclick = () => {
    const f = btn.dataset.filter;
    if (f === 'alle') Object.assign(heatFilter, alleAn() ? HEAT_START : { erholsam: true, fuermich: true, aktiv: true });   // nochmal: zurück zum Anfang
    else heatFilter[f] = !heatFilter[f];
    document.querySelectorAll('#woche-inhalt [data-filter]').forEach(b => {
      const an = b.dataset.filter === 'alle' ? alleAn() : heatFilter[b.dataset.filter];
      b.classList.toggle('an', an); b.setAttribute('aria-pressed', an);
    });
    karteNeu();
  });
  // Scheinwerfer: Moment in „Momente“ antippen, seine Wolken leuchten golden, die übrigen werden blass
  document.querySelectorAll('#woche-inhalt [data-licht]').forEach(el => el.onclick = () => {
    const id = el.dataset.licht;
    licht.has(id) ? licht.delete(id) : licht.add(id);
    document.querySelectorAll(`#woche-inhalt [data-licht="${CSS.escape(id)}"]`).forEach(x => { x.classList.toggle('licht', licht.has(id)); x.setAttribute('aria-pressed', licht.has(id)); });
    karteNeu();
  });
  // Woche abschließen
  const notizSchreiben = () => (S.wochen[wk] ||= {});
  document.querySelectorAll('#woche-inhalt .abschluss .seg').forEach(sg => sg.addEventListener('click', e => {
    const bt = e.target.closest('[data-wert]'); if (!bt) return;
    const n = notizSchreiben(), a = (n.angebote ||= {})[sg.dataset.mid] ||= {};
    a[sg.dataset.feld] = a[sg.dataset.feld] === bt.dataset.wert ? undefined : bt.dataset.wert;
    sg.querySelectorAll('button').forEach(x => x.classList.toggle('an', x.dataset.wert === a[sg.dataset.feld]));
    const voll = ['angekommen', 'getragen'].includes(a.an);
    sg.closest('.angebot').querySelector('.herz-wrap').classList.toggle('voll', voll);
    speichern();
  }));
  const satz = $('#abschluss-satz');
  // der Satz merkt sich seine Frage und die Woche, damit die Rückschau sie später zeigen kann
  if (satz) satz.oninput = () => { const n = notizSchreiben(); n.satz = satz.value.trim() || undefined; n.frage = frage; n.start = start.getTime(); speichern(); };
  const btnAb = $('#btn-abschluss');
  if (btnAb) btnAb.onclick = () => {
    notizSchreiben().abgeschlossen = Date.now(); speichern();
    btnAb.textContent = 'Gespeichert'; $('#abschluss-stand').textContent = 'abgeschlossen';
    btnAb.closest('details').open = false;
    toast('Woche abgeschlossen. Es ist nichts mehr offen.');
  };
  // „▸ Alle“: öffnet bzw. schließt alle Zeilen einer Karte; passt sich an, wenn Zeilen einzeln geöffnet werden
  document.querySelectorAll('#woche-inhalt .btn-alle').forEach(btn => {
    const zeilen = [...btn.closest('.card').querySelectorAll('details.wgruppe')];
    const anzeigen = () => {
      const alle = zeilen.length > 0 && zeilen.every(d => d.open);
      btn.classList.toggle('offen', alle);
      btn.setAttribute('aria-expanded', alle);
      btn.setAttribute('aria-label', alle ? 'Alle Zeilen schließen' : 'Alle Zeilen öffnen');
    };
    btn.onclick = () => { const auf = !zeilen.every(d => d.open); zeilen.forEach(d => { d.open = auf; }); anzeigen(); };
    zeilen.forEach(d => d.addEventListener('toggle', anzeigen));
    anzeigen();
  });
}

// ── Über den Tag ──
const HEAT_START = { erholsam: true, fuermich: true, aktiv: false };
const heatFilter = { ...HEAT_START };
const alleAn = () => heatFilter.erholsam && heatFilter.fuermich && heatFilter.aktiv;
// Scheinwerfer: hervorgehobene Momente (nur bis zum nächsten Wechsel zwischen Heute und Verlauf)
const licht = new Set();
// Bedeutung eines Moments: verändert nur das Aussehen (Breite und Leuchten), nie Balance, Anzahl oder Richtwert
const BEDEUTUNG = { normal: 'normal', mehr: 'mehr', stark: 'stark' };
const BREITE = { normal: 10, mehr: 12.5, stark: 15 };
// Bedeutung zum Zeitpunkt eines Eintrags: gewichtAb merkt sich, ab wann welche Bedeutung gilt („ab jetzt“).
// Ohne Liste gilt die aktuelle Bedeutung für alle Einträge („auch für frühere“).
function gewichtZu(m, ts) {
  let g = m.gewicht || 'normal';
  if (m.gewichtAb?.length) { g = m.gewichtAb[0].g; for (const e of m.gewichtAb) if (e.ab <= ts) g = e.g; }
  return BEDEUTUNG[g] ? g : 'normal';
}
const REFLEXION = ['Was hat dir diese Woche gutgetan?', 'Welche Ruheinsel möchtest du behalten?', 'Was darf nächste Woche etwas weniger sein?', 'Wofür bist du diese Woche dankbar?'];
// Art eines Moments in der Karte: erholsam, aktiv für mich oder aktiv
const ART = { reg: 'reg', beides: 'mich', akt: 'akt' };
const ART_FILTER = { reg: 'erholsam', mich: 'fuermich', akt: 'aktiv' };
const WOLKE_RGB = { reg: '246,240,228', mich: '134,189,181', akt: '217,163,106' };
const LICHT_RGB = '240,200,110';
// opt.H: andere Höhe (Vollbild), opt.achsen === false: Beschriftung außerhalb als HTML (bleibt beim Zoomen am Rand)
let tagGeo = null;
function tagKarte(taps, tage, opt = {}) {
  const ohne = opt.achsen === false;
  const W = 320, H = opt.H || 300, L = ohne ? 4 : 30, R = ohne ? 4 : 8, T = 10, B = ohne ? 10 : 26;
  // getippt wird am Ende: die Wolke liegt auf der Mitte des Moments
  const pts = runden(taps).map(t => { const m = moment(t.mid); return { t, m, art: m && (ART[m.modus] || 'reg'), d: new Date(t.ts - (t.min || 0) * 30000) }; })
    .filter(p => p.m && !istTagesmoment(p.m) && (heatFilter[ART_FILTER[p.art]] || licht.has(p.m.id)));
  // nach Mitternacht bis zum Tageswechsel: 24, 25, 26 … in derselben Spalte
  const stunde = d => { const h = d.getHours() + d.getMinutes() / 60; return h < WECHSEL_H() ? h + 24 : h; };
  const tagIndex = d => Math.round((logTag(d) - tage[0]) / 86400000);
  const fa = tage.map((d, i) => ({ i, z: S.feierabend[tagKey(d)] })).filter(x => x.z).map(x => { const h = zuMin(x.z) / 60; return { i: x.i, h: h < WECHSEL_H() ? h + 24 : h }; });
  // Arbeit: Blöcke mit Start als warmer Schleier (der heute laufende Block bis jetzt)
  const ab = [];
  tage.forEach((d, i) => {
    const k = tagKey(d), bl = (S.arbeitZeit || {})[k] || [];
    bl.forEach((b, j) => {
      if (!b.von) return;
      let h0 = zeitH(b.von), h1 = b.bis ? zeitH(b.bis) : (k === tagKey(logTag()) ? stunde(new Date()) : null);
      if (h1 == null) return;
      if (h1 < h0) [h0, h1] = [h1, h0];
      ab.push({ i, h0, h1, ende: !!b.bis && j < bl.length - 1 });
    });
  });
  const alle = [...pts.map(p => stunde(p.d)), ...fa.map(f => f.h), ...ab.flatMap(a => [a.h0, a.h1])];
  const hMin = Math.min(7, Math.floor(Math.min(...alle, 24)) - 1), hMax = Math.max(23, Math.ceil(Math.max(...alle, 0)) + 1);   // ab 24 = nach Mitternacht
  const spalte = (W - L - R) / 7;
  const x = i => L + (i + 0.5) * spalte, y = h => T + (h - hMin) / (hMax - hMin) * (H - T - B);
  const proStunde = (H - T - B) / (hMax - hMin);
  const tagNamen = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  tagGeo = { x, y, hMin, hMax, proStunde, W, H };
  let achsen = ohne ? '' : tagNamen.map((n, i) => `<text x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="middle" class="tag-achse">${n}</text>`).join('');
  if (!ohne) for (let h = Math.ceil(hMin / 4) * 4; h <= hMax; h += 4) achsen += `<text x="${L - 8}" y="${(y(h) + 3).toFixed(1)}" text-anchor="end" class="tag-achse">${h === 24 ? 24 : h % 24}</text>`;
  // Tagesmomente als Schleier über der ganzen Spalte, danach ein leiser Nachklang über drei Tage
  const NACH = [1, 0.55, 0.3, 0.12];
  const schleier = tage.map((d, i) => {
    let st = 0, art = 'reg';
    if (d > new Date()) return '';   // kein Nachklang in die Zukunft
    S.momente.filter(istTagesmoment).forEach(m => {
      for (let k = 0; k < NACH.length; k++) {
        const v = new Date(d); v.setDate(v.getDate() - k);
        if (tagMit(m.id, v)) { if (NACH[k] > st) { st = NACH[k]; art = ART[m.modus] || 'reg'; } break; }
      }
    });
    if (!st) return '';
    return `<rect x="${(x(i) - spalte * 0.32).toFixed(1)}" y="${T}" width="${(spalte * 0.64).toFixed(1)}" height="${H - T - B}" rx="14" fill="url(#schleier-${art})" opacity="${(st * 0.09).toFixed(3)}" filter="url(#schleier-weich)" class="tag-schleier"/>`;
  }).join('');
  const arbeitSchleier = ab.map(a => `<rect x="${(x(a.i) - spalte * 0.34).toFixed(1)}" y="${y(a.h0).toFixed(1)}" width="${(spalte * 0.68).toFixed(1)}" height="${Math.max(2, y(a.h1) - y(a.h0)).toFixed(1)}" rx="5" class="tag-arbeit" filter="url(#arbeit-weich)"/>`).join('')
    + ab.map(a => `<line x1="${(x(a.i) - spalte * 0.32).toFixed(1)}" x2="${(x(a.i) + spalte * 0.32).toFixed(1)}" y1="${y(a.h0).toFixed(1)}" y2="${y(a.h0).toFixed(1)}" class="tag-arbeitbeginn"/>`
      + (a.ende ? `<line x1="${(x(a.i) - spalte * 0.32).toFixed(1)}" x2="${(x(a.i) + spalte * 0.32).toFixed(1)}" y1="${y(a.h1).toFixed(1)}" y2="${y(a.h1).toFixed(1)}" class="tag-arbeitpause"/>` : '')).join('');
  const striche = fa.map(f => `<line x1="${(x(f.i) - spalte * 0.32).toFixed(1)}" x2="${(x(f.i) + spalte * 0.32).toFixed(1)}" y1="${y(f.h).toFixed(1)}" y2="${y(f.h).toFixed(1)}" class="tag-feierabend"/>`).join('');
  // gleiche Breite für alle, die Länge folgt der Dauer: lange Momente überdecken kurze nicht mehr
  const RANG = { akt: 0, mich: 1, reg: 2 };
  const glow = pts.map(p => {
    const i = Math.min(6, Math.max(0, tagIndex(p.d))), halb = (p.t.min || 0) / 120 * proStunde;
    const von = new Date(p.t.ts - (p.t.min || 0) * 60000), bis = new Date(p.t.ts);
    const zeit = `${tagNamen[i]} ${pad(von.getHours())}:${pad(von.getMinutes())}${p.t.min ? `–${pad(bis.getHours())}:${pad(bis.getMinutes())}` : ''}`;
    const gew = gewichtZu(p.m, p.t.ts);
    return { cx: x(i) + ((p.t.ts / 60000) % 7 - 3) * 0.9, cy: y(stunde(p.d)), rx: BREITE[gew], ry: halb + 8, gew, art: p.art, licht: licht.has(p.m.id), name: p.m.name, zeit };
  }).sort((a, b) => (a.licht - b.licht) || (RANG[a.art] - RANG[b.art]));   // aktiv unten, erholsam oben, Scheinwerfer ganz oben
  // Länge = Dauer, Breite und Leuchten = Bedeutung. Bedeutende Momente bekommen einen feinen Hof, wie kleine Leuchttürme.
  const blass = licht.size > 0;
  const wolke = g => {
    const f = g.licht ? 'licht' : g.art, op = blass && !g.licht ? ' opacity="0.28"' : '';
    const hof = g.gew === 'normal' ? '' : `<ellipse cx="${g.cx.toFixed(1)}" cy="${g.cy.toFixed(1)}" rx="${Math.min(19, g.rx * 1.5).toFixed(1)}" ry="${(g.ry + 7).toFixed(1)}" fill="url(#wolke-${f})" opacity="${g.gew === 'stark' ? 0.5 : 0.3}"/>`;
    const kern = `<ellipse cx="${g.cx.toFixed(1)}" cy="${g.cy.toFixed(1)}" rx="${g.rx}" ry="${g.ry.toFixed(1)}" fill="url(#wolke-${f})"/>`;
    return `<g${op}>${hof}${kern}${g.gew === 'stark' ? kern : ''}</g>`;
  };
  const schein = glow.map(wolke).join('');
  tagWolken = glow;
  const kerne = glow.map(g => `<circle cx="${g.cx.toFixed(1)}" cy="${g.cy.toFixed(1)}" r="${g.gew === 'stark' ? 2 : g.gew === 'mehr' ? 1.6 : 1.3}" class="tag-kern ${g.licht ? 'licht' : g.art}"${blass && !g.licht ? ' opacity="0.3"' : ''}/>`).join('');
  const verlauf = (art, rgb) => `<radialGradient id="wolke-${art}"><stop offset="0" stop-color="rgb(${rgb})" stop-opacity="${art === 'mich' || art === 'licht' ? 0.8 : 0.55}"/><stop offset="0.45" stop-color="rgb(${rgb})" stop-opacity="${art === 'mich' || art === 'licht' ? 0.38 : 0.25}"/><stop offset="1" stop-color="rgb(${rgb})" stop-opacity="0"/></radialGradient>`;
  return `<svg class="tag-svg" viewBox="0 0 ${W} ${H}" data-w="${W}" data-h="${H}" role="img" aria-label="Wann die Momente dieser Woche lagen, ${pts.length} Momente">
    <defs>${Object.entries(WOLKE_RGB).map(([a, r]) => verlauf(a, r)).join('')}${verlauf('licht', LICHT_RGB)}<filter id="schleier-weich" x="-30%" y="-10%" width="160%" height="120%"><feGaussianBlur stdDeviation="5"/></filter><filter id="arbeit-weich" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter>${Object.entries(WOLKE_RGB).map(([a, r]) => `<linearGradient id="schleier-${a}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb(${r})" stop-opacity="0"/><stop offset="0.18" stop-color="rgb(${r})" stop-opacity="1"/><stop offset="0.82" stop-color="rgb(${r})" stop-opacity="1"/><stop offset="1" stop-color="rgb(${r})" stop-opacity="0"/></linearGradient>`).join('')}</defs>
    ${schleier}${arbeitSchleier}${achsen}${striche}${schein}${kerne}</svg>`;
}

// Hineinzoomen mit zwei Fingern: die Karte wird als Vektor neu gezeichnet (bleibt scharf),
// Namen erscheinen als kleine Schilder. In der Karte federt sie beim Loslassen zurück,
// im Vollbild bleibt der Zoom stehen (ein Finger verschiebt, Doppeltipp setzt zurück, nach unten wischen schließt).
// Langer Druck auf eine Wolke: Name und Uhrzeit, deutlich über dem Finger.
let tagWolken = [];
function tagKarteGesten(box, opt = {}) {
  if (!box) return;
  const voll = !!opt.voll;
  const svg = () => box.querySelector('.tag-svg');
  const vbW = () => +(svg()?.dataset.w || 320), vbH = () => +(svg()?.dataset.h || 300);
  const wolken = () => box._wolken || tagWolken;
  let z = 1, tx = 0, ty = 0, feder = 0, gezoomt = false;
  const ebene = document.createElement('div');
  ebene.className = 'tag-namen'; ebene.setAttribute('aria-hidden', 'true');
  box.appendChild(ebene);
  // Maßstab: Bildschirmpixel je viewBox-Einheit bei z = 1
  const mass = () => box.clientWidth / vbW();
  const begrenzen = () => {   // im Vollbild nicht aus dem Bild schieben
    if (!voll) return;
    const B = box.clientWidth, H = box.clientHeight;
    tx = Math.min(0, Math.max(B - B * z, tx)); ty = Math.min(0, Math.max(H - H * z, ty));
  };
  const setzen = () => {
    const s = svg(); if (!s) return;
    begrenzen();
    const k = mass() * z;
    s.setAttribute('viewBox', `${(-tx / k).toFixed(2)} ${(-ty / k).toFixed(2)} ${(vbW() / z).toFixed(2)} ${(vbH() / z).toFixed(2)}`);
    namenZeigen(k);
    if (opt.achsen) opt.achsen(k, tx, ty);
  };
  box._setzen = setzen;
  // Namen nur, wenn die Wolke groß genug ist und kein anderer Name im Weg steht
  const namenZeigen = k => {
    if (!voll && z < 1.35) { ebene.innerHTML = ''; return; }
    const sichtbar = voll ? 1 : Math.min(1, (z - 1.35) / 0.4);
    const belegt = [], teile = [];
    const B = box.clientWidth, H = box.clientHeight;
    [...wolken()].sort((a, b) => b.ry - a.ry).forEach(w => {
      if (w.ry * k < 20) return;
      const x = w.cx * k + tx, y = w.cy * k + ty;
      const halb = w.name.length * 3.9 + 9, r = [x - halb, y - 12, x + halb, y + 12];
      if (r[0] < 2 || r[2] > B - 2 || r[1] < 2 || r[3] > H - 2) return;   // nichts Angeschnittenes
      if (belegt.some(o => r[0] < o[2] && r[2] > o[0] && r[1] < o[3] && r[3] > o[1])) return;
      belegt.push(r);
      teile.push(`<span style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;opacity:${sichtbar.toFixed(2)}">${esc(w.name)}</span>`);
    });
    ebene.innerHTML = teile.join('');
  };
  // weich zurück, mit einem kleinen Nachfedern
  const zurueck = () => {
    cancelAnimationFrame(feder);
    const a = { z, tx, ty }, t0 = performance.now();
    const dauer = matchMedia('(prefers-reduced-motion: reduce)').matches ? 150 : 480;
    const ease = t => { const c = voll ? 0 : 1.25; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; };
    const schritt = now => {
      const t = Math.min(1, (now - t0) / dauer), e = ease(t);
      z = a.z + (1 - a.z) * e; tx = a.tx * (1 - e); ty = a.ty * (1 - e);
      if (t >= 1) { z = 1; tx = 0; ty = 0; }
      setzen();
      if (t < 1) feder = requestAnimationFrame(schritt);
    };
    feder = requestAnimationFrame(schritt);
  };

  // Finger
  let start = null, schieben = null, letzterTipp = 0;
  const mitte = (a, b) => { const r = box.getBoundingClientRect(); return [(a.clientX + b.clientX) / 2 - r.left, (a.clientY + b.clientY) / 2 - r.top]; };
  const abstand = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  box.addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
      tippEnde(); cancelAnimationFrame(feder); schieben = null; gezoomt = true;
      const [a, b] = e.touches, m = mitte(a, b);
      start = { d: abstand(a, b), m: [(m[0] - tx) / z, (m[1] - ty) / z], z };
    } else if (voll && e.touches.length === 1) {
      const t = e.touches[0];
      schieben = { x: t.clientX, y: t.clientY, tx, ty, z0: z, bewegt: false };
    }
  }, { passive: true });
  box.addEventListener('touchmove', e => {
    if (start && e.touches.length === 2) {
      e.preventDefault();
      const [a, b] = e.touches, m = mitte(a, b);
      z = Math.min(5, Math.max(1, start.z * abstand(a, b) / start.d));
      tx = m[0] - start.m[0] * z; ty = m[1] - start.m[1] * z;
      setzen(); return;
    }
    if (schieben && e.touches.length === 1) {
      e.preventDefault();
      const t = e.touches[0], dx = t.clientX - schieben.x, dy = t.clientY - schieben.y;
      if (Math.hypot(dx, dy) > 8) { schieben.bewegt = true; tippEnde(); }
      if (z > 1) { tx = schieben.tx + dx; ty = schieben.ty + dy; setzen(); }
      else if (dy > 0) box.style.transform = `translateY(${dy * 0.5}px)`;   // nach unten ziehen zum Schließen
    }
  }, { passive: false });
  const loslassen = e => {
    if (start && e.touches.length < 2) {
      start = null;
      if (!voll) zurueck();
      return;
    }
    if (schieben && e.touches.length === 0) {
      const t = e.changedTouches[0], dy = t.clientY - schieben.y, dx = t.clientX - schieben.x;
      box.style.transform = '';
      if (voll && schieben.z0 === 1 && z === 1 && dy > 90 && Math.abs(dx) < 70 && opt.schliessen) { opt.schliessen(); return; }
      if (!schieben.bewegt) {   // Doppeltipp: zurück zur ganzen Woche
        const jetzt = Date.now();
        if (jetzt - letzterTipp < 320 && z > 1) zurueck();
        letzterTipp = jetzt;
      }
      schieben = null;
    }
  };
  box.addEventListener('touchend', loslassen);
  box.addEventListener('touchcancel', loslassen);
  // iOS: das Seiten-Zoomen nicht mitnehmen
  ['gesturestart', 'gesturechange'].forEach(n => box.addEventListener(n, e => e.preventDefault()));
  // Trackpad am Rechner (Zwei-Finger-Zoom kommt als wheel mit ctrlKey)
  let radZeit;
  box.addEventListener('wheel', e => {
    if (!e.ctrlKey && !(voll && z > 1)) return;
    e.preventDefault(); cancelAnimationFrame(feder);
    if (!e.ctrlKey) { tx -= e.deltaX; ty -= e.deltaY; setzen(); return; }   // Vollbild: zwei Finger schieben
    const r = box.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    const neu = Math.min(5, Math.max(1, z * Math.exp(-e.deltaY / 80)));
    tx = mx - (mx - tx) * neu / z; ty = my - (my - ty) * neu / z; z = neu; gezoomt = true;
    setzen();
    clearTimeout(radZeit); if (!voll) radZeit = setTimeout(zurueck, 350);
  }, { passive: false });
  if (voll) box.addEventListener('dblclick', () => zurueck());

  // Langer Druck
  let tippTimer, tippStart, lang = false;
  const tipp = document.createElement('div');
  tipp.className = 'tag-tipp'; tipp.setAttribute('role', 'status');
  box.appendChild(tipp);
  function tippEnde() { clearTimeout(tippTimer); tippTimer = null; tipp.classList.remove('an'); }
  box.addEventListener('pointerdown', e => {
    if (!e.isPrimary || start) return;
    tippStart = [e.clientX, e.clientY]; lang = false; gezoomt = false;
    clearTimeout(tippTimer);
    tippTimer = setTimeout(() => {
      const s = svg(); if (!s) return;
      const r = s.getBoundingClientRect(), vb = s.viewBox.baseVal;
      const px = vb.x + (tippStart[0] - r.left) / r.width * vb.width, py = vb.y + (tippStart[1] - r.top) / r.height * vb.height;
      let best = null, wert = 2.2;
      wolken().forEach(w => { const v = ((px - w.cx) / w.rx) ** 2 + ((py - w.cy) / w.ry) ** 2; if (v < wert) { wert = v; best = w; } });
      if (!best) return;
      lang = true;
      tipp.innerHTML = `<strong>${esc(best.name)}</strong><span>${best.zeit}</span>`;
      const br = box.getBoundingClientRect();
      // Mitte über der Wolke, aber immer gut 70 px über dem Finger
      const lx = r.left - br.left + (best.cx - vb.x) / vb.width * r.width;
      const oben = r.top - br.top + (best.cy - best.ry * 0.7 - vb.y) / vb.height * r.height;
      const ly = Math.min(oben, tippStart[1] - br.top - 70);
      tipp.style.left = `${Math.min(br.width - 80, Math.max(80, lx))}px`;
      tipp.style.top = `${voll ? Math.max(40, ly) : ly}px`;
      tipp.classList.add('an');
      if (navigator.vibrate) navigator.vibrate(8);
    }, 450);
  });
  box.addEventListener('pointermove', e => {
    if (tippTimer && !tipp.classList.contains('an') && Math.hypot(e.clientX - tippStart[0], e.clientY - tippStart[1]) > 8) tippEnde();
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(n => box.addEventListener(n, tippEnde));
  box.addEventListener('contextmenu', e => e.preventDefault());
  // Karte antippen (kein langer Druck, kein Zoomen, nicht verschoben): Vollbild
  if (opt.antippen) box.addEventListener('click', e => {
    if (lang || gezoomt || start) return;
    if (tippStart && Math.hypot(e.clientX - tippStart[0], e.clientY - tippStart[1]) > 8) return;
    opt.antippen();
  });
  setzen();
}

// Über den Tag im Vollbild: volle Höhe, Zoom bleibt stehen, Tage und Uhrzeiten bleiben am Rand
function tagVollbild(taps, tage, titel) {
  const v = document.createElement('div');
  v.id = 'tag-voll'; v.setAttribute('role', 'dialog'); v.setAttribute('aria-modal', 'true'); v.setAttribute('aria-label', 'Über den Tag, Vollbild');
  const filterKnoepfe = () => `${[['erholsam', 'erholsam', 'reg'], ['fuermich', 'für mich', 'mich'], ['aktiv', 'aktiv', 'akt']].map(([k, t, c]) => `<button type="button" class="btn-klein filter-${c}${heatFilter[k] ? ' an' : ''}" data-vfilter="${k}" aria-pressed="${heatFilter[k]}">${t}</button>`).join('')}
    <button type="button" class="btn-klein filter-alle${alleAn() ? ' an' : ''}" data-vfilter="alle" aria-pressed="${alleAn()}">Alle</button>`;
  v.innerHTML = `<div class="voll-kopf"><div><h2>Über den Tag</h2><div class="voll-sub">${esc(titel)}</div></div>
      <button class="btn-modal-close" id="voll-zu" type="button" aria-label="Schließen">✕</button></div>
    <div class="tag-filter" role="group" aria-label="Momente zeigen">${filterKnoepfe()}</div>
    <div class="voll-flaeche"><div class="voll-y" aria-hidden="true"></div><div class="voll-karte"></div><div></div><div class="voll-x" aria-hidden="true"></div></div>
    <p class="tag-legende">Zwei Finger: zoomen · ein Finger: schieben · Doppeltipp: zurück · nach unten wischen: schließen</p>`;
  document.body.appendChild(v);
  document.documentElement.classList.add('voll-offen');
  const box = v.querySelector('.voll-karte'), yAchse = v.querySelector('.voll-y'), xAchse = v.querySelector('.voll-x');
  const zeichnen = () => {
    const H = Math.round(320 * box.clientHeight / Math.max(1, box.clientWidth));
    box.innerHTML = tagKarte(taps, tage, { H, achsen: false });
    box._wolken = tagWolken;
    const geo = tagGeo;
    tagKarteGesten(box, {
      voll: true, schliessen: zu,
      achsen: (k, tx, ty) => {
        const proH = geo.proStunde * k, schritt = proH > 44 ? 1 : proH > 22 ? 2 : 4, Hh = box.clientHeight, Bw = box.clientWidth;
        let ys = '';
        for (let h = Math.ceil(geo.hMin / schritt) * schritt; h <= geo.hMax; h += schritt) {
          const py = geo.y(h) * k + ty; if (py < 6 || py > Hh - 6) continue;
          ys += `<span style="top:${py.toFixed(1)}px">${h === 24 ? 24 : h % 24}</span>`;
        }
        yAchse.innerHTML = ys;
        xAchse.innerHTML = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((n, i) => {
          const px = geo.x(i) * k + tx; return px < 8 || px > Bw - 8 ? '' : `<span style="left:${px.toFixed(1)}px">${n}</span>`;
        }).join('');
      },
    });
  };
  function zu() {
    v.remove(); document.documentElement.classList.remove('voll-offen');
    document.removeEventListener('keydown', taste);
    renderWoche();   // Filter und Scheinwerfer auch in der Karte übernehmen
  }
  const taste = e => { if (e.key === 'Escape') zu(); };
  document.addEventListener('keydown', taste);
  v.querySelector('#voll-zu').onclick = zu;
  v.querySelector('.tag-filter').onclick = e => {
    const b = e.target.closest('[data-vfilter]'); if (!b) return;
    const f = b.dataset.vfilter;
    if (f === 'alle') Object.assign(heatFilter, alleAn() ? HEAT_START : { erholsam: true, fuermich: true, aktiv: true });
    else heatFilter[f] = !heatFilter[f];
    v.querySelector('.tag-filter').innerHTML = filterKnoepfe();
    zeichnen();
  };
  requestAnimationFrame(zeichnen);
}

// Feierabend als schmale Zeitachse: Korridor als weiches Band, ein Punkt pro Abend, nur die Endstunden beschriftet
function abendMini(abende) {
  const kv = zuMin(S.einstellungen.korridorVon), kb = zuMin(S.einstellungen.korridorBis);
  const zeiten = abende.map(a => zuMin(a.z));
  const von = Math.floor((Math.min(kv, ...zeiten) - 15) / 60) * 60, bis = Math.ceil((Math.max(kb, ...zeiten) + 15) / 60) * 60;
  const W = 150, x0 = 10, x1 = W - 10, y = 11;
  const x = m => x0 + (m - von) / (bis - von) * (x1 - x0);
  const punkte = zeiten.map(m => `<circle cx="${x(m).toFixed(1)}" cy="${y}" r="4.2" class="mini-punkt"/>`).join('');
  return `<svg class="mini" viewBox="0 0 ${W} 32" role="img" aria-label="Feierabende im Verhältnis zum Korridor ${S.einstellungen.korridorVon} bis ${S.einstellungen.korridorBis}">
    <line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" class="mini-achse"/>
    <rect x="${x(kv).toFixed(1)}" y="${y - 7}" width="${(x(kb) - x(kv)).toFixed(1)}" height="14" rx="7" class="mini-band"/>
    ${punkte}
    <text x="${x0}" y="30" class="mini-text">${pad(von / 60 % 24)}</text><text x="${x1}" y="28" text-anchor="end" class="mini-text">${pad(bis / 60 % 24)}</text></svg>`;
}
// Gefühlte Werte als Skala (z. B. kurz bis erholt): ein blasser Punkt je Tag, ein Ring für die Mitte der Woche
function skala(art, werte, pos, mitte, wort) {
  const W = 150, x0 = 10, x1 = W - 10, y = 11;
  const x = v => x0 + v * (x1 - x0);
  // gleiche Werte liegen nebeneinander, mittig um ihren Platz
  const anzahl = {}, zaehler = {};
  werte.forEach(w => { anzahl[w] = (anzahl[w] || 0) + 1; });
  const punkte = werte.map(w => {
    const k = zaehler[w] = (zaehler[w] || 0) + 1;
    const dx = (k - 1 - (anzahl[w] - 1) / 2) * 7;
    return `<circle cx="${(x(pos(w)) + dx).toFixed(1)}" cy="${y}" r="3.2" class="mini-nacht"/>`;
  }).join('');
  const [oben, , unten] = WAHL[art].werte.map(v => v[1]);
  return `<svg class="mini" viewBox="0 0 ${W} 32" role="img" aria-label="${WAHL[art].name} der Woche, eher ${wort}">
    <line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" class="mini-achse"/>
    <line x1="${x(0.5)}" y1="${y - 3}" x2="${x(0.5)}" y2="${y + 3}" class="mini-achse"/>
    ${punkte}
    <circle cx="${x(mitte).toFixed(1)}" cy="${y}" r="6.5" class="mini-mitte"/>
    <text x="${x0}" y="30" class="mini-text">${unten}</text><text x="${x1}" y="28" text-anchor="end" class="mini-text">${oben}</text></svg>`;
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  const v = s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  return zuHHMM(Math.round(v / 5) * 5);
}

function abendSVG(abende) {
  const kv = zuMin(S.einstellungen.korridorVon), kb = zuMin(S.einstellungen.korridorBis);
  const zeiten = abende.map(a => zuMin(a.z));
  let von = Math.floor((Math.min(kv, ...zeiten) - 30) / 60) * 60;
  let bis = Math.ceil((Math.max(kb, ...zeiten) + 30) / 60) * 60;
  const W = 320, x0 = 12, x1 = W - 12, y = 46;
  const x = m => x0 + (m - von) / (bis - von) * (x1 - x0);
  let ticks = '';
  const schritt = (bis - von) > 360 ? 120 : 60;
  for (let m = von; m <= bis; m += schritt) ticks += `<line x1="${x(m)}" y1="${y - 3}" x2="${x(m)}" y2="${y + 3}" stroke="rgba(255,255,255,.18)"/><text x="${x(m)}" y="${y + 18}" text-anchor="middle">${pad(m / 60 % 24)}</text>`;
  const sortiert = abende.map(a => ({ ...a, m: zuMin(a.z) })).sort((p, q) => p.m - q.m);
  let letzteX = -99, oben = true;
  const punkte = sortiert.map(a => {
    const px = x(a.m);
    if (px - letzteX < 22) oben = !oben; else oben = true;
    letzteX = px;
    const tag = a.d.toLocaleDateString('de-DE', { weekday: 'short' }).replace('.', '');
    return `<circle cx="${px}" cy="${y}" r="5" style="fill:rgb(var(--abend-rgb))" stroke="#0d0d11" stroke-width="2"><title>${tag} ${a.z}</title></circle>
      <text class="tag-label" x="${px}" y="${oben ? y - 12 : y + 30}" text-anchor="middle">${tag}</text>`;
  }).join('');
  return `<svg class="abend-svg" viewBox="0 0 ${W} 100" role="img" aria-label="Feierabende auf einer Zeitachse">
    <rect x="${x(kv)}" y="${y - 9}" width="${x(kb) - x(kv)}" height="18" rx="9" fill="rgba(169,180,222,.14)"/>
    <text x="${(x(kv) + x(kb)) / 2}" y="${y + 50}" text-anchor="middle" style="font-size:9px">Korridor ${S.einstellungen.korridorVon}–${S.einstellungen.korridorBis}</text>
    <line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="rgba(255,255,255,.14)" stroke-width="1.5" stroke-linecap="round"/>
    ${ticks}${punkte}</svg>`;
}

// ── VERWALTUNG ─────────────────────────────────────────
const offeneGruppen = new Set();   // in den Einstellungen geöffnete Gruppen (beim Öffnen der Einstellungen wieder alle zu)
function renderVerwaltung() {
  // Gruppen als Überschriften, darunter ihre Momente. Gleiche Reihenfolge wie auf Heute und in der Woche.
  const sort = sortiermodus;
  $('#btn-sort').textContent = sort ? 'Fertig' : 'Reihenfolge ändern';
  $('#btn-sort').classList.toggle('an', sort);
  $('#sort-hinweis').classList.toggle('hidden', !sort);
  const info = m => [MODI[m.modus], m.dauer ? dauerText(m) : '', m.etwa ? `etwa ${m.etwa} × pro Woche` : '', m.gewicht ? `Bedeutung ${m.gewicht}` : ''].filter(Boolean).join(' · ');
  const zeile = (m, i, liste) => sort
    ? `<div class="moment-zeile sortieren">
      <span class="sym" aria-hidden="true">${symbolHTML(m)}</span>
      <span class="nm">${esc(m.name)}<span class="info" style="display:block">${info(m)}</span></span>
      ${pfeile('m', m.id, i, liste.length, m.name)}</div>`
    : `<button class="moment-zeile" type="button" data-edit="${esc(m.id)}">
      <span class="sym" aria-hidden="true">${symbolHTML(m)}</span>
      <span class="nm">${esc(m.name)}<span class="info" style="display:block">${info(m)}</span></span>
      <span class="modus-punkt ${m.modus}" aria-hidden="true"></span></button>`;
  $('#gm-liste').innerHTML = [...S.gruppen.map(g => g.id), ''].map((g, gi) => {
    const liste = S.momente.filter(m => g ? m.gruppe === g : !GRUPPEN[m.gruppe]);
    if (!g && !liste.length) return '';
    const name = g ? GRUPPEN[g] : 'Ohne Gruppe';
    // Gruppen sind zu Beginn geschlossen: eine Zeile mit Pfeil und Anzahl, ✎ zum Umbenennen
    const auf = offeneGruppen.has(g || '_ohne');
    const anzahl = liste.length === 1 ? '1 Moment' : `${liste.length} Momente`;
    const kopf = `<div class="gm-kopf${auf ? ' auf' : ''}">
      <button class="gm-gruppe" type="button" data-gauf="${esc(g || '_ohne')}" aria-expanded="${auf}"><span class="gm-dreieck" aria-hidden="true">›</span><span class="nm">${esc(name)}</span><span class="gm-anzahl">${anzahl}</span></button>
      ${!g ? '' : sort ? pfeile('g', g, gi, S.gruppen.length, name) : `<button class="gm-stift" type="button" data-gruppe="${esc(g)}" aria-label="Gruppe ${esc(name)} umbenennen oder entfernen">✎</button>`}</div>`;
    const inhalt = auf ? `<div class="gm-inhalt">${liste.map(zeile).join('')}${!sort && g ? `<button class="moment-zeile gm-neu" type="button" data-neu-moment="${esc(g)}"><span class="sym" aria-hidden="true"><span class="plus-kreis">+</span></span><span class="nm">Moment hinzufügen</span></button>` : ''}</div>` : '';
    return `<div class="gm-block">${kopf}${inhalt}</div>`;
  }).join('');
  for (const art of Object.keys(WAHL).filter(a => !WAHL[a].frei)) $('#zeige-' + art).checked = wahlAn(art);
  const at = S.einstellungen.arbeitstage || [1, 2, 3, 4, 5];
  $('#arbeitstage').innerHTML = [1, 2, 3, 4, 5, 6, 0].map(t => `<button type="button" class="btn-klein${at.includes(t) ? ' an' : ''}" data-tag="${t}" aria-pressed="${at.includes(t)}">${TAGE_KURZ[t]}</button>`).join('');
  $('#arbeit-gewicht').value = S.einstellungen.arbeitGewicht ?? 3;
  $('#arbeit-gewicht-text').textContent = gewichtText(S.einstellungen.arbeitGewicht ?? 3);
  $('#tag-wechsel').value = String(WECHSEL_H());
  $('#korridor-von').value = S.einstellungen.korridorVon;
  $('#korridor-bis').value = S.einstellungen.korridorBis;

}

function momentSheet(id, gruppeVorwahl) {
  const neu = !id;
  const m = neu ? { id: uid(), name: '', symbol: '', icon: 'kein', gruppe: gruppeVorwahl || S.gruppen[0]?.id, modus: 'reg', dauer: 30 } : { ...moment(id) };
  const segM = Object.entries(MODI).map(([k, t]) => `<button type="button" data-wert="${k}" class="${m.modus === k ? 'an' : ''}">${t}</button>`).join('');
  sheet(neu ? 'Neuer Moment' : m.name, `
    <div class="form-group"><label for="m-name">Name</label><input type="text" id="m-name" value="${esc(m.name)}" placeholder="z. B. Gartenzeit" maxlength="40"></div>
    <div class="form-group"><label>Piktogramm</label>
      <div class="symbol-wahl" id="m-pikto">${Object.keys(PIKTO).filter(k => !PIKTO_VERSTECKT.includes(k) || m.icon === k).map(k => `<button type="button" data-icon="${k}" class="${m.icon === k ? 'an' : ''}" aria-label="Piktogramm ${k}" aria-pressed="${m.icon === k}">${pikto(k)}</button>`).join('')}
        <button type="button" data-icon="kein" class="kein${hatSymbol(m) ? '' : ' an'}" aria-pressed="${!hatSymbol(m)}">kein Piktogramm</button></div>
      <p class="form-hinweis">Ohne Piktogramm steht der Name größer auf der Kachel.</p></div>
    <div class="form-group"><label>Modus</label><div class="seg modus-seg" id="m-modus">${segM}</div>
      <p class="form-hinweis">Warm für Aktivierung, kühl für Regeneration.</p></div>
    <div class="form-group"><label>Bedeutung</label><div class="seg" id="m-gewicht">${Object.entries(BEDEUTUNG).map(([k, t]) => `<button type="button" data-wert="${k}" class="${(m.gewicht || 'normal') === k ? 'an' : ''}">${t}</button>`).join('')}</div>
      <p class="form-hinweis">Bedeutende Momente leuchten im Verlauf breiter und heller, wie kleine Leuchttürme, auch wenn sie kurz waren. Zählt nicht in die Balance.</p></div>
    <div class="form-group"><label class="schalter-zeile" for="m-angebot"><input type="checkbox" id="m-angebot"${m.angebot ? ' checked' : ''}><span>Angebot für andere</span></label>
      <p class="form-hinweis">Zeigt ein kleines Herz. Beim Wochenabschluss kannst du festhalten, wie es ankam.</p></div>
    <div class="form-reihe">
      <div class="form-group"><label for="m-gruppe">Gruppe</label><select id="m-gruppe">${Object.entries(GRUPPEN).map(([k, t]) => `<option value="${k}"${m.gruppe === k ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></div>
      <div class="form-group"><label for="m-dauer">Dauer</label><input type="number" id="m-dauer" min="0" max="9999" step="any" inputmode="decimal" value="${+((m.dauer || 0) / EINHEIT[m.einheit || 'min'][1]).toFixed(2)}">
        <div class="seg klein einheit-seg" id="m-einheit">${Object.entries(EINHEIT).map(([k, [t]]) => `<button type="button" data-wert="${k}" class="${(m.einheit || 'min') === k ? 'an' : ''}">${t}</button>`).join('')}</div></div>
    </div>
    <div class="form-reihe">
      <div class="form-group"><label for="m-etwa">Richtwert / Woche</label><input type="number" id="m-etwa" min="0" max="50" value="${m.etwa || ''}" placeholder="frei">
        <p class="form-hinweis">Etwa so oft. Kein Soll.</p></div>
      <div class="form-group"><label for="m-genug">Genug ab (min / Tag)</label><input type="number" id="m-genug" min="0" max="900" step="15" value="${m.genugTag || ''}" placeholder="frei">
        <p class="form-hinweis">Zeigt leise „genug für heute“.</p></div>
    </div>
    <div class="btn-reihe">
      <button class="btn-primary" id="m-ok" type="button">${neu ? 'Moment anlegen' : 'Speichern'}</button>
      ${neu ? '' : '<button class="btn-leise" id="m-weg" type="button">Moment entfernen …</button>'}
    </div>`);
  let modus = m.modus;
  document.querySelectorAll('#m-modus button').forEach(b => b.onclick = () => {
    modus = b.dataset.wert; document.querySelectorAll('#m-modus button').forEach(x => x.classList.toggle('an', x === b));
  });
  let einheit = m.einheit || 'min';
  document.querySelectorAll('#m-einheit button').forEach(b => b.onclick = () => {
    // umrechnen, wenn es aufgeht (1440 min → 1 Tag); sonst bleibt die Zahl (30 min → 30 Std wäre Unsinn → 0,5 Std)
    const feld = $('#m-dauer'), alt = parseFloat(String(feld.value).replace(',', '.')) || 0;
    const neu = alt * EINHEIT[einheit][1] / EINHEIT[b.dataset.wert][1];
    if (alt && neu >= 0.25) feld.value = +neu.toFixed(2);
    einheit = b.dataset.wert; document.querySelectorAll('#m-einheit button').forEach(x => x.classList.toggle('an', x === b));
  });
  let gewicht = m.gewicht || 'normal';
  document.querySelectorAll('#m-gewicht button').forEach(b => b.onclick = () => {
    gewicht = b.dataset.wert; document.querySelectorAll('#m-gewicht button').forEach(x => x.classList.toggle('an', x === b));
  });
  let icon = m.icon;
  document.querySelectorAll('#m-pikto button').forEach(b => b.onclick = () => {
    icon = b.dataset.icon;
    document.querySelectorAll('#m-pikto button').forEach(x => { x.classList.toggle('an', x === b); x.setAttribute('aria-pressed', x === b); });
  });
  $('#m-ok').onclick = () => {
    const name = $('#m-name').value.trim();
    if (!name) { $('#m-name').focus(); $('#m-name').placeholder = 'Bitte einen Namen eingeben'; return; }
    const zahl = v => { const n = parseInt(v, 10); return n > 0 ? n : undefined; };
    delete m.unter;
    Object.assign(m, { name, icon: icon || 'kein', symbol: icon && icon !== 'kein' ? '' : m.symbol, modus, gruppe: $('#m-gruppe').value,
      dauer: Math.round((parseFloat(String($('#m-dauer').value).replace(',', '.')) || 0) * EINHEIT[einheit][1]), einheit: einheit === 'min' ? undefined : einheit, etwa: zahl($('#m-etwa').value), genugTag: zahl($('#m-genug').value),
      angebot: $('#m-angebot').checked || undefined });
    const vorher = m.gewicht || 'normal';
    const fertig = rueckwirkend => {
      if (gewicht !== vorher) {
        if (rueckwirkend) delete m.gewichtAb;
        else m.gewichtAb = [...(m.gewichtAb?.length ? m.gewichtAb : [{ ab: 0, g: vorher }]), { ab: Date.now(), g: gewicht }];
      }
      m.gewicht = gewicht === 'normal' ? undefined : gewicht;
      if (neu) S.momente.push(m); else S.momente[S.momente.findIndex(x => x.id === m.id)] = m;
      speichern(); sheetZu(); renderAlles(); toast(neu ? `${name} angelegt` : 'Gespeichert');
    };
    // nur fragen, wenn sich die Bedeutung ändert und es schon Einträge gibt
    if (neu || gewicht === vorher || !S.taps.some(t => t.mid === m.id)) return fertig(true);
    sheet('Bedeutung', `<p class="card-text">„${esc(name)}“ hat jetzt die Bedeutung <strong>${gewicht}</strong>. Ab wann soll das gelten?</p>
      <div class="btn-reihe"><button class="btn-primary" id="gew-jetzt" type="button">Ab jetzt</button><button class="btn-leise" id="gew-alle" type="button">Auch für frühere Einträge</button></div>`);
    $('#gew-jetzt').onclick = () => fertig(false);
    $('#gew-alle').onclick = () => fertig(true);
  };
  if (!neu) $('#m-weg').onclick = () => {
    const n = S.taps.filter(t => t.mid === m.id).length;
    sheet('Moment entfernen', `<p class="card-text">„${esc(m.name)}“ verschwindet von den Kacheln${n ? `, und die ${n} gezählten Einträge werden gelöscht` : ''}. Das lässt sich nicht rückgängig machen.</p>
      <div class="btn-reihe"><button class="btn-primary" id="weg-ja" type="button">Entfernen</button><button class="btn-leise" id="weg-nein" type="button">Behalten</button></div>`);
    $('#weg-ja').onclick = () => { S.momente = S.momente.filter(x => x.id !== m.id); S.taps = S.taps.filter(t => t.mid !== m.id); speichern(); sheetZu(); renderAlles(); toast('Moment entfernt'); };
    $('#weg-nein').onclick = () => momentSheet(m.id);
  };
}

// ── GRUPPEN ───────────────────────────────────────────
// ── REIHENFOLGE ────────────────────────────────────────
let sortiermodus = false;
function pfeile(art, id, i, n, name) {
  return `<span class="sort-pfeile">
    <button type="button" data-${art}-hoch="${esc(id)}" ${i === 0 ? 'disabled' : ''} aria-label="${esc(name)} nach oben">↑</button>
    <button type="button" data-${art}-runter="${esc(id)}" ${i === n - 1 ? 'disabled' : ''} aria-label="${esc(name)} nach unten">↓</button></span>`;
}
// Tauscht ein Element mit seinem Nachbarn innerhalb derselben Teilliste (z. B. Momente einer Gruppe)
function verschieben(arr, id, richtung, gleicheListe) {
  const idx = arr.map((x, k) => k).filter(k => gleicheListe(arr[k]));
  const pos = idx.findIndex(k => arr[k].id === id), ziel = pos + richtung;
  if (pos < 0 || ziel < 0 || ziel >= idx.length) return;
  const a = idx[pos], b = idx[ziel];
  [arr[a], arr[b]] = [arr[b], arr[a]];
  gruppenAktualisieren(); speichern(); renderVerwaltung();
  const fokus = document.querySelector(`[data-${arr === S.momente ? 'm' : 'g'}-${richtung < 0 ? 'hoch' : 'runter'}="${CSS.escape(id)}"]`);
  if (fokus && !fokus.disabled) fokus.focus();
}

function gruppeSheet(id) {
  const neu = !id;
  const g = neu ? { id: uid(), name: '' } : S.gruppen.find(x => x.id === id);
  const i = S.gruppen.indexOf(g);
  sheet(neu ? 'Neue Gruppe' : g.name, `
    <div class="form-group"><label for="g-name">Name</label><input type="text" id="g-name" value="${esc(g.name)}" placeholder="z. B. Ehrenamt" maxlength="30"></div>
    <div class="btn-reihe">
      <button class="btn-primary" id="g-ok" type="button">${neu ? 'Gruppe anlegen' : 'Speichern'}</button>
      ${neu ? '' : '<button class="btn-leise" id="g-weg" type="button">Gruppe entfernen …</button>'}
    </div>`);
  $('#g-ok').onclick = () => {
    const name = $('#g-name').value.trim();
    if (!name) { $('#g-name').focus(); $('#g-name').placeholder = 'Bitte einen Namen eingeben'; return; }
    g.name = name; if (neu) S.gruppen.push(g);
    gespeichertNeu(); sheetZu(); toast(neu ? `${name} angelegt` : 'Gespeichert');
  };
  if (neu) return;
  $('#g-weg').onclick = () => {
    const andere = S.gruppen.filter(x => x.id !== g.id);
    if (!andere.length) { toast('Mindestens eine Gruppe bleibt'); return; }
    const n = S.momente.filter(m => m.gruppe === g.id).length;
    sheet('Gruppe entfernen', `<p class="card-text">„${esc(g.name)}“ wird entfernt. Gezählte Einträge bleiben erhalten.</p>
      ${n ? `<div class="form-group"><label for="g-ziel">${n === 1 ? 'Der Moment kommt nach' : `Die ${n} Momente kommen nach`}</label>
        <select id="g-ziel">${andere.map(x => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('')}</select></div>` : ''}
      <div class="btn-reihe"><button class="btn-primary" id="gw-ja" type="button">Entfernen</button><button class="btn-leise" id="gw-nein" type="button">Behalten</button></div>`);
    $('#gw-ja').onclick = () => {
      const ziel = n ? $('#g-ziel').value : null;
      for (const m of S.momente) if (m.gruppe === g.id) m.gruppe = ziel;
      S.gruppen = andere;
      gespeichertNeu(); sheetZu(); toast('Gruppe entfernt');
    };
    $('#gw-nein').onclick = () => gruppeSheet(g.id);
  };
}

function gespeichertNeu() { gruppenAktualisieren(); speichern(); renderAlles(); }

// ── Sheet, Toast, Navigation ───────────────────────────
function sheet(titel, html) { $('#sheet-titel').textContent = titel; $('#sheet-body').innerHTML = html; $('#sheet').classList.remove('hidden'); }
function sheetZu() { $('#sheet').classList.add('hidden'); }

let toastTimer = null;
function toast(text, rueckgaengig) {
  $('#toast-text').textContent = text;
  const btn = $('#toast-btn');
  btn.classList.toggle('hidden', !rueckgaengig);
  btn.onclick = rueckgaengig ? () => { rueckgaengig(); } : null;
  $('#toast').classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.add('hidden'), rueckgaengig ? 5000 : 2200);
}

let ansicht = 'heute', vorAnsicht = 'heute';
function zeige(v) {
  if (v === 'verwaltung' && ansicht !== 'verwaltung') { vorAnsicht = ansicht; offeneGruppen.clear(); }
  if (v !== 'verwaltung') sortiermodus = false;
  if (v !== ansicht) { licht.clear(); heuteVersatz = 0; }   // Wechsel zwischen Heute und Verlauf: Scheinwerfer aus, Gruppen zu
  ansicht = v;
  document.documentElement.classList.toggle('snap-heute', v === 'heute');
  if (v !== 'woche') document.body.classList.remove('archiv');   // Heute: schnelles Wischen hält an jeder Gruppe
  ['heute', 'woche', 'verwaltung'].forEach(n => $('#view-' + n).classList.toggle('hidden', n !== v));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  renderAlles();
  window.scrollTo(0, 0);
}
function renderAlles() {
  const inEinst = ansicht === 'verwaltung';
  $('#btn-einstellungen').classList.toggle('an', inEinst);
  $('#btn-einstellungen').setAttribute('aria-pressed', inEinst);
  if (ansicht === 'heute') renderHeute();
  if (ansicht === 'woche') renderWoche();
  if (ansicht === 'verwaltung') renderVerwaltung();
}

// ── Start ──────────────────────────────────────────────
function verbinden() {
  const raster = $('#moment-kacheln'), sonder = $('#sonder-kacheln');
  for (const r of [raster, sonder]) {
    r.addEventListener('pointerdown', druckStart);
    r.addEventListener('pointerup', druckEnde);
    r.addEventListener('pointercancel', druckAbbruch);
    r.addEventListener('pointerleave', druckAbbruch, true);
    r.addEventListener('pointermove', druckBewegt);
    r.addEventListener('contextmenu', e => e.preventDefault());
    r.addEventListener('keydown', e => {
      const el = e.target.closest('.kachel[data-mid], .kachel[data-sonder="feierabend"]');
      if (!el || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault();
      if (el.dataset.mid) { if (e.shiftKey) zuruecknehmen(el.dataset.mid); else zaehlen(el.dataset.mid); }
      else if (heuteVersatz) arbeitSheet(); else arbeitTippen();
    });
  }
  sonder.addEventListener('click', e => {
    const b = e.target.closest('[data-wahl]'); if (!b) return;
    const k = heuteKey(), art = b.dataset.wahl, w = b.dataset.wert, m = (S[art] ||= {});
    if (m[k] === w) delete m[k]; else m[k] = w;
    speichern(); renderHeute();
  });

  document.querySelectorAll('.nav-item').forEach(b => b.addEventListener('click', () => zeige(b.dataset.view)));
  // Einstellungen: Zahnrad oben rechts öffnet und schließt, „‹ Zurück“ führt zur vorigen Ansicht
  $('#btn-einstellungen').onclick = () => zeige(ansicht === 'verwaltung' ? vorAnsicht : 'verwaltung');
  $('#btn-zurueck').onclick = () => zeige(vorAnsicht);
  document.querySelectorAll('#hilfe .hz-i').forEach(el => { el.innerHTML = hzIcon(el.dataset.i); });
  $('#btn-info').onclick = () => $('#hilfe').classList.remove('hidden');
  $('#hilfe-zu').onclick = () => $('#hilfe').classList.add('hidden');
  $('#sheet-zu').onclick = sheetZu;
  for (const id of ['#sheet', '#hilfe']) $(id).addEventListener('click', e => { if (e.target === $(id)) $(id).classList.add('hidden'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { sheetZu(); $('#hilfe').classList.add('hidden'); } });

  $('#woche-zurueck').onclick = () => wocheGehe(-1);
  $('#woche-vor').onclick = () => wocheGehe(1);
  $('#woche-heute').onclick = () => { wocheVersatz = 0; renderWoche(); };
  wocheWischen();

  $('#gm-liste').addEventListener('click', e => {
    const mh = e.target.closest('[data-m-hoch],[data-m-runter]');
    if (mh) {
      const id = mh.dataset.mHoch || mh.dataset.mRunter, m = moment(id);
      const g = GRUPPEN[m.gruppe] ? m.gruppe : null;
      verschieben(S.momente, id, mh.dataset.mHoch ? -1 : 1, x => g ? x.gruppe === g : !GRUPPEN[x.gruppe]);
      return;
    }
    const gh = e.target.closest('[data-g-hoch],[data-g-runter]');
    if (gh) { verschieben(S.gruppen, gh.dataset.gHoch || gh.dataset.gRunter, gh.dataset.gHoch ? -1 : 1, () => true); return; }
    const neu = e.target.closest('[data-neu-moment]'); if (neu) { momentSheet(null, neu.dataset.neuMoment); return; }
    const b = e.target.closest('[data-edit]'); if (b) { momentSheet(b.dataset.edit); return; }
    const ga = e.target.closest('[data-gauf]');
    if (ga) { const k = ga.dataset.gauf; offeneGruppen.has(k) ? offeneGruppen.delete(k) : offeneGruppen.add(k); renderVerwaltung(); return; }
    const g = e.target.closest('[data-gruppe]'); if (g) gruppeSheet(g.dataset.gruppe);
  });
  $('#btn-sort').onclick = () => { sortiermodus = !sortiermodus; renderVerwaltung(); };
  $('#btn-gruppe-neu').onclick = () => gruppeSheet(null);
  const korridorNeu = () => {
    const von = $('#korridor-von').value, bis = $('#korridor-bis').value;
    if (!von || !bis) return;
    S.einstellungen.korridorVon = von; S.einstellungen.korridorBis = bis;
    if (korridorPruefen(S.einstellungen)) { $('#korridor-bis').value = S.einstellungen.korridorBis; toast(`„spätestens“ muss nach „ab“ liegen: ${S.einstellungen.korridorBis}`); }
    speichern();
  };
  $('#arbeit-gewicht').oninput = e => {
    S.einstellungen.arbeitGewicht = +e.target.value; $('#arbeit-gewicht-text').textContent = gewichtText(+e.target.value);
  };
  $('#arbeit-gewicht').onchange = () => { speichern(); renderHeute(); };
  $('#tag-wechsel').onchange = e => { S.einstellungen.tagWechsel = +e.target.value; speichern(); renderHeute(); };
  $('#heute-datum').onclick = () => { heuteVersatz = heuteVersatz ? 0 : -1; renderHeute(); window.scrollTo(0, 0); };
  $('#korridor-von').onchange = korridorNeu;
  $('#korridor-bis').onchange = korridorNeu;
  $('#arbeitstage').onclick = e => {
    const b = e.target.closest('[data-tag]'); if (!b) return;
    const t = +b.dataset.tag, at = new Set(S.einstellungen.arbeitstage || [1, 2, 3, 4, 5]);
    at.has(t) ? at.delete(t) : at.add(t);
    S.einstellungen.arbeitstage = [...at].sort(); speichern(); renderVerwaltung(); renderHeute();
  };
  for (const art of Object.keys(WAHL).filter(a => !WAHL[a].frei)) $('#zeige-' + art).onchange = e => { S.einstellungen['zeige_' + art] = e.target.checked; speichern(); renderHeute(); };

  $('#btn-alles-loeschen').onclick = () => {
    sheet('Alle Einträge löschen', `<p class="card-text">Gezählte Momente, Feierabende und Schlaf-Einträge werden von diesem Gerät gelöscht. Die Momente selbst und die Einstellungen bleiben. Das lässt sich nicht rückgängig machen.</p>
      <div class="btn-reihe"><button class="btn-primary" id="del-ja" type="button">Einträge löschen</button><button class="btn-leise" id="del-nein" type="button">Abbrechen</button></div>`);
    $('#del-ja').onclick = () => { S.taps = []; S.feierabend = {}; S.schlaf = {}; S.essen = {}; S.trinken = {}; S.arbeit = {}; S.arbeitStufe = {}; S.arbeitZeit = {}; speichern(); sheetZu(); renderAlles(); toast('Einträge gelöscht'); };
    $('#del-nein').onclick = sheetZu;
  };

  // Sicherung als Datei (zum Mitnehmen auf ein anderes Gerät)
  $('#btn-export').onclick = () => {
    const daten = JSON.stringify({ app: 'MemoMe', exportiert: new Date().toISOString(), zustand: S }, null, 1);
    const url = URL.createObjectURL(new Blob([daten], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `MemoMe-Sicherung-${tagKey(new Date())}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('Sicherung erstellt');
  };
  $('#btn-import').onclick = () => $('#import-datei').click();
  $('#import-datei').onchange = async e => {
    const datei = e.target.files[0]; e.target.value = '';
    if (!datei) return;
    let neu;
    try { const j = JSON.parse(await datei.text()); neu = j.app === 'MemoMe' ? j.zustand : null; } catch { neu = null; }
    if (!neu || neu.version !== 1 || !Array.isArray(neu.momente)) { toast('Diese Datei ist keine MemoMe-Sicherung'); return; }
    sheet('Sicherung laden', `<p class="card-text">Die Sicherung enthält ${neu.momente.length === 1 ? '1 Moment' : neu.momente.length + ' Momente'} und ${(n => n === 1 ? '1 Eintrag' : n + ' Einträge')((neu.taps || []).length)}. Sie ersetzt alles, was jetzt auf diesem Gerät gespeichert ist.</p>
      <div class="btn-reihe"><button class="btn-primary" id="imp-ja" type="button">Sicherung laden</button><button class="btn-leise" id="imp-nein" type="button">Abbrechen</button></div>`);
    $('#imp-ja').onclick = () => { S = zustandAus(neu); gruppenAktualisieren(); speichern(); sheetZu(); renderAlles(); toast('Sicherung geladen'); };
    $('#imp-nein').onclick = sheetZu;
  };

  document.addEventListener('visibilitychange', () => { if (!document.hidden) renderAlles(); });
}

// Gespeicherten oder importierten Zustand auf den aktuellen Datenstand bringen
// Korridor: „bis“ muss nach „von“ liegen (gleicher Abend). Sonst bis = von + 1 Stunde.
function korridorPruefen(e) {
  const v = zuMin(e.korridorVon), b = zuMin(e.korridorBis);
  if (b > v) return false;
  e.korridorBis = zuHHMM(Math.min(v + 60, 23 * 60 + 59));
  return true;
}

function zustandAus(alt) {
  const z = { ...startZustand(), ...alt, einstellungen: { ...startZustand().einstellungen, ...alt.einstellungen } };
  if (!(alt.stand >= 3)) {
    // Stand 3: Piktogramme für die Startmomente
    for (const m of z.momente) { const st = FRUEHERE_MOMENTE.find(x => x.id === m.id); if (st && !m.icon) m.icon = st.icon; }
  }
  if (!(alt.stand >= 4)) {
    // Stand 4: Gruppen werden Daten
    z.gruppen = START_GRUPPEN.map(x => ({ ...x }));
  }
  if (!(alt.stand >= 5)) {
    // Stand 5: keine Untergruppen mehr; die Momente bleiben in ihrer Gruppe
    delete z.untergruppen;
    for (const m of z.momente) delete m.unter;
    z.stand = 5;
  }
  if (!(alt.stand >= 6)) {
    // Stand 6: eine Skala für alle Tage. leicht → halb; freie Tage: etwas · halb bleiben, ganz → normal
    const st = z.arbeitStufe = { ...(z.arbeitStufe || {}) };
    for (const [k, v] of Object.entries(st)) if (v === 'leicht') st[k] = 'halb';
    for (const [k, v] of Object.entries(z.arbeit || {})) st[k] = v === 'ganz' ? 'normal' : v;
    z.arbeit = {}; z.arbeitZeit ||= {};
    z.stand = 6;
  }
  korridorPruefen(z.einstellungen);
  return z;
}

// Hinweis „Neue Version verfügbar“ (wie MemoFix)
function zeigeUpdateHinweis() {
  if (document.getElementById('update-hinweis')) return;
  const el = document.createElement('div');
  el.id = 'update-hinweis'; el.className = 'update-hinweis'; el.setAttribute('role', 'status');
  el.innerHTML = `<span>Neue Version verfügbar</span>
    <button type="button" data-u="neu">Neu laden</button>
    <button type="button" data-u="zu" aria-label="Später">✕</button>`;
  el.addEventListener('click', e => {
    const a = e.target.closest('[data-u]')?.dataset.u;
    if (a === 'neu') location.reload(); else if (a === 'zu') el.remove();
  });
  document.body.appendChild(el);
}

(async function start() {
  const gespeichert = await laden();
  if (gespeichert && gespeichert.version === 1) { S = zustandAus(gespeichert); speichern(); }
  if (!S.seit) { S.seit = tagKey(einstiegTag()); speichern(); }   // erste Nutzung merken: ab hier gibt es Wochen
  gruppenAktualisieren();
  verbinden();
  zeige('heute');
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    const hatteController = !!navigator.serviceWorker.controller;   // beim allerersten Besuch kein Hinweis
    navigator.serviceWorker.register('sw.js').then(reg => {
      // Beim Zurückkehren in die App nach einer neuen Version suchen (iPhone-Apps bleiben lange im Hintergrund)
      document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
    }).catch(() => {});
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hatteController) zeigeUpdateHinweis(); });
  }
})();
