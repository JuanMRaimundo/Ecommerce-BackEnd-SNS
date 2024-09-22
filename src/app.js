import express from "express";
import { engine } from "express-handlebars";
import { Server } from "socket.io";

import passport from "passport";
import path from "path";
import mongoose from "mongoose";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import { router as productRouter } from "./routes/products.router.js";
import { router as cartRouter } from "./routes/cart.router.js";
import { router as viewsRouter } from "./routes/views.router.js";
import { router as sessionsRouter } from "./routes/sessions.router.js";
import { router as loggerRouter } from "./routes/logger.router.js";
import { router as usersRouter } from "./routes/users.router.js";
import { messageModel } from "./dao/models/messageModel.js";
import { productModel } from "./dao/models/productModel.js";
import __dirname from "./utils.js";
import { initPassport } from "./config/passport.config.js";
import cookieParser from "cookie-parser";
import { config } from "./config/config.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { middLogger } from "./utils/loggerUtil.js";

const PORT = config.PORT;
const app = express();

app.use(express.json());
app.use(middLogger);
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, `public`)));
app.use(cookieParser());
initPassport();
app.use(passport.initialize());

//Swagger Configuration
const options = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "SNSports-API",
			version: "1.0.0",
			description: 'Documentación de e-Commerce "SNSports',
		},
		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
				},
			},
		},
	},
	apis: ["./src/docs/*.yaml"], // Rutas de tus archivos de rutas a documentar
};
const specs = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
//HANDLEBARS CONFIGURATION
app.engine("handlebars", engine());

app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, `views`));
app.use("/api/products", productRouter);
app.use("/api/carts", cartRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/users", usersRouter);
app.use("/", viewsRouter);
app.use("/", loggerRouter);

app.use(errorHandler);
const serverHTTP = app.listen(PORT, () =>
	console.log(`Server online en puerto ${PORT}`)
);

export const io = new Server(serverHTTP);

//MONGO DB ATLAS CONFIGURATION
const connDB = async () => {
	try {
		await mongoose.connect(config.MONGO_URL, { dbName: config.DB_NAME });
		console.log("DB SNSport online!");
	} catch (error) {
		console.log("Error al conectar a la DB", error.message);
	}
};
connDB();

//CHAT CONFIGURATION

let users = []; //array para mostrar en el DOM...

const getPreviousMessages = async () => {
	try {
		const messages = await messageModel.find();
		return messages;
	} catch (error) {
		console.log("Error al obtener mensajes previos:", error.message);
		return [];
	}
};

io.on("connection", async (socket) => {
	console.log(`conectado el ${socket.id}`);
	let products;
	try {
		products = await productModel.find();
		socket.emit("products", products);
		const prevMessages = await getPreviousMessages();
		socket.emit("prevMessages", prevMessages);
	} catch (error) {
		console.log(
			"Error al enviar mensajes previos o productos al cliente:",
			error.message
		);
	}

	socket.on("id", (user) => {
		try {
			users.push({ id: socket.id, user });
			socket.broadcast.emit("newUser", user);
		} catch (error) {
			console.log(`Error ${error.message} al conectar con la BD`);
		}
	});
	socket.on("message", async (user, message) => {
		try {
			const newMessage = new messageModel({ user: user, message });
			await newMessage.save();
			io.emit("newMessage", user, message);
		} catch (error) {
			console.log(`Error ${error.message} al conectar con la BD`);
		}
	});
	socket.on("addProductForm", async (producto) => {
		const newProduct = await productModel.create({ ...producto });
		if (newProduct) {
			socket.emit("newProduct", newProduct);
		}
	});

	socket.on("deleteProduct", async (productId) => {
		console.log(productId);
		try {
			await productModel.findByIdAndDelete(productId);
			socket.emit("deletedProduct", productId);
		} catch (error) {
			console.log(`Error al eliminar el producto: ${error.message}`);
		}
	});
	socket.on("disconnect", () => {
		let user = users.find((u) => u.id === socket.id);
		if (user) {
			io.emit("userOff", user.email);
		}
	});
});
