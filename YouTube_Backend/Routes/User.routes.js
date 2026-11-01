import { login, register } from "../Controller/User.controller.js";


export function userRoutes(app) {
    app.post("/api/auth/register", register);
    app.post("/api/auth/login", login);

    // Backwards-compatible aliases used by the original frontend.
    app.post("/register", register);
    app.post("/login", login);
}
