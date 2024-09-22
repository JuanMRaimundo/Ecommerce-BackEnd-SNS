import fs from "fs";
import { ProductManagerFileSystem as ProductManager } from "./ProductManagerFileSystem.js";

export class CartManagerFileSystem {
	path;
	constructor(rootFile) {
		this.path = rootFile;
		this.getCarts();
	}

	async generateId() {
		let carts = await this.getCarts();
		let id = 1;
		if (carts.lenght != 0) {
			id = carts[carts.length - 1].id + 1;
			return id;
		}
	}

	async getCarts() {
		try {
			const data = await fs.promises.readFile(this.path, { encoding: "utf-8" });
			return JSON.parse(data);
		} catch (error) {
			console.log(`Error al leer el CartManager: ${error}`);
			return [];
		}
	}
	async getCartById(id) {
		try {
			let carts = await this.getCarts();
			let cartSelected = carts.find((v) => v.id === id);
			if (cartSelected) {
				console.log(`Carrito seleccionado: ${cartSelected} `);
				return cartSelected;
			}
		} catch (error) {
			console.log(`Error al leer el ${id} del CartManager : ${error}`);
			return null;
		}
	}
	async createCart() {
		const newCart = {
			id: await this.generateId(),
			products: [],
		};
		let carts = await this.getCarts();
		carts.push(newCart);
		await fs.promises.writeFile(this.path, JSON.stringify(carts, null, 5), {
			encoding: "utf-8",
		});
		return newCart;
	}
	async addToCart(cid, pid) {
		let response = `El carrito con id ${cid} no existe`;
		const cart = await this.getCarts();
		const indexCart = cart.findIndex((c) => c.id === cid);

		if (indexCart !== -1) {
			const idProductInCart = cart[indexCart].products.findIndex(
				(p) => p.id === pid
			);
			const products = new ProductManager("./src/data/products.json");
			const productInfo = await products.getProductsById(pid);

			if (productInfo && productInfo.status) {
				if (idProductInCart === -1) {
					cart[indexCart].products.push({ id: pid, quantity: 1 });
				} else {
					++cart[indexCart].products[idProductInCart].quantity;
				}
				await fs.promises.writeFile(this.path, JSON.stringify(cart, null, 5), {
					encoding: "utf-8",
				});
				response = `Producto añadido correctamente al carrito ${cid}`;
			} else {
				response = `El producto con id ${pid} no existe`;
			}
		}
		return response;
	}
	async upDateCart() {}
	async deleteCart() {}
}
