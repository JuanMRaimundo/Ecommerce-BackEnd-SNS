import { productModel } from "./models/productModel.js";

export class ProductManagerMongo {
	async getProducts() {
		return await productModel.find().lean();
	}
	async getPaginateProducts(page = 1) {
		return await productModel.paginate({}, { limit: 5, page, lean: true });
	}
	async getSortProducts() {
		return await productModel.paginate({}, { sort: { price: 1 } });
	}
	async getProductBy(filter) {
		return await productModel.find(filter).lean();
	}
	async getProductsSort(sort = 1) {
		return await productModel.find().sort({ price: sort });
	}

	async addProduct(product) {
		return await productModel.create(product);
	}
	async updateProduct(id, upDProductData) {
		return await productModel.findByIdAndUpdate(id, upDProductData, {
			runValidators: true,
			returnDocument: "after",
		});
	}

	async deleteProduct(pid) {
		return await productModel.deleteOne({ _id: pid });
	}
}
