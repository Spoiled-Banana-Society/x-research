# x-research

Sometimes the thing you're looking for is on Twitter, not Google.

New library just dropped? Devs are posting first impressions on X hours before blog posts exist. API broken? Someone already tweeted the workaround. Cultural moment happening? X has the raw takes while Google has SEO spam from three days later.

This is a skill for [Claude Code](https://claude.ai/claude-code) and [OpenClaw](https://github.com/claw-project/openclaw) that gives your agent the ability to search X — modeled after how Claude Code's built-in research agent works for web search. It decomposes your question into multiple search queries, iterates, follows threads, reads linked content, and comes back with a sourced briefing.

## How it works

You ask something like:

> "what are devs saying about the new X API pay-per-use pricing?"

The skill runs an agentic loop:
1. Breaks your question into 3-5 targeted queries from different angles (core topic, expert voices, pain points, linked resources)
2. Searches X via the API, surfaces the highest-signal tweets
3. Follows interesting threads for full context
4. Reads linked GitHub repos, blog posts, docs — not just the tweets
5. Synthesizes everything by theme with tweet links as sources
6. Saves to a markdown file so you can reference it later

## Example

Query: *"What are the best new OpenClaw skills?"*

6 search queries, ~150 tweets scanned, 4 GitHub repos deep-dived. Output:

```
### Circle Wallet (304 likes, 140K impressions)
Agent-controlled USDC wallets. Already in use at Moltbook hackathon.
- @jerallaire (Circle CEO) — Tweet: https://x.com/jerallaire/status/2019970318581002511
- Skill: https://clawhub.ai/eltontay/circle-wallet

### OpenClaw-Sec (30 likes, 4.4K impressions)
Real-time security — 6 parallel detection modules in under 50ms.
- @orbuloeth — Tweet: https://x.com/orbuloeth/status/2018037658816266577
- Skill: https://github.com/PaoloRollo/openclaw-sec
- Deep dive: prompt injection detection, command validation, SSRF blocking,
  secret scanning. YAML config, SQLite analytics.
```

25+ skills surfaced with links.

## Setup

1. Get an X API bearer token at [developer.x.com](https://developer.x.com)
2. Set the env var:
   ```bash
   export X_BEARER_TOKEN="your_token"
   ```

## Install — Claude Code

```bash
mkdir -p ~/.claude/skills/x-research/references
curl -sL https://raw.githubusercontent.com/rohunvora/x-research-skill/main/SKILL.md \
  -o ~/.claude/skills/x-research/SKILL.md
curl -sL https://raw.githubusercontent.com/rohunvora/x-research-skill/main/references/x-api.md \
  -o ~/.claude/skills/x-research/references/x-api.md
```

## Install — OpenClaw

Tell your agent:

> Install a new skill called "x-research" from https://github.com/rohunvora/x-research-skill — read the SKILL.md and references/x-api.md and set them up. Make sure X_BEARER_TOKEN is in the environment.

## Usage

Just talk to it:

- "search x for what devs think about Bun 2.0"
- "what are people saying about the Vercel outage?"
- "x research: reactions to the new OpenAI model"
- "check twitter for Claude Code tips"

## Limitations

- **7-day window** — recent search only. Full archive needs the $5K/mo Pro tier.
- **Keyword search only** — no semantic/meaning-based search. The skill compensates by running multiple queries from different angles.
- **No `min_likes` filter** — engagement filtering happens after results come back, not at query time.

## License

MIT
