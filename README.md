# project-memory

A portable, self-scaffolding three-layer project memory system for Claude
Code: a **current-state doc** (what's true right now), a **Wiki** of durable,
cross-referenced facts and decisions, and an **append-only log** (the
historical/audit narrative). Based on the LLM-maintained-wiki pattern
described in [this gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f):
the model incrementally builds and maintains the wiki itself - the human
curates sources and asks questions, reviewing generated artifacts rather than
plans.

Extracted from an internal project's working three-layer memory setup so it
can be dropped into any other project as a real Claude Code plugin, instead
of being copy-pasted as static per-project files.

## Install

```
/plugin marketplace add https://github.com/muhaiminul00/project-memory
/plugin install project-memory@project-memory
```

## What you get

- A `SessionStart` hook (plain Node.js - no OS-specific shell scripts) that:
  - on first run in a project, scaffolds whichever of the three layers don't
    already exist - `PROJECT_STATE.md`, `Wiki/index.md`, `Wiki/log.md` -
    **never overwrites or touches anything already present**;
  - once, gated behind a cheap sentinel file, appends a short starter block
    to that project's `CLAUDE.md` (marked with
    `<!-- project-memory-plugin:v1 -->`) explaining the model and prompting
    you to fill in project-specific detail;
  - every session, injects a short reminder of the three-layer model and the
    Promotion Rule into context.
- Four slash commands implementing the gist's core workflows generically:
  - `/memory-log` - append a dated entry to the log (**Ingest**'s bookkeeping
    half; never edited in place once written).
  - `/memory-promote` - write or update a durable Wiki page from a fact or
    decision, and cross-reference it from the index (**Ingest**'s durable
    half).
  - `/memory-lint` - health-check the Wiki for contradictions, orphan pages,
    stale claims, and missing cross-references (**Lint**).
  - `/memory-init` - re-run or repair the scaffold if a layer is missing.

## The Promotion Rule

The rule that keeps the three layers from collapsing into one undifferentiated
pile:

- Learned a durable fact or made a decision? -> a Wiki page (create or edit in
  place, cross-referenced from `index.md`).
- Just completed something with no new durable fact? -> a one-line
  current-state-doc update (overwrite, don't append).
- Need the full narrative of *how* something happened? -> the log. Never the
  state doc.

## What this plugin does NOT assume about your project

Scaffolding uses fixed default names/paths (`PROJECT_STATE.md`, `Wiki/`) since
v1 has no machine-parsed config file to override them (see below). If your
project already tracks state or decisions under different names:

- Say so in your own `CLAUDE.md` - the seeded starter block leaves a
  placeholder for exactly this - and the slash commands will use whatever
  names you give instead of the defaults.
- The scaffold itself still only acts on the default paths and only when
  nothing exists there yet, so it's safe to run even if you use different
  names elsewhere: worst case, one unused placeholder file appears once,
  which you can delete.
- The one-time `CLAUDE.md` starter block is gated differently: only on a
  marker string being absent, not on whether your `CLAUDE.md` already
  describes an equivalent memory model in its own words. If it does, you'll
  get a second, redundant section the first time the plugin runs there -
  harmless, just delete it (or the marker block) if it's not wanted.

## What's deliberately NOT included

- **Build Cards / task-spec generation.** That's a workflow/orchestration
  concern, not a memory-storage one - it belongs in a mode-system plugin (see
  below) or your own project's conventions, not duplicated here.
- **A machine-parsed project-config file** to replace the "if this project
  names one, else default" fallback prose above. A legitimate idea, deferred
  rather than built for v1 - the same call the sibling `role-modes` plugin
  made for its own equivalent fallbacks.
- Any project-specific tooling hooks (credential handling, permission
  fallbacks, etc.) - those stay in the project that needs them.

## Design notes

- **State lives in the consuming project, not the plugin.** Plugin code runs
  from a shared cache directory across every project it's installed in, so
  every scaffolded file is written under `${CLAUDE_PROJECT_DIR}`.
- **Non-destructive by construction.** Every scaffold write is
  existence-checked immediately before it happens; the hook never merges,
  renames, or deletes. Re-running `/memory-init` is always safe.
- **Recommended companion:** pair this with the
  [`role-modes`](https://github.com/muhaiminul00/role-modes) plugin for the
  advisor/commander/execute mode system that actually reads and writes this
  memory during real work. Independently useful either way.

## License

MIT
