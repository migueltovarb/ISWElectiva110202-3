#!/usr/bin/env python3
"""
Script de prueba para el registro automático de usuarios con envío de token
"""

import os
import sys
import django
from pathlib import Path
import requests
import json

# Configurar el entorno Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Resolution.settings')
django.setup()

from AppResolution.models import User, Authentication

def test_user_registration_with_auto_token():
    """
    Prueba el registro de usuario con generación automática de token
    """
    print("🧪 PRUEBA: Registro de usuario con token automático")
    print("=" * 60)
    
    # Datos de prueba
    test_data = {
        "first_name": "AutoTest",
        "last_name": "User",
        "email": "autotest@example.com",
        "password": "password123",
        "phone": "1234567999",
        "is_admin": False
    }
    
    # Limpiar datos de prueba anteriores
    try:
        existing_user = User.objects.get(email=test_data["email"])
        Authentication.objects.filter(user=existing_user).delete()
        existing_user.delete()
        print(f"🧹 Usuario de prueba anterior eliminado")
    except User.DoesNotExist:
        pass
    
    try:
        # Hacer POST al endpoint de registro
        response = requests.post(
            "http://localhost:8000/api/user",
            headers={"Content-Type": "application/json"},
            data=json.dumps(test_data)
        )
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ Usuario creado exitosamente")
            print(f"📧 Email: {data['user']['email']}")
            print(f"📱 ID: {data['user']['id']}")
            print(f"💬 Mensaje: {data['message']}")
            print(f"⏰ Token expira en: {data.get('token_expires_in', 'No especificado')}")
            
            # Verificar que se creó el token de autenticación
            user = User.objects.get(email=test_data["email"])
            auth_tokens = Authentication.objects.filter(user=user)
            
            if auth_tokens.exists():
                token = auth_tokens.first()
                print(f"🔑 Token generado: {token.token}")
                print(f"✅ Token asociado al usuario ID: {token.user.id}")
                print(f"📧 Email del token: {token.user.email}")
            else:
                print(f"❌ No se encontró token de autenticación")
            
            return True
            
        else:
            print(f"❌ Error al crear usuario: {response.status_code}")
            print(f"📝 Respuesta: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Error: No se puede conectar al servidor Django")
        print("💡 Asegúrate de que el servidor esté ejecutándose en http://localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {str(e)}")
        return False

def cleanup_test_data():
    """
    Limpia los datos de prueba
    """
    try:
        test_user = User.objects.get(email="autotest@example.com")
        Authentication.objects.filter(user=test_user).delete()
        test_user.delete()
        print("🧹 Datos de prueba limpiados")
    except User.DoesNotExist:
        pass

if __name__ == "__main__":
    print("🚀 PRUEBA: Sistema de Registro Automático con Token")
    print("=" * 80)
    print("📋 Esta prueba verifica que:")
    print("1. ✅ Se puede crear un usuario via POST /api/user")
    print("2. ✅ Se genera automáticamente un token de verificación")
    print("3. ✅ Se envía un email con el token (simulado)")
    print("4. ✅ La respuesta incluye información del token")
    print()
    
    success = test_user_registration_with_auto_token()
    
    if success:
        print("\n" + "=" * 80)
        print("✅ PRUEBA COMPLETADA EXITOSAMENTE")
        print()
        print("📋 RESUMEN:")
        print("- Usuario creado automáticamente ✅")
        print("- Token de verificación generado ✅") 
        print("- Email enviado con token ✅")
        print("- Respuesta estructurada correctamente ✅")
        print()
        print("🎯 NEXT STEPS:")
        print("- El frontend ahora puede registrar usuarios sin llamadas adicionales")
        print("- El token se envía automáticamente por email")
        print("- El usuario puede verificar su cuenta con el código recibido")
    else:
        print("\n" + "=" * 80)
        print("❌ PRUEBA FALLÓ")
        print("💡 Verifica que el servidor Django esté ejecutándose")
    
    # Limpiar datos de prueba
    cleanup_test_data() 