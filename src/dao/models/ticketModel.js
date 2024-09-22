import mongoose from "mongoose";

const generateUniqueCode = () => {
	return Math.random().toString(36).substring(2, 9).toUpperCase();
};
const ticketsCollection = "tickets";
const ticketSchema = new mongoose.Schema(
	{
		code: {
			type: String,
			required: true,
			unique: true,
			default: generateUniqueCode,
		},
		purchase_datetime: {
			type: Date,
			default: Date.now,
		},
		amount: {
			type: Number,
			required: true,
		},
		purchaser: {
			type: String,
			required: true,
		},
		items: [
			{
				product: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Product",
					required: true,
				},
				quantity: { type: Number, required: true },
				description: { type: String },
				price: { type: Number },
				stockPrevCompra: { type: Number },
				stockPostCompra: { type: Number },
				subtotal: { type: Number },
			},
		],
	},
	{ timestamps: true }
);
ticketSchema.pre("save", function (next) {
	if (!this.code) {
		this.code = generateUniqueCode();
	}
	next();
});

export const ticektModel = mongoose.model(ticketsCollection, ticketSchema);
