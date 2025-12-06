import { shopifyFetch } from '@/lib/shopify';

const PRODUCTS_QUERY = `
  query GetProducts {
    products(first: 8) {
      edges {
        node {
          id
          title
          description
          handle
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

type Product = {
  id: string;
  title: string;
  description: string;
  handle: string;
  images: {
    edges: { node: { url: string; altText: string | null } }[];
  };
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
};

export default async function Home() {
  let products: Product[] = [];
  let error: string | null = null;

  try {
    const result = await shopifyFetch({ query: PRODUCTS_QUERY });
    products = result.data.products.edges.map(
      (edge: { node: Product }) => edge.node,
    );
  } catch (e) {
    error = 'Error loading products from Shopify';
    console.error(e);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-10">
        <h1 className="text-4xl font-bold text-gray-900">
          ShopAustralia
        </h1>
        <p className="text-gray-600 mt-2">
          Smart dropshipping comparison engine – powered by Shopify
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="max-w-6xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700 font-medium">{error}</p>
          <p className="text-sm text-red-600 mt-1">
            Check your Shopify endpoint/token configuration.
          </p>
        </div>
      )}

      {/* Loading */}
      {products.length === 0 && !error && (
        <div className="max-w-6xl mx-auto flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
          <p className="ml-4 text-gray-600">Loading products…</p>
        </div>
      )}

      {/* Product grid */}
      {products.length > 0 && (
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">
            Featured products
          </h2>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => {
              const image = product.images.edges[0]?.node;
              const price = product.priceRange.minVariantPrice;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {image && (
                    <div className="w-full h-48 bg-gray-100 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.url}
                        alt={image.altText || product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
                      {product.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-lg font-bold text-blue-600">
                        {price.currencyCode} {price.amount}
                      </span>
                      <button className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
