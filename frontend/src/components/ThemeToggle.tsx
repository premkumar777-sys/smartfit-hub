import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative h-9 w-9 rounded-full bg-secondary/50 hover:bg-secondary transition-all duration-300 hover:scale-105"
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to bright mode"}
        >
            <Sun
                className={`h-5 w-5 transition-all duration-500 ${theme === "light"
                        ? "rotate-0 scale-100 text-amber-500"
                        : "rotate-90 scale-0"
                    }`}
            />
            <Moon
                className={`absolute h-5 w-5 transition-all duration-500 ${theme === "dark"
                        ? "rotate-0 scale-100 text-blue-400"
                        : "-rotate-90 scale-0"
                    }`}
            />
        </Button>
    );
}
