import { ApiError } from '@/lib/api/errors';

function getBearerToken(): string {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) throw new ApiError(500, 'X API bearer token not configured');
  return token;
}

export interface TweetSearchResult {
  id: string;
  text?: string;
  author_id?: string;
  created_at?: string;
  referenced_tweets?: Array<{ type: string; id: string }>;
  entities?: { urls?: Array<{ expanded_url?: string; url?: string }> };
}

export async function searchTweetsRaw(
  query: string,
  fields: string[] = ['referenced_tweets'],
): Promise<TweetSearchResult[]> {
  const tweetFields = fields.join(',');
  const url = `https://api.x.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=10&tweet.fields=${tweetFields}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${getBearerToken()}` },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`X API search error (${res.status}): ${body}`);
    throw new ApiError(502, `X API error (${res.status}): ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.data ?? [];
}

export async function findTweetByUserContainingUrl(
  handle: string,
  url: string,
): Promise<TweetSearchResult | null> {
  const cleanHandle = handle.replace(/^@/, '');
  const query = `from:${cleanHandle} url:"${url}"`;
  const tweets = await searchTweetsRaw(query, ['entities', 'created_at']);
  const match = tweets.find((t) =>
    t.entities?.urls?.some((u) => (u.expanded_url || '').includes(url) || (u.url || '').includes(url)),
  );
  return match ?? tweets[0] ?? null;
}
