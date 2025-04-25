from django.urls import path

from AppResolution.views import UserView, ClaimView, RequestView, ProfileView, AuthenticationView

urlpatterns = [
    # User endpoints
    path('user', UserView.as_view()),
    path('user/<int:pk>', UserView.as_view()),

    #Auth endpoints
    path('auth', AuthenticationView.as_view()),
    path('auth/<int:pkid>', AuthenticationView.as_view()),

    # Claim endpoints
    path('claim', ClaimView.as_view()),
    
    # Request endpoints
    path('request', RequestView.as_view()),
    
    # Profile endpoints
    path('profile', ProfileView.as_view()),
]
