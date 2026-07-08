import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Subscription plans have been removed — everything is free.
// Online Coaching (₹9) is managed from the Pricing page.
export default function VerifyPayment() {
    const navigate = useNavigate();

    useEffect(() => {
        navigate("/pricing", { replace: true });
    }, [navigate]);

    return null;
}
