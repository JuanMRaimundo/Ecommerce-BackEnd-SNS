import { config } from "../config/config.js";
import jwt from "jsonwebtoken";
import { usersService } from "../repository/users.service.js";

export const authRole = (roles) => {
	return (req, res, next) => {
		const userRole =
			req.user && req.user.rol ? req.user.rol.toLowerCase() : null;

		if (!userRole) {
			return res
				.status(403)
				.json({ error: "Acceso denegado. No se encontró el rol del usuario." });
		}

		if (roles.includes(userRole)) {
			return next();
		} else {
			return res
				.status(403)
				.json({ error: "Acceso denegado. Rol no autorizado." });
		}
	};
};

export const verifyRecoveryToken = async (req, res, next) => {
	try {
		const token = req.cookies.recoveryToken;

		if (!token) {
			return res
				.status(400)
				.json({ error: "Token de recuperación no encontrado" });
		}

		const decoded = jwt.verify(token, config.SECRET);
		const user = await usersService.getUserBy({ _id: decoded.id });

		if (!user) {
			return res.status(404).json({ error: "Usuario no encontrado en BD" });
		}

		req.user = user;
		next();
	} catch (error) {
		if (error.name === "TokenExpiredError") {
			return res.redirect("/login");
		}

		console.error("Error al verificar el token de recuperación:", error);
		res.setHeader("Content-Type", "application/json");
		return res.status(500).json({
			status: "error",
			error:
				"Error inesperado en el servidor al verificar el token - Intente más tarde, o contacte a su administrador",
			detalle: `${error.message}`,
		});
	}
};
