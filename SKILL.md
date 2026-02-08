---
name: x-research
description: >
  General-purpose X/Twitter research agent. Searches X for real-time perspectives,
  dev discussions, product feedback, cultural takes, breaking news, and expert opinions.
  Works like the built-in web research/Explore agent but uses X as the source.
  Use when: (1) user says "x research", "search x for", "search twitter for",
  "what are people saying about", "what's twitter saying", "check x for",
  "x search", "/x-research", (2) user is working on something where recent X discourse
  would provide useful context (new library releases, API changes, product launches,
  cultural events, industry drama), (3) user wants to find what devs/experts/community
  thinks about a topic. NOT for: posting tweets, account management, or historical
  archive searches beyond 7 days.
---

# X Research

General-purpose agentic research over X/Twitter. Decompose any research question into
targeted searches, iteratively refine, follow threads, deep-dive linked content, and
synthesize into a sourced briefing.

For X API details (endpoints, operators, response format): read `references/x-api.md`.

## Research Loop

### 1. Decompose the Question into Queries

Turn the research question into 3-5 keyword queries using X search operators.

Think about the topic from multiple angles:
- **Core query**: Direct keywords for the topic
- **Expert voices**: `from:` specific known experts if relevant
- **Pain points**: Keywords like `(broken OR bug OR issue OR migration)`
- **Positive signal**: Keywords like `(shipped OR love OR fast OR benchmark)`
- **Links**: `url:github.com` or `url:` specific domains for posts sharing resources
- **Language**: Add `lang:en` unless researching non-English communities
- **Noise reduction**: Almost always include `-is:retweet`

Start broad, then refine based on what comes back.

### 2. Search and Extract

Run each query via curl against the X API. Use this pattern:

```bash
curl -s -H "Authorization: Bearer $X_BEARER_TOKEN" \
  "https://api.x.com/2/tweets/search/recent?query=ENCODED_QUERY&max_results=100&tweet.fields=created_at,public_metrics,author_id,conversation_id,entities&expansions=author_id&user.fields=username,name,public_metrics&sort_order=relevancy" \
  | python3 -c "
import json, sys
data = json.load(sys.stdin)
users = {u['id']: u for u in data.get('includes', {}).get('users', [])}
for t in data.get('data', []):
    u = users.get(t['author_id'], {})
    m = t['public_metrics']
    urls = [url.get('expanded_url','') for url in t.get('entities',{}).get('urls',[]) if url.get('expanded_url')]
    print(f'@{u.get(\"username\",\"?\")} | {m[\"like_count\"]}L {m[\"impression_count\"]}I | https://x.com/{u.get(\"username\",\"?\")}/status/{t[\"id\"]}')
    print(f'  {t[\"text\"][:280]}')
    if urls:
        for link in urls[:3]:
            print(f'  -> {link}')
    print()
"
```

After each query, assess:
- Did I get signal or noise? Adjust operators.
- Are there key voices I should search `from:` specifically?
- Are there threads worth following via `conversation_id:`?
- Are there linked resources worth deep-diving?

### 3. Follow Threads

When a tweet has high engagement or interesting replies, fetch the full thread:

```
query=conversation_id:TWEET_ID
```

This returns all tweets in that conversation thread.

### 4. Deep-Dive Linked Content

When tweets link to GitHub repos, blog posts, docs, or other resources, use WebFetch
to read the linked page and extract substance. The tweet `entities.urls[].expanded_url`
field contains the full URL.

Prioritize deep-diving links that:
- Multiple tweets reference
- Come from high-engagement tweets
- Point to GitHub repos, technical blog posts, or official docs
- Are directly relevant to the research question

### 5. Synthesize

Group findings by theme, not by query. Each finding uses this format:

```markdown
### [Theme/Finding Title]

[1-2 sentence summary of what people are saying]

- **@username**: "[key quote or paraphrase]" (NL, NI)
  [Tweet](https://x.com/username/status/id)
- **@username2**: "[another perspective]" (NL, NI)
  [Tweet](https://x.com/username2/status/id2)

Resources shared:
- [Resource title](https://link.com) — [what it is]
```

Where NL = likes, NI = impressions.

### 6. Save and Present

Save the full research output to `~/clawd/drafts/x-research-{topic-slug}-{YYYY-MM-DD}.md`.

Include a metadata footer:

```markdown
---
## Research Metadata
- **Query**: [original question]
- **Date**: YYYY-MM-DD
- **API calls**: N search queries + N deep-dives
- **Tweets scanned**: ~N
- **Queries used**: [list the actual search strings]
- **Limitations**: [any gaps — e.g., min_likes unavailable, topic too new, non-English results excluded]
```

## Refinement Heuristics

- **Too much noise?** Add `-is:retweet -is:reply`, use `sort_order=relevancy`, narrow keywords
- **Too few results?** Broaden keywords, try synonyms with `OR`, remove restrictive operators
- **Crypto/spam flooding?** Add `-$` to exclude cashtags, add `-airdrop -giveaway -whitelist`
- **Want expert takes only?** Use `from:` for known voices, or filter post-hoc by `impression_count > 1000`
- **Need to see engagement?** Sort results by `like_count` or `impression_count` post-hoc since `min_likes` operator is unavailable on current tier
- **Non-English results?** Add `lang:en` or the desired language code
- **Want posts with substance?** Add `has:links` to find posts sharing resources, not just hot takes

## Pagination

If the first 100 results aren't enough, paginate using `next_token` from the response
`meta.next_token` field. Append `&pagination_token=TOKEN` to the next request. Tokens
don't expire.

Typically 2-3 pages (200-300 tweets) is sufficient for most research questions. Go
deeper only if the topic is very active or the user needs comprehensive coverage.
