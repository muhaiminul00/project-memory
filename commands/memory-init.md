---
description: Re-run or repair the project-memory scaffold (state doc + Wiki index/log)
---

Check for this project's three memory layers - a state doc (default `PROJECT_STATE.md`), a Wiki index (default `Wiki/index.md`), and a Wiki log (default `Wiki/log.md`) - using whatever names this project's own CLAUDE.md gives them if it names any, else the defaults just listed.

For each of the three that is genuinely missing (not just differently named - check CLAUDE.md and the repo root/Wiki dir first): create it with a minimal header matching its purpose - a current-state dashboard header for the state doc, a Wiki index header for `index.md`, a Wiki log header for `log.md` (see the plugin's own `Wiki/index.md`/`Wiki/log.md`-equivalent structure in its README for the shape, or just write a `# <name> - <one-line purpose>` heading plus a short purpose note if unsure). Never overwrite, merge into, or delete a file that already exists, under any name - this command repairs gaps, it does not restructure.

If all three already exist, say so plainly and do nothing.

Report exactly what was created, what already existed, and what (if anything) looked ambiguous enough to leave alone and flag instead of guessing.
