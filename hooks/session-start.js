#!/usr/bin/env node
'use strict';

// project-memory plugin - SessionStart hook
//
// On first run in a project, scaffolds the three-layer memory structure
// (state doc + Wiki dir with index.md/log.md) if none of it exists yet -
// never overwrites or touches anything already present. Every run, injects
// a short reminder of the model into context.
//
// Runs under plain Node.js so it behaves identically on Windows/macOS/Linux -
// same convention as the sibling `role-modes` plugin.

const fs = require('fs');
const path = require('path');

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const stateDir = path.join(projectDir, '.claude', 'hooks', 'state');

// Fixed default filenames/paths for v1. A project may already track this
// under different names - see README "What this plugin does NOT assume".
// The hook only ever creates these defaults when nothing exists at that
// exact path; it never renames, merges, or deletes anything.
const STATE_DOC = path.join(projectDir, 'PROJECT_STATE.md');
const WIKI_DIR = path.join(projectDir, 'Wiki');
const WIKI_INDEX = path.join(WIKI_DIR, 'index.md');
const WIKI_LOG = path.join(WIKI_DIR, 'log.md');

// Kept short and directive on purpose: the full three-layer explanation and
// the Promotion Rule live in exactly one place - the seeded CLAUDE.md block
// (see seedClaudeMd below) and the README - not restated here too. This is
// just a pointer so every session is reminded the system exists AND that
// maintaining it is the default, automatic behavior - not something that
// waits for a human to type a /memory-* command.
const context =
  'MEMORY: this project has the `project-memory` plugin installed (a state doc + a durable ' +
  'cross-referenced Wiki + an append-only log). Apply the Promotion Rule yourself, without ' +
  'being asked: a durable fact/decision -> write/update a Wiki page now; a status-only update ' +
  '-> overwrite the state doc now; the full narrative of how something happened -> append the ' +
  "log now. `/memory-log`/`/memory-promote`/`/memory-lint` are the manual fallback for when you " +
  "want to trigger one explicitly, not the primary path. See this project's `.claude/CLAUDE.md` " +
  "(this plugin's own seeded instructions) and its root CLAUDE.md for file names if either " +
  'defines them, else the defaults are `PROJECT_STATE.md` and `Wiki/` (`index.md`, `log.md`) at ' +
  'the project root.';

const output = {
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: context
  }
};

process.stdout.write(JSON.stringify(output));

scaffoldMemoryFiles();
seedClaudeMd();

function scaffoldMemoryFiles() {
  // Cheap sentinel-file stat gates this on every run after the first, so
  // existing files are never re-stat'd just to test for prior scaffolding.
  const sentinelFile = path.join(stateDir, '.memory-scaffolded');
  if (fs.existsSync(sentinelFile)) return;

  try {
    fs.mkdirSync(stateDir, { recursive: true });

    const needsWikiDir = !fs.existsSync(WIKI_INDEX) || !fs.existsSync(WIKI_LOG);
    if (needsWikiDir) fs.mkdirSync(WIKI_DIR, { recursive: true });

    if (!fs.existsSync(STATE_DOC)) {
      fs.writeFileSync(STATE_DOC, template('PROJECT_STATE.md - Current State Dashboard', [
        'Purpose: what is true RIGHT NOW. Not history (see `Wiki/log.md`), not',
        'durable facts/decisions (see `Wiki/*.md`). Overwritten each session,',
        'never appended to.',
        '',
        'Read this first, every session. Then `Wiki/index.md` for anything this',
        'file points to but does not explain.',
        '',
        '---',
        '',
        '## Last Updated',
        '(nothing recorded yet)',
        '',
        '## Current Phase',
        '(nothing recorded yet)',
        '',
        '## Active Blockers',
        '(none)'
      ]), 'utf8');
    }
    if (!fs.existsSync(WIKI_INDEX)) {
      fs.writeFileSync(WIKI_INDEX, template('Wiki Index - Durable Facts & Decisions', [
        '```',
        'Purpose:   Catalog of durable, still-current facts and decisions - HOW',
        '           something works or WHAT was decided, not the story of',
        '           getting there. Read this index every session; drill into',
        '           specific pages only as needed for the task at hand.',
        'Not this:  Wiki/log.md (append-only historical/audit record, consulted',
        '           only on demand) or the project state doc (current-state',
        '           dashboard - read that in full every session too).',
        '```',
        '',
        'Add topic sections and pages as the project accumulates durable facts -',
        'link each new page here so it is discoverable.'
      ]), 'utf8');
    }
    if (!fs.existsSync(WIKI_LOG)) {
      fs.writeFileSync(WIKI_LOG, template('Wiki Log - Append-Only Historical Record', [
        'Cold storage. Read only for historical/audit purposes - never as part',
        'of routine session start. Each entry: what happened, why, what it',
        'resolved to. Never edited in place once written; corrections are new',
        'entries, not rewrites of old ones.'
      ]), 'utf8');
    }
  } catch (err) {
    return; // Best-effort; retry next session. Sentinel intentionally not written on failure.
  }

  try {
    fs.writeFileSync(sentinelFile, '', 'utf8');
  } catch (err) {
    // If the sentinel write fails, this scaffold logic just runs again next
    // session - harmless, since every write above is itself existence-checked.
  }
}

function template(title, bodyLines) {
  return [
    `# ${title}`,
    '',
    ...bodyLines,
    '',
    '(Scaffolded by the `project-memory` plugin on first run.)',
    ''
  ].join('\n');
}

function seedClaudeMd() {
  // Deliberately its own sentinel, separate from scaffoldMemoryFiles' - this
  // is an independent concern (documenting the system in CLAUDE.md) and
  // should retry on its own if it fails, regardless of whether the memory
  // files above were written successfully. Matches the sibling role-modes
  // plugin's seedClaudeMd, which is likewise fully self-contained.
  // Namespaced, not the generic `.claude-md-seeded` name - the sibling
  // role-modes plugin uses that exact filename for its own CLAUDE.md-seed
  // gate. A shared `.claude/hooks/state/` directory means a bare, generic
  // sentinel name silently collides across plugins: whichever plugin's
  // SessionStart hook runs first "claims" the sentinel, and every other
  // plugin sharing that name sees it already exists and skips seeding its
  // own block entirely - found live, verifying this exact scenario against
  // a real project with both plugins installed.
  const sentinelFile = path.join(stateDir, '.project-memory-claude-md-seeded');
  if (fs.existsSync(sentinelFile)) return;

  const marker = '<!-- project-memory-plugin:v1 -->';
  // Seeded under .claude/CLAUDE.md, not the project's root CLAUDE.md - this
  // is tool/plugin instruction, not project documentation, and keeping it
  // out of the file a human actually maintains keeps that file clean. Claude
  // Code loads .claude/CLAUDE.md the same as root CLAUDE.md, so nothing is
  // lost by seeding here instead.
  const dotClaudeDir = path.join(projectDir, '.claude');
  const claudeMdPath = path.join(dotClaudeDir, 'CLAUDE.md');

  const block = [
    '',
    marker,
    '## Project Memory (project-memory plugin)',
    '',
    'This project has the `project-memory` plugin installed, providing a',
    'three-layer memory model, based on the LLM-maintained-wiki pattern',
    '(https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).',
    'Every file the plugin scaffolds says so in its own header - this is',
    'plugin-managed structure, not ad hoc project documentation:',
    '',
    '- `PROJECT_STATE.md` - current truth only, overwritten each session.',
    '- `Wiki/*.md` - durable facts and decisions, organized by topic,',
    '  edited in place as understanding changes, cross-referenced from',
    '  `Wiki/index.md`.',
    '- `Wiki/log.md` - append-only chronological record, read only on',
    '  request.',
    '',
    'Promotion Rule (self-maintaining, do not wait to be asked): a durable',
    'fact or decision -> write/update a Wiki page now; a status-only update',
    '-> overwrite `PROJECT_STATE.md` now; the full narrative of how',
    'something happened -> append `Wiki/log.md` now. Do this as part of',
    'normal work, not just when a human explicitly asks for a memory update.',
    '',
    'Commands (manual/explicit fallback, not the primary path): `/memory-log`',
    '(force a log entry), `/memory-promote` (force a Wiki write + index',
    'cross-reference), `/memory-lint` (health-check the Wiki for',
    'contradictions/orphans/stale claims), `/memory-init` (re-run/repair the',
    'scaffold).',
    '',
    'Fill in the specifics that make this useful for THIS project:',
    '- If this project already tracks state/decisions under different file',
    '  names, say so here and point at them instead of the defaults above.',
    '- Name any topic folders under `Wiki/` this project should use',
    '  (e.g. `credentials/`, `infra/`, `decisions/`).',
    '',
    'Recommended companion: pair this with the `role-modes` plugin',
    '(https://github.com/muhaiminul00/role-modes) for the advisor/',
    'commander/execute mode system that reads and writes this memory.',
    marker,
    ''
  ].join('\n');

  try {
    fs.mkdirSync(dotClaudeDir, { recursive: true });
    let existing = '';
    try {
      existing = fs.readFileSync(claudeMdPath, 'utf8');
    } catch (readErr) {
      existing = ''; // No .claude/CLAUDE.md yet - fine, we'll create one.
    }
    if (!existing.includes(marker)) {
      const needsLeadingNewline = existing.length > 0 && !existing.endsWith('\n');
      fs.appendFileSync(claudeMdPath, (needsLeadingNewline ? '\n' : '') + block, 'utf8');
    }
    fs.writeFileSync(sentinelFile, '', 'utf8');
  } catch (err) {
    // Seeding is a convenience, not a requirement for the memory system to work.
  }
}
