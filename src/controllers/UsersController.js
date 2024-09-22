import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import bcrypt from "bcrypt";
import { UsersDTO } from "../dto/UsersDTO.js";
import { sendMail } from "../utils.js";
import { usersService } from "../repository/users.service.js";
import { isValidObjectId } from "mongoose";
import fs from "fs";
import path from "path";

export class UsersController {
	static registration = async (req, res) => {
		let userMail;
		try {
			userMail = req.body;
			res.setHeader("Content-Type", "application/json");

			let registroOk = await sendMail(
				userMail.email,
				"¡Registro exitoso!",
				`<h2>Bienvenido/a a SNSports!</h2><br><br>
						<p>Usuario registrado con email:${userMail.email}</p>
					`
			);
			if (registroOk.accepted.length > 0) {
				req.logger.info("Email enviado-Usuario registrado");
			}
			if (req.body.web) {
				return res.redirect("/login");
			} else {
				return res
					.status(200)
					.json({ payload: "Registro exitoso", newUser: req.user });
			}
		} catch (error) {
			req.logger.error("Error durante el registro" + "error:" + error.stack);
			return res.status(400).json({
				error: "Error al registrarse",
				message: error.message || "Hubo un error inesperado.",
			});
		}
	};
	static login = async (req, res) => {
		let { user } = req;
		try {
			let token = jwt.sign(user, config.SECRET, { expiresIn: "1h" });
			user.last_connection = new Date();
			await usersService.updateUser(user._id, {
				last_connection: user.last_connection,
			});
			req.logger.info("Datos recibidos:", user);
			res.cookie("SNScookie", token, { httpOnly: true });

			if (req.body.web) {
				return res.redirect("/home");
			} else {
				return res.status(200).json({ payload: user });
			}
		} catch (error) {
			req.logger.error("Error al iniciar sesion");
			return res
				.status(400)
				.json({ error: "Error al iniciar sesión: " + error.message });
		}
	};
	static callBackGitHub = async (req, res) => {
		try {
			let { user } = req;
			let tokenPayload = {
				id: user._id,
				role: user.rol,
				cart: user.cart,
			};
			let token = jwt.sign(tokenPayload, config.SECRET, {
				expiresIn: "1h",
			});
			res.cookie("SNScookie", token, { httpOnly: true });
			res.redirect("/home");
		} catch (error) {
			req.logger.error("Error al generar el token:", error);
			res.status(500).json({ error: "Error interno del servidor" });
		}
	};
	static current = async (req, res) => {
		try {
			if (!req.user) {
				return res.status(401).json({ message: "User no autenticado" });
			}
			let { user } = req;
			const token = req.cookies["SNScookie"];
			if (!token) {
				return res.status(400).json({ message: "Token not found" });
			}
			res.cookie("SNScookie", token, { httpOnly: true });
			let userDTO = new UsersDTO(user);
			res.setHeader("Content-Type", "application/json");
			return res.status(200).json({ message: "Current user: ", user: userDTO });
		} catch (error) {
			return res.status(400).json({
				message: "Error al mostrar el current user: ",
				error: error.message,
			});
		}
	};
	static errorRoute = (req, res) => {
		res.setHeader("Content-Type", "application/json");
		const errorMessage = "Error en la operación de autenticación";
		req.logger.error(errorMessage);
		return res.status(400).json({ error: errorMessage });
	};
	static logout = async (req, res) => {
		let { user } = req;
		try {
			if (!user) {
				return res.status(401).json({ error: "No estás autenticado" });
			}
			console.log("user de loguot: ", user);

			user.last_connection = new Date();
			await usersService.updateUser(user._id, {
				last_connection: user.last_connection,
			});
			res.clearCookie("SNScookie");
			res.setHeader("Content-Type", "application/json");
			if (req.body.web) {
				return res.redirect("/login");
			} else {
				return res
					.status(200)
					.json({ message: "Usted ha cerrado la sesión", payload: user });
			}
		} catch (error) {
			req.logger.error("Error al cerrar sesión");
			return res
				.status(400)
				.json({ error: "Error al cerrar sesión: " + error.message });
		}
	};
	static updatePass = async (req, res) => {
		const { newPass } = req.body;
		const token = req.cookies.recoveryToken;

		if (!token) {
			return res
				.status(400)
				.json({ error: "Token de recuperación no encontrado" });
		}

		try {
			const decoded = jwt.verify(token, config.SECRET);
			const userId = decoded.id;
			const user = await usersService.getUserBy({ _id: userId });
			if (!user) {
				return res.status(404).json({ error: "Usuario no encontrado en BD" });
			}
			const isSamePassword = await bcrypt.compare(newPass, user.password);
			if (isSamePassword) {
				return res.status(400).json({
					error:
						"La nueva contraseña no puede ser igual a la contraseña actual",
				});
			}
			const hashedPassword = await bcrypt.hash(newPass, 10);
			await usersService.updateUser(userId, { password: hashedPassword });

			res.clearCookie("recoveryToken");
			res.status(200).json({ message: "Contraseña actualizada exitosamente" });
		} catch (error) {
			console.error("Error al restablecer la contraseña:", error);
			res.status(500).json({ error: "Error al restablecer la contraseña" });
		}
	};
	static switchRole = async (req, res) => {
		try {
			let uid = req.params.uid;
			let user = await usersService.getUserBy({ _id: uid });
			if (!user.rol) {
				res.setHeader("Content-Type", "application/json");
				return res
					.status(400)
					.json({ error: "El usuario no posee la propiedad rol" });
			}
			if (user.rol === "user" && user.documents.length > 0) {
				await usersService.updateUser({ _id: uid }, { rol: "premium" });
				res.setHeader("Content-Type", "application/json");
				return res
					.status(200)
					.json({ payload: `El usuario ${user.email} ahora es premium` });
			}
			if (user.rol === "premium") {
				await usersService.updateUser({ _id: uid }, { rol: "user" });
				res.setHeader("Content-Type", "application/json");
				return res
					.status(200)
					.json({ payload: `El usuario ${user.email} ahora es user` });
			}
		} catch (error) {
			res.setHeader("Content-Type", "application/json");
			return res.status(500).json({
				error: `Unexpected server error - contact your administrator,
				  detalle:${error}`,
			});
		}
	};
	static uploadDocuments = async (req, res) => {
		try {
			const uid = req.params.uid;
			const files = req.files;
			const type = req.body.type;

			console.log("UID:", uid);
			console.log("Body completo:", req.body);
			console.log("Files:", files);

			if (!isValidObjectId(uid)) {
				return res
					.status(400)
					.json({ error: "Ingrese un id válido de MongoDB" });
			}

			if (!files || files.length === 0) {
				return res.status(400).json({ error: "No se han cargado archivos." });
			}

			if (!type) {
				return res.status(400).json({ error: "El campo 'type' es requerido." });
			}

			let destinationFolder = "";
			switch (type) {
				case "profile":
					destinationFolder = "./src/uploads/profiles";
					break;
				case "product":
					destinationFolder = "./src/uploads/products";
					break;
				case "document":
					destinationFolder = "./src/uploads/documents";
					break;
				default:
					return res.status(400).json({ error: "Tipo de archivo no válido." });
			}

			const documentPaths = [];
			const filesArray = Array.isArray(files) ? files : [files];

			for (const file of filesArray) {
				const oldPath = file.path;
				const newPath = path.join(destinationFolder, file.filename);
				console.log("fileName:  ", file.filename);

				await fs.promises.rename(oldPath, newPath);

				documentPaths.push({
					name: file.originalname,
					reference: newPath,
				});
			}
			//Actualiza en BD
			await usersService.updateUser(uid, {
				$push: { documents: { $each: documentPaths } },
			});

			res.status(200).json({ message: "Archivos cargados con éxito", files });
		} catch (error) {
			console.error("Error al cargar documentos:", error);
			res
				.status(500)
				.json({ error: "Error al cargar documentos: " + error.message });
		}
	};
	static getUsers = async (req, res) => {
		try {
			let users = await usersService.getUsers();
			let usersDTO = users.map((user) => new UsersDTO(user));
			res.setHeader("Content-Type", "application/json");
			res.status(200).json({ payload: usersDTO });
		} catch (error) {
			return res
				.status(400)
				.json({ error: "Error al obtener usuarios", message: error.message });
		}
	};
	static deleteInactiveUsers = async (req, res) => {
		try {
			const inactivityDays = 20;
			const deletedCount = await usersService.deleteUsers(inactivityDays);
			res.status(200).json({
				message: `Se eliminaron ${deletedCount.deletedCount} usuarios inactivos.`,
			});
		} catch (error) {
			console.error("Error al eliminar usuarios inactivos:", error);
			res.status(500).json({
				error: "Error al eliminar usuarios inactivos: " + error.message,
			});
		}
	};
}
