import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

export default function GithubCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setUser, setToken } = useUser();

  useEffect(() => {
    const token = params.get("token") || "";
    const name = params.get("name") || "";
    const id = params.get("id") || "";

    if (token) {
      // Save to localStorage or context
      setUser(id, name);
      setToken(token);
      const user = { id: id, name: name, token: token, isGuest: false };
      localStorage.setItem("user", JSON.stringify(user));
      const redirect = localStorage.getItem("post_login_redirect") || "/";
      localStorage.removeItem("post_login_redirect");
      navigate(redirect, { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, []);

  return <p>Logging in with GitHub...</p>;
}
