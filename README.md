# TODO
- Einkommensliste drucken funktioniert nicht, gibt Fehler "Fehler beim Generieren der Einnahmenübersicht."
- Erinnerung 3 Monate nach Auftragseingang Rechnungsstellung? sonst läuft es ab
- Assoziierte Dokumente abspeichern können
  - dynamisch: Gutachtenordner parsen und schauen, welche Gutachten denselben Namen tragen
  - statisch: Nutzer kann Dateien auswählen, die jetzt zu dem Auftrag zählen sollen

### Später
- Autosave? Oder bei Änderungen fragen ob gespeichert werden soll bevor man geht?
- Datenbank woanders abspeichern können
- Datenbank backups (jeden Tag, für die letzten 30 Tage)
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
- ✅ Vergütungsgruppen parsen
- ✅ Deadlines erstellen können für Assignments?
- ✅ Reset datepicker knopf wird verdrängt
- ✅ Knopf um Bearbeitung anzufangen
- ✅ Knopf um Deadline zu setzen
- ✅ Abgabe überfällig = rot
- ✅ Generate invoice date input is too narrow
- ✅ Festlegen können, ab wann man vor kommenden Abgabedaten gewarnt werden will
- ✅ Knopf um deadline 1 Woche zurückzustellen (sowohl für submission als auch für Zahldatum?) - wenn Deadline nah kommt
- ✅ Mehr Werte sind verpflichtend (Geburtstag, Aktenzeichen)
- ✅ Vielleicht drei Gruppen innerhalb der ersten Liste: 1. Als "Werden gerade bearbeitet" markierte Aufträge (grün), 2. Aufträge, deren Wiedervorlagedatum näher rückt (gelb), 3. die restlichen Aufträge, also deren Wiedervorlagedatum noch lange hin ist, die noch nicht aktiv bearbeitet werden
- ✅ Assignment edit inputs links etwas zusammenrücken
- ✅ in 2. Liste zeigen, wann Rechnung gedruckt wurde