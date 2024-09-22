import { Router } from "express";
import { CartsController } from "../controllers/CartsController.js";
import passport from "passport";
import { authRole } from "../middleware/auth.js";

export const router = Router();

router.get(`/`, CartsController.getCarts);
router.get(`/:cid`, CartsController.getCartById);
router.post("/", CartsController.createCart);
router.post(
	"/:cid/products/:pid",
	passport.authenticate("current", {
		session: false,
		failureRedirect: "/api/sessions/error",
	}),
	authRole(["user", "premium"]),
	CartsController.addProductToCart
);
router.post(
	"/:cid/purchase",
	passport.authenticate("current", {
		session: false,
		failureRedirect: "/api/sessions/error",
	}),
	authRole(["user", "premium"]),
	CartsController.newPurchase
);
router.put("/:cid", CartsController.editCart);
router.put("/:cid/products/:pid", CartsController.editQuantityCart);
router.delete("/:cid", CartsController.deleteEveryProducts);
router.delete("/:cid/products/:pid", CartsController.deleteAProductOfCart);
