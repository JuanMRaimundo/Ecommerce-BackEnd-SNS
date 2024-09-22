import { ERROR_TYPES } from "./Enum-error.js";

export class CustomError {
	static generateError(
		name = "Error",
		cause,
		message,
		code = ERROR_TYPES.INTERNAL_SERVER_ERROR
	) {
		console.log(
			`Generating error with name: ${name}, cause: ${cause}, message: ${message}, code: ${code}`
		);
		let error = new Error(message);
		error.name = name;
		error.code = code;
		if (cause) {
			error.cause = cause;
		}
		console.log(error);

		return error;
	}
	static createUserError(
		name = "User-Error",
		cause,
		message,
		code = ERROR_TYPES.INVALID_ARGUMENTS
	) {
		const error = new Error(message, { cause: cause });
		error.name = name;
		error.code = code;

		return error;
	}
	static createProductError(
		name = "Product-Error",
		cause,
		message,
		code = ERROR_TYPES.DATA_TYPE
	) {
		const error = new Error(message);
		error.name = name;
		error.code = code;
		if (cause) {
			error.cause = cause;
		}

		return error;
	}
	static createCartError(
		name = "Cart-Error",
		cause,
		message,
		code = ERROR_TYPES.DATA_TYPE
	) {
		const error = new Error(message, { cause: cause });
		error.name = name;
		error.code = code;

		return error;
	}
}
