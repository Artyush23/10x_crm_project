# AI Usage Log

This log records how AI assistance was used while planning, implementing, and checking the project. Every result was reviewed against the PRD and the running application before it was accepted.

## Entry 1 — Turning the PRD into staged work

- **Goal:** Break a large CRM specification into small stages that could be implemented and reviewed independently.
- **Prompt used:** “Analyze my 10X CRM PRD and the Twenty CRM example. Use Twenty only as visual inspiration, not as code. Create a step-by-step implementation plan with CORE and FULL features, file structure, storage keys, models, implementation order, and 25 meaningful commits.”
- **Tool:** Codex with the local PRD and Twenty reference archive.
- **Result:** **Changed.** The first outline was reorganized into feature branches and ordered so shared storage, guards, theme, and notifications existed before page features. Twenty remained a visual reference only.
- **What I learned:** A detailed implementation order prevents later features from duplicating shared logic.

## Entry 2 — Prompt refinement for authentication

- **Goal:** Replace a vague authentication request with requirements that could be tested exactly.
- **Prompt used:** Vague version: “Add signup and login.” Refined version: “Validate every signup field, show all errors at once, lowercase email before duplicate checks, save users to `crm_users`, create `crm_session` only after an exact password match, show the required toast, and follow the specified redirects.”
- **Tool:** Codex for prompt refinement and implementation; browser testing for verification.
- **Result:** **Used.** The specific prompt produced deterministic validation, storage, messages, and navigation instead of an ambiguous form implementation.
- **What I learned:** Exact error text, storage keys, normalization rules, and success behavior make an AI-generated feature much easier to verify.

## Entry 3 — Building the client repository and CORE workflow

- **Goal:** Use one client source of truth while supporting local persistence and DummyJSON requests.
- **Prompt used:** “Load `crm_clients` when it exists; otherwise fetch 30 DummyJSON users, map them to the exact Client model, save them, and implement add and delete without adding FULL search or detail features yet.”
- **Tool:** Codex, DummyJSON API, browser developer tools, and JavaScript syntax checks.
- **Result:** **Changed.** API records were normalized into the project model, while locally added IDs and DummyJSON 404 deletion behavior were handled separately so local deletion still worked.
- **What I learned:** External API objects should be mapped at the repository boundary so the UI always receives one predictable model.

## Entry 4 — Protecting canonical client state

- **Goal:** Add search, status filters, and sorting without changing the stored client order by accident.
- **Prompt used:** “Implement one `getVisibleClients()` function in this order: status filter, search, then sort on a copied array. Filtering and sorting must not mutate the canonical clients array.”
- **Tool:** Codex and browser interaction testing.
- **Result:** **Used.** Derived lists are created from a copy, while only deliberate actions such as status changes, notes, additions, and deletions update `crm_clients`.
- **What I learned:** Separating canonical state from derived display state avoids subtle bugs after repeated filters and sorts.

## Entry 5 — Verifying dashboard and profile behavior

- **Goal:** Confirm that multiple pages use the same stored users and clients consistently.
- **Prompt used:** “Resolve the current user through `crm_session.userId` and `crm_users`, calculate dashboard values from the shared clients, then verify profile edits, password changes, reset behavior, and the updated dashboard greeting in the browser.”
- **Tool:** Codex, Sass CLI, Node.js syntax checks, and in-browser end-to-end verification.
- **Result:** **Used.** Profile edits persisted into `crm_users`, the new password replaced the old one, the dashboard greeting reflected the changed name, and resetting restored 30 clients.
- **What I learned:** Cross-page browser tests catch integration problems that isolated form tests cannot reveal.

## Entry 6 — Rejecting an unsafe storage shortcut

- **Goal:** Make logout and CRM reset obey the exact data-preservation rules.
- **Prompt used:** “Evaluate whether `localStorage.clear()` should be used for logout or Reset CRM Data. Logout must remove only `crm_session`; reset must remove only `crm_clients` and preserve `crm_users`, `crm_session`, and `crm_theme`.”
- **Tool:** Codex code review, MDN `localStorage` documentation, and a mocked-storage test.
- **Result:** **Rejected.** The generic AI shortcut `localStorage.clear()` was rejected because it would erase accounts, the active session, and the saved theme. Targeted `removeItem` behavior was used instead.
- **What I learned:** AI suggestions must be compared with data ownership rules; shorter code is not correct when it destroys unrelated state.
