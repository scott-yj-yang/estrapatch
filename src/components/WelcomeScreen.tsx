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
          Welcome to EstaPatch
        </h1>
        <p className="text-gray-600 leading-relaxed">
          Track your estradiol patch applications, simulate serum E2 levels
          using a pharmacokinetic model, and plan your patch schedule.
        </p>
        <p className="text-sm text-gray-400">
          All data stays on your device. Nothing is sent to any server.
        </p>
        <Button variant="primary" size="lg" onClick={handleGetStarted}>
          Get Started
        </Button>
      </div>
    </div>
  );
}
