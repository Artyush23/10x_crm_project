# 10X CRM

## About

10X CRM is an educational, backend-free customer relationship management application. It demonstrates a complete browser-based workflow with account creation, protected pages, client management, dashboard reporting, profile settings, and theme preferences. Twenty CRM was used only as visual inspiration; no Twenty source code is included.

This project stores application data in the browser. Passwords are stored in plaintext only because this is an educational project with no backend. Plaintext password storage is unsafe and must never be used in a production application; a real system should hash passwords securely on a trusted server.

## Features

- Account registration and login with validation, session protection, and logout.
- Light and dark themes saved between browser sessions.
- Dashboard statistics, pipeline counts, a live clock, and recent clients.
- Initial client loading from DummyJSON with browser storage for later visits.
- Client creation, deletion, status updates, search, filtering, and sorting.
- Client detail view with notes and temporary follow-up reminders.
- Profile editing, password changing, and client-data reset.
- Responsive, accessible interface with modal dialogs and toast notifications.

## Tech Stack

- Semantic HTML5
- Vanilla JavaScript with native ES modules
- Sass/SCSS compiled to CSS
- Browser `localStorage`
- Native Fetch API
- [DummyJSON](https://dummyjson.com/) users API

The project does not use React, TypeScript, jQuery, a backend, a database, or an external UI library.

## How to Run

1. Install [Node.js](https://nodejs.org/) and clone this repository.
2. In the project directory, install the Sass development dependency:

   ```bash
   npm install
   ```

3. Compile the SCSS source:

   ```bash
   npm run sass:build
   ```

4. Start a local static server. For example, with Python:

   ```bash
   python -m http.server 8000
   ```

5. Open `http://localhost:8000/` in a browser. An internet connection is needed the first time client data is loaded from DummyJSON.

During styling work, run `npm run sass:watch` to rebuild `css/style.css` whenever an SCSS file changes.

## Live Demo

Live demo will be added after deployment.

## Test Account

No demo account is preloaded. Open `signup.html`, register a new account, and then log in with the same email and password. The account exists only in the `localStorage` of that browser and origin.

## Credits

- Created by [Artyush23](https://github.com/Artyush23) as an educational 10X CRM exam project.
- Client seed data and simulated create/delete requests are provided by [DummyJSON](https://dummyjson.com/).
- Web API reference material was consulted on [MDN Web Docs](https://developer.mozilla.org/).
- [Twenty CRM](https://twenty.com/) was used only as visual inspiration, not as a code source.
