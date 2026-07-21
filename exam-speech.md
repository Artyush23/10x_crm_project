# One-Minute Exam Speech

Hello, my project is called 10X CRM. It is a small customer relationship management application for organizing clients and sales work. A user can create an account, log in, view dashboard statistics, add clients, change their status, search and sort them, write notes, and edit a profile. The application also supports light and dark themes.

I built it with semantic HTML, Vanilla JavaScript, and Sass. It has no backend or database, so it stores users, sessions, clients, and theme preferences in browser localStorage. DummyJSON provides the initial client data and simulates API requests.

The hardest part was keeping one reliable client state across the dashboard, client list, and profile reset. I solved this with a shared repository and careful storage helpers. This project helped me understand validation, Fetch API requests, state management, and testing complete user flows.
