import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "../context/UserContext";
import axios from "axios";

import "./LoginModal.css";
import { Button } from "./Button";
import { useNavigate } from "react-router-dom";

type Props = {
  closeModal: () => void;
  returnTo?: string | null;
  reason?: string | null;
};

const LoginModal = ({ closeModal, returnTo, reason }: Props) => {
  const guestNameRef = useRef<HTMLInputElement>(null);
  const { setUser, setToken } = useUser();
  const navigate = useNavigate();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const BACKEND_URL = "http://localhost:3000/api";
  const redirectAfterLogin = useMemo(() => returnTo ?? "/play", [returnTo]);

  const googleLoginHandler = () => {
    localStorage.setItem("post_login_redirect", redirectAfterLogin);
    window.location.href = `${BACKEND_URL}/auth/google`;
  };

  const githubLoginHandler = () => {
    localStorage.setItem("post_login_redirect", redirectAfterLogin);
    window.location.href = `${BACKEND_URL}/auth/github`;
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", handleEsc);
    guestNameRef.current?.focus();
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  const guestLoginHandler = async () => {
    try {
      setIsBusy(true);
      setError(null);
      const guestName = guestNameRef.current?.value?.trim();
      const { data } = await axios.post(
        `${BACKEND_URL}/auth/guest`,
        { name: guestName || undefined },
        { withCredentials: true },
      );
      setUser(data.id, data.name);
      setToken(data.token);
      localStorage.setItem("user", JSON.stringify(data));
      closeModal();
      navigate(redirectAfterLogin);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          "Could not sign you in. Please try again.",
      );
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={() => !isBusy && closeModal()}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="auth-close"
          onClick={() => !isBusy && closeModal()}
          aria-label="Close"
          title="Close"
        >
          ×
        </button>

        <div className="auth-header">
          <div className="auth-brand">Chess</div>
          <div className="auth-title">Sign in to continue</div>
          <div className="auth-subtitle">
            {reason ?? "Join games, spectate, and save your progress."}
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-section">
          <div className="auth-label">Play as guest</div>
          <div className="auth-row">
            <input
              ref={guestNameRef}
              className="auth-input"
              placeholder="Guest name (optional)"
              disabled={isBusy}
              onKeyDown={(e) => {
                if (e.key === "Enter") guestLoginHandler();
              }}
            />
            <Button onClick={guestLoginHandler} disabled={isBusy}>
              Continue
            </Button>
          </div>
        </div>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="auth-providers">
          <button
            className="auth-provider-btn auth-provider-google"
            onClick={googleLoginHandler}
            disabled={isBusy}
          >
            Continue with Google
          </button>
          <button
            className="auth-provider-btn auth-provider-github"
            onClick={githubLoginHandler}
            disabled={isBusy}
          >
            Continue with GitHub
          </button>
        </div>

        <div className="auth-footnote">
          By continuing, you agree to our Terms and Privacy Policy.
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
