const socket = io();
let tableProducts = document.getElementById("products");
const form = document.getElementById("prodForm");
const btnAddProduct = document.getElementById("btn-addProduct");

socket.on("products", (products) => {
	(tableProducts.innerHTML = ""),
		products.forEach((product) => {
			const row = `
		<tr data-id="${product._id}">
		<td>${product.code}</td>
		<td>${product.title}</td>
		<td>${product.price}</td>
		<td>${product.stock}</td>
		<td>${product.status ? `Activo` : `Pendiente`}</td>
		<td>${
			product.thumbnail.length > 0
				? product.thumbnail[0]
				: "No existe la imagen"
		}</td>
		<td>
			<button class="btn btn-danger btn-delete" data-id="${
				product._id
			}">Eliminar</button>
		</td>
	</tr>
		`;
			tableProducts.innerHTML += row;
		});
});

socket.on("newProduct", (newProduct) => {
	const tableProducts = document.getElementById("products");
	const newRow = `
		<tr data-id="${newProduct._id}">
			<td>${newProduct.code}</td>
			<td>${newProduct.title}</td>
			<td>${newProduct.price}</td>
			<td>${newProduct.stock}</td>
			<td>${newProduct.status ? `Activo` : `Pendiente`}</td>
		<td>${
			newProduct.thumbnail.length > 0
				? newProduct.thumbnail[0]
				: "No existe la imagen"
		}</td>
			<td>
                <button class="btn btn-danger btn-delete" data-id="${
									newProduct._id
								}">Eliminar</button>
            </td>
		</tr>`;
	tableProducts.innerHTML += newRow;
});

form.addEventListener("submit", (event) => {
	event.preventDefault();
	const title = document.getElementById("title").value;
	const description = document.getElementById("description").value;
	const price = document.getElementById("price").value;
	const code = document.getElementById("code").value;
	const stock = document.getElementById("stock").value;
	const category = document.getElementById("category").value;
	const producto = {
		title: title,
		description: description,
		price: price,
		code: code,
		stock: stock,
		category: category,
	};

	socket.emit("addProductForm", producto);

	document.getElementById("title").value = "";
	document.getElementById("description").value = "";
	document.getElementById("price").value = "";
	document.getElementById("code").value = "";
	document.getElementById("stock").value = "";
	document.getElementById("category").value = "";
});

tableProducts.addEventListener("click", (event) => {
	if (event.target.classList.contains("btn-delete")) {
		const productId = event.target.dataset.id;

		Swal.fire({
			icon: "error",
			title: "Atención",
			text: "¿Deseas eliminar el producto?",
			showCancelButton: true,
			confirmButtonText: "Sí",
			cancelButtonText: "Cancelar",
		}).then((result) => {
			if (result.isConfirmed) {
				socket.emit("deleteProduct", productId);
			}
		});
	}
});

socket.on("deletedProduct", (productId) => {
	const deletedRow = document.querySelector(`tr[data-id="${productId}"]`);
	if (deletedRow) {
		deletedRow.remove();
	}
});
