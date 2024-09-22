const login = document.getElementById("btnSubmit");
const recovery = document.getElementById("recoverPasswordLink");

login.addEventListener("submit", async (e) => {
	e.preventDefault();

	let body = {
		email: document.querySelector("input[name='email']").value.trim(),
		password: document.querySelector("input[name='password']").value.trim(),
		web: "web",
	};

	try {
		const response = await fetch("/api/sessions/login", {
			method: "post",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});
		if (!response.ok) {
			throw new Error("Network response was not ok");
		}

		const data = await response.json();

		if (data.payload) {
			console.log(data.payload);
			window.location.href = "/home";
		} else {
			console.log("Error:", data.error);
		}
	} catch (error) {
		console.error("Error al enviar solicitud de login:", error);
	}
});

recovery.addEventListener("click", function (event) {
	event.preventDefault();
	Swal.fire({
		title: "Recuperación de Contraseña",
		input: "email",
		inputLabel: "Ingrese su correo electrónico",
		inputPlaceholder: "correo@ejemplo.com",
		showCancelButton: true,
		confirmButtonText: "Enviar",
		cancelButtonText: "Cancelar",
		inputValidator: (value) => {
			if (!value) {
				return "¡Necesita ingresar un correo electrónico!";
			}
		},
	}).then((result) => {
		if (result.isConfirmed) {
			const email = result.value;
			fetch("/passwordRecoveryResponse", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email }),
			})
				.then((response) => response.json())
				.then((data) => {
					if (data.error) {
						Swal.fire("Error", data.error, "error");
					} else {
						Swal.fire("Éxito", data.message, "success");
					}
				})
				.catch((error) => {
					Swal.fire("Error", "Ocurrió un error al enviar el correo", "error");
				});
		}
	});
});
