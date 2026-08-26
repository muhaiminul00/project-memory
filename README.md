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
  already exist - `PROJECT_STATE.md`, `Wiki/index.md`, `Wiki/log.md` at the
  project root - and **never touches anything already present**.
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
- No manual setup step, at either install scope. Installed for one project:
  it scaffolds that project the next time Claude Code starts there.
  Installed at user scope: it scaffolds whatever project you open next,
  automatically, the same way it would on a fresh per-project install -
  there's nothing to remember to run first.

## Why use it

If you're working on anything longer than a single session with Claude
Code, you already have this problem: facts get re-derived, decisions get
re-asked, and there's no single place that says "here's what's actually
true right now" versus "here's the full history of how we got here." This
plugin doesn't solve that with anything clever - it just gives Claude a
place to put things, and a rule for which of three places a given piece of
information belongs in, so it stops needing to be re-explained.

## How to use it

```
/plugin marketplace add https://github.com/muhaiminul00/project-memory
/plugin install project-memory@project-memory
```

That's it. Open (or restart) a project and the three files appear if
they're missing. From there, just work normally - Claude is expected to
keep the state doc, the Wiki, and the log up to date on its own, applying
the Promotion Rule below without being asked. If you want to force a
specific update, use the matching slash command:

- `/memory-log` - append a dated entry to the log.
- `/memory-promote` - write or update a durable Wiki page from a fact or
  decision, and cross-reference it from the index.
- `/memory-lint` - health-check the Wiki for contradictions, orphan pages,
  stale claims, and missing cross-references.
- `/memory-init` - re-run or repair the scaffold if a layer is missing.

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

Scaffolding uses fixed default names/paths (`PROJECT_STATE.md`, `Wiki/`)
since v1 has no machine-parsed config file to override them. If your
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

## License

MIT
