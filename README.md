# x-research

A general-purpose X/Twitter research skill for [Claude Code](https://claude.ai/claude-code) and [OpenClaw](https://github.com/claw-project/openclaw). Searches X the way a research agent searches the web — decomposing questions into multi-angle queries, iteratively refining, following threads, deep-diving linked content, and synthesizing into a sourced briefing.

X is often better than Google for recent dev discussions, product launches, breaking news, cultural takes, and expert opinions. This skill makes that searchable programmatically.

## What it does

Given any research question, the skill:

1. **Decomposes** it into 3-5 targeted X search queries with smart operators (`from:`, `has:links`, `url:github.com`, `-is:retweet`, etc.)
2. **Searches** X via the API, ranks by relevance and engagement
3. **Follows threads** via `conversation_id:` for full context
4. **Deep-dives linked content** — fetches GitHub READMEs, blog posts, docs from tweet URLs
5. **Synthesizes by theme** with standardized output: tweet links, engagement metrics, linked resources
6. **Saves** a date-stamped markdown briefing to `~/clawd/drafts/`

## Example output

Query: *"What are the best new OpenClaw skills?"*

```
### Circle Wallet (304 likes, 140K impressions)
Agent-controlled USDC wallets. Already in use at Moltbook hackathon.
- **@jerallaire**: Circle CEO announcing agent wallets (304L, 140KI)
  [Tweet](https://x.com/jerallaire/status/2019970318581002511)
- Skill: https://clawhub.ai/eltontay/circle-wallet

### OpenClaw-Sec (30 likes, 4.4K impressions)
Real-time security with 6 parallel detection modules in under 50ms.
- **@orbuloeth**: prompt injection, command validation, SSRF blocking, secret detection (30L, 4.4KI)
  [Tweet](https://x.com/orbuloeth/status/2018037658816266577)
- Skill: https://github.com/PaoloRollo/openclaw-sec
- Deep dive: YAML config, SQLite analytics, severity scoring SAFE → CRITICAL

---
## Research Metadata
- API calls: 6 search queries + 4 deep-dives
- Tweets scanned: ~150
- Est. cost: ~$0.06
```

That example ran 6 search queries, scanned ~150 tweets, deep-dived 4 GitHub repos, and surfaced 25+ skills with links. Total API cost: ~$0.06.

## Prerequisites

1. **X API bearer token** — Get one at [developer.x.com](https://developer.x.com). The pay-per-use tier works fine (~$0.005/tweet read).
2. Set the env var:
   ```bash
   export X_BEARER_TOKEN="your_bearer_token_here"
   ```

## Install — Claude Code

Copy the skill folder into your Claude Code skills directory:

```bash
# Clone
git clone https://github.com/rohunvora/x-research-skill.git

# Copy to Claude Code skills
cp -r x-research-skill ~/.claude/skills/x-research
```

Or install directly:

```bash
mkdir -p ~/.claude/skills/x-research/references
curl -sL https://raw.githubusercontent.com/rohunvora/x-research-skill/main/SKILL.md -o ~/.claude/skills/x-research/SKILL.md
curl -sL https://raw.githubusercontent.com/rohunvora/x-research-skill/main/references/x-api.md -o ~/.claude/skills/x-research/references/x-api.md
```

## Install — OpenClaw

Tell your agent:

> Install a new skill called "x-research" from https://github.com/rohunvora/x-research-skill — create the SKILL.md and references/x-api.md files. Make sure X_BEARER_TOKEN is set in the environment.

## Usage

Just ask naturally:

- "search x for what devs think about Bun 2.0"
- "what are people saying about the new X API pricing?"
- "x research: best practices for Claude Code skills"
- "check x for reactions to the Vercel outage"

The skill triggers on phrases like "search x for", "what are people saying about", "x research", etc.

## Cost

A typical research session runs 3-6 search queries at 100 tweets each. At $0.005/tweet read:

| Session size | Queries | Tweets | Cost |
|-------------|---------|--------|------|
| Quick check | 2-3 | ~200 | ~$1 |
| Standard research | 4-6 | ~500 | ~$2.50 |
| Deep dive | 6-10 | ~800 | ~$4 |

Plus any deep-dives into linked URLs (free, uses WebFetch).

## Limitations

- **7-day window** — Recent search only covers the last 7 days. Full archive requires the Pro tier ($5K/mo) or pay-per-use equivalent.
- **No semantic search** — X API is keyword-only. The skill compensates by decomposing questions into multiple angle-specific queries.
- **`min_likes` unavailable** — Engagement filtering is done post-hoc from `public_metrics`, not at the query level (requires Pro tier).
- **Rate limits** — 450 requests per 15 minutes. Plenty for research, but be aware if running back-to-back sessions.

## License

MIT
