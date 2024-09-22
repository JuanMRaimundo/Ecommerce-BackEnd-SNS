import jwt from "jsonwebtoken";
import { CartsMongoDAO as CartsDAO } from "../dao/CartsMongoDAO.js";
import { ProductsMongoDAO as ProductsDAO } from "../dao/ProductsMongoDAO.js";
import { config } from "../config/config.js";
import { sendMail } from "../utils.js";
import { usersService } from "../repository/users.service.js";

const cartsDao = new CartsDAO();
const productsDao = new ProductsDAO();

export class ViewsController {
	static homeView = async (req, res) => {
		let { page } = req.query;
		let token = req.cookies["SNScookie"];
		let user = jwt.verify(token, config.SECRET);
		let cartId = user.cart._id;
		req.logger.info("Usuario:" + user + "Id del carrito:" + cartId);
		if (!page) page = 1;
		let {
			docs: payload,
			totalPages,
			hasPrevPage,
			hasNextPage,
			prevPage,
			nextPage,
		} = await productsDao.getPaginateProducts(page);
		res.setHeader(`Content-Type`, `text/html`);
		res.status(200).render(`home`, {
			payload,
			totalPages,
			hasPrevPage,
			hasNextPage,
			prevPage,
			nextPage,
			cartId,
		});
	};
	static realTimeProductsView = async (req, res) => {
		let products;
		let token = req.cookies["SNScookie"];
		let user = jwt.verify(token, config.SECRET);
		let cartId = user.cart._id;
		try {
			products = await productsDao.getPaginateProducts(1);

			res.setHeader("Content-Type", "text/html");
			res
				.status(200)
				.render("realTimeProducts", { products, user: user, cartId });
		} catch (error) {
			res.setHeader("Content-Type", "application/json");
			return res.status(500).json({
				error: `Error inesperado en el servidor-Intente más tarde`,
			});
		}
	};
	static chatView = async (req, res) => {
		let token = req.cookies["SNScookie"];
		let user = jwt.verify(token, config.SECRET);
		let cartId = user.cart._id;
		try {
			res.setHeader("Content-Type", "text/html");
			res.status(200).render("chat", { user: user, cartId });
		} catch (error) {
			res.setHeader("Content-Type", "application/json");
			return res.status(500).json({
				status: "error",
				error:
					"Error inesperado en el servidor - Intente más tarde, o contacte a su administrador",
				detalle: `${error.message}`,
			});
		}
	};
	static cartView = async (req, res) => {
		let { cid } = req.params;

		try {
			let cart = await cartsDao.getCartByIdForCartView({ _id: cid });
			res.setHeader("Content-Type", "text/html");
			return res
				.status(200)
				.render("carts", { cart, user: req.cookies["SNScookie"]?.user });
		} catch (error) {
			req.logger.error(
				"Error al cargar vista del carrito" + "Error:" + error.stack
			);
			res.setHeader("Content-Type", "application/json");
			return res.status(500).json({
				status: "error",
				error:
					"Error inesperado en el servidor - Intente más tarde, o contacte a su administrador",
				detalle: `${error.message}`,
			});
		}
	};
	static profileView = async (req, res) => {
		try {
			let token = req.cookies["SNScookie"];
			let user = jwt.verify(token, config.SECRET);
			req.logger.info("Vista del usuario:" + user);
			res.status(200).render("profile", { user });
		} catch (error) {
			res.setHeader("Content-Type", "application/json");
			return res.status(500).json({
				status: "error",
				error:
					"Error inesperado en el servidor - Intente más tarde, o contacte a su administrador",
				detalle: `${error.message}`,
			});
		}
	};
	static registrationView = async (req, res) => {
		try {
			if (req.cookies["SNScookie"]?.user) {
				return res.redirect("/home");
			}
			res.status(200).render("registration");
		} catch (error) {
			res.setHeader("Content-Type", "application/json");
			return res.status(500).json({
				status: "error",
				error:
					"Error inesperado en el servidor - Intente más tarde, o contacte a su administrador",
				detalle: `${error.message}`,
			});
		}
	};
	static loginView = async (req, res) => {
		try {
			if (req.token) {
				return res.redirect("/home");
			}
			let { error } = req.query;
			res.status(200).render("login", { error });
		} catch (error) {
			res.setHeader("Content-Type", "application/json");
			return res.status(500).json({
				status: "error",
				error:
					"Error inesperado en el servidor - Intente más tarde, o contacte a su administrador",
				detalle: `${error.message}`,
			});
		}
	};
	static recoveryPasswordView = async (req, res) => {
		try {
			console.log(req.body);
			console.log("recuperacion contraseña");
			res.status(200).render("passwordRecovery");
		} catch (error) {
			res.setHeader("Content-Type", "application/json");
			return res.status(500).json({
				status: "error",
				error:
					"Error inesperado en el servidor en la recuperación de contraseña - Intente más tarde, o contacte a su administrador",
				detalle: `${error.message}`,
			});
		}
	};
	static requestRecoveryPassword = async (req, res) => {
		try {
			const { email } = req.body;

			if (!email) {
				return res.status(400).json({ error: "El email es requerido" });
			}
			const user = await usersService.getUserBy({ email });

			if (!user) {
				return res.status(404).json({ error: "Usuario no encontrado en BD" });
			}
			const token = jwt.sign({ id: user._id }, config.SECRET, {
				expiresIn: "1h",
			});
			res.cookie("recoveryToken", token, {
				httpOnly: true,
				secure: config.MODE,
				maxAge: 3600000,
			});
			const recoveryLink = `http://localhost:8080/passwordRecovery`;
			console.log("enlace de recuperacion", recoveryLink);
			await sendMail(
				user.email,
				"Recuperación de Contraseña",
				`
				<div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
  				<h1 style="color: #1a73e8;">¡¡Hola ${user.first_name}!!</h1>
 				 <h2 style="margin-top: 30px;">Gracias por confiar en SNSports</h2>
  				<p style="margin-top: 20px;">Haz click en el siguiente link para generar una nueva contraseña:</p>
 				 <a href="${recoveryLink}" style="background-color: #1a73e8; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; border-radius: 5px; margin-top: 20px;">Restablecer Contraseña</a>
				</div>
				`
			);

			req.logger.info("Correo de recuperación enviado a:", user.email);
			res.status(200).json({ message: "Correo de recuperación enviado" });
		} catch (error) {
			console.error("Error en recuperación de contraseña:", error);
			res.setHeader("Content-Type", "application/json");
			return res.status(500).json({
				status: "error",
				error:
					"Error inesperado en el servidor en la generación de recupero - Intente más tarde, o contacte a su administrador",
				detalle: `${error.message}`,
			});
		}
	};
}
