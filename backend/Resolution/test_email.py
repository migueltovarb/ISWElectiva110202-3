#!/usr/bin/env python3
"""
Script de prueba para verificar el sistema de envío de correos
"""

import os
import sys
import django
from pathlib import Path

# Configurar el entorno Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Resolution.settings')
django.setup()

from AppResolution.utils.send import send_auth_email
from AppResolution.config import EMAIL_DEVELOPMENT_MODE, DEFAULT_TEST_EMAIL

def test_email_system():
    print("🧪 PRUEBA DEL SISTEMA DE CORREOS")
    print("=" * 50)
    print(f"Modo de desarrollo: {EMAIL_DEVELOPMENT_MODE}")
    print("=" * 50)
    
    # Usar el email por defecto de configuración para pruebas
    test_email = DEFAULT_TEST_EMAIL
    
    print(f"Enviando código de prueba a: {test_email}")
    print("-" * 50)
    
    try:
        token = send_auth_email(user_email=test_email)
        
        if token:
            print("-" * 50)
            print("✅ PRUEBA EXITOSA")
            print(f"🔑 Token generado: {token}")
            print("💡 Si está en modo desarrollo, el código aparece arriba")
            print("💡 Si está en modo producción, revise el email")
        else:
            print("❌ PRUEBA FALLIDA: No se pudo generar el token")
            
    except Exception as e:
        print(f"❌ ERROR EN LA PRUEBA: {str(e)}")

if __name__ == "__main__":
    test_email_system() 