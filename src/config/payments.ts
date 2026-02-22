/**
 * Payment Configuration for SmartFit Hub
 * 
 * Update the payment links here once you have your Razorpay links.
 * All components will automatically use these links.
 */

export const WHATSAPP_NUMBER = "917671862872"; // Replace with your business number (e.g., 919876543210)

export interface PaymentPlan {
    id: string;
    name: string;
    price: string;
    period: string;
    link: string;
    badge?: string;
}

// ===========================================
// PRO PLANS (For individual users)
// ===========================================
export const PRO_PLANS: PaymentPlan[] = [
    {
        id: "intro",
        name: "Intro Offer",
        price: "₹79",
        period: "1st month",
        link: "https://imjo.in/KHh48R",

    },
    {
        id: "semiannual",
        name: "6 Months",
        price: "₹399",
        period: "every 6 months",
        link: "https://imjo.in/DHbKMq"
    },
    {
        id: "annual",
        name: "Yearly",
        price: "₹699",
        period: "per year",
        link: "https://imjo.in/fMMzWK",
        badge: "Best Value",
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
    price: "₹199",
    period: "per month",
    link: "https://imjo.in/ZQVVWg"
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
