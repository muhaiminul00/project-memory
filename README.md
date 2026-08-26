# project-memory

A portable, self-scaffolding three-layer memory system for Claude Code
projects: a **current-state doc** (what's true right now), a **Wiki** of
durable, cross-referenced facts and decisions, and an **append-only log**
(the historical/audit narrative).

## Why this exists

This came out of building a real multi-week project with Claude Code, where
context kept getting lost between sessions - the same facts re-explained,
decisions re-litigated, "wait, didn't we already figure this out?" more
times than it should have happened. The fix that actually worked was a
three-layer memory model (loosely following [this gist on LLM-maintained
wikis](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)):
one file for current state, a cross-referenced wiki for anything durable,
and a plain append-only log for the history. It worked well enough on that
project that it seemed worth pulling out into something reusable, instead
of copy-pasting the same files into every new project by hand.

It's not a big, general-purpose memory product - no vector search, no
automatic summarization pipeline, no daily-rotation history. It's a small,
opinionated structure that solved a real problem, packaged so you don't
have to rebuild it yourself.

## What it does

- On first run in a project, scaffolds whichever of the three layers don't
  already exist - `.project-memory/PROJECT_STATE.md`,
  `.project-memory/Wiki/index.md`, `.project-memory/Wiki/log.md` (same
  convention as the `remember` plugin's own `.remember/` folder) - and
  **never touches anything already present**.
- Once, seeds a short starter block into that project's `.claude/CLAUDE.md`
  (not the root `CLAUDE.md` you actually maintain - this keeps plugin/tool
  instructions separate from your own project documentation) explaining the
  model and the Promotion Rule.
- Every session, reminds Claude that maintaining this memory is its own
  job, not something that waits for you to ask - see "The Promotion Rule"
  below.
- Ships four slash commands as an explicit, manual fallback for when you
  want to force one of the workflows directly: `/memory-log`,
  `/memory-promote`, `/memory-lint`, `/memory-init`.
- No manual setup step required, at either install scope, though `/memory-init`
  is there for running it right now instead of waiting - see Install/Setup
  below for the exact mechanics and the session-boundary caveat.

## Why use it

If you're working on anything longer than a single session with Claude
Code, you already have this problem: facts get re-derived, decisions get
re-asked, and there's no single place that says "here's what's actually
true right now" versus "here's the full history of how we got here." This
plugin doesn't solve that with anything clever - it just gives Claude a
place to put things, and a rule for which of three places a given piece of
information belongs in, so it stops needing to be re-explained.

Credit where it's due: the three-layer, LLM-maintained-wiki pattern itself
is [Andrej Karpathy's](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
idea, not this project's. This plugin is an independent implementation of
that pattern for Claude Code - not a fork or a copy of any of his code -
packaged so it scaffolds and self-maintains automatically instead of being
set up by hand each time.

## Install

```
/plugin marketplace add https://github.com/muhaiminul00/project-memory
/plugin install project-memory@project-memory
```

**Caveat, stated plainly:** scaffolding happens the next time Claude Code
starts in that project - an actual session boundary (`startup`, `resume`,
`compact`, `clear`, or a forked session), not the moment `/plugin install`
runs. If you don't want to wait (or you're testing right after installing),
run `/memory-init` - it scaffolds everything immediately, in the current
session, with no restart.

## Setup

Nothing to configure for the defaults. Optional, once installed:

1. Run `/memory-init` to scaffold now instead of waiting for the next
   session boundary.
2. If your project already tracks state/decisions under different file
   names, say so in `.claude/CLAUDE.md` (the seeded block leaves a
   placeholder for exactly this) instead of using the defaults.
3. Pair with [`role-modes`](https://github.com/muhaiminul00/role-modes) if
   you also want the advisor/commander/execute mode system that reads and
   writes this memory during real work.

## Usage example

A fresh project, right after install, in a live session:

```
> /memory-init
Created .project-memory/PROJECT_STATE.md
Created .project-memory/Wiki/index.md
Created .project-memory/Wiki/log.md
Seeded .claude/CLAUDE.md with the project-memory starter block.
```

Resulting tree:

```
.project-memory/
├── PROJECT_STATE.md
└── Wiki/
    ├── index.md
    └── log.md
```

Later, after deciding something durable:

```
> /memory-promote We decided to use Postgres row-level security instead
  of an app-layer permission check, because RLS holds even if a future
  endpoint forgets to check.

Wrote .project-memory/Wiki/decisions/rls-over-app-layer-checks.md,
cross-referenced it from Wiki/index.md.
```

From there, just work normally - Claude is expected to keep the state doc,
the Wiki, and the log up to date on its own, applying the Promotion Rule
below without being asked. If you want to force a specific update, use the
matching slash command:

- `/memory-log` - append a dated entry to the log.
- `/memory-promote` - write or update a durable Wiki page from a fact or
  decision, and cross-reference it from the index.
- `/memory-lint` - health-check the Wiki for contradictions, orphan pages,
  stale claims, and missing cross-references.
- `/memory-init` - re-run or repair the scaffold if a layer is missing, or
  run the entire first-time setup (files + CLAUDE.md block) immediately
  instead of waiting for the next session boundary.

## The Promotion Rule

The rule that keeps the three layers from collapsing into one
undifferentiated pile - and the thing Claude is expected to apply on its
own, as part of normal work, not just when reminded:

- Learned a durable fact or made a decision? -> a Wiki page (create or edit
  in place, cross-referenced from `index.md`) - now, not later.
- Just completed something with no new durable fact? -> a one-line
  current-state-doc update (overwrite, don't append) - now.
- Need the full narrative of *how* something happened? -> the log - now.
  Never the state doc.

## What this plugin does NOT assume about your project

Scaffolding uses fixed default names/paths (`.project-memory/PROJECT_STATE.md`,
`.project-memory/Wiki/`) since v1 has no machine-parsed config file to
override them. If your
project already tracks state or decisions under different names:

- Say so in `.claude/CLAUDE.md` or your project's own root `CLAUDE.md` -
  the seeded starter block leaves a placeholder for exactly this - and the
  slash commands will use whatever names you give instead of the defaults.
- The scaffold itself still only acts on the default paths and only when
  nothing exists there yet, so it's safe to run even if you use different
  names elsewhere: worst case, one unused placeholder file appears once,
  which you can delete.
- The one-time `.claude/CLAUDE.md` starter block is gated on a marker
  string being absent, not on whether your project already describes an
  equivalent memory model in its own words. If it does, you'll get a
  redundant section the first time the plugin runs there - harmless, just
  delete it if it's not wanted.

## Design notes

- **State lives in the consuming project, not the plugin.** Plugin code
  runs from a shared cache directory across every project it's installed
  in, so every scaffolded file is written under `${CLAUDE_PROJECT_DIR}` -
  plugin updates reach every project automatically; nothing about a
  project's own memory files is duplicated into the plugin's code.
- **Non-destructive by construction.** Every scaffold write is
  existence-checked immediately before it happens; the hook never merges,
  renames, or deletes. Re-running `/memory-init` is always safe.
- **Recommended companion:** pair this with the
  [`role-modes`](https://github.com/muhaiminul00/role-modes) plugin for the
  advisor/commander/execute mode system that actually reads and writes this
  memory during real work. Independently useful either way.
- **`/memory-init` duplicates content, on purpose, with a check.**
  `commands/memory-init.md` embeds a literal copy of the `.claude/CLAUDE.md`
  starter block that `hooks/session-start.js` writes - a slash-command has
  no way to read the hook's own code (`${CLAUDE_PLUGIN_ROOT}` is
  hooks/MCP/LSP/monitor-only). Rather than trust a comment alone to catch
  the two drifting apart, `scripts/check-init-sync.js` actually runs the
  hook against a scratch project and byte-diffs its output against the
  command file - run it after editing the block's wording, before
  committing.

## Releases

`.claude-plugin/plugin.json`'s `version` field is the single source of truth
(Claude Code ignores `marketplace.json`'s copy silently if both are set, so
only `plugin.json` carries one). **A plain commit to `main` is not enough for
an installed copy to update** - `/plugin update` compares versions and skips
if they match, so every user-facing change needs a version bump in
`plugin.json` alongside it, or existing installs stay on the cached version
forever. Bump on any commit that changes a command, hook behavior, or
anything else an installed project would notice; a doc-only typo fix doesn't
need one. A git tag/GitHub Release isn't required for `/plugin update` to
work, but tagging `vX.Y.Z` after a version bump makes the history easy to
read.

## License

MIT
