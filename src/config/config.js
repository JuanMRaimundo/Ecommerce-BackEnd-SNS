import dotenv from "dotenv";
import { Command, Option } from "commander";

let program = new Command();

program.addOption(
	new Option("-m, --mode <modo>", "Mode de ejecución del script")
		.choices(["dev", "prod"])
		.default("dev")
);
program.parse();
const options = program.opts();
const mode = options.mode;

dotenv.config({
	path: mode === "prod" ? "./src/.env.production" : "./src/.env.development",
	override: true,
});

export const config = {
	PORT: process.env.PORT || 3000,
	MONGO_URL: process.env.MONGO_URL,
	DB_NAME: process.env.DB_NAME,
	SECRET: process.env.SECRET,
	CLIENT_ID_GITHUB: process.env.CLIENT_ID_GITHUB,
	CLIENT_SECRET_GITHUB: process.env.CLIENT_SECRET_GITHUB,
	MODE: mode,
};
