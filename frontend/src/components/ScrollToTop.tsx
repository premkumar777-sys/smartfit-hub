import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // 1. Immediately dismiss any open virtual keyboard by blurring active element
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }

        // 2. Reset scroll position instantly
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "instant" as ScrollBehavior,
        });

        // 3. Ensure viewport reset after virtual keyboard closes
        const timer = setTimeout(() => {
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: "instant" as ScrollBehavior,
            });
        }, 100);

        return () => clearTimeout(timer);
    }, [pathname]);

    return null;
};
