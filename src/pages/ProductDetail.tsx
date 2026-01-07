import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowLeft, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartDrawer } from "@/components/CartDrawer";
import { useCartStore, ShopifyProduct } from "@/stores/cartStore";
import { toast } from "sonner";

const SHOPIFY_API_VERSION = '2025-07';
const SHOPIFY_STORE_PERMANENT_DOMAIN = 'lovable-project-9pk19.myshopify.com';
const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
const SHOPIFY_STOREFRONT_TOKEN = '977474804201bb734ab75b0144c4d779';

const PRODUCT_QUERY = `
  query GetProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      id
      title
      description
      handle
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
      variants(first: 20) {
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
    toast.error("Shopify: Payment required");
    return null;
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`Error: ${data.errors.map((e: { message: string }) => e.message).join(', ')}`);
  }

  return data;
}

const ProductDetail = () => {
  const { handle } = useParams<{ handle: string }>();
  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!handle) return;
      
      try {
        const data = await storefrontApiRequest(PRODUCT_QUERY, { handle });
        if (data?.data?.productByHandle) {
          const productData = { node: data.data.productByHandle };
          setProduct(productData);
          if (productData.node.variants.edges[0]) {
            setSelectedVariant(productData.node.variants.edges[0].node.id);
          }
        }
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [handle]);

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;
    
    const variant = product.node.variants.edges.find(v => v.node.id === selectedVariant);
    if (!variant) return;

    addItem({
      product,
      variantId: variant.node.id,
      variantTitle: variant.node.title,
      price: variant.node.price,
      quantity: 1,
      selectedOptions: variant.node.selectedOptions || []
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Product not found</h1>
        <Button asChild>
          <Link to="/marketplace">Back to Marketplace</Link>
        </Button>
      </div>
    );
  }

  const currentVariant = product.node.variants.edges.find(v => v.node.id === selectedVariant);
  const images = product.node.images.edges;

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" asChild>
            <Link to="/marketplace">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Marketplace
            </Link>
          </Button>
          <CartDrawer />
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="aspect-square rounded-xl overflow-hidden bg-secondary/20 mb-4">
              {images[selectedImage]?.node ? (
                <img
                  src={images[selectedImage].node.url}
                  alt={images[selectedImage].node.altText || product.node.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-20 h-20 text-muted-foreground" />
                </div>
              )}
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                      selectedImage === idx ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={img.node.url}
                      alt={img.node.altText || ''}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {product.node.title}
            </h1>
            
            <p className="text-3xl font-bold text-primary mb-6">
              ₹{parseFloat(currentVariant?.node.price.amount || product.node.priceRange.minVariantPrice.amount).toFixed(2)}
            </p>

            <p className="text-muted-foreground mb-8 leading-relaxed">
              {product.node.description}
            </p>

            {/* Variants */}
            {product.node.options.map((option) => (
              <div key={option.name} className="mb-6">
                <h3 className="font-semibold mb-3">{option.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {product.node.variants.edges
                    .filter((v, i, arr) => 
                      arr.findIndex(x => 
                        x.node.selectedOptions.find(o => o.name === option.name)?.value === 
                        v.node.selectedOptions.find(o => o.name === option.name)?.value
                      ) === i
                    )
                    .map(variant => {
                      const optionValue = variant.node.selectedOptions.find(o => o.name === option.name)?.value;
                      const isSelected = selectedVariant === variant.node.id;
                      
                      return (
                        <Button
                          key={variant.node.id}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedVariant(variant.node.id)}
                          disabled={!variant.node.availableForSale}
                          className="relative"
                        >
                          {optionValue}
                          {isSelected && <Check className="w-3 h-3 ml-1" />}
                        </Button>
                      );
                    })}
                </div>
              </div>
            ))}

            <Button 
              size="lg" 
              className="w-full"
              onClick={handleAddToCart}
              disabled={!currentVariant?.node.availableForSale}
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Add to Cart
            </Button>

            {!currentVariant?.node.availableForSale && (
              <p className="text-destructive text-center mt-4">
                This variant is currently out of stock
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
