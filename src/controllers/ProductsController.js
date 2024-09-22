import { ProductsMongoDAO as ProductsDAO } from "../dao/ProductsMongoDAO.js";
import { usersService } from "../repository/users.service.js";
import { productModel } from "../dao/models/productModel.js";
import { isValidObjectId } from "mongoose";
import { fakerES_MX as faker } from "@faker-js/faker";
import { CustomError } from "../utils/CustomError.js";
import { productErrorInfo } from "../utils/errors-types.js";
import { ERROR_TYPES } from "../utils/Enum-error.js";
import { sendMail } from "../utils.js";

const productDAO = new ProductsDAO();

export class ProductsController {
	static getLimitedProducts = async (req, res) => {
		try {
			const { limit, sort, all } = req.query;
			let products;

			const limitNumber = limit ? Number(limit) : undefined;
			const sortNumber = sort ? Number(sort) : undefined;

			if (limitNumber && sortNumber) {
				products = await productDAO.getLimitAndSortProducts(
					limitNumber,
					sortNumber
				);
			} else if (limitNumber) {
				products = await productDAO.getLimitProducts(limitNumber);
			} else if (sortNumber) {
				products = await productDAO.getSortProducts(sortNumber);
			} else if (all) {
				products = await productDAO.getProducts();
			} else {
				products = await productDAO.getPaginateProducts(5);
			}

			res.setHeader("Content-Type", "application/json");
			return res.status(200).json({ products });
		} catch (error) {
			req.logger.error(
				"Error al consultar por productos con límites:" + "Error:" + error.stack
			);
			res.setHeader("Content-Type", "application/json");
			return res.status(500).json({
				error: `Error inesperado en el servidor - Intente más tarde`,
			});
		}
	};
	static getProductsByCategory = async (req, res) => {
		let category = req.params.category;
		try {
			if (!category) {
				return res.status(400).json({ error: "La categoría es requerida." });
			}
			let payload = await productDAO.getProductBy({ category: category });
			if (payload.length === 0) {
				return res.status(404).json({
					error: `No se encontraron productos para la categoría: ${category}`,
				});
			}
			return res.status(200).json({ payload });
		} catch (error) {
			req.logger.error(
				"Error al consultar por productos por categoría:" +
					"Error:" +
					error.stack
			);
			res.setHeader("Content-Type", "application/json");
			return res.status(500).json({
				error: `Error inesperado en el servidor - Intente más tarde`,
			});
		}
	};
	static getProductsbyStock = async (req, res) => {
		let maxStock = req.params.maxStock;
		try {
			let payload = await productDAO.getProductBy({
				stock: { $lt: maxStock },
			});
			if (payload.length > 0) {
				res.setHeader("Content-Type", "application/json");
				return res.status(200).json({ payload: payload });
			} else {
				res.json({
					error: `No se encontraron productos con un stock inferior a ${maxStock}`,
				});
			}
		} catch (error) {
			req.logger.error(
				"Error al consultar por productos por stock:" + "Error:" + error.stack
			);
			res.setHeader("Content-Type", "application/json");
			return res.status(500).json({
				error: `Error inesperado en el servidor - Intente más tarde`,
			});
		}
	};
	static getProductsSortedbyPrice = async (req, res) => {
		let sort = parseInt(req.params.sort);
		try {
			if (sort !== 1 && sort !== -1) {
				res.setHeader("Content-Type", "application/json");
				return res
					.status(400)
					.json({ error: "El parametro es incorrecto, debe ser 1 o -1" });
			}
			let payload = await productDAO.getProductsSort(sort);
			res.setHeader("Content-Type", "application/json");
			return res.status(200).json({ payload: payload });
		} catch (error) {
			req.logger.error(
				"Error al consultar por productos por precio:" + "Error:" + error.stack
			);
			res.setHeader("Content-Type", "application/json");
			return res.status(500).json({
				error: `Error inesperado en el servidor al ordenar productos por precio - Intente más tarde`,
			});
		}
	};
	static getProductbyTitle = async (req, res) => {
		let data = await productDAO.getProducts();
		let title = req.params.title;
		let product = data.find(
			(t) => t.title.toLowerCase() === title.toLocaleLowerCase()
		);
		if (product) {
			res.json(product);
		} else {
			res.json({ error: `El producto ${title} no existe` });
		}
	};
	static getProductById = async (req, res) => {
		let { pid } = req.params;
		if (!isValidObjectId(pid)) {
			res.setHeader(`Content-Type`, `aplication/json`);
			return res.status(400).json({
				error: `Ingrese un id valido de MongoDB como argumento para su busqueda`,
			});
		}
		try {
			let product = await productDAO.getProductBy({ _id: pid });
			res.setHeader("Content-Type", "application/json");
			return res.status(200).json({ product });
		} catch (error) {
			req.logger.error(
				"Error al consultar por productos por ID:" + "Error:" + error.stack
			);
			res.setHeader("Content-Type", "application/json");
			return res.status(500).json({
				error: `Error inesperado en el servidor - Intente más tarde, o contacte a su administrador`,
				detalle: `${error.message}`,
			});
		}
	};
	static createProduct = async (req, res, next) => {
		try {
			req.logger.info("Datos del cuerpo de la solicitud:", req.body);
			let { title, code, description, price, status, stock, category } =
				req.body;
			let user = req.user._id;

			if (
				!title ||
				!code ||
				!description ||
				!price ||
				!status ||
				!stock ||
				!category
			) {
				throw CustomError.createProductError(
					"Product creation error",
					productErrorInfo({
						title,
						code,
						description,
						price,
						status,
						stock,
						category,
					}),
					"Error al tratar de crear un producto",
					ERROR_TYPES.INVALID_ARGUMENTS
				);
			}

			let exist = await productDAO.getProductBy({ code });
			if (exist.length > 0) {
				return res.status(400).json({
					error: `El producto con código ${code} ya existe en la Base de Datos`,
				});
			}

			let newProduct = await productDAO.addProduct({
				title,
				code,
				description,
				price,
				status,
				stock,
				category,
				owner: user || "admin",
			});
			return res.status(201).json({ payload: newProduct });
		} catch (error) {
			req.logger.error("Error al crear un producto." + "Error:" + error.stack);
			return res.status(error.code || 500).json({
				error: error.message,
				detail: error.cause || "No se pudo determinar la causa del error",
			});
		}
	};
	static editProduct = async (req, res) => {
		let { pid } = req.params;
		if (!isValidObjectId(pid)) {
			res.setHeader(`Content-Type`, `aplication/json`);
			return res.status(400).json({
				error: `Ingrese un id válido de MongoDB como argumento para su busqueda`,
			});
		}
		let productEdited = req.body;
		if (productEdited._id) {
			delete productEdited._id;
		}
		if (productEdited.code) {
			let exist;
			try {
				exist = await productDAO.getProductBy({
					_id: { $ne: pid },
					code: productEdited.code,
				});
				if (exist) {
					res.setHeader("Content-Type", "application/json");
					return res.status(400).json({
						error: `Ya existe otro producto en la BD con código: ${productEdited.code}`,
					});
				}
			} catch (error) {
				res.setHeader("Content-Type", "application/json");
				return res.status(404).json({
					error: `Producto no encontrado`,
					detalle: `${error.message}`,
				});
			}
		}
		try {
			let editProduct = await productDAO.updateProduct(pid, productEdited);
			res.setHeader(`Content-Type`, `aplication/json`);
			return res.status(200).json({ editProduct });
		} catch (error) {
			res.setHeader("Content-Type", "application/json");
			return res.status(400).json({
				error: `Error al editar producto`,
				detalle: `${error.message}`,
			});
		}
	};
	static deleteProduct = async (req, res) => {
		let { pid } = req.params;
		let user = req.user;
		if (!isValidObjectId(pid)) {
			res.setHeader(`Content-Type`, `aplication/json`);
			return res.status(400).json({
				error: `Ingrese un id valido de MongoDB como argumento para su petición`,
			});
		}
		try {
			const product = await productDAO.getProductBy({ _id: pid });
			if (!product) {
				return res
					.status(404)
					.json({ error: `El producto con id ${pid} no existe` });
			}
			if (!product[0].owner) {
				return res.status(500).json({
					error: "El owner del producto no está definido",
				});
			}
			if (product[0].owner.toString() === user._id.toString()) {
				try {
					await sendMail(
						user.email.trim(),
						"SNSports...¡Producto eliminado!",
						`
							<h1>¡¡Hola ${user?.first_name}!!</h1>
							<h2>Te informamos que tu producto ha sido eliminado</h2><br><br>
							<p>El producto eliminado es ${product[0].title} con código: ${product[0].code}</p><br>
							<p>Ante cualquier duda comunicate con nosotros</p><br><br>
							`
					);
				} catch (error) {
					console.error("Error al enviar el correo:", error);
					throw error;
				}
			} else {
				CustomError.createProductError(
					this.name,
					"Delete Error",
					"El usuario no es el propietario del producto.",
					ERROR_TYPES.AUTHORIZATION
				);
			}
			const result = await productDAO.deleteProduct(pid);

			if (result.deletedCount > 0) {
				productDAO.deleteProduct(result._id);

				res.setHeader(`Content-Type`, `aplication/json`);
				return res
					.status(200)
					.json({ payload: `Producto con id ${pid} eliminado` });
			} else {
				res.setHeader(`Content-Type`, `aplication/json`);
				return res
					.status(404)
					.json({ error: `El producto con id ${pid} no existe` });
			}
		} catch (error) {
			res.setHeader(`Content-Type`, `aplication/json`);
			return res.status(500).json({
				error: `Error inesperado en el servidor, intente más tarde`,
				detail: `${error.message}`,
			});
		}
	};
	static mockingProducts = async (req, res) => {
		try {
			let products = [];
			for (let i = 0; i < 100; i++) {
				const product = {
					id: faker.database.mongodbObjectId,
					title: faker.commerce.productName(),
					code: faker.helpers.replaceSymbols("#?*#?*"),
					description: faker.commerce.productDescription(),
					price: faker.commerce.price({
						min: 29999,
						max: 99999,
						dec: 0,
						symbol: "$",
					}),
					status: faker.datatype.boolean(),
					stock: faker.helpers.replaceSymbols("##"),
				};
				products.push(product);
			}
			return res.status(200).json({ products });
		} catch (error) {
			res.setHeader(`Content-Type`, `aplication/json`);
			return res.status(500).json({
				error: `Error inesperado en el servidor, intente más tarde`,
				detail: `${error.message}`,
			});
		}
	};
}
