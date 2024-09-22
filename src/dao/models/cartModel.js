import mongoose from "mongoose";

const cartsCollection = "carts";
const cartSchema = new mongoose.Schema(
	{
		products: {
			type: [
				{
					product: {
						type: mongoose.Types.ObjectId,
						ref: "products",
						required: true,
					},
					quantity: {
						type: Number,
						default: 1,
					},
				},
			],
		},
	},
	{
		timeseries: true,
	}
);

export const cartsModel = mongoose.model(cartsCollection, cartSchema);
