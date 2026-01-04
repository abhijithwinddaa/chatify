import jwt from "jsonwebtoken";
import { ENV } from "./env.js";

export const generateToken = (userId, res) => {
    const { JWT_SECRET } = ENV;
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign({ userId }, JWT_SECRET, {
        expiresIn: '7d',
    });

    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true, //prevent xss attacks: client-side js cannot access the cookie scripting
        sameSite: ENV.NODE_ENV === "production" ? "none" : "strict", // 'none' for cross-domain in production
        secure: ENV.NODE_ENV !== "development", //https only in production (required for sameSite: none)
    });

    return token
}

export default generateToken;