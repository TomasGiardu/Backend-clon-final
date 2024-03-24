const sendResetPasswordEmail = require('./transporter');

// Agregar un manejador de eventos para el envío del formulario
document.getElementById('forgotPasswordForm').addEventListener('submit', async function(event) {
    event.preventDefault(); 

    // Obtener el valor del correo electrónico desde el input
    const email = document.getElementById('emailInput').value;

    try {
        // Enviar correo electrónico de restablecimiento de contraseña utilizando la función de transporte
        await sendResetPasswordEmail(email);

        alert('Se ha enviado un correo electrónico con instrucciones para restablecer tu contraseña');
    } catch (error) {
        console.error('Error al solicitar el restablecimiento de contraseña:', error);
        alert('Se produjo un error al solicitar el restablecimiento de contraseña');
    }
});
