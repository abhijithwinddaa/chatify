import express from 'express';
import { signup } from '../controllers/auth.controllers.js';

const route = express.Router();

route.post("/signup", signup)

route.get("/login", (req,res) => {
    res.send("Login endpoint");
})

route.get("/logout", (req,res) => {
    res.send("Logout endpoint");
})

export default route;