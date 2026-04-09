# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## TODO
### Später
- Deadlines erstellen können für Assignments?
- Autosave? Oder bei Änderungen fragen ob gespeichert werden soll bevor man geht?
- Vergütungsgruppen parsen
- Datenbank woanders abspeichern können
- Datenbank backups (jeden Tag, für die letzten 30 Tage)
- Icon ändern
- Code aufräumen
- Werte sind nicht ganz stimmig, TypeScript Fehler? <any> casts?
- Sicherstellen, dass alle Einstellungen und Werte überhaupt durch handlebar templates genutzt werden können
### Erledigt
- ✅ Kommazahlen können nicht richtig eingegeben werden
- ✅ Auf 1. oder 2. Stelle runden?
- ✅ Erinnerungen wenn Rechnung verschickt aber noch nicht gezahlt
- ✅ Automatisch vergrößert starten
- ✅ Text neben Einstellungsknopf und Einnahmenlisteknopf zeigen
- ✅ Einnahmenliste Header auf jeder Seite zeigen
- ✅ Neuer Auftrag: Zeigen, welche Felder verpflichtend sind (Patientname und Gericht)
- ✅ Updates fragen?
- ✅ Assignment edit: Bezahlt am sollte nichts anzeigen, wenn da kein Wert drinnen ist
- ✅ Warnung wenn man Rechnungsdaten verändert nachdem die Rechnung versendet wurde (Warnhinweis in AssignmentEdit)
- ✅ Assignment löschen sollte fragen (genauso wie Gerichte)
- ✅ Assignments in 4 Listen teilen:
  1. Aktuelle Assignments
  2. Fertige Assignments, aber noch nicht bezahlt
  3. Abgeschlossene Assignments (Rechnungen eingegangen) aus diesem Monat
  4. Eingeklappt (ausklappbar): alle sonstigen, alten abgeschlossenen Assignments
