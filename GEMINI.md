# Project Description

This is a lightweight assignment/commission manager for psychiatric examiners that create examinations of patients as requested by court assignments/commissions.

The app has three central functions:
1. Manage the assignments
2. Let the user enter certain data per assignment, and global data
3. Generating docx invoices for assignments

The central screen should be the list of assignments.

# Developer environment

This project currently contains a Tauri + React scaffold and uses a Tauri SQL database. TailwindCSS is included for styling.

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
- Kilometer fee (km charged at 0.42€/km)
- Shipping fee (€)
- Total (= sum of previous entries)
- Tax (19%)
- Total (= previous total + tax)

This is the total data that has to be stored for the first step. In the second step, we will also store the state/phase each assignment is in, but that is not our focus right now.

All data should be editable by the user.

The user information (name and address) alongside the tax rate (19% atm), kilometer fee rate (0.42€/km) and writing fee (1.5€/1000) should be stored and editable globally. Important note: All strings from the invoice should be editable. 

For the courts (name, address and department) and remuneration groups, we should keep separate editable list. Then in each assignment the user only has to select which court and remuneration group applies to this assignment from a dropdown.

The remaining information should be stored within each assignment (patient info, remaining invoice data) or generated on the fly when printing the invoice (invoice number and printing date).

## Invoice numbers

Each court order has exactly one invoice number. The invoice number is built from the static prefix "ZZK", the date in "YYMM" form and a two digit running index per month starting at 01.

# UI

There are mainly three screens:
1. List of assignments
2. Edit individual assignment
3. Settings where global data can be edited (single values and strings for the invoice and courts and remuneration groups)

# Supplementary resources

## Simplified previous version

The original version of this project is in legacy.html. It does _not_ manage assignments but only acts as a calculator for the invoice values. You can see how the invoice data is calculated.