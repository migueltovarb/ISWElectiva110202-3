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
from AppResolution.config import EMAIL_DEVELOPMENT_MODE, MAILERSEND_API_KEY, MAILERSEND_FROM_EMAIL, MAILERSEND_FROM_NAME, DEFAULT_TEST_EMAIL

load_dotenv()

def send_auth_email_dev(token=None, user_email=None):
    """
    Función para desarrollo que simula el envío de correos
    mostrando el código en la consola del servidor
    """
    if token is None:
        token = generate_auth_code()
    
    if user_email is None:
        raise ValueError("Se requiere el email del usuario para enviar el código de verificación")
    
    print("=" * 70)
    print("🔔 SIMULACIÓN DE ENVÍO DE CORREO - MODO DESARROLLO")
    print("=" * 70)
    print(f"📧 Destinatario: {user_email}")
    print(f"📋 Asunto: Código de Verificación - Resolution")
    print(f"🔑 Código de verificación: {token}")
    print(f"⏰ Expira en: 10 minutos")
    print("=" * 70)
    print("💡 NOTA: Este es un código de prueba para desarrollo")
    print("💡 Copie este código para usarlo en la verificación")
    print("💡 El correo se habría enviado al email del usuario registrado")
    print("=" * 70)
    
    return token

def send_auth_email(token=None, user_email=None):
    try:
        # Si no se proporciona un token, generamos uno
        if token is None:
            token = generate_auth_code()
        
        # IMPORTANTE: Siempre requerir el email del usuario
        if user_email is None:
            raise ValueError("Se requiere el email del usuario para enviar el código de verificación")
        
        print(f"Código a enviar: {token}")
        print(f"Email destinatario: {user_email}")

        # Para desarrollo, usar la función de simulación
        if EMAIL_DEVELOPMENT_MODE:
            return send_auth_email_dev(token, user_email)

        # Inicializar el cliente de email con la API key
        mailer = emails.NewEmail(MAILERSEND_API_KEY)
        mail_body = {}

        mail_from = {
            "name": MAILERSEND_FROM_NAME,
            "email": MAILERSEND_FROM_EMAIL,
        }

        recipients = [
            {
                "name": "Usuario",
                "email": user_email,
            }
        ]

        # Contenido del email personalizado
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb;">Resolution</h1>
                    <h2 style="color: #374151;">Código de Verificación</h2>
                </div>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="font-size: 16px; color: #374151; margin-bottom: 15px;">
                        Hola,
                    </p>
                    <p style="font-size: 16px; color: #374151; margin-bottom: 15px;">
                        Has solicitado un código de verificación para tu cuenta en Resolution.
                    </p>
                    <div style="text-align: center; margin: 25px 0;">
                        <div style="background-color: #2563eb; color: white; font-size: 24px; font-weight: bold; padding: 15px 30px; border-radius: 8px; display: inline-block; letter-spacing: 3px;">
                            {token}
                        </div>
                    </div>
                    <p style="font-size: 14px; color: #6b7280; text-align: center;">
                        Este código expirará en <strong>10 minutos</strong>
                    </p>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="font-size: 14px; color: #6b7280;">
                        Si no solicitaste este código, puedes ignorar este mensaje de forma segura.
                    </p>
                    <p style="font-size: 14px; color: #6b7280;">
                        Este correo fue enviado a: <strong>{user_email}</strong>
                    </p>
                </div>
            </body>
        </html>
        """

        text_content = f"""
Resolution - Código de Verificación

Hola,

Has solicitado un código de verificación para tu cuenta en Resolution.

Tu código de verificación es: {token}

Este código expirará en 10 minutos.

Si no solicitaste este código, puedes ignorar este mensaje de forma segura.

Este correo fue enviado a: {user_email}

---
Resolution
        """

        try:
            # Configuramos el email
            mailer.set_mail_from(mail_from, mail_body)
            mailer.set_mail_to(recipients, mail_body)
            mailer.set_subject("Código de Verificación - Resolution", mail_body)
            mailer.set_html_content(html_content, mail_body)
            mailer.set_plaintext_content(text_content, mail_body)

            print("Intentando enviar email...")
            # Enviamos el email y capturamos la respuesta
            response = mailer.send(mail_body)
            
            # Verificar si la respuesta es un código de error
            if isinstance(response, int) and response >= 400:
                if response == 422:
                    print("⚠️  ADVERTENCIA: Se ha alcanzado el límite de cuota de correos.")
                    print(f"📧 Email que se habría enviado a: {user_email}")
                    print(f"🔑 Código de verificación: {token}")
                    print("💡 Para pruebas, use este código directamente.")
                    return token  # Retornamos el token para que se pueda usar en pruebas
                else:
                    raise Exception(f"Error del servidor de correo: {response}")

            print("✅ Email enviado exitosamente")
            return token

        except Exception as e:
            print(f"❌ Error durante el envío del email: {str(e)}")
            print(f"📧 Email destinatario: {user_email}")
            print(f"🔑 Código generado: {token}")
            print("💡 Para pruebas, use este código directamente.")
            return token  # Retornamos el token para que se pueda usar en pruebas

    except Exception as e:
        print(f"❌ Error general en send_auth_email: {str(e)}")
        return None

if __name__ == "__main__":
    try:
        code = send_auth_email()
        if code:
            print(f"Código generado: {code}")
            print("IMPORTANTE: Verifique los logs arriba para el estado del envío.")
        else:
            print("No se pudo generar el código")
    except Exception as e:
        print(f"Error general en el programa principal: {str(e)}")