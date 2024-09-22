document.addEventListener("DOMContentLoaded", () => {
	Swal.fire({
		title: "Debe identificarse",
		input: "text",
		text: "Ingrese su nombre",
		inputValidator: (value) => {
			return !value && "¡Debe ingresar un nombre!";
		},
		allowOutsideClick: false,
	}).then((datos) => {
		console.log(datos);
		let user = datos.value;
		let inputMessage = document.getElementById("message");
		let divMessages = document.getElementById("messages");
		inputMessage.focus();

		const socket = io();

		socket.emit("id", user);

		socket.on("newUser", (user) => {
			Swal.fire({
				text: `${user} se ha conectado!`,
				toast: true,
				position: "top-right",
			});
		});

		socket.on("prevMessages", (messages) => {
			messages.forEach((e) => {
				divMessages.innerHTML += `<span class="message" ><strong>${e.user} </strong> dice: <i>${e.user}</i></span><br>`;
				divMessages.scrollTop = divMessages.scrollHeight;
			});
		});
		socket.on("userOff", (user) => {
			divMessages.innerHTML += `<span class="messageOff" ><strong>${user} </strong> ha abandonado el chat...</span><br>`;
			divMessages.scrollTop = divMessages.scrollHeight;
		});

		inputMessage.addEventListener("keyup", (e) => {
			e.preventDefault();

			if (e.code === "Enter" && e.target.value.trim().length > 0) {
				socket.emit("message", user, e.target.value.trim());
				e.target.value = "";
				e.target.focus();
			}
		});
		socket.on("newMessage", (user, message) => {
			divMessages.innerHTML += `<span class="message"><strong>${user} </strong> dice: <i>${message}</i></span><br>`;
			divMessages.scrollTop = divMessages.scrollHeight;
		});
	});
});
