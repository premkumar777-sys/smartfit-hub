import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
                    <div className="max-w-md w-full space-y-6 animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-center">
                            <div className="p-4 rounded-full bg-red-500/10 ring-1 ring-red-500/30">
                                <AlertTriangle className="w-12 h-12 text-red-500" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
                            <p className="text-gray-400">
                                The application encountered an unexpected error and couldn't render this page.
                            </p>
                        </div>

                        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800 text-left overflow-auto max-h-40">
                            <p className="text-xs font-mono text-red-400">
                                {this.state.error?.toString()}
                            </p>
                        </div>

                        <Button
                            onClick={() => window.location.reload()}
                            className="w-full bg-[#00FF9C] hover:bg-[#00FF9C]/90 text-black font-bold"
                        >
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            Reload Application
                        </Button>

                        <p className="text-xs text-gray-500">
                            If the problem persists, please clear your browser cache and try again.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
