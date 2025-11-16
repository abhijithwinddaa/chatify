import express from 'express';

const route = express.Router();

route.get("/signup", (req,res) => {
    res.send("Signup endpoint");
})

route.get("/login", (req,res) => {
    res.send("Login endpoint");
})

route.get("/logout", (req,res) => {
    res.send("Logout endpoint");
})

export default route;