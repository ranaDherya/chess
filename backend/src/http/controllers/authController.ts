import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { COOKIE_MAX_AGE } from "../../constants";
import { db } from "../../db/db";
import { UserDetails, UserJwtClaims } from "../../types/types";
import { getEnv } from "../utils/getEnv";

const JWT_SECRET = getEnv("JWT_SECRET", "your_secret_key");
const COOKIE_MAX_AGE_MILLISECONDS = COOKIE_MAX_AGE * 1000; // Convert seconds to milliseconds

// User Logins as Guest
export const guestLogin = async (req: Request, res: Response) => {
  const data = req.body;
  const guestUUID = uuidv4();

  // add user to db
  const user = await db.user.create({
    data: {
      username: guestUUID,
      email: guestUUID + "@playchess.com",
      name: data.name || guestUUID,
      provider: "GUEST",
    },
  });

  // jwt token
  const token = jwt.sign(
    { userId: user.id, name: user.name, isGuest: true },
    JWT_SECRET,
    { expiresIn: COOKIE_MAX_AGE }
  );

  const UserDetails: UserDetails = {
    id: user.id,
    name: user.name!,
    token: token,
    isGuest: true,
  };
  // send the cookie again
  res.cookie("guest", token, { maxAge: COOKIE_MAX_AGE_MILLISECONDS });
  // send userDetails object to connect to the socket server
  res.json(UserDetails);
};

// If user refreshes the page, we have token in the cookie
export const pageRefreshes = async (req: Request, res: Response) => {
  if (req.user) {
    const user = req.user as UserDetails;

    // Token is issued so it can be shared b/w HTTP and ws server
    // Temporary implementation: Issue a new token for every refresh
    // Todo: Add proper refresh token logic with expiration and renewal

    const userDb = await db.user.findFirst({
      where: {
        id: user.id,
      },
    });

    const token = jwt.sign({ userId: user.id, name: userDb?.name }, JWT_SECRET);

    res.json({
      token,
      id: user.id,
      name: userDb?.name,
    });
  } else if (req.cookies && req.cookies.guest) {
    // If user is not logged in but has a guest token in the cookie
    // Decode the token to get userId and name
    const decoded = jwt.verify(req.cookies.guest, JWT_SECRET) as UserJwtClaims;
    const token = jwt.sign(
      { userId: decoded.userId, name: decoded.name, isGuest: true },
      JWT_SECRET,
      { expiresIn: COOKIE_MAX_AGE }
    );

    // Create UserDetails object to send back to the client
    let UserDetails: UserDetails = {
      id: decoded.userId,
      name: decoded.name,
      token: token,
      isGuest: true,
    };

    // send the cookie again
    res.cookie("guest", token, { maxAge: COOKIE_MAX_AGE_MILLISECONDS });
    // send userDetails object to connect to the socket server
    res.json(UserDetails);
  } else {
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

// User Logout
export const logoutUser = (req: Request, res: Response) => {
  res.clearCookie("guest");
  req.logout((err) => {
    if (err) {
      console.error("Error logging out:", err);
      res.status(500).json({ error: "Failed to log out" });
    } else {
      res.clearCookie("jwt");
      res.redirect("http://localhost:5173/");
    }
  });
};

// Login Failed
export const loginFailed = (req: Request, res: Response) => {
  res.status(401).json({
    success: false,
    message: "Login Failed",
  });
};
