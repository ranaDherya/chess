import { useEffect, useRef } from "react";
import { useUser } from "../context/UserContext";
import axios from "axios";

import "./LoginModal.css";
import { Button } from "./Button";

type Props = {
  closeModal: () => void;
};

const LoginModal = ({ closeModal }: Props) => {
  const guestNameRef = useRef<HTMLInputElement>(null);
  const { setUser, setToken } = useUser();

  const BACKEND_URL = "http://localhost:3000/api"; // change this to your actual backend URL

  const googleLoginHandler = () => {
    window.location.href = `${BACKEND_URL}/auth/google`;
  };

  const githubLoginHandler = () => {
    window.location.href = `${BACKEND_URL}/auth/github`;
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  const guestLoginHandler = async () => {
    try {
      const guestName = guestNameRef.current?.value;
      const data = await axios.post("http://localhost:3000/api/auth/guest", {
        name: guestName,
      });
      setUser(data.data.id, data.data.name);
      setToken(data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data));
      console.log("Data:::", data);
      closeModal();
    } catch (e) {
      console.log("error occured::", e);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="guest-login">
          <input
            ref={guestNameRef}
            className="guest-name-input"
            placeholder="Enter Guest Name"
          />
          <Button onClick={guestLoginHandler}>Login as Guest</Button>
        </div>
        <div className="google-login">
          <Button onClick={googleLoginHandler}>Login with Google</Button>
        </div>
        <div className="github-login">
          <Button onClick={githubLoginHandler}>Login with Github</Button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
