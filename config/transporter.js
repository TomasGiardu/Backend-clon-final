const nodemailer = require('nodemailer');

// Configuración del transporte de correos electrónicos
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'tomasgiardullo14@gmail.com',
        pass: 'beagle123'
    }
});

// Función para enviar correo electrónico de restablecimiento de contraseña
async function sendResetPasswordEmail(email) {
    try {
        // Enviar correo electrónico con el enlace de restablecimiento de contraseña
        await transporter.sendMail({
            from: 'tomasgiardullo14@gmail.com',
            to: email, // Utiliza el correo electrónico ingresado en el input
            subject: 'Restablecimiento de Contraseña',
            html: `<p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para cambiar tu contraseña:</p>
                   <p><a href="http://tu_sitio_web.com/reset-password">Restablecer Contraseña</a></p>
                   <p>Este enlace expirará en 1 hora.</p>`
        });
        console.log('Correo electrónico enviado con éxito:', email);
    } catch (error) {
        console.error('Error al enviar el correo electrónico:', error);
        throw error;
    }
}

module.exports = sendResetPasswordEmail;
