# Patient Address Book

A mobile-friendly patient contact/address book.

## Features

- Search by patient name or phone number
- Duplicate detection by normalized name and phone number
- Add, edit and delete patient records
- Required name and contact number
- Optional address
- International phone number support
- WhatsApp shortcut using the international `wa.me` format
- Responsive glassmorphism-inspired UI
- Fast client-side searching after the initial data load

## Cloud version

The recommended version uses a **private Google Sheet + Google Apps Script web app**. The patient list is loaded once into the browser and searching happens locally, so search speed is not tied to Google Sheets response time.

Setup instructions are in [GOOGLE-SHEETS-SETUP.md](GOOGLE-SHEETS-SETUP.md).

The Apps Script source and the version of the UI suitable for Apps Script are in `google-apps-script/`.

## Privacy

Keep the Google Sheet private and deploy the Apps Script web app only to your own Google account. This repository is private.

For a larger multi-user clinical system, use dedicated authentication, audit logging, backups and a healthcare-oriented database/security design.
