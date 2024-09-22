import { Router } from "express";
import passport from "passport";
import { ViewsController } from "../controllers/ViewsController.js";
import { authRole, verifyRecoveryToken } from "../middleware/auth.js";

export const router = Router();

router.get("/", (req, res) => {
	res.status(200).render("login");
});
router.get(
	"/home",
	passport.authenticate("current", { session: false }),
	ViewsController.homeView
);
router.get(
	"/realTimeProducts",
	passport.authenticate("current", { session: false }),
	ViewsController.realTimeProductsView
);
router.get(
	"/chat",
	passport.authenticate("current", {
		session: false,
		failureRedirect: "/api/sessions/error",
	}),
	authRole(["user"]),
	ViewsController.chatView
);
router.get(
	"/carts/:cid",
	passport.authenticate("current", { session: false }),
	ViewsController.cartView
);
router.post(
	"/passwordRecoveryResponse",
	ViewsController.requestRecoveryPassword
);
router.get(
	"/passwordRecovery",
	verifyRecoveryToken,
	ViewsController.recoveryPasswordView
);
router.get("/registration", ViewsController.registrationView);
router.get("/login", ViewsController.loginView);
router.get(
	"/profile",
	passport.authenticate("current", { session: false }),
	ViewsController.profileView
);
