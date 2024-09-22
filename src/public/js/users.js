const resetForm = document.getElementById("resetForm");

resetForm.addEventListener("submit", async (event) => {
	event.preventDefault();
	const newPass = document.getElementById("resetInput").value;
	try {
		let response = await fetch(`/api/users/updatePass`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ newPass }),
		})
			.then((response) => response.json())
			.then((data) => {
				if (data.error) {
					Swal.fire("Error", data.error, "error");
				} else {
					Swal.fire({
						title: "Contraseña reestablecida",
						text: "Ahora serás reedirigido a la página de inicio",
						icon: "success",
						cancelButtonColor: "#d33",
						confirmButtonText: "Genial!",
					}).then((result) => {
						window.location.href = "/login";
					});
				}
			});
	} catch (error) {
		console.error("Error al reestablecer contraseña:", error);
	}
});
