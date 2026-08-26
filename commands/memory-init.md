---
description: Re-run or repair the project-memory scaffold (state doc + Wiki index/log + CLAUDE.md block)
---

`/plugin install` never triggers this plugin's `SessionStart` hook (Claude Code
has no hook that fires the instant a plugin is enabled - see the README's
"Caveat, stated plainly"). This command does everything that hook would
otherwise do, right now, without a `/clear` or restart. It also doubles as a
repair tool for an existing project missing a layer.

**1. The three memory files.** Check for this project's three memory layers -
a state doc (default `.project-memory/PROJECT_STATE.md`), a Wiki index
(default `.project-memory/Wiki/index.md`), and a Wiki log (default
`.project-memory/Wiki/log.md`) - using whatever names this project's
`.claude/CLAUDE.md` (this plugin's own seeded instructions) or root
`CLAUDE.md` gives them if either names any, else the defaults just listed.

For each of the three that is genuinely missing (not just differently named -
check both CLAUDE.md files and the `.project-memory/` dir first): create it
with a minimal header matching its purpose - a current-state dashboard header
for the state doc, a Wiki index header for `index.md`, a Wiki log header for
`log.md` (see the plugin's own `Wiki/index.md`/`Wiki/log.md`-equivalent
structure in its README for the shape, or just write a `# <name> - <one-line
purpose>` heading plus a short purpose note if unsure). Never overwrite, merge
into, or delete a file that already exists, under any name - this command
repairs gaps, it does not restructure.

**2. CLAUDE.md starter block.** Check `.claude/CLAUDE.md` for the marker
`<!-- project-memory-plugin:v1 -->`. If it's already present, leave the file
alone. If it's absent, append this exact block (create `.claude/CLAUDE.md`
first if it doesn't exist yet; add one blank line before the block if the
file has other content and doesn't already end in a blank line):

```
<!-- project-memory-plugin:v1 -->
## Project Memory (project-memory plugin)

This project has the `project-memory` plugin installed, providing a
three-layer memory model inspired by the LLM-maintained-wiki pattern in
Andrej Karpathy's gist
(https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) - an
independent implementation of that pattern, not a fork of any of his code.
Everything lives under `.project-memory/` (same convention as the
`remember` plugin's `.remember/`), and every file the plugin scaffolds
says so in its own header - this is plugin-managed structure, not ad hoc
project documentation:

- `.project-memory/PROJECT_STATE.md` - current truth only, overwritten
  each session.
- `.project-memory/Wiki/*.md` - durable facts and decisions, organized
  by topic, edited in place as understanding changes, cross-referenced
  from `.project-memory/Wiki/index.md`.
- `.project-memory/Wiki/log.md` - append-only chronological record,
  read only on request.

Promotion Rule (self-maintaining, do not wait to be asked): a durable
fact or decision -> write/update a Wiki page now; a status-only update
-> overwrite `.project-memory/PROJECT_STATE.md` now; the full narrative
of how something happened -> append `.project-memory/Wiki/log.md` now.
Do this as part of normal work, not just when a human explicitly asks
for a memory update.

Commands (manual/explicit fallback, not the primary path): `/memory-log`
(force a log entry), `/memory-promote` (force a Wiki write + index
cross-reference), `/memory-lint` (health-check the Wiki for
contradictions/orphans/stale claims), `/memory-init` (re-run/repair the
scaffold).

Fill in the specifics that make this useful for THIS project:
- If this project already tracks state/decisions under different file
  names, say so here and point at them instead of the defaults above.
- Name any topic folders under `Wiki/` this project should use
  (e.g. `credentials/`, `infra/`, `decisions/`).

Recommended companion: pair this with the `role-modes` plugin
(https://github.com/muhaiminul00/role-modes) for the advisor/
commander/execute mode system that reads and writes this memory.
<!-- project-memory-plugin:v1 -->
```

After writing it, also create the sentinel file
`.claude/hooks/state/.project-memory-claude-md-seeded` (empty file) so the
`SessionStart` hook doesn't try to seed a second, duplicate block the next
time a real session boundary happens.

**Maintenance note for whoever edits this plugin:** this block is a literal
copy of the one `hooks/session-start.js`'s `seedClaudeMd()` writes - there is
no way for a slash-command to `require()` or otherwise share code with a hook
script (`${CLAUDE_PLUGIN_ROOT}` is only readable from hooks/MCP/LSP/monitor
processes, not from a command's own execution context). If you change the
starter block's wording in one place, change it in the other too, then run
`node scripts/check-init-sync.js` to verify - it actually runs the hook
against a scratch project and byte-diffs the output against this file,
instead of relying on this comment alone to catch drift.

If everything in both steps already exists, say so plainly and do nothing.

Report exactly what was created in each step, what already existed, and what
(if anything) looked ambiguous enough to leave alone and flag instead of
guessing.
