import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { db } from "../../db/db";

import jwt from "jsonwebtoken";
import { getEnv } from "./getEnv";

const JWT_SECRET = getEnv("JWT_SECRET", "your_secret_key");
const COOKIE_MAX_AGE = "7d"; // or '1h', etc.

function generateJWT(user: any, isGuest = false) {
  return jwt.sign(
    {
      userId: user.id,
      name: user.name,
      isGuest: isGuest,
    },
    JWT_SECRET,
    { expiresIn: COOKIE_MAX_AGE }
  );
}

interface GithubEmailRes {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: "private" | "public";
}

const GOOGLE_CLIENT_ID = getEnv("GOOGLE_CLIENT_ID", "your_google_client_id");
const GOOGLE_CLIENT_SECRET = getEnv(
  "GOOGLE_CLIENT_SECRET",
  "your_google_client_secret"
);
const GITHUB_CLIENT_ID = getEnv("GITHUB_CLIENT_ID", "your_github_client_id");
const GITHUB_CLIENT_SECRET = getEnv(
  "GITHUB_CLIENT_SECRET",
  "your_github_client_secret"
);

export function initPassport() {
  if (
    !GOOGLE_CLIENT_ID ||
    !GOOGLE_CLIENT_SECRET ||
    !GITHUB_CLIENT_ID ||
    !GITHUB_CLIENT_SECRET
  ) {
    throw new Error(
      "Missing environment variables for authentication providers"
    );
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
      },
      async function (
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: (error: any, user?: any) => void
      ) {
        const user = await db.user.upsert({
          create: {
            email: profile.emails[0].value,
            name: profile.displayName,
            provider: "GOOGLE",
          },
          update: {
            name: profile.displayName,
          },
          where: {
            email: profile.emails[0].value,
          },
        });

        done(null, user);
      }
    )
  );

  passport.use(
    new GitHubStrategy(
      {
        clientID: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET,
        callbackURL: "/api/auth/github/callback",
      },
      async function (
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: (error: any, user?: any) => void
      ) {
        const res = await fetch("https://api.github.com/user/emails", {
          headers: {
            Authorization: `token ${accessToken}`,
          },
        });
        const data: GithubEmailRes[] = await res.json();
        const primaryEmail = data.find((item) => item.primary === true);

        const user = await db.user.upsert({
          create: {
            email: primaryEmail!.email,
            name: profile.displayName,
            provider: "GITHUB",
          },
          update: {
            name: profile.displayName,
          },
          where: {
            email: primaryEmail?.email,
          },
        });

        const token = generateJWT(user, false);
        // profile.jwtToken = token;
        user.jwtToken = token;
        done(null, user);
      }
    )
  );

  passport.serializeUser(function (user: any, cb) {
    process.nextTick(function () {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture,
      });
    });
  });

  passport.deserializeUser(function (user: any, cb) {
    process.nextTick(function () {
      return cb(null, user);
    });
  });
}
