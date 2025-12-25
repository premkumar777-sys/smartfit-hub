import { DropdownItem } from "../DropdownItem";
import { Store, ShoppingBag, Heart, Star, Truck, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const marketplaceItems = [
  {
    icon: ShoppingBag,
    title: "Equipment Store",
    description: "Premium fitness equipment from top brands with expert reviews",
    href: "/marketplace/equipment"
  },
  {
    icon: Heart,
    title: "Nutrition Shop",
    description: "Supplements, protein powders, and healthy snacks curated by experts"
  },
  {
    icon: Star,
    title: "Best Sellers",
    description: "Top-rated products loved by our fitness community"
  },
  {
    icon: Truck,
    title: "Free Shipping",
    description: "Free delivery on orders over $50 with fast processing"
  },
  {
    icon: Shield,
    title: "Quality Guarantee",
    description: "100% satisfaction guarantee on all marketplace purchases"
  },
  {
    icon: Store,
    title: "Vendor Marketplace",
    description: "Connect with local fitness vendors and specialty stores"
  }
];

export default function MarketplaceDropdown() {
  return (
    <div className="p-4" role="menu">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">Fitness Marketplace</h3>
        <p className="text-sm text-gray-400">Everything you need for your fitness journey</p>
      </div>

      <div className="grid gap-2">
        {marketplaceItems.map((item) => (
          <DropdownItem
            key={item.title}
            href={item.href}
            icon={item.icon}
            title={item.title}
            description={item.description}
          />
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-800">
        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/marketplace"
            className="flex items-center justify-center px-3 py-2 text-sm font-medium text-[#00FF9C] hover:text-white transition-colors rounded-lg hover:bg-white/10"
          >
            Shop Now
          </Link>
          <Link
            to="/marketplace/deals"
            className="flex items-center justify-center px-3 py-2 text-sm font-medium text-[#00FF9C] hover:text-white transition-colors rounded-lg hover:bg-white/10"
          >
            Special Deals
          </Link>
        </div>
      </div>
    </div>
  );
}


