import { UsersMongoDAO } from "../dao/UsersMongoDAO.js";

class UserService {
	constructor(dao) {
		this.usersDAO = dao;
	}

	async getUsers() {
		return await this.usersDAO.getUsers();
	}
	async getUserBy(filter) {
		return await this.usersDAO.getUserBy(filter);
	}
	async getUserByPopulate() {
		return await this.usersDAO.getUserByPopulate();
	}
	async createUser() {
		let newUser = await this.createUser();
		return newUser.toJSON();
	}
	async updateUser(uid, updateData) {
		let data = await this.usersDAO.updateUser(uid, updateData);
		return data;
	}
	async deleteUsers(inactivityDays) {
		const date = new Date();
		date.setDate(date.getDate() - inactivityDays);
		const filter = { last_connection: { $lt: date } };
		return await this.usersDAO.deleteUsers(filter);
	}
}

export const usersService = new UserService(new UsersMongoDAO());
