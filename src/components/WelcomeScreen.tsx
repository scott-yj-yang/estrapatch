"use client";

import Button from "@/components/Button";
import { ensureDefaults, setSetting } from "@/lib/db";

interface WelcomeScreenProps {
  onComplete: () => void;
}

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const handleGetStarted = async () => {
    await ensureDefaults();
    await setSetting("onboarding_complete", "true");
    onComplete();
  };

  return (
    <div className="min-h-screen bg-kawaii-cream flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6 animate-bounce-in">
        <div className="text-6xl">&#x1F48A;</div>
        <h1 className="text-3xl font-bold text-kawaii-pink-dark">
          Welcome to estrapatch
        </h1>
        <p className="text-gray-600 leading-relaxed">
          Track your estradiol patch applications, simulate serum E2 levels
          using a pharmacokinetic model, and plan your patch schedule.
        </p>
        <p className="text-sm text-gray-400">
          All data stays on your device. Nothing is sent to any server.
        </p>
        {/* Legal disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-kawaii p-4 text-left space-y-2">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
            Important Disclaimer
          </p>
          <p className="text-xs text-amber-700 leading-relaxed">
            estrapatch is provided for <strong>informational and educational purposes only</strong>.
            It is not a medical device and does not provide medical advice, diagnosis, or treatment.
          </p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Estradiol level estimates are based on published pharmacokinetic models from FDA clinical
            studies of post-menopausal cisgender women. Actual serum levels vary significantly based on
            individual physiology, application site, body composition, and other factors.
          </p>
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Use this tool at your own risk.</strong> Always consult a qualified healthcare
            provider for medical decisions regarding hormone therapy. Do not adjust medication
            based solely on this tool&apos;s estimates.
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={handleGetStarted}>
          I Understand — Get Started
        </Button>
      </div>
    </div>
  );
}
