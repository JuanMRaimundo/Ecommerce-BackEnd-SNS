import { cartsModel } from "./models/cartModel.js";
import mongoose from "mongoose";
import { ticektModel } from "./models/ticketModel.js";
import { CustomError } from "../utils/CustomError.js";

export class CartsMongoDAO {
	async generateId() {
		let carts = await this.getCarts();
		let id = 1;
		if (carts.length != 0) {
			id = carts[carts.length - 1].id + 1;
			return id;
		}
	}

	async getCarts() {
		let carts = await cartsModel
			.find()
			.populate({ path: "products.product" })
			.lean();

		return carts;
	}
	async getCartBy(filter) {
		return await cartsModel.findOne(filter).lean();
	}
	async getCartById(id) {
		return await cartsModel.findOne({ _id: id }).populate("products.product");
	}
	async getCartByIdForCartView(id) {
		return await cartsModel
			.findOne({ _id: id })
			.populate("products.product")
			.lean();
	}
	async createCart(product) {
		return await cartsModel.create(product);
	}
	async addToCart(cid, pid) {
		try {
			let searchCart = await this.getCartById(cid);
			console.log(searchCart);
			let productIndex = searchCart.products.findIndex(
				(p) => p.product._id.toString() === pid
			);

			if (productIndex !== -1) {
				searchCart.products[productIndex].quantity += 1;
			} else {
				searchCart.products.push({
					product: new mongoose.Types.ObjectId(pid),
					quantity: 1,
				});
			}

			await searchCart.save();
			return searchCart;
		} catch (error) {
			CustomError.createCartError(
				"Cart-Error",
				"Error al agregar un producto al carrito",
				error.stack,
				400
			);
		}
	}

	async upDateCart(cid, pid, quantity) {
		//correcto
		try {
			let updatedCart = await cartsModel
				.findOneAndUpdate(
					{ _id: cid, "products.product": pid },
					{ $set: { "products.$.quantity": quantity } },
					{ new: true }
				)
				.populate("products.product");
			if (!updatedCart) {
				throw new Error(
					`No se pudo actualizar el carrito con ID ${cid}. Verifica los IDs.`
				);
			}

			console.log("Carrito actualizado:", updatedCart);
			let cart = await cartsModel
				.findOne({ _id: cid })
				.populate("products.product");
			console.log("Carrito actualizado (verificación):", cart); // Verificar el carrito actualizado
			return updatedCart;
		} catch (error) {
			console.error("Error al actualizar el carrito:", error);
			throw new Error(
				`Error al actualizar la cantidad del producto ${pid} en el carrito ${cid}: ${error.message}`
			);
		}
	}
	async upDateQuantityCart(cid, pid, quantity) {
		try {
			let updatedCart = await cartsModel
				.findOneAndUpdate(
					{ _id: cid, "products.product": pid },
					{ $set: { "products.$.quantity": quantity } },
					{ new: true }
				)
				.populate("products.product");
			console.log({ quantity });
			console.log(updatedCart);
			return updatedCart;
		} catch (error) {
			CustomError.createCartError(
				"Cart-Error",
				"Error al actualizar la cantidad del producto en el carrito",
				error.stack,
				400
			);
		}
	}
	async deleteEveryProducts(cid) {
		try {
			let updatedCart = await cartsModel.findOneAndUpdate(
				{ _id: cid },
				{ $pull: { products: {} } },
				{ new: true }
			);
			return updatedCart;
		} catch (error) {
			CustomError.createCartError(
				"Cart-Error",
				"Error al eliminar todos los productos del carrito",
				error.stack,
				400
			);
		}
	}

	async deleteProduct(cid, pid) {
		try {
			let updatedCart = await cartsModel.findOneAndUpdate(
				{ _id: cid },
				{ $pull: { products: { _id: pid } } },
				{ new: true }
			);
			return updatedCart;
		} catch (error) {
			CustomError.createCartError(
				"Cart-Error",
				"Error al eliminar el producto del carrito",
				error.stack,
				400
			);
		}
	}
	async createPurchase(cid) {
		return await ticektModel.create(cid);
	}
}
