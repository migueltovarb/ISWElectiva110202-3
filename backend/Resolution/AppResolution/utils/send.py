import os
import sys
import django
from pathlib import Path

# Configurar el entorno Django
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Resolution.settings')
django.setup()

from mailersend import emails
from dotenv import load_dotenv
from AppResolution.utils.authToken import generate_auth_code

load_dotenv()

def send_auth_email(token=None):
    try:
        # Si no se proporciona un token, generamos uno
        if token is None:
            token = generate_auth_code()
        
        print(f"Código a enviar: {token}")

        # Inicializar el cliente de email con la API key
        api_key = "mlsn.d872473062109acfec97c7ba199179c59ef8fd194070f4d0bc92f46be101e650"
        
        mailer = emails.NewEmail(api_key)
        mail_body = {}

        mail_from = {
            "name": "Resolution",
            "email": "MS_EOJlqh@test-65qngkd23mdlwr12.mlsender.net",
        }

        recipients = [
            {
                "name": "Usuario",
                "email": "makabeuz6618@gmail.com",
            }
        ]

        # Contenido del email
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

        try:
            # Configuramos el email
            mailer.set_mail_from(mail_from, mail_body)
            mailer.set_mail_to(recipients, mail_body)
            mailer.set_subject("Código de Autenticación", mail_body)
            mailer.set_html_content(html_content, mail_body)
            mailer.set_plaintext_content(text_content, mail_body)

            print("Intentando enviar email...")
            # Enviamos el email y capturamos la respuesta
            response = mailer.send(mail_body)
            
            # Verificar si la respuesta es un código de error
            if isinstance(response, int) and response >= 400:
                if response == 422:
                    raise Exception("Se ha alcanzado el límite de cuota de correos. Por favor, contacte al administrador.")
                else:
                    raise Exception(f"Error del servidor de correo: {response}")

            print("Email enviado exitosamente")
            return token

        except Exception as e:
            print(f"Error durante el envío del email: {str(e)}")
            raise

    except Exception as e:
        print(f"Error general en send_auth_email: {str(e)}")
        return None

if __name__ == "__main__":
    try:
        code = send_auth_email()
        if code:
            print(f"Código generado: {code}")
            print("IMPORTANTE: El correo NO pudo ser enviado debido a limitaciones de la cuenta de prueba.")
            print("Por favor, contacte al administrador para actualizar la cuenta de correo.")
        else:
            print("No se pudo generar o enviar el código")
    except Exception as e:
        print(f"Error general en el programa principal: {str(e)}")