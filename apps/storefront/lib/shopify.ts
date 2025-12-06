const endpoint = process.env.SHOPIFY_STOREFRONT_API_ENDPOINT!;
const token = process.env.SHOPIFY_STOREFRONT_API_TOKEN!;

export async function shopifyFetch({
  query,
  variables,
}: {
  query: string;
  variables?: Record<string, unknown>;
}) {
  if (!endpoint || !token) {
    throw new Error('Missing Shopify Storefront API env vars');
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
    // Ensure this runs server-side only in Next.js (no cache for dev)
    cache: 'no-store',
  });

  const json = await res.json();
  if (!res.ok || json.errors) {
    console.error('Shopify error', json.errors || json);
    throw new Error('Shopify Storefront API request failed');
  }

  return json;
}
