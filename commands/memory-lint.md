---
description: Health-check the Wiki for contradictions, orphan pages, stale claims, and missing cross-references
---

This is the "Lint" workflow: a periodic health check of this project's Wiki (default `Wiki/`, or wherever this project's own CLAUDE.md names it instead), not a search for new facts to add.

1. Read `Wiki/index.md` in full, then every page it links to.
2. Flag, for each: a page no longer linked from the index (orphan); two pages making claims that can no longer both be true (contradiction); a claim that reads as still-current but is dated or references something since superseded (stale claim); a page that references another page/decision by name without a link where one should exist (missing cross-reference).
3. For anything with one obviously correct fix (a missing link, a page that's clearly superseded and should say so), fix it directly and note the fix.
4. For anything ambiguous - which of two contradicting claims is actually current, whether a claim is genuinely stale or still true - do not guess. Report it and ask, or leave it flagged in place (e.g. a short inline note) if this project's convention supports that, rather than silently picking one.
5. Log this pass with `/memory-log` (what was checked, what was found, what was fixed vs. flagged) if this project treats a lint pass as work worth recording - most do.

If nothing is wrong, say so plainly rather than inventing findings to justify the pass.
