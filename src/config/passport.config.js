import passport from "passport";
import passportJWT from "passport-jwt";
import localPassport from "passport-local";
import githubPassport from "passport-github2";
import { UsersManagerMongo as UsersManager } from "../dao/UsersManagerMongo.js";
import { CartManagerMongo as CartManager } from "../dao/CartManagerMongo.js";
import { generateHash, validationPassword } from "../utils.js";
import { config } from "./config.js";

const userManager = new UsersManager();
const cartManager = new CartManager();

const searchToken = (req) => {
	let token = null;
	if (req.cookies["SNScookie"]) {
		token = req.cookies["SNScookie"];
	}

	return token;
};

export const initPassport = () => {
	passport.use(
		"current",
		new passportJWT.Strategy(
			{
				secretOrKey: config.SECRET,
				jwtFromRequest: new passportJWT.ExtractJwt.fromExtractors([
					searchToken,
				]),
			},
			async (userToken, done) => {
				try {
					return done(null, userToken);
				} catch (error) {
					return done(error);
				}
			}
		)
	);
	passport.use(
		"github",
		new githubPassport.Strategy(
			{
				clientID: config.CLIENT_ID_GITHUB,
				clientSecret: config.CLIENT_SECRET_GITHUB,
				callbackURL: "http://localhost:8080/api/sessions/callbackGithub",
			},
			async (ta, tr, profile, done) => {
				try {
					console.log(profile);
					let email = profile._json.email || profile._json.login; //pongo el login, ya que no pude conectar mi email a GitHub
					let first_name = profile._json.name;
					if (!email) {
						return done(null, false);
					}
					let user = await userManager.getUserByPopulate({ email });
					if (!user) {
						let newCart = await cartManager.createCart();
						user = await userManager.createUser({
							first_name,
							email,
							profile,
							cart: newCart._id,
							rol: "user",
						});
						user = await userManager.getUserByPopulate({ email });
					}
					if (!user.cart) {
						let newCart = await cartManager.createCart();
						user.cart = newCart._id;
						await userManager.updateUser(user._id, { cart: newCart._id });
					}
					return done(null, user);
				} catch (error) {
					return done(error);
				}
			}
		)
	);
	passport.use(
		"register",
		new localPassport.Strategy(
			{
				passReqToCallback: true,
				usernameField: "email",
			},
			async (req, username, password, done) => {
				try {
					let { first_name, last_name, email, age, rol } = req.body;
					if (!first_name || !last_name || !email || !age) {
						return done(null, false, { message: "Faltan campos requeridos" });
					}
					let exist = await userManager.getUserBy({ email: username });
					if (exist) {
						return done(null, false, {
							message: "El usuario ya existe en la BD.",
						});
					}

					let newCart = await cartManager.createCart();
					password = generateHash(password);

					let user = await userManager.createUser({
						first_name,
						last_name,
						email: username,
						age,
						password,
						rol,
						cart: newCart._id,
					});

					return done(null, user);
				} catch (error) {
					return done(error);
				}
			}
		)
	);

	passport.use(
		"login",
		new localPassport.Strategy(
			{
				usernameField: "email",
			},
			async (username, password, done) => {
				try {
					let user = await userManager.getUserByPopulate({ email: username });
					if (!user) {
						return done(null, false);
					}
					if (!validationPassword(password, user.password)) {
						return done(null, false);
					}

					user = { ...user };
					delete user.password;
					return done(null, user);
				} catch (error) {
					return done(error);
				}
			}
		)
	);
};
