"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (notification?: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
        };
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
            error_callback?: (err: any) => void;
          }) => {
            requestAccessToken: (overrideConfig?: any) => void;
          };
        };
      };
    };
  }
}

const GSI_SCRIPT_URL = "https://accounts.google.com/gsi/client";

export function useGoogleAuth() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const isConfigured = !!clientId && clientId !== "YOUR_GOOGLE_CLIENT_ID_HERE";

  // Load Google Identity Services script
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.google?.accounts) {
      setIsLoaded(true);
      return;
    }

    const existingScript = document.querySelector(`script[src="${GSI_SCRIPT_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => setIsLoaded(true));
      return;
    }

    const script = document.createElement("script");
    script.src = GSI_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => {
      console.warn("Failed to load Google Identity Services SDK.");
    };
    document.head.appendChild(script);
  }, []);

  /**
   * Triggers Google Sign-In with standard identity scopes (openid, email, profile).
   */
  const signInWithGoogle = useCallback(async (): Promise<{ access_token?: string; credential?: string }> => {
    setIsPrompting(true);

    // If client ID is not configured yet (e.g. fresh local clone)
    if (!isConfigured) {
      setIsPrompting(false);
      // Informative demo / dev option
      const devConsent = window.confirm(
        "NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured in .env.local yet.\n\n" +
        "Would you like to test with a simulated Google Developer account (dev@globalreach.io) for local testing?"
      );
      if (devConsent) {
        return {
          credential: undefined,
          access_token: "dev_mock_google_token_" + Date.now(),
        };
      }
      throw new Error("Google Client ID not configured. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local");
    }

    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) {
        setIsPrompting(false);
        reject(new Error("Google Identity SDK not loaded yet. Please try again."));
        return;
      }

      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "openid email profile",
          callback: (res) => {
            setIsPrompting(false);
            if (res.error) {
              reject(new Error(res.error));
              return;
            }
            if (res.access_token) {
              resolve({ access_token: res.access_token });
            } else {
              reject(new Error("No access token returned from Google."));
            }
          },
          error_callback: (err) => {
            setIsPrompting(false);
            reject(new Error(err?.message || "Google Sign-In was cancelled or failed."));
          },
        });

        tokenClient.requestAccessToken({ prompt: "select_account" });
      } catch (err: any) {
        setIsPrompting(false);
        reject(err);
      }
    });
  }, [clientId, isConfigured]);

  /**
   * Triggers Google Cloud authorization for https://www.googleapis.com/auth/cloud-platform
   * to automatically query and retrieve Google Maps API keys from the user's GCP project.
   */
  const authorizeGoogleCloud = useCallback(async (): Promise<string> => {
    setIsPrompting(true);

    if (!isConfigured) {
      setIsPrompting(false);
      const devConsent = window.confirm(
        "NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured in .env.local yet.\n\n" +
        "Would you like to test the Google Cloud connection with a simulated token?"
      );
      if (devConsent) {
        return "dev_mock_gcp_token_" + Date.now();
      }
      throw new Error("Google Client ID not configured. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local");
    }

    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) {
        setIsPrompting(false);
        reject(new Error("Google Identity SDK not loaded yet. Please try again."));
        return;
      }

      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "https://www.googleapis.com/auth/cloud-platform",
          callback: (res) => {
            setIsPrompting(false);
            if (res.error) {
              reject(new Error(res.error));
              return;
            }
            if (res.access_token) {
              resolve(res.access_token);
            } else {
              reject(new Error("No Google Cloud access token returned."));
            }
          },
          error_callback: (err) => {
            setIsPrompting(false);
            reject(new Error(err?.message || "Google Cloud authorization was cancelled."));
          },
        });

        tokenClient.requestAccessToken({ prompt: "consent" });
      } catch (err: any) {
        setIsPrompting(false);
        reject(err);
      }
    });
  }, [clientId, isConfigured]);

  return {
    isLoaded,
    isPrompting,
    isConfigured,
    signInWithGoogle,
    authorizeGoogleCloud,
  };
}
