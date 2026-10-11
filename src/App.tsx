import { Component, lazy, Suspense, useEffect, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router";
import { AppShell } from "./components/AppShell";
import { ToastProvider, useToast } from "./components/Toast";
import { BADGE_BY_ID } from "./content/badges";
import { progress } from "./state/progress";
import { useApplyMotion } from "./state/preferences";
import { LocationProvider } from "./features/location/LocationProvider";
import { ArrivalSheet } from "./features/location/ArrivalSheet";
import { AudioProvider } from "./features/audio/AudioProvider";
import { HomePage } from "./features/home/HomePage";

// Route-level code splitting keeps the first load small on phones (Leaflet, the
// site experience and three.js only download when needed).
const MapPage = lazy(() => import("./features/map/MapPage").then((m) => ({ default: m.MapPage })));
const NowPage = lazy(() => import("./features/now/NowPage").then((m) => ({ default: m.NowPage })));
const TourPage = lazy(() => import("./features/tour/TourPage").then((m) => ({ default: m.TourPage })));
const PassportPage = lazy(() => import("./features/passport/PassportPage").then((m) => ({ default: m.PassportPage })));
const ProfilePage = lazy(() => import("./features/profile/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const info = () => import("./features/info/InfoPages");
const AboutPage = lazy(() => info().then((m) => ({ default: m.AboutPage })));
const PrivacyPage = lazy(() => info().then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => info().then((m) => ({ default: m.TermsPage })));
const NotFoundPage = lazy(() => info().then((m) => ({ default: m.NotFoundPage })));
// Moderation: a separate chunk, reachable only by URL (not in any navigation).
const AdminPage = lazy(() => import("./features/admin/AdminPage").then((m) => ({ default: m.AdminPage })));

function PageLoading() {
  return (
    <div className="page" aria-busy="true" aria-label="Loading">
      <div className="skeleton-line" style={{ width: "40%", marginTop: 24 }} />
      <div className="skeleton-line" style={{ width: "80%", height: 36, marginTop: 16 }} />
      <div className="skeleton-line" style={{ width: "95%", height: 180, marginTop: 24, borderRadius: 12 }} />
    </div>
  );
}

/** Keep old site URLs working while opening the tour directly. */
function SiteTourRedirect() {
  const { slug = "" } = useParams();
  const location = useLocation();
  return <Navigate to={`/tour/${slug}${location.search}`} replace state={location.state} />;
}

const HotspotDebug = import.meta.env.DEV ? lazy(() => import("./features/dev/HotspotDebug").then((m) => ({ default: m.HotspotDebug }))) : null;

/** Announce newly earned badges wherever they happen. */
function BadgeToasts() {
  const toast = useToast();
  const navigate = useNavigate();
  useEffect(
    () =>
      progress.onBadges((ids) => {
        for (const id of ids) {
          const b = BADGE_BY_ID.get(id);
          if (b)
            toast({
              title: `Badge earned: ${b.name}`,
              body: b.description,
              image: b.art,
              tone: "success",
              duration: 7000,
              action: { label: "See your board", onClick: () => navigate("/profile") },
            });
        }
      }),
    [toast, navigate],
  );
  return null;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error(error);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="page">
        <div className="empty">
          <h1>Something went wrong</h1>
          <p>Your stamps and progress are safe in this browser. Try reloading the page.</p>
          <button type="button" className="btn btn--primary" onClick={() => location.reload()}>
            Reload
          </button>
        </div>
      </div>
    );
  }
}

function Root() {
  useApplyMotion();
  return (
    <ToastProvider>
      <LocationProvider>
        <AudioProvider>
          <ScrollToTop />
          <BadgeToasts />
          <AppShell>
            <ErrorBoundary>
              <Suspense fallback={<PageLoading />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/now" element={<NowPage />} />
                <Route path="/timewalk" element={<NowPage />} />
                <Route path="/camera" element={<NowPage />} />
                <Route path="/site/:slug" element={<SiteTourRedirect />} />
                <Route path="/tour/:slug" element={<TourPage />} />
                <Route path="/passport" element={<PassportPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/admin" element={<AdminPage />} />
                {HotspotDebug && (
                  <Route
                    path="/dev/hotspots"
                    element={
                      <Suspense fallback={null}>
                        <HotspotDebug />
                      </Suspense>
                    }
                  />
                )}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              </Suspense>
            </ErrorBoundary>
          </AppShell>
          <ArrivalSheet />
        </AudioProvider>
      </LocationProvider>
    </ToastProvider>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  );
}
