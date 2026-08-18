import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as any).standalone === true
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * "Download as an app" entry point. Chrome/Edge/Android get the native
 * install prompt via `beforeinstallprompt`. iOS Safari has no such API, so
 * it gets short instructions instead (Share → Add to Home Screen).
 */
export function InstallAppButton({ className }: { className?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (isStandalone()) setInstalled(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;
  if (!deferred && !isIos()) return null; // browser doesn't support install (or already dismissed silently)

  async function handleClick() {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setDeferred(null);
      return;
    }
    if (isIos()) setShowIosHelp(true);
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleClick}
        className={className}
        aria-label="Download the Mtwapa Premier League app"
      >
        <Download size={14} className="mr-1.5" />
        Get the app
      </Button>

      {showIosHelp && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4" onClick={() => setShowIosHelp(false)}>
          <div className="surface-card max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-display text-sm font-bold uppercase">Install MPL</p>
              <button onClick={() => setShowIosHelp(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <ol className="grid gap-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Share size={16} className="shrink-0" /> Tap the Share icon in Safari's toolbar
              </li>
              <li>Scroll down and choose "Add to Home Screen"</li>
              <li>Tap "Add" — the MPL icon will appear on your home screen like any other app</li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
