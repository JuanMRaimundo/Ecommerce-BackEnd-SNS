import winston from "winston";
import { config } from "../config/config.js";

let customLevels = {
	fatal: 0,
	error: 1,
	warning: 2,
	info: 3,
	http: 4,
	debug: 5,
};
const colors = {
	fatal: "red bold",
	error: "red",
	warning: "yellow",
	info: "green",
	http: "magenta",
	debug: "blue",
};

winston.addColors(colors);
const transportErrorFile = new winston.transports.File({
	level: "error",
	filename: "./src/errors.log",
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.json()
	),
});
const transportProdConsole = new winston.transports.Console({
	level: "debug",
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.colorize(),
		winston.format.simple()
	),
});
const transportDebugConsole = new winston.transports.Console({
	level: "info",
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.colorize(),
		winston.format.simple()
	),
});

export const logger = winston.createLogger({
	levels: customLevels,
	transports: [
		//ACA DEBERIA ESTAR SOLO EL EEROR, PARA GRABAR EN ARCHIVO
		transportErrorFile,
		transportProdConsole,
	],
});

if (config.MODE === "dev") {
	//sería de esta gforma?
	logger.add(transportDebugConsole);
}

export const middLogger = (req, res, next) => {
	req.logger = logger;

	next();
};
//ACA EL ADD PARA AGREGAR EN DEBUG == TRUE
