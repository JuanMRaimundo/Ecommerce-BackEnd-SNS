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

describe("Test for Products DAO", function () {
	this.timeout(10000);
	before(function () {
		this.daoProducts = new ProductsMongoDAO();
	});
	afterEach(async function () {
		await mongoose.connection
			.collection("products")
			.deleteMany({ title: "MockProduct" });
	});
	it("The DAO, in its get method, returns an array of products", async function () {
		let result = await this.daoProducts.getProducts();
		expect(Array.isArray(result)).to.be.equal(true);
		if (Array.isArray(result) && result.length > 0) {
			let product = result[0];
			expect(product._id).to.exist;
			expect(product.code).to.exist;
			expect(Object.keys(product).includes("_id")).to.be.true;
			expect(Object.keys(product)).to.includes("code");
		}
	});
	it("The DAO, in its addProduct method, create a new product", async function () {
		let result2 = await mongoose.connection
			.collection("products")
			.findOne({ title: "MockProduct" });
		expect(result2).to.be.equal(null);

		let ownerID = new mongoose.Types.ObjectId();
		let mockProduct = {
			code: 123456798,
			title: "MockProduct",
			descrption: "Product for test",
			price: 44444,
			status: false,
			stock: 2,
			category: "for testing",
			thumbnail: [],
			owner: ownerID,
		};
		result2 = await this.daoProducts.addProduct(mockProduct);
		expect(result2._id).to.exist;
		expect(isValidObjectId(result2)).to.be.ok;

		result2 = await mongoose.connection
			.collection("products")
			.findOne({ title: "MockProduct" });
		expect(result2).to.be.ok;
	});
});
