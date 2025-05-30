from django.urls import path

from AppResolution.views import UserView, ClaimView, RequestView, ProfileView, AuthenticationView, LoginView, AdminView, ReportsView

urlpatterns = [
    # User endpoints
    path('user', UserView.as_view()),
    path('user/<int:pk>', UserView.as_view()),
    
    # Login endpoint
    path('login', LoginView.as_view()),

    # Auth endpoints
    path('auth', AuthenticationView.as_view()),
    path('auth/<int:pkid>', AuthenticationView.as_view()),
    path('auth/verify', AuthenticationView.as_view()),

    # Claim endpoints
    path('claim', ClaimView.as_view()),
    path('claim/<int:pk>', ClaimView.as_view()),
    path('claim/user/<int:user_id>', ClaimView.as_view()),
    
    # Request endpoints
    path('request', RequestView.as_view()),
    path('request/<int:pk>', RequestView.as_view()),
    path('request/user/<int:user_id>', RequestView.as_view()),
    
    # Profile endpoints
    path('profile', ProfileView.as_view()),
    path('profile/<int:pk>', ProfileView.as_view()),
    path('profile/user/<int:user_id>', ProfileView.as_view()),
    
    # Admin endpoints
    path('admin', AdminView.as_view()),
    
    # Reports endpoints
    path('reports/', ReportsView.as_view()),
]
