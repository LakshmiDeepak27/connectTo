from django.contrib import admin
from django.urls import path
from . import views
from django.shortcuts import redirect

urlpatterns = [
    path('', views.homePage, name='home'),
    path('signup/', views.signup, name='signup'),
    path('signin/', views.signin, name='signin'),
    path('explore/', views.explore, name='explore'),
    path('verify-otp/', views.verify_otp, name='verify_otp'),
    path('resend-otp/', views.resend_otp, name='resend_otp'),
    path('logout/', views.user_logout, name='user_logout'),
    path('mobile-login/', lambda request: redirect('signin'), name='mobile_login'),
]