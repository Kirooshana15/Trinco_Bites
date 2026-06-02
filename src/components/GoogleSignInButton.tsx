import { useEffect, useRef, useState } from "react";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleSignInButtonProps = {
  onCredential: (credential: string) => void;
  onError: (message: string) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme: "outline" | "filled_blue" | "filled_black";
              size: "large" | "medium" | "small";
              shape: "rectangular" | "pill" | "circle" | "square";
              text: "signin_with" | "signup_with" | "continue_with" | "signin";
              width?: number;
              logo_alignment?: "left" | "center";
              locale?: string;
            },
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_SCRIPT_ID = "google-identity-services";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function loadGoogleScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Unable to load Google sign-in.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client?hl=en";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Google sign-in."));
    document.head.appendChild(script);
  });
}

export function GoogleSignInButton({ onCredential, onError }: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const isDemo = !GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.startsWith("your_google_client_id");

  useEffect(() => {
    if (isDemo) {
      setReady(true);
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      onError("Google client ID is not configured.");
      return;
    }

    let mounted = true;

    loadGoogleScript()
      .then(() => {
        if (!mounted || !buttonRef.current || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: response => {
            if (response.credential) onCredential(response.credential);
            else onError("Google did not return a sign-in credential.");
          },
        });

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: 312,
          logo_alignment: "center",
          locale: "en",
        });
        setReady(true);
      })
      .catch(error => onError(error instanceof Error ? error.message : "Unable to load Google sign-in."));

    return () => {
      mounted = false;
    };
  }, [onCredential, onError, isDemo]);

  if (isDemo) {
    return (
      <div className="flex min-h-[44px] w-full justify-center">
        <button
          onClick={() => onCredential("mock-gsi-credential-token-demouser")}
          className="flex h-11 w-full items-center justify-center gap-3 rounded-full border text-sm font-semibold transition-all hover:bg-neutral-50 active:scale-[0.98]"
          style={{
            color: "#3c4043",
            borderColor: "#dadce0",
            background: "#ffffff",
            maxWidth: 312,
            fontFamily: "Roboto, arial, sans-serif"
          }}
        >
          {/* Google G logo */}
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 48 48">
            <g>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.5 24c0-1.61-.15-3.16-.4-4.69H24v9.09h12.64c-.55 2.85-2.16 5.27-4.58 6.89l7.14 5.53C43.37 35.8 46.5 30.34 46.5 24z"></path>
              <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.14-5.53c-2.1 1.4-4.79 2.34-8.75 2.34-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </g>
          </svg>
          Continue with Google
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[44px] w-full justify-center">
      <div ref={buttonRef} />
      {!ready && (
        <div className="flex h-11 w-full items-center justify-center rounded-full border text-sm font-semibold" style={{ color: "#813405", borderColor: "rgba(129,52,5,0.15)" }}>
          Loading Google...
        </div>
      )}
    </div>
  );
}
