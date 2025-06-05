from django.shortcuts import render

from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .models import Post, Like, Comment, SavedPost, UserProfile
from .serializers import (
    PostSerializer, LikeSerializer, CommentSerializer,
    SavedPostSerializer, UserProfileSerializer, UserSerializer
)
from django.contrib.auth.models import User
from rest_framework.permissions import IsAuthenticated

@api_view(['GET'])
def hello(request):
    return Response({"message": "Hello from Django!"})

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = self.get_object()
        like, created = Like.objects.get_or_create(user=request.user, post=post)
        if not created:
            like.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(LikeSerializer(like).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def save(self, request, pk=None):
        post = self.get_object()
        saved_post, created = SavedPost.objects.get_or_create(user=request.user, post=post)
        if not created:
            saved_post.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(SavedPostSerializer(saved_post).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
        post = self.get_object()
        serializer = CommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, post=post)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return UserProfile.objects.all()

    def get_object(self):
        if self.action == 'me':
            try:
                return self.request.user.profile
            except UserProfile.DoesNotExist:
                # Create a profile if it doesn't exist
                return UserProfile.objects.create(user=self.request.user)
        return super().get_object()

    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        try:
            profile = request.user.profile
        except UserProfile.DoesNotExist:
            # Create a new profile for the user
            profile = UserProfile.objects.create(user=request.user)

        if request.method == 'GET':
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def posts(self, request, pk=None):
        profile = self.get_object()
        posts = Post.objects.filter(user=profile.user).order_by('-created_at')
        serializer = PostSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_posts(self, request):
        try:
            profile = request.user.profile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=request.user)
        
        posts = Post.objects.filter(user=request.user).order_by('-created_at')
        serializer = PostSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def follow(self, request, pk=None):
        profile = self.get_object()
        if request.user == profile.user:
            return Response(
                {"error": "You cannot follow yourself"},
                status=status.HTTP_400_BAD_REQUEST
            )
        profile.followers.add(request.user)
        return Response(status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def unfollow(self, request, pk=None):
        profile = self.get_object()
        profile.followers.remove(request.user)
        return Response(status=status.HTTP_200_OK)

class SavedPostViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SavedPostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SavedPost.objects.filter(user=self.request.user)

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        # This action will be available at /api/users/me/
        # detail=False means it applies to the list endpoint, not a specific instance
        # methods=['get'] means it only responds to GET requests
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, url_path='me/posts', methods=['get'])
    def my_posts(self, request):
        # This action will be available at /api/users/me/posts/
        # detail=False means it applies to the list endpoint path (/api/users/)
        # url_path='me/posts' defines the sub-path after /api/users/
        # methods=['get'] means it only responds to GET requests
        if request.user.is_authenticated:
            # Filter posts to only include those by the current user
            user_posts = Post.objects.filter(user=request.user)
            # Serialize the posts using the PostSerializer
            serializer = PostSerializer(user_posts, many=True)
            return Response(serializer.data)
        else:
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_profile_picture(request):
    user_profile = request.user.profile
    profile_picture = request.FILES.get('profile_picture')
    if profile_picture:
        user_profile.profile_picture = profile_picture
        user_profile.save()
        return Response({'profile_picture': user_profile.profile_picture.url}, status=status.HTTP_200_OK)
    return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)
