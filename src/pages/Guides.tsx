import { Container } from "@/components/Container";

export default function Guides() {
  return (
    <div className="min-h-screen py-20">
      <Container>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
            Training Guides
          </h1>
          <p className="text-lg md:text-xl leading-relaxed text-gray-300 max-w-2xl mx-auto mb-8">
            Workouts & how-tos - Master your training with comprehensive guides, exercise tutorials, and expert tips.
          </p>
          <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
            <p className="text-gray-400">
              Comprehensive training guides and exercise tutorials are coming soon! Get ready for step-by-step workout instructions and expert fitness guidance.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
