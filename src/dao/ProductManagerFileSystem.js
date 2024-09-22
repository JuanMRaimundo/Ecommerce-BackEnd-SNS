import fs from "fs";

export class ProductManagerFileSystem {
	path;

	COUNTER = 0;
	constructor(rootFile) {
		this.path = rootFile;
		this.getProducts();
	}

	async generateId() {
		let products = await this.getProducts();
		let id = 1;
		if (products.lenght != 0) {
			id = products[products.length - 1].id + 1;
			return id;
		}
	}

	async getProducts() {
		try {
			const data = await fs.promises.readFile(this.path, { encoding: "utf-8" });

			return JSON.parse(data);
		} catch (error) {
			console.log(`Advertencia, error al leer el archivo: ${error}`);
			return [];
		}
	}
	async getProductsById(id) {
		try {
			let status = false;
			let response = `El producto con id: ${id} no existe.`;
			let products = await this.getProducts();
			let productSelected = products.find((v) => v.id === id);

			if (productSelected) {
				status = true;
				response = productSelected;
				return { status, response };
			} else {
				console.log("Producto no encontrado.");
				return null;
			}
		} catch (error) {
			console.log(`Cuidado, error al leer el archivo: ${error.message}`);
			return null;
		}
	}

	async addProducts(
		title,
		description,
		code,
		price,
		status,
		stock,
		category,
		thumbnails = []
	) {
		try {
			let products = await this.getProducts();

			let codeNoRepeated = products.some((v) => v.code === code);

			if (codeNoRepeated) {
				return `El producto con código: ${code} ya se encuentra registrado`;
			} else {
				let newId = await this.generateId();
				const newProduct = {
					id: newId,
					title,
					description,
					code,
					price,
					status,
					stock,
					category,
					thumbnails,
				};

				products.push(newProduct);
				await fs.promises.writeFile(
					this.path,
					JSON.stringify(products, null, 5),
					{
						encoding: "utf-8",
					}
				);
				console.log("Producto añadido exitosamente");
				return newProduct;
			}
		} catch (error) {
			console.log(error.message);
		}
	}
	async updateProduct(id, upProductData) {
		try {
			let productList = await this.getProducts();
			let findProductIndex = productList.findIndex((p) => p.id === id);

			if (findProductIndex !== -1) {
				let updatedProduct = {
					...productList[findProductIndex],
					...upProductData,
					id: productList[findProductIndex].id,
				};
				productList[findProductIndex] = updatedProduct;
				await fs.promises.writeFile(
					this.path,
					JSON.stringify(productList, null, 5),
					{
						encoding: "utf-8",
					}
				);

				console.log("Producto actualizado:", updatedProduct);
			} else {
				console.log("Producto no encontrado");
			}
		} catch (error) {
			console.log(`Error: ${error.message} al querer actualizar producto`);
		}
	}

	async deleteProduct(id) {
		try {
			let products = await this.getProducts();
			let index = products.findIndex((p) => p.id === id);
			if (index !== -1) {
				products.splice(index, 1);
				await fs.promises.writeFile(
					this.path,
					JSON.stringify(products, null, 5)
				);
				console.log("Producto eliminado exitosamente");
			} else {
				return console.log("Producto no encontrado");
			}
		} catch (error) {
			console.log(`Error: ${error.message} al querer eliminar producto`);
		}
	}
}
