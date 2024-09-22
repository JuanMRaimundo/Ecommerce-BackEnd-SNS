import { Router } from "express";
import { ProductsController } from "../controllers/ProductsController.js";
import { authRole } from "../middleware/auth.js";
import passport from "passport";

export const router = Router();

router.get("/", ProductsController.getLimitedProducts);
router.get("/mockingproducts", ProductsController.mockingProducts);
router.get("/category/:category", ProductsController.getProductsByCategory);
router.get("/stock/:maxStock", ProductsController.getProductsbyStock);
router.get("/price/:sort", ProductsController.getProductsSortedbyPrice);
router.get("/title/:title", ProductsController.getProductbyTitle);
router.get("/:pid", ProductsController.getProductById);
router.post(
	"/",
	passport.authenticate("current", {
		session: false,
		failureRedirect: "/api/sessions/error",
	}),
	authRole(["admin", "premium"]),
	ProductsController.createProduct
);
router.put(
	"/:pid",
	passport.authenticate("current", {
		session: false,
		failureRedirect: "/api/sessions/error",
	}),
	authRole(["admin"]),
	ProductsController.editProduct
);
router.delete(
	"/:pid",
	passport.authenticate("current", {
		session: false,
		failureRedirect: "/api/sessions/error",
	}),
	authRole(["admin", "premium"]),
	ProductsController.deleteProduct
);
