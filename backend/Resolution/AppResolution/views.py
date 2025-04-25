import json
from django.shortcuts import render
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

#creates
#usuario
class UserView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
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
                # Capturar errores específicos de unicidad
                if 'email' in str(e):
                    return Response({"error": "Ya existe un usuario con este correo electrónico"}, status=status.HTTP_400_BAD_REQUEST)
                elif 'phone' in str(e):
                    return Response({"error": "Ya existe un usuario con este número de teléfono"}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    
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
        data = {
            'user': request.data.get('user'),
            'subject': request.data.get('subject'),
            'description': request.data.get('description'),
            'status': request.data.get('status'),
        }
        serializer = claim_serializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    def get(self, request):
        claims = Claim.objects.all()
        serializer = claim_serializer(claims, many=True)
        return Response(serializer.data)

#solicitiud
class RequestView(APIView):
    def post(self, request):
        data = {
            'user': request.data.get('user'),
            'subject': request.data.get('subject'),
            'description': request.data.get('description'),
            'status': request.data.get('status'),
        }
        serializer = request_serializer(data=data)
        if serializer.is_valid():
            serializer.save()

    def get(self, request):
        requests = Request.objects.all()
        serializer = request_serializer(requests, many=True)
        return Response(serializer.data)

#profile
class ProfileView(APIView):
    def put(self, request):

        data = {
            'first_name': request.data.get('first_name'),
            'last_name': request.data.get('last_name'),
            'email': request.data.get('email'),
            'password': request.data.get('password'),
            'phone': request.data.get('phone'),
            'photo': request.data.get('photo'),
        }
        serializer = profile_serializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request):
        profile = Profile.objects.all()
        serializer = profile_serializer(profile, many=True)
        return Response(serializer.data)