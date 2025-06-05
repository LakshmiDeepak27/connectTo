from django.shortcuts import redirect, render
from django.http import HttpResponse, JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from konnectia import settings
from .models import UserProfile, MobileOTP
from django.utils import timezone
from twilio.rest import Client
import random
from datetime import timedelta
from django.utils.crypto import get_random_string
from django.contrib.sites.shortcuts import get_current_site
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.template.loader import render_to_string
from django.core.mail import EmailMessage
from django.contrib.auth.tokens import PasswordResetTokenGenerator
import logging

# Token generator for email confirmation
generate_token = PasswordResetTokenGenerator()
from rest_framework_simplejwt.tokens import RefreshToken
from django.views.decorators.csrf import csrf_exempt
import json

logger = logging.getLogger(__name__)

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

def homePage(request):
    return render(request, "homePage.html")

def signup(request):
    if request.method == "POST":
        username = request.POST['username']
        fname = request.POST['fname']
        lname = request.POST['lname']
        email = request.POST['email']
        pass1 = request.POST['pass1']
        pass2 = request.POST['pass2']
        mobile = request.POST['mobile'].strip()
        
        # Format mobile number
        if not mobile.startswith('+'):
            mobile = '+' + mobile
        if not mobile.startswith('+91'):
            mobile = '+91' + mobile.lstrip('+')

        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists! Please try some other username.")
            return redirect('signup')

        if User.objects.filter(email=email).exists():
            messages.error(request, "Email already registered!")
            return redirect('signup')

        if len(username) > 20:
            messages.error(request, "Username must be under 20 characters!")
            return redirect('signup')

        if pass1 != pass2:
            messages.error(request, "Passwords didn't match!")
            return redirect('signup')

        if not username.isalnum():
            messages.error(request, "Username must be Alpha-Numeric!")
            return redirect('signup')

        myuser = User.objects.create_user(username, email, pass1)
        myuser.first_name = fname
        myuser.last_name = lname
        myuser.is_active = False
        myuser.save()

        # Create UserProfile with formatted mobile number
        UserProfile.objects.create(user=myuser, mobile=mobile)

        messages.success(request, "Your Account has been created successfully!! Please check your email to confirm your email address in order to activate your account.")

        # Welcome Email
        subject = "Welcome to Konnectia!!"
        message = "Hello " + myuser.first_name + "!! \n" + "Welcome to Konnectia!! \nThank you for visiting our website\n. We have also sent you a confirmation email, please confirm your email address. \n\nThanking You\nKonnectia Team"
        from_email = settings.EMAIL_HOST_USER
        to_list = [myuser.email]
        send_mail(subject, message, from_email, to_list, fail_silently=True)

        # Email Address Confirmation Email
        current_site = get_current_site(request)
        email_subject = "Confirm your Email @ Konnectia!!"
        message2 = render_to_string('authentication/email_confirmation.html', {
            'name': myuser.first_name,
            'domain': current_site.domain,
            'uid': urlsafe_base64_encode(force_bytes(myuser.pk)),
            'token': generate_token.make_token(myuser)
        })
        email = EmailMessage(
            email_subject,
            message2,
            settings.EMAIL_HOST_USER,
            [myuser.email],
        )
        email.fail_silently = True
        email.send()

        return redirect('signin')

    return render(request, 'authentication/signup.html')

def explore(request):
    return render(request, 'explore.html')

@csrf_exempt
def signin(request):
    if request.user.is_authenticated:
        if request.headers.get('Accept') == 'application/json':
            return JsonResponse({
                'status': 'success',
                'message': 'User is already authenticated',
                'tokens': get_tokens_for_user(request.user)
            })
        return redirect('http://localhost:5137/')
        
    if request.method == "POST":
        # Handle JSON requests from React
        if request.headers.get('Accept') == 'application/json':
            try:
                data = json.loads(request.body)
                auth_type = data.get('auth_type', 'email')
            except json.JSONDecodeError:
                return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
        else:
            auth_type = request.POST.get('auth_type', 'email')

        if auth_type == 'email':
            # Email/Password Authentication
            if request.headers.get('Accept') == 'application/json':
                username = data.get('username')
                password = data.get('password')
            else:
                username = request.POST['username']
                password = request.POST['pass1']

            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                # Update login info
                profile = UserProfile.objects.get(user=user)
                profile.update_login_info('email')
                
                # Get JWT tokens
                tokens = get_tokens_for_user(user)
                logger.info(f"Generated tokens for user {user.username}: {tokens}")
                
                if request.headers.get('Accept') == 'application/json':
                    response_data = {
                        'status': 'success',
                        'message': f'Welcome back, {user.first_name}!',
                        'tokens': {
                            'access': tokens.get('access'),
                            'refresh': tokens.get('refresh')
                        }
                    }
                    logger.info(f"Sending JSON response with tokens: {response_data}")
                    return JsonResponse(response_data)
                
                messages.success(request, f"Welcome back, {user.first_name}! You have been logged in successfully.")
                # Redirect to React app profile page with tokens in URL parameters
                redirect_url = f'http://localhost:5137/profile/me?access_token={tokens.get("access")}&refresh_token={tokens.get("refresh")}'
                logger.info(f"Redirecting to: {redirect_url}")
                return redirect(redirect_url)
            else:
                if request.headers.get('Accept') == 'application/json':
                    return JsonResponse({'status': 'error', 'message': 'Invalid username or password'}, status=401)
                messages.error(request, "Invalid username or password.")
                return render(request, 'authentication/signin.html')
        
        elif auth_type == 'otp':
            logger.info("Attempting OTP authentication flow (initial request).")
            # OTP Authentication
            if request.headers.get('Accept') == 'application/json':
                try:
                    data = json.loads(request.body)
                    mobile = data.get('mobile', '').strip()
                    logger.info(f"JSON request for initial OTP. Mobile: {mobile}")
                except json.JSONDecodeError:
                    logger.error("Invalid JSON data in initial OTP request.")
                    return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
            else:
                mobile = request.POST['mobile'].strip()
                logger.info(f"Form data for initial OTP. Mobile: {mobile}")

            # Format mobile number to ensure consistency
            if not mobile.startswith('+'):
                mobile = '+' + mobile
            if not mobile.startswith('+91'): # Assuming +91 is the standard country code
                mobile = '+91' + mobile.lstrip('+')
            logger.info(f"Formatted mobile number: {mobile}")

            user_found = False
            try:
                # Find user by mobile number
                profile = UserProfile.objects.get(mobile=mobile)
                user = profile.user
                logger.info(f"UserProfile found for mobile {mobile}. User: {user.username}.")
                user_found = True

            except UserProfile.DoesNotExist:
                logger.info(f"No UserProfile found for mobile {mobile}. Creating a new account.")
                # Create a new user and profile
                # Generate a unique username (e.g., based on mobile number or a random string)
                # Using mobile number (cleaning it up for username validity)
                username = mobile.replace('+', '').replace(' ', '') # Simple cleaning
                # Ensure username is unique and meets Django criteria (alphanumeric)
                # A more robust approach might handle collisions or use a random string + mobile
                i = 1
                while User.objects.filter(username=username).exists():
                    username = f"{mobile.replace('+', '').replace(' ', '')}_{i}"
                    i += 1

                # Create the Django User (requires username and password)
                # We can set an unusable password since login will be via OTP
                user = User.objects.create_user(
                    username=username,
                    password=None, # Or set_unusable_password()
                    # Optionally set email, first_name, last_name if you collect them later
                )
                user.set_unusable_password()
                user.is_active = False # Keep inactive until mobile is fully verified if needed later
                user.save()
                logger.info(f"New Django User created: {user.username}.")

                # Create the UserProfile for the new user
                profile = UserProfile.objects.create(user=user, mobile=mobile)
                logger.info(f"New UserProfile created for user {user.username} with mobile {mobile}.")
                messages.success(request, f"A new account has been created for {mobile}. Please verify the OTP to complete setup.")
                # After creating the user, proceed to generate and send OTP for the new user

            # --- Code to generate and send OTP (now outside UserProfile.DoesNotExist block) ---
            try:
                # Generate and send OTP via Twilio
                otp = ''.join(random.choices('0123456789', k=6))
                logger.info(f"Generated OTP for user {user.username}: {otp}")
                # Clean up old OTPs for this user
                MobileOTP.objects.filter(user=user, is_verified=False).delete()
                MobileOTP.objects.create(user=user, otp=otp, expires_at=timezone.now() + timedelta(minutes=10))
                logger.info(f"MobileOTP object created for user {user.username}.")

                # ** Ensure JWT tokens are NOT generated at this stage **

                client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                message = client.messages.create(
                    body=f"Your Konnectia OTP is: {otp}",
                    from_=settings.TWILIO_PHONE_NUMBER,
                    to=profile.mobile
                )
                logger.info(f"OTP sent via Twilio to {profile.mobile}.")

                if request.headers.get('Accept') == 'application/json':
                    logger.info("Sending JSON success response for initial OTP request.")
                    return JsonResponse({
                        'status': 'success',
                        'message': 'OTP sent successfully',
                        'mobile': mobile,
                        'username': user.username
                    })

                messages.success(request, "OTP sent to your mobile number.")
                logger.info("Rendering verify_otp template after sending OTP.")
                return render(request, 'authentication/verify_otp.html', {
                    'mobile': mobile,
                    'username': user.username
                })
            except Exception as e:
                logger.error(f"Twilio error while sending OTP: {e}", exc_info=True)
                if request.headers.get('Accept') == 'application/json':
                    return JsonResponse({'status': 'error', 'message': 'Could not send OTP'}, status=500)
                messages.error(request, f"Could not send OTP. Please try again later.")
                # Render signin template again on Twilio error
                return render(request, 'authentication/signin.html', {
                    'mobile': mobile,
                    'auth_type': 'otp'
                })

    # GET request or initial load
    return render(request, 'authentication/signin.html')

def resend_otp(request):
    if request.method == "POST":
        mobile = request.POST['mobile']
        username = request.POST['username']
        try:
            profile = UserProfile.objects.get(mobile=mobile)
            user = profile.user
            
            # Generate and send new OTP
            otp = ''.join(random.choices('0123456789', k=6))
            MobileOTP.objects.filter(user=user, is_verified=False).delete()  # Clean up old OTPs
            MobileOTP.objects.create(user=user, otp=otp, expires_at=timezone.now() + timedelta(minutes=10))
            
            try:
                client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                message = client.messages.create(     
                    body=f"Your new Konnectia OTP is: {otp}",
                    from_=settings.TWILIO_PHONE_NUMBER,
                    to=profile.mobile
                )
                messages.success(request, "New OTP has been sent to your mobile number.")
            except Exception as e:
                logger.error(f"Twilio error while resending OTP: {str(e)}")
                messages.error(request, "Could not send OTP. Please try again later.")
                return redirect('signin')
                
            return render(request, 'authentication/verify_otp.html', {
                'mobile': mobile,
                'username': username
            })
        except UserProfile.DoesNotExist:
            messages.error(request, "Invalid request.")
            return redirect('signin')
    return redirect('signin')

@csrf_exempt
def verify_otp(request):
    if request.method == "POST":
        if request.headers.get('Accept') == 'application/json':
            try:
                data = json.loads(request.body)
                mobile = data.get('mobile')
                otp = data.get('otp')
                username = data.get('username')
            except json.JSONDecodeError:
                return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
        else:
            mobile = request.POST['mobile']
            otp = request.POST['otp']
            username = request.POST['username']

        try:
            profile = UserProfile.objects.get(mobile=mobile)
            user = profile.user
            otp_obj = MobileOTP.objects.filter(user=user, is_verified=False).latest('created_at')
            
            if not otp_obj.is_valid():
                if request.headers.get('Accept') == 'application/json':
                    return JsonResponse({'status': 'error', 'message': 'OTP expired or too many attempts'}, status=400)
                messages.error(request, "OTP expired or too many attempts. Please request a new OTP.")
                return redirect('signin')
                
            if otp_obj.otp == otp:
                otp_obj.mark_as_verified()
                login(request, user)
                profile.update_login_info('otp')
                
                # Get JWT tokens
                tokens = get_tokens_for_user(user)
                logger.info(f"Generated tokens for OTP user {user.username}: {tokens}")
                
                if request.headers.get('Accept') == 'application/json':
                    response_data = {
                        'status': 'success',
                        'message': f'Welcome, {user.first_name}!',
                        'tokens': {
                            'access': tokens.get('access'),
                            'refresh': tokens.get('refresh')
                        }
                    }
                    logger.info(f"Sending JSON response with tokens: {response_data}")
                    return JsonResponse(response_data)
                    
                messages.success(request, f"Welcome, {user.first_name}! You have been logged in successfully.")
                # Redirect to React app profile page with tokens in URL parameters
                redirect_url = f'http://localhost:5137/profile/me?access_token={tokens.get("access")}&refresh_token={tokens.get("refresh")}'
                logger.info(f"Redirecting to: {redirect_url}")
                return redirect(redirect_url)
            else:
                otp_obj.increment_attempts()
                remaining_attempts = 3 - otp_obj.attempts
                if remaining_attempts > 0:
                    if request.headers.get('Accept') == 'application/json':
                        return JsonResponse({
                            'status': 'error',
                            'message': f'Invalid OTP. {remaining_attempts} attempts remaining'
                        }, status=400)
                    messages.error(request, f"Invalid OTP. {remaining_attempts} attempts remaining.")
                else:
                    if request.headers.get('Accept') == 'application/json':
                        return JsonResponse({
                            'status': 'error',
                            'message': 'Maximum attempts exceeded'
                        }, status=400)
                    messages.error(request, "Maximum attempts exceeded. Please request a new OTP.")
                    return redirect('signin')
                return render(request, 'authentication/verify_otp.html', {
                    'mobile': mobile,
                    'username': username
                })
        except (UserProfile.DoesNotExist, MobileOTP.DoesNotExist):
            if request.headers.get('Accept') == 'application/json':
                return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)
            messages.error(request, "Invalid request.")
            return redirect('signin')
    return redirect('signin')

@csrf_exempt
def user_logout(request):
    if request.user.is_authenticated:
        # Update user profile
        profile = UserProfile.objects.get(user=request.user)
        profile.logout()
    logout(request)
    
    # Handle API request (from React app)
    if request.headers.get('Accept') == 'application/json':
        return JsonResponse({
            'status': 'success',
            'message': 'Logged out successfully'
        })
    
    # Handle regular request (from Django templates)
    messages.success(request, "You have been logged out successfully.")
    return redirect('signin')
