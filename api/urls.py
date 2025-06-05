from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.urls import re_path

router = DefaultRouter()
router.register(r'profiles', views.UserProfileViewSet, basename='profile')
router.register(r'posts', views.PostViewSet, basename='post')
router.register(r'saved-posts', views.SavedPostViewSet, basename='saved-post')
router.register(r'users', views.UserViewSet, basename='user')

# Include all router URLs first
urlpatterns = router.urls

# Then add any additional URL patterns
urlpatterns += [
    path('posts/<int:post_id>/like/', views.like_post, name='like-post'),
    path('posts/<int:post_id>/unlike/', views.unlike_post, name='unlike-post'),
    path('posts/<int:post_id>/save/', views.save_post, name='save-post'),
    path('posts/<int:post_id>/unsave/', views.unsave_post, name='unsave-post'),
    path('posts/<int:post_id>/comments/', views.CommentViewSet.as_view({'get': 'list', 'post': 'create'}), name='post-comments'),
    path('comments/<int:pk>/', views.CommentViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='comment-detail'),
    path('users/upload_profile_picture/', views.upload_profile_picture, name='upload-profile-picture'),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += [
    re_path(r'^(?!api/|static/|media/).*$', TemplateView.as_view(template_name='index.html')),
]
