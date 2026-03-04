import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Preloader from "./components/common/Preloader";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import BottomNav from "./components/navigation/BottomNav";
import PhotoCaptureSheet from "./components/capture/PhotoCaptureSheet";
import HomePage from "./pages/HomePage";
import AnalysisPage from "./pages/AnalysisPage";
import CameraPage from "./pages/CameraPage";
import ResultsPage from "./pages/ResultsPage";
import ResultsDashboardPage from "./pages/ResultsDashboardPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import ProfilePage from "./pages/ProfilePage";
import OnboardingPage, { isOnboardingDone } from "./pages/OnboardingPage";

export default function App() {
  const [preloaderDone, setPreloaderDone] = useState(false);

  if (!preloaderDone) {
    return <Preloader onComplete={() => setPreloaderDone(true)} />;
  }

  return (
    <Routes>
      {/* Onboarding - full screen, no nav */}
      <Route
        path="/onboarding"
        element={<OnboardingPage />}
      />

      {/* Main app shell - guard checks onboarding at render time */}
      <Route
        path="*"
        element={<OnboardingGuard />}
      />
    </Routes>
  );
}

function OnboardingGuard() {
  if (!isOnboardingDone()) {
    return <Navigate to="/onboarding" replace />;
  }
  return <AppShell />;
}

function AppShell() {
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-[#F7F9FC] pb-16">
      <Header />

      <main className="relative z-10 w-full flex-1">
        <Routes>
          <Route path="/" element={<HomePage onOpenPhotoSheet={() => setPhotoSheetOpen(true)} />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/camera" element={<CameraPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/results/dashboard" element={<ResultsDashboardPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>

      <Footer />
      <BottomNav onOpenPhotoSheet={() => setPhotoSheetOpen(true)} />
      <PhotoCaptureSheet open={photoSheetOpen} onClose={() => setPhotoSheetOpen(false)} />
    </div>
  );
}
