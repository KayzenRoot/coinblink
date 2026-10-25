# ECC curated plugin staging · NO INSTALL / NO AUTO-DISCOVERY

This is a **dormant, self-contained local marketplace candidate** for four adapted, reviewed skills.
It lives *inside* the experimental ECC tools path, not in the repository's root
`.agents/plugins/marketplace.json` or `plugins/` directory. It is **not installed**,
not enabled, not configured, and does not change the CoinBlink module pipeline.

The plugin uses the OpenAI portable `plugin.json` format with a root `skills/`
directory. The marketplace source points only inside this staging root.
There is **no** `mcp.json`, `.mcp.json`, `hooks/`, executable script,
`config.toml`, installation command, package manager step or network dependency.

## Pinned skill payloads

```json
{
  "ecc-ai-regression": "d1e8b20ca4718eabf7beef6c60363702e5142842",
  "ecc-change-impact": "a3bf769d4bc17d6f476e51a612e5725528d818a9",
  "ecc-module-regression": "bef483c7f9c17c5a51a500eda07e2b280b21762e",
  "ecc-pr-test-analyzer": "6de01d5977de254042e1ba2ec5b68d1ef54209d7"
}
```

The stdlib CI checks the actual bytes against the existing project-scoped
`.agents/skills/ecc-*/SKILL.md` and the original A/B materials. These
fingerprints are for **contents**, not proof of real Codex discovery.

## Enrollment is expressly deferred

Do not add a root marketplace, call `codex plugin marketplace add`,
`codex plugin add`, run Codex, enable hooks, enable MCP or copy files to
`~/.codex` from this PR. The package exists for *static evaluation* only.

For a future authorized pilot, use an isolated CODEX_HOME/profile and
synthetic fixtures. Choose **one** discovery path for each skill (project
`.agents/skills` or installed plugin); do not enable the same skill from
two places at once. Verify session authentication and included allowance
without paid fallback, offline/FS boundaries, version compatibility and
rollback before attempting installation.

After explicit per-HEAD approval and complete proof, consider merging only
the audited four-skills subset. The full 311-skill upstream, hooks and MCP
are separate initiatives and are NOT implied by this staged package.
