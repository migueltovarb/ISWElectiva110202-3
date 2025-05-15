import json
from django.shortcuts import render, get_object_or_404
from rest_framework.decorators import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import AllowAny
from AppResolution.models import User, Authentication, Claim, Request, Profile
from AppResolution.serializers import user_serializer, authentication_serializer, claim_serializer, request_serializer, profile_serializer
from AppResolution.utils.send import send_auth_email
from AppResolution.utils.authToken import generate_auth_code
from django.utils import timezone
from datetime import timedelta
import threading
import time
from django.contrib.auth.hashers import check_password

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
            'verified': request_data.get('verified'),
        }
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

    def get(self, request):
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

        verified_value = request.data.get("verified")
        if verified_value is None:
            return Response({"error": "Campo 'verified' requerido."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user.verified = int(verified_value)  
            user.save()
            return Response({"message": "Verificación actualizada correctamente."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    
#auth
class AuthenticationView(APIView):
    def post(self, request):
        request_data = request.data[0] if isinstance(request.data, list) else request.data
        try:
            user_id = int(request_data.get('user'))
            user = User.objects.get(id=user_id)
            
            # Verificar si ya existe un registro de autenticación para este usuario
            try:
                existing_auth = Authentication.objects.get(user_id=user_id)
                return Response({
                    "error": "Ya existe un registro de autenticación para este usuario. Use PUT para actualizar el token."
                }, status=status.HTTP_400_BAD_REQUEST)
            except Authentication.DoesNotExist:
                # Si no existe, continuar con la creación
                pass
            
            # Generar código de autenticación automáticamente
            verification_code = generate_auth_code()
            
            data = {
                'user': user_id,
                'token': verification_code,
            }
            serializer = authentication_serializer(data=data)
            if serializer.is_valid():
                serializer.save()
                
                # Enviar el código por correo electrónico inmediatamente
                send_auth_email(verification_code)
                
                return Response({
                    "message": "Código de verificación enviado",
                    "data": serializer.data
                }, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        except (ValueError, TypeError):
            return Response({"error": "ID de usuario inválido. Debe ser un número."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request, pkid=None):
        try:
            # Si se proporciona un ID, actualizar un registro específico
            if pkid:
                try:
                    auth_record = Authentication.objects.get(id=pkid)
                    # Generar un nuevo código de autenticación
                    new_verification_code = generate_auth_code()
                    
                    # Actualizar el token existente
                    auth_record.token = new_verification_code
                    auth_record.save()
                    
                    # Enviar el nuevo código por correo electrónico
                    send_auth_email(new_verification_code)
                    
                    return Response({
                        "message": "Código de verificación actualizado y enviado",
                        "data": authentication_serializer(auth_record).data
                    }, status=status.HTTP_200_OK)
                except Authentication.DoesNotExist:
                    return Response({"error": "Registro de autenticación no encontrado"}, status=status.HTTP_404_NOT_FOUND)
            else:
                # Si no se proporciona ID, usar el ID de usuario de la solicitud
                request_data = request.data[0] if isinstance(request.data, list) else request.data
                user_id = int(request_data.get('user'))
                
                # Verificar que el usuario existe
                try:
                    user = User.objects.get(id=user_id)
                except User.DoesNotExist:
                    return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
                
                # Generar un nuevo código de autenticación
                new_verification_code = generate_auth_code()
                
                # Buscar si ya existe un registro de autenticación para este usuario
                try:
                    existing_auth = Authentication.objects.get(user_id=user_id)
                    # Actualizar el token existente
                    existing_auth.token = new_verification_code
                    existing_auth.save()
                    
                    # Enviar el nuevo código por correo electrónico
                    send_auth_email(new_verification_code)
                    
                    return Response({
                        "message": "Código de verificación actualizado y enviado",
                        "data": authentication_serializer(existing_auth).data
                    }, status=status.HTTP_200_OK)
                except Authentication.DoesNotExist:
                    # Si no existe, crear uno nuevo
                    data = {
                        'user': user_id,
                        'token': new_verification_code,
                    }
                    serializer = authentication_serializer(data=data)
                    if serializer.is_valid():
                        serializer.save()
                        
                        # Enviar el código por correo electrónico
                        send_auth_email(new_verification_code)
                        
                        return Response({
                            "message": "Código de verificación creado y enviado",
                            "data": serializer.data
                        }, status=status.HTTP_201_CREATED)
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({"error": "ID de usuario inválido. Debe ser un número."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request):
        auth_records = Authentication.objects.all()
        serializer = authentication_serializer(auth_records, many=True)
        return Response(serializer.data)

    def delete(self, request, pkid):
        try:
            auth_record = Authentication.objects.get(id=pkid)
            auth_record.delete()
            return Response({"message": "Registro de autenticación eliminado exitosamente"}, status=status.HTTP_200_OK)
        except Authentication.DoesNotExist:
            return Response({"error": "Registro de autenticación no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

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
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk=None):
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
            if 'password' in request_data:
                profile.password = request_data.get('password')
            if 'phone' in request_data:
                profile.phone = request_data.get('phone')
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
                profiles = Profile.objects.filter(user_id=filter_user_id)
                if not profiles.exists():
                    return Response({"error": "No se encontraron perfiles para este usuario"}, status=status.HTTP_404_NOT_FOUND)
                serializer = profile_serializer(profiles, many=True)
                return Response(serializer.data)
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
                        profile = Profile.objects.get(user_id=user.id)
                        profile_data = profile_serializer(profile).data
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
                            "verified": user.verified
                        },
                        "profile": profile_data
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({"error": "Usuario no verificado"}, status=status.HTTP_401_UNAUTHORIZED)
            else:
                return Response({"error": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)
        except User.DoesNotExist:
            return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)