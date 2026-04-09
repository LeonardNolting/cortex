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

The UI shows a `status` field for assignments, but that is intentionally only in the UI, not in the database and logic.

# UI

There are mainly three screens:
1. List of assignments
2. Edit individual assignment
3. Settings where global data can be edited (single values and strings for the invoice and courts and remuneration groups)

# Supplementary resources

## Simplified previous version

The original version of this project is in legacy.html. It does _not_ manage assignments but only acts as a calculator for the invoice values. You can see how the invoice data is calculated.

## Docx generation draft

A proof-of-concept docx generation file can be found in print.ts. It was tested in a node environment and thus may not work here, but the code creates a docx file exactly how I want the app to produce them.