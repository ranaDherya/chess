import { Router } from "express";
import passport from "passport";
import {
  guestLogin,
  pageRefreshes,
  logoutUser,
  loginFailed,
} from "../controllers/authController";

const router = Router();

// Routes for Guest Login, Page Refreshes, and Logout
router.post("/guest", guestLogin);
router.get("/refresh", pageRefreshes);
router.get("/logout", logoutUser);
router.get("/login/failed", loginFailed);

// Login With Google and Github using Passport.js
const CLIENT_URL =
  process.env.AUTH_REDIRECT_URL ?? "http://localhost:5173/game/random";

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: CLIENT_URL,
    failureRedirect: "/login/failed",
  })
);

router.get(
  "/github",
  passport.authenticate("github", { scope: ["read:user", "user:email"] })
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    successRedirect: CLIENT_URL,
    failureRedirect: "/login/failed",
  })
);

export default router;
