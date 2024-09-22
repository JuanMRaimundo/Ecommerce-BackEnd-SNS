import { fileURLToPath } from "url";
import { dirname } from "path";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default __dirname;

export const generateHash = (password) =>
	bcrypt.hashSync(password, bcrypt.genSaltSync(10));

export const validationPassword = (password, encryptPassword) =>
	bcrypt.compareSync(password, encryptPassword);

const transporter = nodemailer.createTransport({
	service: "gmail",
	port: "587",
	auth: {
		user: "juanmr.093@gmail.com",
		pass: "xfrgwzxchqmvpbzp",
	},
});
export const sendMail = async (to, subject, message, attachments) => {
	return await transporter.sendMail({
		from: "SNSports juanmr.093@gmail.com",
		to: to,
		subject: subject,
		html: message,
		attachments: attachments,
	});
};

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		const tempFolder = "./src/uploads/temporals";
		cb(null, tempFolder);
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + "-" + file.originalname);
	},
});

export const upload = multer({ storage: storage });
