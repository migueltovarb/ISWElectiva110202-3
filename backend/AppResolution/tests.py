import json
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock

from AppResolution.models import User, Authentication, Claim, Request, Profile
from AppResolution.serializers import (
    user_serializer, authentication_serializer, claim_serializer, 
    request_serializer, profile_serializer
)
from AppResolution.utils.authToken import generate_auth_code, get_latest_auth_code


class UserModelTest(TestCase):
    """Tests para el modelo User"""
    
    def setUp(self):
        self.user_data = {
            'first_name': 'Juan',
            'last_name': 'Pérez',
            'email': 'juan@test.com',
            'password': 'password123',
            'phone': '1234567890',
            'verified': 0,
            'is_admin': False
        }
    
    def test_create_user(self):
        """Test crear usuario"""
        user = User.objects.create(**self.user_data)
        self.assertEqual(user.first_name, 'Juan')
        self.assertEqual(user.last_name, 'Pérez')
        self.assertEqual(user.email, 'juan@test.com')
        self.assertEqual(user.phone, '1234567890')
        self.assertEqual(user.verified, 0)
        self.assertFalse(user.is_admin)
    
    def test_user_str_representation(self):
        """Test representación string del usuario"""
        user = User.objects.create(**self.user_data)
        # Como User hereda de AbstractUser, debería tener una representación
        self.assertIsNotNone(str(user))
    
    def test_unique_email_constraint(self):
        """Test que el email debe ser único"""
        User.objects.create(**self.user_data)
        with self.assertRaises(Exception):
            User.objects.create(**self.user_data)
    
    def test_unique_phone_constraint(self):
        """Test que el teléfono debe ser único"""
        User.objects.create(**self.user_data)
        user_data_2 = self.user_data.copy()
        user_data_2['email'] = 'otro@test.com'
        with self.assertRaises(Exception):
            User.objects.create(**user_data_2)


class AuthenticationModelTest(TestCase):
    """Tests para el modelo Authentication"""
    
    def setUp(self):
        self.user = User.objects.create(
            first_name='Test',
            last_name='User',
            email='test@test.com',
            password='password123'
        )
    
    def test_create_authentication(self):
        """Test crear registro de autenticación"""
        auth = Authentication.objects.create(
            user=self.user,
            token='123456'
        )
        self.assertEqual(auth.user, self.user)
        self.assertEqual(auth.token, '123456')
    
    def test_authentication_user_relationship(self):
        """Test relación con usuario"""
        auth = Authentication.objects.create(
            user=self.user,
            token='123456'
        )
        self.assertEqual(self.user.authentications.first(), auth)


class ClaimModelTest(TestCase):
    """Tests para el modelo Claim"""
    
    def setUp(self):
        self.user = User.objects.create(
            first_name='Test',
            last_name='User',
            email='test@test.com',
            password='password123'
        )
    
    def test_create_claim(self):
        """Test crear reclamo"""
        claim = Claim.objects.create(
            user=self.user,
            subject='Test Claim',
            description='Test Description',
            status='pendiente'
        )
        self.assertEqual(claim.user, self.user)
        self.assertEqual(claim.subject, 'Test Claim')
        self.assertEqual(claim.description, 'Test Description')
        self.assertEqual(claim.status, 'pendiente')
        self.assertIsNotNone(claim.created_at)
    
    def test_claim_user_relationship(self):
        """Test relación con usuario"""
        claim = Claim.objects.create(
            user=self.user,
            subject='Test Claim',
            description='Test Description'
        )
        self.assertEqual(self.user.claims.first(), claim)


class RequestModelTest(TestCase):
    """Tests para el modelo Request"""
    
    def setUp(self):
        self.user = User.objects.create(
            first_name='Test',
            last_name='User',
            email='test@test.com',
            password='password123'
        )
    
    def test_create_request(self):
        """Test crear solicitud"""
        request_obj = Request.objects.create(
            user=self.user,
            subject='Test Request',
            description='Test Description',
            status='pendiente'
        )
        self.assertEqual(request_obj.user, self.user)
        self.assertEqual(request_obj.subject, 'Test Request')
        self.assertEqual(request_obj.description, 'Test Description')
        self.assertEqual(request_obj.status, 'pendiente')
        self.assertIsNotNone(request_obj.created_at)
    
    def test_request_user_relationship(self):
        """Test relación con usuario"""
        request_obj = Request.objects.create(
            user=self.user,
            subject='Test Request',
            description='Test Description'
        )
        self.assertEqual(self.user.requests.first(), request_obj)


class ProfileModelTest(TestCase):
    """Tests para el modelo Profile"""
    
    def test_create_profile(self):
        """Test crear perfil"""
        profile = Profile.objects.create(
            first_name='Juan',
            last_name='Pérez',
            email='juan@test.com',
            password='password123',
            phone='1234567890',
            photo='photo.jpg'
        )
        self.assertEqual(profile.first_name, 'Juan')
        self.assertEqual(profile.last_name, 'Pérez')
        self.assertEqual(profile.email, 'juan@test.com')
        self.assertEqual(profile.phone, '1234567890')
        self.assertEqual(profile.photo, 'photo.jpg')


class UserSerializerTest(TestCase):
    """Tests para el serializer de User"""
    
    def test_user_serializer_valid_data(self):
        """Test serializer con datos válidos"""
        data = {
            'first_name': 'Juan',
            'last_name': 'Pérez',
            'email': 'juan@test.com',
            'password': 'password123',
            'phone': '1234567890',
            'is_admin': False
        }
        serializer = user_serializer(data=data)
        self.assertTrue(serializer.is_valid())
    
    def test_user_serializer_invalid_email(self):
        """Test serializer con email inválido"""
        data = {
            'first_name': 'Juan',
            'last_name': 'Pérez',
            'email': 'invalid-email',
            'password': 'password123',
            'is_admin': False
        }
        serializer = user_serializer(data=data)
        self.assertFalse(serializer.is_valid())
    
    def test_user_serializer_password_hashing(self):
        """Test que la contraseña se hashea al crear usuario"""
        data = {
            'first_name': 'Juan',
            'last_name': 'Pérez',
            'email': 'juan@test.com',
            'password': 'password123',
            'is_admin': False
        }
        serializer = user_serializer(data=data)
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        self.assertTrue(check_password('password123', user.password))


class UserViewTest(APITestCase):
    """Tests para UserView"""
    
    def setUp(self):
        self.client = APIClient()
        self.user_data = {
            'first_name': 'Juan',
            'last_name': 'Pérez',
            'email': 'juan@test.com',
            'password': 'password123',
            'phone': '1234567890',
            'is_admin': False
        }
        self.user = User.objects.create(**self.user_data)
    
    def test_create_user_success(self):
        """Test crear usuario exitosamente"""
        data = {
            'first_name': 'Ana',
            'last_name': 'García',
            'email': 'ana@test.com',
            'password': 'password123',
            'phone': '0987654321',
            'is_admin': False
        }
        response = self.client.post('/api/user', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 2)
    
    def test_create_user_duplicate_email(self):
        """Test crear usuario con email duplicado"""
        response = self.client.post('/api/user', self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Verificar que hay errores de validación
        self.assertTrue('email' in response.data or 'error' in response.data)
    
    def test_get_all_users(self):
        """Test obtener todos los usuarios"""
        response = self.client.get('/api/user')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_get_user_by_id(self):
        """Test obtener usuario por ID"""
        response = self.client.get(f'/api/user/{self.user.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.user.email)
    
    def test_get_user_not_found(self):
        """Test obtener usuario que no existe"""
        response = self.client.get('/api/user/999')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_update_user_verification(self):
        """Test actualizar verificación de usuario"""
        data = {'verified': 1}
        response = self.client.patch(f'/api/user/{self.user.id}', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.verified, 1)
    
    def test_update_user_profile(self):
        """Test actualizar perfil de usuario"""
        data = {
            'first_name': 'Juan Carlos',
            'last_name': 'Pérez García',
            'phone': '1111111111'
        }
        response = self.client.patch(f'/api/user/{self.user.id}', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Juan Carlos')
    
    def test_delete_user(self):
        """Test eliminar usuario"""
        response = self.client.delete(f'/api/user/{self.user.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(User.objects.count(), 0)


class AuthenticationViewTest(APITestCase):
    """Tests para AuthenticationView"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create(
            first_name='Test',
            last_name='User',
            email='test@test.com',
            password='password123'
        )
    
    @patch('AppResolution.views.send_auth_email')
    @patch('AppResolution.views.generate_auth_code')
    @patch('AppResolution.views.get_latest_auth_code')
    def test_generate_auth_code(self, mock_get_code, mock_generate, mock_send_email):
        """Test generar código de autenticación"""
        mock_generate.return_value = '123456'
        mock_get_code.return_value = '123456'
        mock_send_email.return_value = True
        
        response = self.client.get(f'/api/auth/{self.user.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('auth_code', response.data)
    
    def test_verify_auth_code_success(self):
        """Test verificar código de autenticación exitoso"""
        # Crear código de autenticación
        auth = Authentication.objects.create(user=self.user, token='123456')
        
        data = {
            'user_id': self.user.id,
            'code': '123456'
        }
        response = self.client.post('/api/auth', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Verificar que el usuario fue marcado como verificado
        self.user.refresh_from_db()
        self.assertEqual(self.user.verified, 1)
    
    def test_verify_auth_code_invalid(self):
        """Test verificar código de autenticación inválido"""
        Authentication.objects.create(user=self.user, token='123456')
        
        data = {
            'user_id': self.user.id,
            'code': '654321'
        }
        response = self.client.post('/api/auth', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_verify_token_for_password_recovery(self):
        """Test verificar token para recuperación de contraseña"""
        Authentication.objects.create(user=self.user, token='123456')
        
        data = {
            'user_id': self.user.id,
            'code': '123456'
        }
        response = self.client.put('/api/auth', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])


class ClaimViewTest(APITestCase):
    """Tests para ClaimView"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create(
            first_name='Test',
            last_name='User',
            email='test@test.com',
            password='password123'
        )
        self.claim_data = {
            'user': self.user.id,
            'subject': 'Test Claim',
            'description': 'Test Description',
            'status': 'pendiente'
        }
    
    def test_create_claim_success(self):
        """Test crear reclamo exitosamente"""
        response = self.client.post('/api/claim', self.claim_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Claim.objects.count(), 1)
    
    def test_create_claim_without_user(self):
        """Test crear reclamo sin usuario"""
        data = self.claim_data.copy()
        del data['user']
        response = self.client.post('/api/claim', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_get_all_claims(self):
        """Test obtener todos los reclamos"""
        Claim.objects.create(
            user=self.user,
            subject='Test Claim',
            description='Test Description',
            status='pendiente'
        )
        response = self.client.get('/api/claim')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_get_claim_by_id(self):
        """Test obtener reclamo por ID"""
        claim = Claim.objects.create(
            user=self.user,
            subject='Test Claim',
            description='Test Description',
            status='pendiente'
        )
        response = self.client.get(f'/api/claim/{claim.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['subject'], claim.subject)
    
    def test_get_claims_by_user(self):
        """Test obtener reclamos por usuario"""
        Claim.objects.create(
            user=self.user,
            subject='Test Claim',
            description='Test Description',
            status='pendiente'
        )
        response = self.client.get(f'/api/claim/user/{self.user.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_update_claim(self):
        """Test actualizar reclamo"""
        claim = Claim.objects.create(
            user=self.user,
            subject='Test Claim',
            description='Test Description',
            status='pendiente'
        )
        data = {'status': 'completado'}
        response = self.client.put(f'/api/claim/{claim.id}', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        claim.refresh_from_db()
        self.assertEqual(claim.status, 'completado')
    
    def test_delete_claim(self):
        """Test eliminar reclamo"""
        claim = Claim.objects.create(
            user=self.user,
            subject='Test Claim',
            description='Test Description',
            status='pendiente'
        )
        response = self.client.delete(f'/api/claim/{claim.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Claim.objects.count(), 0)


class RequestViewTest(APITestCase):
    """Tests para RequestView"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create(
            first_name='Test',
            last_name='User',
            email='test@test.com',
            password='password123'
        )
        self.request_data = {
            'user': self.user.id,
            'subject': 'Test Request',
            'description': 'Test Description',
            'status': 'pendiente'
        }
    
    def test_create_request_success(self):
        """Test crear solicitud exitosamente"""
        response = self.client.post('/api/request', self.request_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Request.objects.count(), 1)
    
    def test_create_request_without_user(self):
        """Test crear solicitud sin usuario"""
        data = self.request_data.copy()
        del data['user']
        response = self.client.post('/api/request', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_get_all_requests(self):
        """Test obtener todas las solicitudes"""
        Request.objects.create(
            user=self.user,
            subject='Test Request',
            description='Test Description',
            status='pendiente'
        )
        response = self.client.get('/api/request')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_get_request_by_id(self):
        """Test obtener solicitud por ID"""
        request_obj = Request.objects.create(
            user=self.user,
            subject='Test Request',
            description='Test Description',
            status='pendiente'
        )
        response = self.client.get(f'/api/request/{request_obj.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['subject'], request_obj.subject)
    
    def test_get_requests_by_user(self):
        """Test obtener solicitudes por usuario"""
        Request.objects.create(
            user=self.user,
            subject='Test Request',
            description='Test Description',
            status='pendiente'
        )
        response = self.client.get(f'/api/request/user/{self.user.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_update_request(self):
        """Test actualizar solicitud"""
        request_obj = Request.objects.create(
            user=self.user,
            subject='Test Request',
            description='Test Description',
            status='pendiente'
        )
        data = {'status': 'completado'}
        response = self.client.put(f'/api/request/{request_obj.id}', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        request_obj.refresh_from_db()
        self.assertEqual(request_obj.status, 'completado')
    
    def test_delete_request(self):
        """Test eliminar solicitud"""
        request_obj = Request.objects.create(
            user=self.user,
            subject='Test Request',
            description='Test Description',
            status='pendiente'
        )
        response = self.client.delete(f'/api/request/{request_obj.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Request.objects.count(), 0)


class ProfileViewTest(APITestCase):
    """Tests para ProfileView"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create(
            first_name='Test',
            last_name='User',
            email='test@test.com',
            password='password123'
        )
        self.profile_data = {
            'first_name': 'Juan',
            'last_name': 'Pérez',
            'email': 'juan@test.com',
            'password': 'password123',
            'phone': '1234567890',
            'photo': 'photo.jpg'
        }
    
    def test_create_profile_success(self):
        """Test crear perfil exitosamente"""
        response = self.client.post('/api/profile', self.profile_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Profile.objects.count(), 1)
    
    def test_get_all_profiles(self):
        """Test obtener todos los perfiles"""
        Profile.objects.create(**self.profile_data)
        response = self.client.get('/api/profile')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_get_profile_by_id(self):
        """Test obtener perfil por ID"""
        profile = Profile.objects.create(**self.profile_data)
        response = self.client.get(f'/api/profile/{profile.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], profile.email)
    
    def test_update_profile(self):
        """Test actualizar perfil"""
        profile = Profile.objects.create(**self.profile_data)
        data = {'first_name': 'Juan Carlos', 'phone': '0987654321'}
        response = self.client.patch(f'/api/profile/{profile.id}', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        profile.refresh_from_db()
        self.assertEqual(profile.first_name, 'Juan Carlos')
        self.assertEqual(profile.phone, '0987654321')


class LoginViewTest(APITestCase):
    """Tests para LoginView"""
    
    def setUp(self):
        self.client = APIClient()
        self.password = 'password123'
        self.user = User.objects.create(
            first_name='Test',
            last_name='User',
            email='test@test.com',
            password=make_password(self.password),
            verified=1
        )
    
    def test_login_success(self):
        """Test login exitoso"""
        data = {
            'email': 'test@test.com',
            'password': self.password
        }
        response = self.client.post('/api/login', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)
        self.assertIn('token', response.data)
    
    def test_login_invalid_credentials(self):
        """Test login con credenciales inválidas"""
        data = {
            'email': 'test@test.com',
            'password': 'wrongpassword'
        }
        response = self.client.post('/api/login', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_login_unverified_user(self):
        """Test login con usuario no verificado"""
        self.user.verified = 0
        self.user.save()
        
        data = {
            'email': 'test@test.com',
            'password': self.password
        }
        response = self.client.post('/api/login', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_login_user_not_found(self):
        """Test login con usuario que no existe"""
        data = {
            'email': 'noexiste@test.com',
            'password': self.password
        }
        response = self.client.post('/api/login', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class AdminViewTest(APITestCase):
    """Tests para AdminView"""
    
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create(
            first_name='Admin',
            last_name='User',
            email='admin@test.com',
            password='password123',
            is_admin=True
        )
        self.regular_user = User.objects.create(
            first_name='Regular',
            last_name='User',
            email='user@test.com',
            password='password123',
            is_admin=False
        )
        
        # Crear algunos reclamos y solicitudes
        self.claim = Claim.objects.create(
            user=self.regular_user,
            subject='Test Claim',
            description='Test Description',
            status='pendiente'
        )
        self.request = Request.objects.create(
            user=self.regular_user,
            subject='Test Request',
            description='Test Description',
            status='pendiente'
        )
    
    def test_admin_get_all_data_success(self):
        """Test admin obtiene todos los datos exitosamente"""
        response = self.client.get(f'/api/admin?user_id={self.admin_user.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('claims', response.data)
        self.assertIn('requests', response.data)
        self.assertEqual(len(response.data['claims']), 1)
        self.assertEqual(len(response.data['requests']), 1)
    
    def test_admin_access_denied_for_regular_user(self):
        """Test acceso denegado para usuario regular"""
        response = self.client.get(f'/api/admin?user_id={self.regular_user.id}')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_admin_update_claim_status(self):
        """Test admin actualiza estado de reclamo"""
        data = {
            'user_id': self.admin_user.id,
            'type': 'claim',
            'id': self.claim.id,
            'status': 'completado'
        }
        response = self.client.patch('/api/admin', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.claim.refresh_from_db()
        self.assertEqual(self.claim.status, 'completado')
    
    def test_admin_update_request_status(self):
        """Test admin actualiza estado de solicitud"""
        data = {
            'user_id': self.admin_user.id,
            'type': 'request',
            'id': self.request.id,
            'status': 'en proceso'
        }
        response = self.client.patch('/api/admin', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.request.refresh_from_db()
        self.assertEqual(self.request.status, 'en proceso')


class ReportsViewTest(APITestCase):
    """Tests para ReportsView"""
    
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create(
            first_name='Admin',
            last_name='User',
            email='admin@test.com',
            password='password123',
            is_admin=True
        )
        self.regular_user = User.objects.create(
            first_name='Regular',
            last_name='User',
            email='user@test.com',
            password='password123',
            is_admin=False
        )
        
        # Crear datos de prueba
        Claim.objects.create(
            user=self.regular_user,
            subject='Claim 1',
            description='Description 1',
            status='pendiente'
        )
        Claim.objects.create(
            user=self.regular_user,
            subject='Claim 2',
            description='Description 2',
            status='completado'
        )
        Request.objects.create(
            user=self.regular_user,
            subject='Request 1',
            description='Description 1',
            status='en proceso'
        )
    
    def test_reports_success_for_admin(self):
        """Test reportes exitoso para admin"""
        response = self.client.get(f'/api/reports/?user_id={self.admin_user.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar estructura de respuesta
        self.assertIn('claims_stats', response.data)
        self.assertIn('requests_stats', response.data)
        self.assertIn('claims_chart_data', response.data)
        self.assertIn('requests_chart_data', response.data)
        self.assertIn('date_range', response.data)
        
        # Verificar estadísticas
        claims_stats = response.data['claims_stats']
        self.assertEqual(claims_stats['total'], 2)
        self.assertEqual(claims_stats['pendiente'], 1)
        self.assertEqual(claims_stats['completado'], 1)
        
        requests_stats = response.data['requests_stats']
        self.assertEqual(requests_stats['total'], 1)
        self.assertEqual(requests_stats['en_proceso'], 1)
    
    def test_reports_access_denied_for_regular_user(self):
        """Test acceso denegado a reportes para usuario regular"""
        response = self.client.get(f'/api/reports/?user_id={self.regular_user.id}')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_reports_missing_user_id(self):
        """Test reportes sin user_id"""
        response = self.client.get('/api/reports/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_reports_chart_data_structure(self):
        """Test estructura de datos de gráficas"""
        response = self.client.get(f'/api/reports/?user_id={self.admin_user.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que los datos de gráficas tienen 30 días
        self.assertEqual(len(response.data['claims_chart_data']), 30)
        self.assertEqual(len(response.data['requests_chart_data']), 30)
        
        # Verificar estructura de cada elemento
        chart_item = response.data['claims_chart_data'][0]
        self.assertIn('date', chart_item)
        self.assertIn('pendiente', chart_item)
        self.assertIn('en_proceso', chart_item)
        self.assertIn('completado', chart_item)
        self.assertIn('total', chart_item)


class UtilsTest(TestCase):
    """Tests para funciones de utilidad"""
    
    def test_generate_auth_code(self):
        """Test generar código de autenticación"""
        code = generate_auth_code()
        # Verificar que es un string de 6 dígitos
        self.assertIsInstance(code, str)
        self.assertEqual(len(code), 6)
        self.assertTrue(code.isdigit())
    
    def test_get_latest_auth_code(self):
        """Test obtener último código de autenticación"""
        # Primero generar un código
        generate_auth_code()
        latest_code = get_latest_auth_code()
        self.assertIsNotNone(latest_code)


class IntegrationTest(APITestCase):
    """Tests de integración para flujos completos"""
    
    def setUp(self):
        self.client = APIClient()
    
    def test_complete_user_registration_flow(self):
        """Test flujo completo de registro de usuario"""
        # 1. Crear usuario
        user_data = {
            'first_name': 'Juan',
            'last_name': 'Pérez',
            'email': 'juan@test.com',
            'password': 'password123',
            'phone': '1234567890',
            'is_admin': False
        }
        response = self.client.post('/api/user', user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user_id = response.data['id']
        
        # 2. Generar código de verificación
        with patch('AppResolution.views.send_auth_email'), \
             patch('AppResolution.views.generate_auth_code') as mock_generate, \
             patch('AppResolution.views.get_latest_auth_code') as mock_get_code:
            
            mock_generate.return_value = '123456'
            mock_get_code.return_value = '123456'
            
            response = self.client.get(f'/api/auth/{user_id}')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 3. Verificar código
        verify_data = {
            'user_id': user_id,
            'code': '123456'
        }
        response = self.client.post('/api/auth', verify_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 4. Login
        login_data = {
            'email': 'juan@test.com',
            'password': 'password123'
        }
        response = self.client.post('/api/login', login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)
    
    def test_complete_claim_lifecycle(self):
        """Test ciclo de vida completo de un reclamo"""
        # Crear usuario
        user = User.objects.create(
            first_name='Test',
            last_name='User',
            email='test@test.com',
            password='password123',
            verified=1
        )
        
        # Crear admin
        admin = User.objects.create(
            first_name='Admin',
            last_name='User',
            email='admin@test.com',
            password='password123',
            is_admin=True
        )
        
        # 1. Usuario crea reclamo
        claim_data = {
            'user': user.id,
            'subject': 'Test Claim',
            'description': 'Test Description'
        }
        response = self.client.post('/api/claim', claim_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        claim_id = response.data['id']
        
        # 2. Admin ve el reclamo
        response = self.client.get(f'/api/admin?user_id={admin.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['claims']), 1)
        
        # 3. Admin actualiza estado
        update_data = {
            'user_id': admin.id,
            'type': 'claim',
            'id': claim_id,
            'status': 'en proceso'
        }
        response = self.client.patch('/api/admin', update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 4. Usuario ve su reclamo actualizado
        response = self.client.get(f'/api/claim/{claim_id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'en proceso')
        
        # 5. Admin completa el reclamo
        update_data['status'] = 'completado'
        response = self.client.patch('/api/admin', update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 6. Verificar en reportes
        response = self.client.get(f'/api/reports/?user_id={admin.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['claims_stats']['completado'], 1)


if __name__ == '__main__':
    import django
    from django.conf import settings
    from django.test.utils import get_runner
    
    django.setup()
    TestRunner = get_runner(settings)
    test_runner = TestRunner()
    failures = test_runner.run_tests(["AppResolution.tests"])
