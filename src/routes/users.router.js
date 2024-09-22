import { Router } from "express";
import { authRole, verifyRecoveryToken } from "../middleware/auth.js";
import { UsersController } from "../controllers/UsersController.js";
import { upload } from "../utils.js";
import passport from "passport";

export const router = Router();

router.get("/", UsersController.getUsers);
router.post("/premium/:uid", UsersController.switchRole);
router.post(
	"/:uid/documents",
	upload.array("files", 10),
	UsersController.uploadDocuments
);
router.post("/updatePass", verifyRecoveryToken, UsersController.updatePass);
router.delete(
	"/",
	passport.authenticate("current", {
		session: false,
		failureRedirect: "/api/sessions/error",
	}),
	authRole(["admin"]),
	UsersController.deleteInactiveUsers
);
