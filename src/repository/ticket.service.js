import { CartsMongoDAO as CartsDAO } from "../dao/CartsMongoDAO.js";
import { UsersMongoDAO as UserDAO } from "../dao/UsersMongoDAO.js";
import { ProductsMongoDAO as ProductsDAO } from "../dao/ProductsMongoDAO.js";
import { ticektModel } from "../dao/models/ticketModel.js";
import { CustomError } from "../utils/CustomError.js";
import { ERROR_TYPES } from "../utils/Enum-error.js";

const cartsDAO = new CartsDAO();
const userDAO = new UserDAO();
const productDAO = new ProductsDAO();

export class TicketService {
	static async createTicketFromCart(cartId, userId) {
		try {
			let cart = await cartsDAO.getCartById(cartId);

			if (!cart) {
				CustomError.createCartError(
					"Cart Error",
					"Carrito no encontrado",
					`El carrito con id ${cartId}, no ha sido encontrado`,
					ERROR_TYPES.NOT_FOUND
				);
			}
			const user = await userDAO.getUserBy({ _id: userId });
			if (!user) {
				CustomError.createUserError(
					"User Error",
					"Usuario no encontrado",
					`El usuario con id ${userId}, no ha sido encontrado`,
					ERROR_TYPES.NOT_FOUND
				);
			}

			let totalAmount = 0;
			let productsToPurchase = [];
			let productsWithProblemns = [];

			for (const cartProduct of cart.products) {
				const product = cartProduct.product;
				const quantity = cartProduct.quantity;
				if (product && product.stock >= quantity) {
					product.stock -= quantity;
					await product.save();

					totalAmount += product.price * quantity;
					productsToPurchase.push({
						product: product._id,
						quantity: quantity,
						description: product.description,
						price: product.price,
						stockPrevCompra: product.stock + quantity,
						stockPostCompra: product.stock,
						subtotal: product.price * quantity,
					});
				} else if (product && product.stock < quantity) {
					productsWithProblemns.push(cartProduct);
					console.log(`Stock insuficiente para el producto ${product.title}`);
				} else {
					console.log(
						`Producto ${cartProduct._id} no encontrado o nulo en la base de datos.`
					);
				}
			}
			if (productsToPurchase.length === 0) {
				throw new Error(
					"No hay productos suficientes en stock para completar la compra"
				);
			}
			const newTicket = new ticektModel({
				amount: totalAmount,
				purchaser: user.email,
				items: productsToPurchase,
			});
			await newTicket.save();

			cart.products = productsWithProblemns;
			await cart.save();
			return newTicket;
		} catch (error) {
			CustomError.createCartError(
				"Cart Error",
				"Error en el método CreateTicket",
				`El método createTicket ha fallado`,
				ERROR_TYPES.INTERNAL_SERVER_ERROR
			);
		}
	}
}
