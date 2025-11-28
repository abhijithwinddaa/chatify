import jwt from 'jsonwebtoken';
import { ENV } from '../lib/env.js';
import User from '../models/User.js';

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies?.jwt
        if (!token) return res.status(401).json({message: "Unauthorized access. No token provided."})

        const decodec = jwt.verify(token, ENV.JWT_SECRET);
        if (!decodec) return res.status(401).json({message: "Unauthorized access. Invalid token."}) 

        const user = await User.findById(decodec.userId).select("-password");
        if (!user) return res.status(401).json({message: "User not found."})   
        
        req.user = user;    
        next();    
    } catch (error) {
        console.error("Error in protectRoute middleware:", error);
        res.status(401).json({message: "internal server error"})
    }
}

export default protectRoute;