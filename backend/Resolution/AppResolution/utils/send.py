from mailersend import emails
from dotenv import load_dotenv
import os
from AppResolution.utils.authToken import generate_auth_code

load_dotenv()

def send_auth_email(token=None):
    # Si no se proporciona un token, generamos uno
    if token is None:
        token = generate_auth_code()
    
    print(f"Código a enviar: {token}")  # Para verificar el código generado

    mailer = emails.NewEmail("mlsn.1e2795f40f1f51fd362e4c204b13f74b5c7ee222ef5c2ee7a865d57e950205c7")
    mail_body = {}

    mail_from = {
        "name": "Sistema de Autenticación",
        "email": "MS_uYWDqH@test-vz9dlemm0k64kj50.mlsender.net",
    }

    recipients = [
        {
            "name": "Usuario",
            "email": "makibu277353@gmail.com",
        }
    ]

    # Usamos el código generado en el contenido del email
    html_content = f"""
    <html>
        <body>
            <h2>Código de Autenticación</h2>
            <p>Su código de doble autenticación es: <strong>{token}</strong></p>
            <p>Este código expirará en 10 minutos.</p>
        </body>
    </html>
    """

    text_content = f"Su código de doble autenticación es: {token}\nEste código expirará en 10 minutos."

    # Configuramos el email
    mailer.set_mail_from(mail_from, mail_body)
    mailer.set_mail_to(recipients, mail_body)
    mailer.set_subject("Código de Autenticación", mail_body)
    mailer.set_html_content(html_content, mail_body)
    mailer.set_plaintext_content(text_content, mail_body)

    # Enviamos el email
    mailer.send(mail_body)
    
    # Retornamos el código generado para guardarlo
    return token

if __name__ == "__main__":
    code = send_auth_email()
    print(f"Código enviado: {code}")