import { CartsMongoDAO } from "../../src/dao/CartsMongoDAO.js";
import { ProductsMongoDAO } from "../../src/dao/ProductsMongoDAO.js";
import mongoose, { isValidObjectId } from "mongoose";
import { expect } from "chai";
import { before, describe, it } from "mocha";
import { config } from "../../src/config/config.js";

const connDB = async () => {
	try {
		await mongoose.connect(config.MONGO_URL, {
			dbName: config.DB_NAME,
		});
		console.log("DB conectada");
	} catch (error) {
		console.log(`Error al conectar a la BD: ${error}`);
	}
};
connDB();

describe("Test for Carts DAO", function () {
	this.timeout(10000);
	before(function () {
		this.daoCarts = new CartsMongoDAO();
		this.daoProducts = new ProductsMongoDAO();
		this.mockCart = null;
	});
	afterEach(async function () {
		if (this.mockCart) {
			await mongoose.connection
				.collection("carts")
				.deleteMany({ _id: this.mockCart._id });
		}
	});
	it("The DAO, in its get method, returns an array of carts", async function () {
		let result = await this.daoCarts.getCarts();

		expect(Array.isArray(result)).to.be.equal(true);
		if (Array.isArray(result) && result.length > 0) {
			let cart = result[0];
			expect(cart._id).exist;

			expect(Object.keys(cart).includes("_id")).to.be.true;
			expect(Object.keys(cart)).to.includes("products");
		}
	});
	it("The DAO, in its addToCart method, adds a product to a cart", async function () {
		let mockCart = await this.daoCarts.createCart();
		this.mockCart = mockCart;
		expect(mockCart).to.exist;
		let ownerID = new mongoose.Types.ObjectId();
		let mockProduct = await this.daoProducts.addProduct({
			code: 123456799,
			title: "MockProduct",
			description: "Product for test",
			price: 44444,
			status: false,
			stock: 2,
			category: "for testing",
			thumbnail: [],
			owner: ownerID,
		});
		let updatedCart = await this.daoCarts.addToCart(
			this.mockCart._id,
			mockProduct._id
		);
		expect(updatedCart).to.exist;
		let productAdded = await mongoose.connection
			.collection("carts")
			.findOne({ _id: this.mockCart._id });
		console.log("resultado del add to cart:", productAdded);

		expect(productAdded._id).to.exist;
	});
});
