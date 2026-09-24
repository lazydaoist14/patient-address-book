# Patient Address Book

A mobile-friendly patient contact/address book with:

- Search by patient name or phone number
- Duplicate detection by normalized name and phone number
- Add, edit and delete patient records
- Required name and contact number
- Optional address
- WhatsApp shortcut using the international `wa.me` format
- Responsive glassmorphism-inspired UI
- Browser-local storage for the current prototype

## Important data note

The current version stores patient records in the browser's **localStorage**. That means the data is tied to the specific browser/device and is not synchronized between devices.

For actual clinical use or multi-device access, the next version should add authenticated storage using a proper database (for example, Supabase) and appropriate privacy/security controls.

## WhatsApp numbers

The app supports international numbers. Select the appropriate country code, or paste a complete number beginning with `+`. The WhatsApp button opens:

`https://wa.me/<international-digits>`

The number should include the country calling code and should not contain spaces, brackets or other formatting after normalization.

## Deployment

The project is a static web app and can be deployed with GitHub Pages.