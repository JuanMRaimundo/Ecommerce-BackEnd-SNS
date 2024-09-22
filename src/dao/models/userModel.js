import mongoose from "mongoose";

const usersCollection = "users";
const userSchema = new mongoose.Schema(
	{
		first_name: { type: String, required: true },
		last_name: { type: String },
		email: { type: String, required: true, unique: true },
		age: { type: Number },
		password: { type: String },
		rol: {
			type: String,
			enum: ["admin", "premium", "user"],
			default: "user",
			required: true,
		},
		cart: {
			type: mongoose.Types.ObjectId,
			ref: "carts",
		},
		documents: [
			{
				name: { type: String },
				reference: { type: String },
			},
		],
		last_connection: { type: Date },
	},
	{
		timestamps: true,
		strict: false,
	}
);

export const userModel = mongoose.model(usersCollection, userSchema);
