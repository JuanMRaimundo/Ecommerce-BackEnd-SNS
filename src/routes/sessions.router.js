import { Router } from "express";
import passport from "passport";
import { UsersController } from "../controllers/UsersController.js";

export const router = Router();

router.post(
	"/registration",
	passport.authenticate("register", {
		session: false,
	}),
	UsersController.registration
);

router.post(
	"/login",
	passport.authenticate("login", {
		session: false,
		failureRedirect: "/api/sessions/error",
	}),
	UsersController.login
);
router.get(`/github`, passport.authenticate("github"), (req, res) => {});
router.get(
	"/callbackGithub",
	passport.authenticate("github", {
		session: false,
		failureRedirect: "/api/sessions/error",
	}),
	UsersController.callBackGitHub
);
router.get("/error", UsersController.errorRoute);
router.put(
	"/logout",
	passport.authenticate("current", { session: false }),
	UsersController.logout
);

router.get(
	"/current",
	passport.authenticate("current", {
		session: false,
		failureRedirect: "/api/sessions/error",
	}),
	UsersController.current
);
