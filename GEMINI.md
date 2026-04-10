# Project Description

This is a lightweight assignment/commission manager for psychiatric examiners that create examinations of patients as requested by court assignments/commissions.

The app has three central functions:
1. Manage the assignments
2. Let the user enter certain data per assignment, and global data
3. Generating docx invoices for assignments

The central screen should be the list of assignments.

The app is made for German users, thus many strings and some code may be German.

# Developer environment

This project currently contains a Tauri + React scaffold and uses a Tauri SQL database. TailwindCSS is included for styling and you can use shadcn presets from https://ui.shadcn.com/docs/components and add them with `npx shadcn@latest add accordion` (for an accordion for example).

# Data management

Each assignment should have a unique ID in the background. The data stored per assignment is all the data needed for the invoice. Here is a list:
1. Name, address and tax ID of the examiner, aka. the user (global)
2. Name, department and address of the court that gave the assignment (global, but there are different courts)
3. Invoice number
4. Printing date
5. Patient name, birthdate and file number
6. Remuneration group (global)
7. Invoice entries:
- Travel time (minutes)
- Preparation and examination (minutes)
- Evaluation and writing (minutes)
- Total time (= sum of previous three entries)
- Writing fee (number of characters charged at 1.5€/1000)
- Printing fee (number of pages charged at 0,5€/page)
- Kilometer fee (km charged at 0.42€/km)
- Shipping fee (€)
- Total (= sum of previous entries)
- Tax (19%)
- Total (= previous total + tax)

This is the total data that has to be stored for the first step. In the second step, we will also store the state/phase each assignment is in, but that is not our focus right now.

All data should be editable by the user.

The user information (name and address) alongside the tax rate (19% atm), kilometer fee rate (0.42€/km) and writing fee (1.5€/1000) should be stored and editable globally. Important note: All strings from the invoice should be editable. As they may contain values that should be inserted, the handlebars templating engine is included. For example, one sentence coming up on the invoice is "Für die Erstellung eines psychiatrischen Gutachtens erlaube ich mir gemäß Vergütungsgruppe M2 zu berechnen:", where "M2" is the name of a remuneration group. The remuneration group is selected per assignment, so this is a dynamic value that can then be inserted like "Für die Erstellung ... Vergütungsgruppe {{vergütungsgruppe.name}} zu berechnen:".

For the courts (name, address and department) and remuneration groups, we should keep separate editable list. Then in each assignment the user only has to select which court and remuneration group applies to this assignment from a dropdown.

The remaining information should be stored within each assignment (patient info, remaining invoice data) or generated on the fly when printing the invoice (invoice number and printing date).

## Invoice numbers

Each court order has exactly one invoice number. The invoice number is built from the static prefix "ZZK", the date in "YYMM" form and a two digit running index per month starting at 01.

## Courts

The data stored for each court is:
- ID (auto generated, not user-facing)
- Name
- Department (default: "Abteilung für Betreuungssachen")
- Address (split up into a typical address format, you decide the specifics)

There should be one default entry for this table:
- name: "Amtsgericht Fürth", department: "Abteilung für Betreuungssachen", address: Amtsgericht Fürth Hallstraße 1 90762 Fürth

## Remuneration groups (Vergütungsgruppen)

The data stored for each remuneration group is:
- ID (auto generated, not user-facing)
- Name
- Value (meaning €/hour)

There should be default entries for this table:
- id: m1, name: M1, value: 80
- id: m2, name: M2, value: 90
- id: m3, name: M3, value: 120

## Assignments

The data stored for each assignment is:
- Patient name, birthdate, file number
- Remuneration group ("Vergütungsgruppe", reference)
- Travel time ("Anfahrt", minutes)
- Preparation and examination ("Exploration, Fremdanamnese und Durchsicht der Unterlagen", minutes)
- Evaluation and writing ("Auswertung der Untersuchung und der neuropsycholog. Testung, Verfassen des Gutachtens", minutes)
- Amount of characters for the writing fee ("Schreibgebühr")
- Amount of pages for printing fee ("Kopierkosten", optional)
- Amount of km for Kilometer fee ("Kilometerpauschale")
- Shipping fee ("Versandkosten", optional)
- Creation time
- Printing date (optional, only set after printing)
- Invoice number (optional, only set after printing)
- Amount of trips ("Anzahl Anfahrten" to let user charge for multiple trips, even at fractions (e.g. 1.5))
- Paid date ("Bezahlt am", optional)
- Submission date ("Abgabedatum", optional)
- Started working date ("In Bearbeitung seit", optional)

### "Softly required" invoice fields

Some fields are required for a meaningful invoice calculation (based on the `required` inputs in `legacy.html`), but the app treats them as **soft requirements**: invoice generation is still allowed, but the user is warned.

The warning is shown in the **invoice generation dialog** (opened from the assignment list screen) and:
- lists which fields are missing
- offers a link/button to jump to the assignment edit screen (`/edit/:id`) to fill them in

Softly required fields (warn if missing/empty, or \(≤ 0\) for numeric fields):
- Patient name
- Patient birthdate
- File number
- Court
- Remuneration group
- Travel time (minutes)
- Travel count (number of trips)
- Preparation time (minutes)
- Evaluation time (minutes)
- Writing characters (for writing fee)

# UI

There are mainly three screens:
1. List of assignments (Home): Split into four categories:
   - **Open**: Not paid and invoice not yet generated. This list is internally categorized and sorted:
     - **Working on it**: Assignments with a "started working" date (newest first).
     - **Urgent**: Assignments with a submission deadline within 2 weeks or already passed (most urgent first).
     - **Others**: Remaining open assignments.
   - **Ready for Billing**: Invoice generated but not yet paid.
   - **Paid This Month**: Assignments paid in the current kalendar month.
   - **Archive**: Paid assignments from previous months (collapsed by default).
2. Edit individual assignment
3. Settings where global data can be edited (single values and strings for the invoice and courts and remuneration groups)

# Supplementary resources

## Simplified previous version

The original version of this project is in legacy.html. It does _not_ manage assignments but only acts as a calculator for the invoice values. You can see how the invoice data is calculated.

## Docx generation draft

A proof-of-concept docx generation file can be found in print.ts. It was tested in a node environment and thus may not work here, but the code creates a docx file exactly how I want the app to produce them.

# Extra features

## Income tax listing

This is a general feature of the app. When pressing the button, the user be able to select the month and year in a dialog, preset to the current month/year. Then, all assignments that were paid in that month (according to their paid date) are collected and a docx table should be generated with two columns: date and sum (including tax). The document should have a header with two lines. The first line is the examiner's/user's name and address, the second line reads "Einnahmen inkl. Mwst. [month and year in German]".

## Automatic remuneration group updates

Remuneration groups are defined by a German law: Justizvergütungs- und -entschädigungsgesetz (JVEG). The rates and the remuneration groups themselves (M1, M2, M3) may change over time. A service I would like to provide is checking for changes and parsing the new rates and integrating them into the app automatically.
A JSON version of the law is here: https://gadi.netlify.app/laws/jveg.json
There are two steps to this:
1. Whenever the app is started, e.g. at the same time when the app checks for new updates for the app, query the JSON and compare to the previously stored version. If the string has any differences, notify the user at the top of the assignment list screen with a note. This is the first step - just to make the user aware of changes / to be transparent. If the request fails, a warning should appear instead (which can be closed and remains closed even if the request fails the next day - only after it succeeds again, the warning should come again if it fails again afterwards).
2. The second step is to try parse the changes automatically. This requires traversing the JSON and the HTML inside the JSON. As the law will have changed when this parsing happens, the parsing should be resistent to the text changing. However, we should not try to understand a new version of this JSON file when it was changed beyond what we can understand - so the parsing should still be strict enough to not deliver false positives (e.g. parsing M1, M2, M3 but not M4 if M4 was newly introduced). If the parsing is successful, we can show a button in the user notice from the first step to automatically use the new rates for new remuneration groups. This should open a dialog to preview the new rates and a hint about when these changes took effect (if it's possible to parse that easily - if not, just say "Detected: \[day of detection\]"). Then the user can choose to apply these new rates and they will change the existing entries in remuneration groups.