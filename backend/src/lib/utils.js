import jwt from "jsonwebtoken";

export const generateToken=(userId, res) => {
    const token = jwt.sign({userId},process.env.JWT_SECRET, {
        expiresIn: '7d',
    });

    res.cookie("jwt", token, {
        maxAge: 7*24*60*60*1000,
        httpOnly: true, //prevent xss attacks: client-side js cannot access the cookie scripting
        sameSite: "strict", //CSRF attacks prevention
        secure: process.env.NODE_ENV === "development" ? false : true, //https only in production

    });

    return token
}

export default generateToken;