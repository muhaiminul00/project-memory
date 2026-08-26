---
description: Append a dated entry to this project's Wiki log (append-only, never edited in place)
---

Append one new entry to this project's append-only Wiki log (default `Wiki/log.md`, or wherever this project's `.claude/CLAUDE.md` or root CLAUDE.md names it instead).

Entry format: a dated heading followed by what happened, why, and what it resolved to - parseable and greppable, matching whatever prefix/heading convention existing entries in that file already use (read the last few entries first and match their shape; if the file is new/empty, use `## [YYYY-MM-DD] <short-slug> | <one-line summary>` as the heading).

Use today's date. Never rewrite or delete an existing entry - corrections to something already logged are new entries that reference the old one, not edits to it.

ARGUMENTS, if given, is the content to log (what happened / why / what it resolved to). If no argument was given, ask what to log rather than inventing content - this command records real events, it does not summarize speculatively.

After appending, report the entry as written.
