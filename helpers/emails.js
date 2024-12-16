import nodemailer from 'nodemailer';

const emailRegistro = async (datos) => {
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const { email, nombre, token } = datos;

  // Enviar el email
  await transport.sendMail({
    from: 'BienesRaices.com',
    to: email,
    subject: 'Confirma tu cuenta en BienesRaices.com',
    text: 'Confirma tu cuenta en BienesRaices.com',
    html: `
      <header style="font-family: Arial, sans-serif; text-align: center; line-height: 1.2;">
        <h2 style="color: #9381FF;">Bienes Raices</h2>
        <h3 style="color: #B8B8FF;">Confirmación de correo</h3>
      </header>
      <div style="font-family: Arial, sans-serif; text-align: justify; line-height: 1.6; color: #6C6C6C; background-color: #F8F7FF; padding: 25px; border: 2px solid #FFEEDD; border-radius: 5px;">
        <h2 style="color: #9381FF;">¡Hola, <span style="color: #B8B8FF;">${nombre}</span>!</h2>
        <div style="padding: 20px; border: dashed #FFD8BE; border-radius: 10px;">
          <p style="font-size: 16px;">
            ¡Gracias por registrarte en <strong style="color: #9381FF;">BienesRaices.com</strong>! Para completar el proceso de confirmación de tu cuenta, necesitamos que confirmes tu correo electrónico.
          </p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.BACKEND_URL}:${process.env.PORT ?? 3001}/auth/confirmar/${token}"
               style="background-color: #9381FF; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-size: 16px;">
               Confirmar Cuenta
            </a>
          </div>
          <p style="font-size: 16px; color: #6C6C6C;">
            Si no reconoces esta solicitud, puedes ignorar este mensaje.
          </p>
        </div>
      </div>
      <footer style="text-align: center; color: #9381FF;">
        @Todos los derechos reservados de BienesRaices.com
      </footer>
    `
  });
};

const emailOlvidePassword = async (datos) => {
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const { email, nombre, token } = datos;

  // Enviar el email
  await transport.sendMail({
    from: 'BienesRaices.com',
    to: email,
    subject: 'Restablece tu password en BienesRaices.com',
    text: 'Restablece tu password en BienesRaices.com',
    html: `
      <header style="font-family: Arial, sans-serif; text-align: center; line-height: 1.2;">
        <h2 style="color: #9381FF;">Bienes Raices</h2>
        <h3 style="color: #B8B8FF;">Recuperación de contraseña</h3>
      </header>
      <div style="font-family: Arial, sans-serif; text-align: justify; line-height: 1.6; color: #6C6C6C; background-color: #F8F7FF; padding: 25px; border: 2px solid #FFEEDD; border-radius: 5px;">
        <h2 style="color: #9381FF;">¡Hola, <span style="color: #B8B8FF;">${nombre}</span>!</h2>
        <div style="padding: 20px; border: dashed #FFD8BE; border-radius: 10px;">
          <p style="font-size: 16px;">
            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong style="color: #9381FF;">BienesRaices.com</strong>.
          </p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.BACKEND_URL}:${process.env.PORT ?? 3001}/auth/olvide-password/${token}"
               style="background-color: #9381FF; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-size: 16px;">
               Restablecer Contraseña
            </a>
          </div>
          <p style="font-size: 16px; color: #6C6C6C;">
            Si no solicitaste este cambio, puedes ignorar este mensaje.
          </p>
        </div>
      </div>
      <footer style="text-align: center; color: #9381FF;">
        @Todos los derechos reservados de BienesRaices.com
      </footer>
    `
  });
};

export { emailRegistro, emailOlvidePassword };
