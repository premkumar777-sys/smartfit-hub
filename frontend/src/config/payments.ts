/**
 * Payment Configuration for SmartFit AI Hub
 * 
 * Update the payment links here once you have your Razorpay links.
 * All components will automatically use these links.
 */

export const WHATSAPP_NUMBER = "917671862872"; // Replace with your business number (e.g., 919876543210)

export interface PaymentPlan {
    id: string;
    name: string;
    price: string;
    originalPrice?: string;
    period: string;
    link: string;
    badge?: string;
}

// ===========================================
// PRO PLANS (For individual users)
// ===========================================
export const PRO_PLANS: PaymentPlan[] = [
    {
        id: "trial",
        name: "7-Day Trial",
        price: "₹0",
        period: "7 days",
        link: "#",
        badge: "Free Trial"
    },
    {
        id: "monthly_31",
        name: "31 Days Plan",
        price: "₹699",
        originalPrice: "₹899",
        period: "31 days",
        link: "https://imjo.in/KHh48R",
        badge: "Save 22%"
    },
    {
        id: "quarterly_90",
        name: "90 Days Plan",
        price: "₹1279",
        originalPrice: "₹2097",
        period: "90 days",
        link: "https://imjo.in/DHbKMq",
        badge: "39% Off"
    }
];

// ===========================================
// BUSINESS PLANS (For gym owners/trainers)
// ===========================================
export const BUSINESS_PLANS: PaymentPlan[] = [
    {
        id: "biz_monthly",
        name: "Monthly",
        price: "₹999",
        period: "per month",
        link: "RAZORPAY_BIZ_MONTHLY_LINK", // TODO: Replace with Razorpay link
        badge: "Popular"
    },
    {
        id: "biz_yearly",
        name: "Yearly",
        price: "₹9,999",
        period: "per year",
        link: "RAZORPAY_BIZ_YEARLY_LINK", // TODO: Replace with Razorpay link
        badge: "Save 20%"
    }
];

// ===========================================
// COACHING PLAN
// ===========================================
export const COACHING_PLAN: PaymentPlan = {
    id: "coaching",
    name: "Personal Coaching",
    price: "₹9",
    period: "per month",
    link: "https://imjo.in/vJwgza" // ₹9/month coaching link
};

// ===========================================
// BODY TRANSFORMATION PLAN
// ===========================================
export const BODY_TRANSFORMATION_PLAN: PaymentPlan = {
    id: "body_transformation",
    name: "Body Transformation",
    price: "499",
    period: "40 days",
    link: "https://imjo.in/QPuCvc", // ₹499 / 40-day body transformation link
    badge: "Most Popular"
};

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Get the default Pro plans
 */
export function getProPlans(): PaymentPlan[] {
    return PRO_PLANS;
}

/**
 * Get the default Business plans
 */
export function getBusinessPlans(): PaymentPlan[] {
    return BUSINESS_PLANS;
}

/**
 * Open a payment link in a new tab
 */
export function openPaymentLink(link: string): void {
    if (link.startsWith("RAZORPAY_")) {
        console.warn("Payment link not configured yet:", link);
        alert("Payment links are being set up. Please try again later.");
        return;
    }
    window.open(link, "_blank");
}
