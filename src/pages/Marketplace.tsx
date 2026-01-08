import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Loader2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CartDrawer } from "@/components/CartDrawer";
import { useCartStore, ShopifyProduct } from "@/stores/cartStore";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const SHOPIFY_API_VERSION = '2025-07';
const SHOPIFY_STORE_PERMANENT_DOMAIN = 'lovable-project-9pk19.myshopify.com';
const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
const SHOPIFY_STOREFRONT_TOKEN = '977474804201bb734ab75b0144c4d779';

const CATEGORIES = [
  { id: 'all', label: 'All Products' },
  { id: 'Protein', label: 'Protein' },
  { id: 'Pre-Workout', label: 'Pre-Workout' },
  { id: 'Post-Workout', label: 'Post-Workout' },
];

const STOREFRONT_QUERY = `
  query GetProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          description
          handle
          productType
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 5) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                availableForSale
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
          options {
            name
            values
          }
        }
      }
    }
  }
`;

async function storefrontApiRequest(query: string, variables: Record<string, unknown> = {}) {
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN
    },
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 402) {
    toast.error("Shopify: Payment required", {
      description: "Your store needs to be upgraded to a paid plan."
    });
    return null;
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`Error calling Shopify: ${data.errors.map((e: { message: string }) => e.message).join(', ')}`);
  }

  return data;
}

const ProductCard = ({ product }: { product: ShopifyProduct }) => {
  const addItem = useCartStore(state => state.addItem);
  const firstVariant = product.node.variants.edges[0]?.node;
  const firstImage = product.node.images.edges[0]?.node;
  
  const handleAddToCart = () => {
    if (!firstVariant) return;
    
    addItem({
      product,
      variantId: firstVariant.id,
      variantTitle: firstVariant.title,
      price: firstVariant.price,
      quantity: 1,
      selectedOptions: firstVariant.selectedOptions || []
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all duration-300 h-full flex flex-col">
        <Link to={`/product/${product.node.handle}`} className="block">
          <div className="aspect-square overflow-hidden bg-secondary/20">
            {firstImage ? (
              <img
                src={firstImage.url}
                alt={firstImage.altText || product.node.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
          </div>
        </Link>
        
        <CardContent className="p-4 flex flex-col flex-1">
          <Link to={`/product/${product.node.handle}`}>
            <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-primary transition-colors">
              {product.node.title}
            </h3>
          </Link>
          
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
            {product.node.description}
          </p>
          
          <div className="flex items-center justify-between mt-auto">
            <span className="text-xl font-bold text-primary">
              ₹{parseFloat(product.node.priceRange.minVariantPrice.amount).toFixed(2)}
            </span>
            
            <Button 
              onClick={handleAddToCart}
              size="sm"
              disabled={!firstVariant?.availableForSale}
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface ExtendedShopifyProduct extends ShopifyProduct {
  node: ShopifyProduct['node'] & {
    productType?: string;
  };
}

const Marketplace = () => {
  const [products, setProducts] = useState<ExtendedShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await storefrontApiRequest(STOREFRONT_QUERY, { first: 20 });
        if (data?.data?.products?.edges) {
          setProducts(data.data.products.edges);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.node.productType === activeCategory);

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <motion.h1 
              className="text-4xl md:text-5xl font-bold mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Supplement <span className="text-gradient">Marketplace</span>
            </motion.h1>
            <motion.p 
              className="text-muted-foreground text-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Premium supplements for your fitness journey
            </motion.p>
          </div>
          
          <CartDrawer />
        </div>

        {/* Category Filters */}
        <motion.div 
          className="flex flex-wrap gap-3 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Filter className="w-5 h-5 text-muted-foreground self-center mr-2" />
          {CATEGORIES.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category.id)}
              className="transition-all"
            >
              {category.label}
            </Button>
          ))}
        </motion.div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No products found</h2>
            <p className="text-muted-foreground">
              {activeCategory === 'all' 
                ? 'Check back soon for new products!' 
                : `No ${activeCategory} products available.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.node.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
