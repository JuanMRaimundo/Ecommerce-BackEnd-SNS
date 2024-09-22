export const userErrorInfo = (user) => {
	return `Una o más propiedades del usuario están incompletas o no son válidas
    Lista de propiedades requeridas:
    *first_name : debe ser un string, se recibió ${user.first_name}
    *last_name : debe ser un string, se recibió ${user.last_name}
    * email: debe ser un string, se recibió ${user.email}
    * age: debe ser un number, se rebició ${user.age}
    * rol: debe ser un string, "admin" o "user", se recibió ${user.rol}
    `;
};

export const productErrorInfo = (product) => {
	return `Una o más propiedades del usuario están incompletas o no son válidas
    Lista de propiedades requeridas:
    *title : debe ser un string, se recibió ${product.title}
    *code : debe ser un number único, se recibió ${product.code}
    *description: debe ser un string, se recibió ${product.description}
    *price: debe ser un number, se rebició ${product.price}
    *status: debe ser un boolean, se recibió ${product.status}
    *stock: debe ser un number, se rebició ${product.stock}
    *category: debe ser un string, se recibió ${product.category}
    `;
};
