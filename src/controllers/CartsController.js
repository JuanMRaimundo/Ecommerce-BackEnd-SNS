import { CartsMongoDAO as CartsDAO } from "../dao/CartsMongoDAO.js";
import { ProductsMongoDAO as ProductsDAO } from "../dao/ProductsMongoDAO.js";
import { isValidObjectId } from "mongoose";
import { TicketService } from "../repository/ticket.service.js";
import { sendMail } from "../utils.js";
import { ERROR_TYPES } from "../utils/Enum-error.js";
import { CustomError } from "../utils/CustomError.js";

const cartsDAO = new CartsDAO();
const productDAO = new ProductsDAO();

export class CartsController {
	static getCarts = async (req, res) => {
		try {
			let carts = await cartsDAO.getCarts();
			res.setHeader("Content-Type", "application/json");
			return res.status(200).json({ carts });
		} catch (error) {
			req.logger.error(
				"Error al consultar por los carritos." + "Error:" + error.stack
			);
			res.setHeader("Content-Type", "application/json");
			return res.status(500).json({
				error: `Error inesperado en el servidor - Intente más tarde`,
			});
		}
	};
	static getCartById = async (req, res) => {
		let { cid } = req.params;

		if (!isValidObjectId(cid)) {
			res.setHeader(`Content-Type`, `aplication/json`);
			return res.status(400).json({
				error: `Ingrese un id valido de MongoDB como argumento para su busqueda`,
			});
		}
		try {
			let cart = await cartsDAO.getCartById({ _id: cid });
			res.setHeader("Content-Type", "application/json");
			return res.status(200).json({ cart });
		} catch (error) {
			req.logger.error(
				"Error al consultar por el ID de un carrito." + "Error:" + error.stack
			);
			res.setHeader("Content-Type", "application/json");
			return res.status(500).json({
				error: `Error inesperado en el servidor - Intente más tarde, o contacte a su administrador`,
				detalle: `${error.message}`,
			});
		}
	};
	static createCart = async (req, res) => {
		const newCart = await cartsDAO.createCart();
		return res.json({ payload: newCart });
	};
	static addProductToCart = async (req, res) => {
		let { cid, pid } = req.params;
		let user = req.user;

		if (!isValidObjectId(cid) && !isValidObjectId(pid)) {
			return res.status(400).json({
				error: `Ingrese un id valido de MongoDB como argumento para su petición`,
			});
		}

		try {
			let product = await productDAO.getProductBy({ _id: pid });
			if (!product) {
				return res.status(404).json({
					error: "Producto no encontrado",
				});
			}
			console.log("este es el product", product);
			console.log("el owner del producto: ", product[0].owner);
			console.log("el user id:", user._id);
			if (product[0].owner.toString() === user._id.toString()) {
				return res.status(403).json({
					error:
						"Los usuarios premium no pueden agregar sus propios productos al carrito.",
				});
			}
			if (product[0].stock <= 0) {
				return res.status(400).json({
					error:
						"No hay suficiente stock disponible para agregar este producto al carrito.",
				});
			}
			await cartsDAO.addToCart(cid, pid);

			let cartUpdated = await cartsDAO.getCartById(cid);
			res.json({ payload: cartUpdated });
		} catch (error) {
			res.setHeader("Content-Type", "application/json");
			return res.status(300).json({
				error: `Error al agregar productos al carrito`,
				detalle: `${error.message}`,
			});
		}
	};
	static editCart = async (req, res) => {
		//PARA ACTUALIZAR UN CARRITO
		let { cid } = req.params;
		let { pid, quantity } = req.body;

		console.log("este es el pid:", pid);
		console.log("este es el Quiantity:", quantity);

		req.logger.info(
			"Esta es la info de la req.:" +
				"CID:" +
				cid +
				"PID" +
				pid +
				"Quantity" +
				quantity
		);
		if (!isValidObjectId(cid) || !isValidObjectId(pid)) {
			return res.status(400).json({
				error: `Ingrese un id válido de MongoDB como argumento para su petición`,
			});
		}
		if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) {
			return res.status(400).json({
				error: `Ingrese una cantidad válida para actualizar el producto en el carrito`,
			});
		}
		try {
			const productExists = await productDAO.getProductBy({ _id: pid });
			if (!productExists) {
				return res.status(404).json({
					error: `El producto con ID ${pid} no existe en la base de datos`,
				});
			}
			const cart = await cartsDAO.getCartById(cid);
			if (!cart) {
				return res.status(404).json({
					error: `El carrito con ID ${cid} no existe en la base de datos`,
				});
			}
			await cartsDAO.upDateCart(cid, pid, parseInt(quantity));
			let updatedCart = await cartsDAO.getCartById(cid);
			req.logger.info("El carrito actualizado es:" + updatedCart);
			res.json({ payload: updatedCart });
		} catch (error) {
			res.setHeader("Content-Type", "application/json");
			return res.status(500).json({
				error: `Error inesperado en el servidor al actualizar el carrito - Intente más tarde`,
				detalle: `${error.message}`,
			});
		}
	};
	static editQuantityCart = async (req, res) => {
		//EDITAR QUANTITY DE PRODUCTOS
		let { cid, pid } = req.params;
		let { quantity } = req.body;
		if (!isValidObjectId(cid)) {
			res.setHeader(`Content-Type`, `aplication/json`);
			return res.status(400).json({
				error: `Ingrese un id valido de MongoDB como argumento para su petición`,
			});
		}
		if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) {
			return res.status(400).json({
				error: `Ingrese una cantidad válida para actualizar la cantidad del producto en el carrito`,
			});
		}
		try {
			let updatedProduct = await cartsDAO.upDateQuantityCart(
				cid,
				pid,
				quantity
			);
			res.json({
				message: "Cantidad actualizada correctamente",
				cart: updatedProduct,
			});
		} catch (error) {
			res.setHeader(`Content-Type`, `aplication/json`);
			return res.status(500).json({
				error: `Error inesperado en el servidor, intente más tarde`,
				detail: `${error.message}`,
			});
		}
	};
	static deleteEveryProducts = async (req, res) => {
		let { cid } = req.params;
		if (!isValidObjectId(cid)) {
			res.setHeader(`Content-Type`, `aplication/json`);
			return res.status(400).json({
				error: `Ingrese un id valido de MongoDB como argumento para su petición`,
			});
		}
		try {
			let deleteProductsCart = await cartsDAO.deleteEveryProducts(cid);
			res.json({
				message: "Productos eliminados del carrito",
				cart: deleteProductsCart,
			});
		} catch (error) {
			res.setHeader(`Content-Type`, `aplication/json`);
			return res.status(500).json({
				error: `Error inesperado en el servidor, intente más tarde`,
				detail: `${error.message}`,
			});
		}
	};
	static deleteAProductOfCart = async (req, res) => {
		let { cid, pid } = req.params;
		if (!isValidObjectId(cid)) {
			res.setHeader(`Content-Type`, `aplication/json`);
			return res.status(400).json({
				error: `Ingrese un id valido de MongoDB como argumento para su petición`,
			});
		}
		try {
			let updatedCart = await cartsDAO.deleteProduct(cid, pid);
			res.json({
				message: "Producto eliminado del carrito",
				cart: updatedCart,
			});
		} catch (error) {
			res.setHeader(`Content-Type`, `aplication/json`);
			return res.status(500).json({
				error: `Error inesperado en el servidor, intente más tarde`,
				detail: `${error.message}`,
			});
		}
	};

	static newPurchase = async (req, res, next) => {
		let { cid } = req.params;
		let userId = req.user._id;
		try {
			if (!isValidObjectId(cid)) {
				CustomError.generateError(
					"Cart Error",
					"Carrito no encontrado",
					`El carrito con id ${cid}, no ha sido encontrado`,
					ERROR_TYPES.DATA_TYPE
				);
				req.logger.error("Carrito no encontrado");
			}
			const newTicket = await TicketService.createTicketFromCart(cid, userId);
			let ticketEnviado = await sendMail(
				newTicket.purchaser,
				"¡Compra exitosa!",
				`
				<h1>¡¡Hola ${req.user?.first_name}!!</h1>
				<h2>Gracias por comprar en SNSports</h2><br><br>
				<p>Tu nro de compra es: ${newTicket.code} por un monto de $${newTicket.amount}</p><br>
				<p>Ante cualquier duda comunicate con nosotros</p><br><br>
				`
			);
			if (ticketEnviado.accepted.length > 0) {
				req.logger.info("Registro de compra-Ticket enviado:" + newTicket);
			}
			res
				.status(201)
				.json({ message: "Compra realizada con éxito", ticket: newTicket });
		} catch (error) {
			next(error);
		}
	};
}
