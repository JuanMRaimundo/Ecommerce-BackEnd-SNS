import { productModel } from "./models/productModel.js";

export class ProductsMongoDAO {
	async getProducts() {
		return await productModel.find().lean();
	}
	async getPaginateProducts(page = 1) {
		return await productModel.paginate({}, { limit: 5, page, lean: true });
	}
	async getLimitProducts(limit) {
		return await productModel.find().limit(Number(limit));
	}
	async getSortProducts(sort) {
		return await productModel.paginate({}, { sort: { price: sort } });
	}
	async getLimitAndSortProducts(limit, sort) {
		return await productModel.find().limit(Number(limit)).sort({ price: sort });
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
