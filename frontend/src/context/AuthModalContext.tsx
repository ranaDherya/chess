import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import LoginModal from "../components/LoginModal";

type OpenOptions = {
  reason?: string;
  returnTo?: string;
};

type AuthModalContextType = {
  isOpen: boolean;
  reason: string | null;
  returnTo: string | null;
  open: (opts?: OpenOptions) => void;
  close: () => void;
};

const AuthModalContext = createContext<AuthModalContextType | undefined>(
  undefined,
);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [returnTo, setReturnTo] = useState<string | null>(null);

  const value = useMemo<AuthModalContextType>(() => {
    return {
      isOpen,
      reason,
      returnTo,
      open: (opts?: OpenOptions) => {
        setReason(opts?.reason ?? null);
        setReturnTo(
          opts?.returnTo ?? `${location.pathname}${location.search}`,
        );
        setIsOpen(true);
      },
      close: () => {
        setIsOpen(false);
        setReason(null);
        setReturnTo(null);
      },
    };
  }, [isOpen, reason, returnTo, location.pathname, location.search]);

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      {isOpen && (
        <LoginModal closeModal={value.close} returnTo={returnTo} reason={reason} />
      )}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}

