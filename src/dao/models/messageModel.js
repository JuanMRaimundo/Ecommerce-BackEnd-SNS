import mongoose from "mongoose";

const messagesCollection = "messages";
const messagesSchema = new mongoose.Schema(
	{
		user: { type: String, require: true, unique: true },
		message: { type: String, require: true },
	},
	{
		timestamps: true,
	}
);

export const messageModel = mongoose.model(messagesCollection, messagesSchema);
