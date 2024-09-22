import { ERROR_TYPES } from "../utils/Enum-error.js";

export const errorHandler = (error, req, res, next) => {
	switch (error.code) {
		case ERROR_TYPES.AUTHENTICATION || ERROR_TYPES.AUTHORIZATION:
			res.setHeader("Content-Type", "application/json");
			return res
				.status(401)
				.json({ error: `Credenciales incorrectas: ${error.message}` });

		case ERROR_TYPES.INVALID_ARGUMENTS:
			res.setHeader("Content-Type", "application/json");
			return res
				.status(400)
				.json({ error: `Argumentos inválidos: ${error.message}` });

		default:
			res.setHeader("Content-Type", "application/json");
			return res
				.status(500)
				.json({ error: `Error - contacte al administrador` });
	}
};
