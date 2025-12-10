import { Container } from "@/components/Container";

export default function Nutrition() {
  return (
    <div className="min-h-screen py-20">
      <Container>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
            Nutrition <span className="text-yellow-600">Beta</span>
          </h1>
          <p className="text-lg md:text-xl leading-relaxed text-gray-300 max-w-2xl mx-auto mb-8">
            Calorie & macro calculator - Coming soon! Track your nutrition, plan meals, and optimize your diet for better fitness results.
          </p>
          <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
            <p className="text-gray-400">
              This feature is currently in development. Stay tuned for our advanced nutrition tracking and meal planning tools!
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
