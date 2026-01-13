import { Container } from "@/components/Container";
import { ComingSoon } from "@/components/ComingSoon";

export default function GymFinder() {
    return (
        <div className="min-h-screen py-20 relative overflow-hidden">
            <Container className="relative z-10">
                <ComingSoon
                    feature="Gym Finder"
                    description="Locate top-rated gyms near you, check amenities, and book day passes instantly."
                >
                    <div className="flex justify-center mt-8">
                        <a href="/" className="text-primary hover:underline">Return to Home</a>
                    </div>
                </ComingSoon>
            </Container>
        </div>
    );
}
