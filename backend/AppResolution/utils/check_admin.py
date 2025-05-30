#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Resolution.settings')
django.setup()

from AppResolution.models import User

def check_user_admin(email):
    """
    Verifica si un usuario es administrador
    """
    try:
        user = User.objects.get(email=email)
        print(f"👤 Usuario: {user.first_name} {user.last_name}")
        print(f"📧 Email: {user.email}")
        print(f"🆔 ID: {user.id}")
        print(f"✅ Verificado: {'Sí' if user.verified == 1 else 'No'}")
        print(f"👑 Admin: {'Sí' if user.is_admin else 'No'}")
        
        if not user.is_admin:
            print("\n🔧 ¿Quieres hacer administrador a este usuario? (s/n)")
            response = input().lower()
            if response == 's':
                user.is_admin = True
                user.save()
                print("✅ Usuario convertido en administrador")
            else:
                print("❌ No se realizaron cambios")
        else:
            print("✅ El usuario ya es administrador")
            
    except User.DoesNotExist:
        print(f"❌ No se encontró un usuario con el email: {email}")

def list_all_users():
    """
    Lista todos los usuarios
    """
    users = User.objects.all()
    print("📋 Todos los usuarios:")
    print("-" * 60)
    for user in users:
        admin_icon = "👑" if user.is_admin else "👤"
        verified_icon = "✅" if user.verified == 1 else "❌"
        print(f"{admin_icon} {user.first_name} {user.last_name} ({user.email}) {verified_icon}")
    print("-" * 60)

if __name__ == "__main__":
    print("🔍 Verificador de Estado de Administrador")
    print("=" * 50)
    
    if len(sys.argv) > 1:
        email = sys.argv[1]
        check_user_admin(email)
    else:
        list_all_users()
        print("\n💡 Para verificar un usuario específico:")
        print("   python check_admin.py usuario@email.com") 