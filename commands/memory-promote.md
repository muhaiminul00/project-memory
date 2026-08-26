---
description: Write or update a durable Wiki page from a fact/decision, and cross-reference it from the index
---

This is the "Ingest" workflow: take a durable fact or decision - ARGUMENTS if given, otherwise ask what's being promoted rather than inventing one - and give it a permanent home in this project's Wiki (default `Wiki/`, or wherever this project's own CLAUDE.md names it instead).

1. Search the existing Wiki first (read `Wiki/index.md`, then any page it points to that looks related) for a page this fact already belongs on or contradicts. Prefer editing an existing page in place over creating a near-duplicate new one.
2. If no existing page fits, create a new one under the topic folder that best matches (create the folder if this project uses topic folders and none fits yet - name it plainly, don't invent an elaborate taxonomy for one page).
3. Write the page as a durable statement of what is true / what was decided - not a narrative of how you found out. If the full story matters, that belongs in a `/memory-log` entry, cross-referenced from the page, not inlined into it.
4. Add or update a line for this page in `Wiki/index.md` under the right section, so it is discoverable.
5. If this fact contradicts something already written elsewhere in the Wiki, do not silently overwrite the old claim - flag the contradiction, resolve it if the resolution is obvious from what's already established, and say plainly which page changed and why.

Report which page(s) changed (or was created) and the index line added/updated.
