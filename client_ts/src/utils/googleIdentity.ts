type GoogleIdentity = {
  accounts?: {
    id?: {
      initialize: (options: Record<string, unknown>) => void;
      renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
};

let googleScriptPromise: Promise<GoogleIdentity> | null = null;

export function loadGoogleIdentityScript(): Promise<GoogleIdentity> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Google Identity can only run in the browser."),
    );
  }

  const existingGoogle = (window as Window & { google?: GoogleIdentity }).google;
  if (existingGoogle?.accounts?.id) {
    return Promise.resolve(existingGoogle);
  }

  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-google-identity="true"]',
      );
      if (existing) {
        existing.addEventListener(
          "load",
          () => {
            resolve(
              (window as Window & { google?: GoogleIdentity }).google || {},
            );
          },
          { once: true },
        );
        existing.addEventListener(
          "error",
          () => reject(new Error("Failed to load Google Identity script.")),
          { once: true },
        );
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = "true";
      script.onload = () =>
        resolve((window as Window & { google?: GoogleIdentity }).google || {});
      script.onerror = () =>
        reject(new Error("Failed to load Google Identity script."));
      document.head.appendChild(script);
    });
  }

  return googleScriptPromise;
}
