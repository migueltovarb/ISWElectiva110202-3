import json
from django.shortcuts import render, get_object_or_404
from rest_framework.decorators import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import AllowAny
from AppResolution.models import User, Authentication, Claim, Request, Profile
from AppResolution.serializers import user_serializer, authentication_serializer, claim_serializer, request_serializer, profile_serializer
from AppResolution.utils.send import send_auth_email
from AppResolution.utils.authToken import generate_auth_code, verify_auth_code, get_latest_auth_code
from django.utils import timezone
from datetime import timedelta
import threading
import time
from django.contrib.auth.hashers import check_password, make_password

#creates
#usuario
class UserView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # Handle both list and dictionary input formats
        request_data = request.data[0] if isinstance(request.data, list) else request.data
        
        data = {
            'first_name': request_data.get('first_name'),
            'last_name': request_data.get('last_name'),
            'email': request_data.get('email'),
            'password': request_data.get('password'),
            'phone': request_data.get('phone'),
            'verified': request_data.get('verified', 0),
            'is_admin': request_data.get('is_admin', False)
        }
        
        # Set username to email if not provided (required by AbstractUser)
        if not data.get('username'):
            data['username'] = data['email']
        
        serializer = user_serializer(data=data)
        if serializer.is_valid():
            try:
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                # Capturar errores específicos de unicidad
                if 'email' in str(e):
                    return Response({"error": "Ya existe un usuario con este correo electrónico"}, status=status.HTTP_400_BAD_REQUEST)
                elif 'phone' in str(e):
                    return Response({"error": "Ya existe un usuario con este número de teléfono"}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, pk=None):
        # Si se proporciona un ID específico, devolver ese usuario
        if pk:
            try:
                user = User.objects.get(pk=pk)
                serializer = user_serializer(user)
                return Response(serializer.data)
            except User.DoesNotExist:
                return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        
        # Si no hay ID, devolver todos los usuarios
        users = User.objects.all()
        serializer = user_serializer(users, many=True)
        return Response(serializer.data)
    
    def put(self, request):
        data = {
            'first_name': request.data.get('first_name'),
            'last_name': request.data.get('last_name'),
            'email': request.data.get('email'),
            'password': request.data.get('password'),
            'phone': request.data.get('phone'),
            'verified': request.data.get('verified'),
            'is_admin': request.data.get('is_admin')
        }
        serializer = user_serializer(data=data)
        if serializer.is_valid():
            try:
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                if 'email' in str(e):
                    return Response({"error": "Ya existe un usuario con este correo electrónico"}, status=status.HTTP_400_BAD_REQUEST)
                elif 'phone' in str(e):
                    return Response({"error": "Ya existe un usuario con este número de teléfono"}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, pk=None):
        if not pk:
            return Response({"error": "Se requiere el ID del usuario."}, status=status.HTTP_400_BAD_REQUEST)
        
        user = get_object_or_404(User, pk=pk)
        request_data = request.data[0] if isinstance(request.data, list) else request.data

        # Si solo se está actualizando el campo verified (funcionalidad original)
        if 'verified' in request_data and len(request_data) == 1:
            verified_value = request_data.get("verified")
            if verified_value is None:
                return Response({"error": "Campo 'verified' requerido."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                user.verified = int(verified_value)  
                user.save()
                return Response({"message": "Verificación actualizada correctamente."}, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        # Si se están actualizando otros campos del perfil
        try:
            # Actualizar campos del usuario si están presentes
            if 'first_name' in request_data:
                user.first_name = request_data.get('first_name')
            if 'last_name' in request_data:
                user.last_name = request_data.get('last_name')
            if 'email' in request_data:
                user.email = request_data.get('email')
            if 'phone' in request_data:
                user.phone = request_data.get('phone')
            if 'password' in request_data:
                # Hashear la contraseña antes de guardarla
                user.password = make_password(request_data.get('password'))
            if 'is_admin' in request_data:
                user.is_admin = request_data.get('is_admin')
            user.save()
            
            # También actualizar el perfil asociado si existe
            if hasattr(user, 'profile') and user.profile:
                profile = user.profile
                if 'first_name' in request_data:
                    profile.first_name = request_data.get('first_name')
                if 'last_name' in request_data:
                    profile.last_name = request_data.get('last_name')
                if 'email' in request_data:
                    profile.email = request_data.get('email')
                if 'phone' in request_data:
                    profile.phone = request_data.get('phone')
                if 'password' in request_data:
                    # Hashear la contraseña antes de guardarla en el perfil
                    profile.password = make_password(request_data.get('password'))
                if 'is_admin' in request_data:
                    profile.is_admin = request_data.get('is_admin')
                
                profile.save()
            
            # Devolver los datos actualizados del usuario
            user_data = {
                'id': user.id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'phone': user.phone,
                'verified': user.verified,
                'is_admin': user.is_admin
            }
            
            return Response({
                "message": "Perfil actualizado correctamente.",
                "user": user_data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    def delete(self,request,pk=None):
        if not pk:
            return Response({"error": "Se requiere el ID del usuario"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(pk=pk)
            user.delete()
            return Response({"message": "Usuario eliminado correctamente"}, status=status.HTTP_200_OK)  
        except User.DoesNotExist:
            return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    
#auth
class AuthenticationView(APIView):
   
    def get(self, request, pkid=None):
        # Si se proporciona un ID específico (ya sea como pkid en URL o como query param)
        user_id = pkid or request.query_params.get('user_id')
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                
                # Primero, buscar y eliminar cualquier registro de autenticación existente para este usuario
                try:
                    existing_auth = Authentication.objects.get(user_id=user_id)
                    existing_auth_id = existing_auth.id  # Guardar el ID para mensaje de depuración
                    existing_auth.delete()
                    print(f"Código anterior eliminado para el usuario {user_id} (ID de autenticación: {existing_auth_id})")
                except Authentication.DoesNotExist:
                    print(f"No había código anterior para el usuario {user_id}")
                
                # Generar un nuevo código de autenticación
                verification_code = generate_auth_code()
                print(f"Nuevo código generado: {verification_code}")
                print(f"Código en variable global: {get_latest_auth_code()}")
                
                # Crear un nuevo registro de autenticación
                auth_record = Authentication.objects.create(
                    user_id=user_id,
                    token=get_latest_auth_code()
                )
                
                # Programar la eliminación del token después de 10 minutos
                delete_auth_token_after_timeout(auth_record.id, timeout_minutes=10)
                print(f"Programada eliminación del nuevo token (ID: {auth_record.id}) en 10 minutos")
                
                # Enviar el código por correo electrónico
                try:
                    send_auth_email(get_latest_auth_code(), user.email)
                    print(f"Correo enviado con éxito con código: {get_latest_auth_code()}")
                except Exception as e:
                    print(f"Error al enviar correo: {str(e)}")
                    # Continuamos incluso si falla el envío de correo
                
                # Devolver el nuevo registro
                serializer = authentication_serializer(auth_record)
                return Response({
                    "message": "Código anterior eliminado. Nuevo código generado y enviado. Expirará en 10 minutos.",
                    "data": serializer.data,
                    "auth_code": get_latest_auth_code(),
                    "expires_in": "10 minutos"
                }, status=status.HTTP_200_OK)
                
            except User.DoesNotExist:
                return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                print(f"Error general: {str(e)}")
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        # Si no hay ID de usuario, devolver todos los registros
        auth_records = Authentication.objects.all()
        serializer = authentication_serializer(auth_records, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        user_id = request.data.get('user_id')
        input_code = request.data.get('code')
        if not user_id or not input_code:
            return Response({'error': 'Faltan datos'}, status=400)
        try:
            auth_record = Authentication.objects.filter(user_id=user_id).order_by('-id').first()
            if not auth_record:
                return Response({'error': 'No se encontró código para este usuario'}, status=404)
            if str(auth_record.token) == str(input_code):
                user = User.objects.get(id=user_id)
                user.verified = 1
                user.save()
                # Crear perfil si no existe y asignar al usuario
                if not user.profile:
                    perfil = Profile.objects.create(
                        first_name=user.first_name,
                        last_name=user.last_name,
                        email=user.email,
                        phone=user.phone or '',
                        password='',
                        photo=''
                    )
                    user.profile = perfil
                    user.save()
                return Response({'success': True})
            else:
                return Response({'success': False, 'error': 'Código incorrecto'}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    def put(self, request):
        """
        Verifica el token sin actualizar el campo verified (para recuperación de contraseña)
        """
        user_id = request.data.get('user_id')
        input_code = request.data.get('code')
        if not user_id or not input_code:
            return Response({'error': 'Faltan datos'}, status=400)
        try:
            auth_record = Authentication.objects.filter(user_id=user_id).order_by('-id').first()
            if not auth_record:
                return Response({'error': 'No se encontró código para este usuario'}, status=404)
            if str(auth_record.token) == str(input_code):
                return Response({'success': True, 'message': 'Token válido'})
            else:
                return Response({'success': False, 'error': 'Código incorrecto'}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=400)
   
#reclamo
class ClaimView(APIView):
    def post(self, request):
        request_data = request.data[0] if isinstance(request.data, list) else request.data
        
        data = {
            'user': request_data.get('user'),
            'subject': request_data.get('subject'),
            'description': request_data.get('description'),
            'status': request_data.get('status') or 'Pendiente',
        }
        
        if not data['user']:
            return Response({"error": "Se requiere el ID del usuario"}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = claim_serializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request, pk=None, user_id=None, **kwargs):
        # Si se proporcionó un ID específico
        if pk:
            try:
                claim = Claim.objects.get(pk=pk)
                serializer = claim_serializer(claim)
                return Response(serializer.data)
            except Claim.DoesNotExist:
                return Response({"error": "Reclamo no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        
        # Si se está filtrando por user_id (ya sea de la URL o de query_params)
        filter_user_id = user_id or request.query_params.get('user_id')
        if filter_user_id:
            try:
                claims = Claim.objects.filter(user_id=filter_user_id)
                serializer = claim_serializer(claims, many=True)
                return Response(serializer.data)
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        # Si no hay filtros, devolver todos los reclamos
        claims = Claim.objects.all()
        serializer = claim_serializer(claims, many=True)
        return Response(serializer.data)
        
    def put(self, request, pk=None):
        request_data = request.data[0] if isinstance(request.data, list) else request.data
        
        if not pk:
            pk = request_data.get('id')
            if not pk:
                return Response({"error": "Se requiere el ID del reclamo"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            claim = Claim.objects.get(pk=pk)
            
            # Actualizar solo los campos proporcionados
            if 'subject' in request_data:
                claim.subject = request_data.get('subject')
            if 'description' in request_data:
                claim.description = request_data.get('description')
            if 'status' in request_data:
                claim.status = request_data.get('status')
            
            claim.save()
            serializer = claim_serializer(claim)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Claim.DoesNotExist:
            return Response({"error": "Reclamo no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    def delete(self,request,pk=None):
        if not pk:
            return Response({"error": "Se requiere el ID del reclamo"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            claim = Claim.objects.get(pk=pk)
            claim.delete()
            return Response({"message": "Reclamo eliminado correctamente"}, status=status.HTTP_200_OK)
        except Claim.DoesNotExist:
            return Response({"error": "Reclamo no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
#solicitud
class RequestView(APIView):
    def post(self, request):
        request_data = request.data[0] if isinstance(request.data, list) else request.data
        
        data = {
            'user': request_data.get('user'),
            'subject': request_data.get('subject'),
            'description': request_data.get('description'),
            'status': request_data.get('status') or 'Pendiente',
        }
        
        if not data['user']:
            return Response({"error": "Se requiere el ID del usuario"}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = request_serializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request, pk=None, user_id=None, **kwargs):
        # Si se proporcionó un ID específico
        if pk:
            try:
                req = Request.objects.get(pk=pk)
                serializer = request_serializer(req)
                return Response(serializer.data)
            except Request.DoesNotExist:
                return Response({"error": "Solicitud no encontrada"}, status=status.HTTP_404_NOT_FOUND)
        
        # Si se está filtrando por user_id (ya sea de la URL o de query_params)
        filter_user_id = user_id or request.query_params.get('user_id')
        if filter_user_id:
            try:
                requests = Request.objects.filter(user_id=filter_user_id)
                serializer = request_serializer(requests, many=True)
                return Response(serializer.data)
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        # Si no hay filtros, devolver todas las solicitudes
        requests = Request.objects.all()
        serializer = request_serializer(requests, many=True)
        return Response(serializer.data)
        
    def put(self, request, pk=None):
        request_data = request.data[0] if isinstance(request.data, list) else request.data
        
        if not pk:
            pk = request_data.get('id')
            if not pk:
                return Response({"error": "Se requiere el ID de la solicitud"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            req = Request.objects.get(pk=pk)
            
            # Actualizar solo los campos proporcionados
            if 'subject' in request_data:
                req.subject = request_data.get('subject')
            if 'description' in request_data:
                req.description = request_data.get('description')
            if 'status' in request_data:
                req.status = request_data.get('status')
            
            req.save()
            serializer = request_serializer(req)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Request.DoesNotExist:
            return Response({"error": "Solicitud no encontrada"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    def delete(self, request, pk=None):
        if not pk:
            return Response({"error": "Se requiere el ID de la solicitud"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            req = Request.objects.get(pk=pk)
            req.delete()
            return Response({"message": "Solicitud eliminada correctamente"}, status=status.HTTP_200_OK)
        except Request.DoesNotExist:
            return Response({"error": "Solicitud no encontrada"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

#profile
class ProfileView(APIView):
    def post(self, request):
        request_data = request.data[0] if isinstance(request.data, list) else request.data
        
        data = {
            'user': request_data.get('user'),
            'first_name': request_data.get('first_name'),
            'last_name': request_data.get('last_name'),
            'email': request_data.get('email'),
            'password': request_data.get('password'),
            'phone': request_data.get('phone'),
            'photo': request_data.get('photo') or '',
        }
        serializer = profile_serializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, Status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk=None):
        request_data = request.data[0] if isinstance(request.data, list) else request.data
        
        if not pk:
            pk = request_data.get('id')
            if not pk:
                return Response({"error": "Se requiere el ID del perfil"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            profile = Profile.objects.get(pk=pk)
            
            # Actualizar solo los campos proporcionados
            if 'first_name' in request_data:
                profile.first_name = request_data.get('first_name')
            if 'last_name' in request_data:
                profile.last_name = request_data.get('last_name')
            if 'email' in request_data:
                profile.email = request_data.get('email')
            if 'phone' in request_data:
                profile.phone = request_data.get('phone')
            if 'password' in request_data:
                # Hashear la contraseña antes de guardarla en el perfil
                profile.password = make_password(request_data.get('password'))
            if 'photo' in request_data:
                profile.photo = request_data.get('photo')
            
            profile.save()
            serializer = profile_serializer(profile)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Profile.DoesNotExist:
            return Response({"error": "Perfil no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request, pk=None, user_id=None, **kwargs):
        # Si se proporcionó un ID específico
        if pk:
            try:
                profile = Profile.objects.get(pk=pk)
                serializer = profile_serializer(profile)
                return Response(serializer.data)
            except Profile.DoesNotExist:
                return Response({"error": "Perfil no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        
        # Si se está filtrando por user_id (ya sea de la URL o de query_params)
        filter_user_id = user_id or request.query_params.get('user_id')
        if filter_user_id:
            try:
                user = User.objects.get(id=filter_user_id)
                profile = user.profile
                if not profile:
                    return Response({"error": "No se encontró perfil para este usuario"}, status=status.HTTP_404_NOT_FOUND)
                serializer = profile_serializer(profile)
                return Response(serializer.data)
            except User.DoesNotExist:
                return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        # Si no hay filtros, devolver todos los perfiles
        profiles = Profile.objects.all()
        serializer = profile_serializer(profiles, many=True)
        return Response(serializer.data)

# Login de usuario
class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        request_data = request.data[0] if isinstance(request.data, list) else request.data
        
        email = request_data.get('email')
        password = request_data.get('password')
        
        if not email or not password:
            return Response({"error": "Se requiere email y contraseña"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            
            # Verificar si la contraseña es correcta (asumiendo que está hasheada)
            if check_password(password, user.password):
                # Si el usuario está verificado
                if user.verified == 1:
                    # Buscar el perfil del usuario
                    try:
                        profile = user.profile
                        profile_data = profile_serializer(profile).data if profile else None
                    except Profile.DoesNotExist:
                        profile_data = None
                    
                    # Devolver la información del usuario y el perfil
                    return Response({
                        "message": "Inicio de sesión exitoso",
                        "user": {
                            "id": user.id,
                            "first_name": user.first_name,
                            "last_name": user.last_name,
                            "email": user.email,
                            "phone": user.phone,
                            "verified": user.verified,
                            "is_admin": user.is_admin
                        },
                        "profile": profile_data,
                        "token": "dummy-token"
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({"error": "Usuario no verificado"}, status=status.HTTP_401_UNAUTHORIZED)
            else:
                return Response({"error": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)
        except User.DoesNotExist:
            return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# Añadir una función para eliminar tokens después de un tiempo
def delete_auth_token_after_timeout(auth_id, timeout_minutes=10):
    """
    Función para eliminar un token de autenticación después de un tiempo determinado
    """
    # Crear un temporizador en segundo plano
    def delete_token():
        time.sleep(timeout_minutes * 60)  # Convertir minutos a segundos
        try:
            # Intentar obtener y eliminar el token después del tiempo especificado
            auth_record = Authentication.objects.get(id=auth_id)
            auth_record.delete()
            print(f"Token de autenticación con ID {auth_id} eliminado después de {timeout_minutes} minutos")
        except Authentication.DoesNotExist:
            print(f"El token de autenticación con ID {auth_id} ya no existe")
        except Exception as e:
            print(f"Error al eliminar el token: {str(e)}")
    
    # Iniciar el temporizador en un hilo separado
    thread = threading.Thread(target=delete_token)
    thread.daemon = True  # Hacer que el hilo sea un demonio para que no bloquee la salida
    thread.start()
    return thread

# Panel de administrador
class AdminView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        Obtener todas las solicitudes y reclamos para el panel de administrador
        """
        try:
            # Verificar si el usuario es administrador
            user_id = request.query_params.get('user_id')
            if not user_id:
                return Response({"error": "Se requiere user_id"}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                user = User.objects.get(id=user_id)
                if not user.is_admin:
                    return Response({"error": "Acceso denegado. Solo administradores."}, status=status.HTTP_403_FORBIDDEN)
            except User.DoesNotExist:
                return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
            
            # Obtener todas las solicitudes y reclamos
            claims = Claim.objects.all().order_by('-created_at')
            requests = Request.objects.all().order_by('-created_at')
            
            # Serializar los datos incluyendo información del usuario
            claims_data = []
            for claim in claims:
                claim_data = claim_serializer(claim).data
                claim_data['user_info'] = {
                    'id': claim.user.id,
                    'first_name': claim.user.first_name,
                    'last_name': claim.user.last_name,
                    'email': claim.user.email
                }
                claims_data.append(claim_data)
            
            requests_data = []
            for req in requests:
                request_data = request_serializer(req).data
                request_data['user_info'] = {
                    'id': req.user.id,
                    'first_name': req.user.first_name,
                    'last_name': req.user.last_name,
                    'email': req.user.email
                }
                requests_data.append(request_data)
            
            return Response({
                "claims": claims_data,
                "requests": requests_data,
                "total_claims": len(claims_data),
                "total_requests": len(requests_data)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request):
        """
        Actualizar el estado de una solicitud o reclamo
        """
        try:
            # Verificar si el usuario es administrador
            user_id = request.data.get('user_id')
            if not user_id:
                return Response({"error": "Se requiere user_id"}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                user = User.objects.get(id=user_id)
                if not user.is_admin:
                    return Response({"error": "Acceso denegado. Solo administradores."}, status=status.HTTP_403_FORBIDDEN)
            except User.DoesNotExist:
                return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
            
            # Obtener los datos de la solicitud
            item_type = request.data.get('type')  # 'claim' o 'request'
            item_id = request.data.get('id')
            new_status = request.data.get('status')
            
            if not all([item_type, item_id, new_status]):
                return Response({"error": "Se requieren type, id y status"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Actualizar según el tipo
            if item_type == 'claim':
                try:
                    claim = Claim.objects.get(id=item_id)
                    claim.status = new_status
                    claim.save()
                    return Response({
                        "message": "Estado del reclamo actualizado correctamente",
                        "data": claim_serializer(claim).data
                    }, status=status.HTTP_200_OK)
                except Claim.DoesNotExist:
                    return Response({"error": "Reclamo no encontrado"}, status=status.HTTP_404_NOT_FOUND)
            
            elif item_type == 'request':
                try:
                    req = Request.objects.get(id=item_id)
                    req.status = new_status
                    req.save()
                    return Response({
                        "message": "Estado de la solicitud actualizado correctamente",
                        "data": request_serializer(req).data
                    }, status=status.HTTP_200_OK)
                except Request.DoesNotExist:
                    return Response({"error": "Solicitud no encontrada"}, status=status.HTTP_404_NOT_FOUND)
            
            else:
                return Response({"error": "Tipo inválido. Use 'claim' o 'request'"}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# Panel de reportes para administradores
class ReportsView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        Obtener estadísticas detalladas de solicitudes y reclamos para reportes
        """
        try:
            # Verificar si el usuario es administrador
            user_id = request.GET.get('user_id')  # Changed from request.query_params.get('user_id')
            if not user_id:
                return Response({"error": "Se requiere user_id"}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                user = User.objects.get(id=user_id)
                if not user.is_admin:
                    return Response({"error": "Acceso denegado. Solo administradores."}, status=status.HTTP_403_FORBIDDEN)
            except User.DoesNotExist:
                return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
            
            # Obtener todas las solicitudes y reclamos
            claims = Claim.objects.all()
            requests = Request.objects.all()
            
            # Estadísticas de reclamos
            claims_stats = {
                'total': claims.count(),
                'pendiente': claims.filter(status__iexact='pendiente').count(),
                'en_proceso': claims.filter(status__iexact='en proceso').count(),
                'completado': claims.filter(status__iexact='completado').count(),
            }
            
            # Estadísticas de solicitudes
            requests_stats = {
                'total': requests.count(),
                'pendiente': requests.filter(status__iexact='pendiente').count(),
                'en_proceso': requests.filter(status__iexact='en proceso').count(),
                'completado': requests.filter(status__iexact='completado').count(),
            }
            
            # Datos para gráficas por fecha (últimos 30 días)
            from datetime import timedelta
            
            end_date = timezone.now().date()
            start_date = end_date - timedelta(days=29)  # 30 días incluyendo hoy
            
            # Generar lista de fechas para los últimos 30 días
            date_range = []
            current_date = start_date
            while current_date <= end_date:
                date_range.append(current_date.strftime('%Y-%m-%d'))
                current_date += timedelta(days=1)
            
            # Obtener datos de reclamos y solicitudes en el rango de fechas
            claims_in_range = claims.filter(
                created_at__date__gte=start_date,
                created_at__date__lte=end_date
            )
            
            requests_in_range = requests.filter(
                created_at__date__gte=start_date,
                created_at__date__lte=end_date
            )
            
            # Organizar datos para gráficas
            claims_chart_data = {}
            requests_chart_data = {}
            
            # Inicializar datos para cada fecha
            for date_str in date_range:
                claims_chart_data[date_str] = {
                    'pendiente': 0,
                    'en_proceso': 0,
                    'completado': 0,
                    'total': 0
                }
                requests_chart_data[date_str] = {
                    'pendiente': 0,
                    'en_proceso': 0,
                    'completado': 0,
                    'total': 0
                }
            
            # Procesar reclamos
            for claim in claims_in_range:
                date_str = claim.created_at.date().strftime('%Y-%m-%d')
                status_value = (claim.status or 'pendiente').lower()
                
                if date_str in claims_chart_data:
                    if status_value in claims_chart_data[date_str]:
                        claims_chart_data[date_str][status_value] += 1
                    claims_chart_data[date_str]['total'] += 1
            
            # Procesar solicitudes
            for req in requests_in_range:
                date_str = req.created_at.date().strftime('%Y-%m-%d')
                status_value = (req.status or 'pendiente').lower()
                
                if date_str in requests_chart_data:
                    if status_value in requests_chart_data[date_str]:
                        requests_chart_data[date_str][status_value] += 1
                    requests_chart_data[date_str]['total'] += 1
            
            # Convertir a formato de array para gráficas
            claims_chart_array = []
            requests_chart_array = []
            
            for date_str in date_range:
                claims_chart_array.append({
                    'date': date_str,
                    **claims_chart_data[date_str]
                })
                requests_chart_array.append({
                    'date': date_str,
                    **requests_chart_data[date_str]
                })
            
            return Response({
                "claims_stats": claims_stats,
                "requests_stats": requests_stats,
                "claims_chart_data": claims_chart_array,
                "requests_chart_data": requests_chart_array,
                "date_range": {
                    "start_date": start_date.strftime('%Y-%m-%d'),
                    "end_date": end_date.strftime('%Y-%m-%d')
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            print(f"Error en ReportsView: {str(e)}")
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

