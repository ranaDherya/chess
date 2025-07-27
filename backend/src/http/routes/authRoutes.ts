import { Router } from "express";
import passport from "passport";
import {
  guestLogin,
  pageRefreshes,
  logoutUser,
  loginFailed,
} from "../controllers/authController";
import { COOKIE_MAX_AGE } from "../../constants";
import { getEnv } from "../utils/getEnv";

const router = Router();

// Routes for Guest Login, Page Refreshes, and Logout
router.post("/guest", guestLogin);
router.get("/refresh", pageRefreshes);
router.get("/logout", logoutUser);
router.get("/login/failed", loginFailed);

// Login With Google and Github using Passport.js
const CLIENT_URL = getEnv("AUTH_REDIRECT_URL", "http://localhost:5173");

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
  passport.authenticate("github", { failureRedirect: "/login/failed" }),
  async (req, res) => {
    // `req.user` is available now
    const user = req.user as any;
    const token = user.jwtToken;

    // send the cookie again
    res.cookie(`user`, token, { maxAge: COOKIE_MAX_AGE * 1000 });
    // send userDetails object to connect to the socket server
    const UserDetails = {
      id: user.id,
      name: user.name!,
      token: token,
      isGuest: false,
    };
    // res.json(UserDetails);
    res.redirect(
      `${CLIENT_URL}/github/callback?token=${token}&name=${encodeURIComponent(
        user.name
      )}&id=${user.id}`
    );
  }
);

export default router;
