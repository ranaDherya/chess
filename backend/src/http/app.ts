import express from "express";
// import gameRoutes from "./routes/gameRoutes";
import cors from "cors";
// import v1Router from './router/v1';
import { initPassport } from "./utils/passportConfig";
import authRoute from "./routes/authRoutes";
import session from "express-session";
import passport from "passport";
import cookieParser from "cookie-parser";
import { COOKIE_MAX_AGE } from "../constants";
import { getEnv } from "./utils/getEnv";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: getEnv("COOKIE_SECRET", "keyboard cat"),
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: COOKIE_MAX_AGE },
  })
);
initPassport();
app.use(passport.initialize());
app.use(passport.authenticate("session"));

let allowedHostsArray = getEnv("ALLOWED_HOSTS");

const allowedHosts = allowedHostsArray ? allowedHostsArray.split(",") : ["*"];

// app.use(
//   cors({
//     origin: allowedHosts,
//     methods: "GET,POST,PUT,DELETE",
//     credentials: true,
//   })
// );

app.use(cors());

// Register HTTP routes
app.use("/api/auth", authRoute);
// app.use("/api/game", gameRoutes);

export default app;
