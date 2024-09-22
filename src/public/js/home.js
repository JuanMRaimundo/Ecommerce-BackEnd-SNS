const addToCart = async (pid, cid) => {
	const url = `/api/carts/${cid}/products/${pid}`;
	const data = {
		productId: pid,
	};
	const options = {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	};
	let response;
	try {
		response = await fetch(url, options);

		if (response.ok) {
			Swal.fire({
				title: "¡Éxito!",
				text: "Producto agregado al carrito!",
				icon: "success",
				confirmButtonText: "Cerrar",
			});
			console.log(cid + " y el " + pid);
		} else {
			throw new Error("Error al agregar el producto al carrito");
		}
	} catch (error) {
		console.error("Error al realizar la solicitud:", error.message);
		Swal.fire({
			title: "Error",
			text: "No se pudo agregar el producto al carrito.",
			icon: "error",
			confirmButtonText: "Cerrar",
		});
	}
};
