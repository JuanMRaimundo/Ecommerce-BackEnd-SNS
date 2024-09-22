import { userModel } from "./models/userModel.js";

export class UsersMongoDAO {
	async getUsers() {
		return await userModel.find();
	}
	async getUserBy(filter = {}) {
		return await userModel.findOne(filter).lean();
	}
	async getUserByPopulate(filter = {}) {
		return await userModel.findOne(filter).populate("cart").lean();
	}
	async createUser(user) {
		let newUser = await userModel.create(user);
		return newUser.toJSON();
	}
	async updateUser(uid, upDateData) {
		return await userModel.findByIdAndUpdate(uid, upDateData, {
			runValidators: true,
			returnDocument: "after",
		});
	}
	async deleteUsers(filter) {
		return await userModel.deleteMany(filter);
	}
}
