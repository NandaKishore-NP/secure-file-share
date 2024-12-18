from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import File, FileShare
from .serializers import (
    FileSerializer,
    FileUploadSerializer,
    FileShareSerializer,
    SharedFileSerializer,
)
from .permissions import IsOwnerOrSharedWith

class FileListCreateView(generics.ListCreateAPIView):
    serializer_class = FileSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return File.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class FileUploadView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = FileUploadSerializer(data=request.data)
        if serializer.is_valid():
            uploaded_file = serializer.validated_data['file']
            file = File.objects.create(
                owner=request.user,
                name=serializer.validated_data['name'],
                file=uploaded_file,
                encrypted_key=serializer.validated_data['encrypted_key'],
                size=uploaded_file.size,
                mime_type=uploaded_file.content_type
            )
            return Response(FileSerializer(file).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class FileDetailView(generics.RetrieveDestroyAPIView):
    queryset = File.objects.all()
    serializer_class = FileSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrSharedWith)

class FileDownloadView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrSharedWith)

    def get(self, request, pk):
        file = get_object_or_404(File, pk=pk)
        
        # Check if user has permission through share
        if request.user != file.owner:
            share = FileShare.objects.filter(
                file=file,
                shared_with=request.user,
            ).first()
            
            if not share:
                return Response(
                    {"detail": "You don't have permission to access this file."},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Check if share has expired
            if share.is_expired:
                return Response(
                    {"detail": "This share has expired."},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Check if permission matches the request
            is_download = request.query_params.get('download', 'true').lower() == 'true'
            if is_download and share.permission != FileShare.Permission.DOWNLOAD:
                return Response(
                    {"detail": "You don't have permission to download this file."},
                    status=status.HTTP_403_FORBIDDEN
                )

        response = FileResponse(file.file, content_type=file.mime_type)
        if request.query_params.get('download', 'true').lower() == 'true':
            response['Content-Disposition'] = f'attachment; filename="{file.name}"'
        else:
            response['Content-Disposition'] = f'inline; filename="{file.name}"'
        return response

class FileShareCreateView(generics.CreateAPIView):
    serializer_class = FileShareSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def perform_create(self, serializer):
        serializer.save(shared_by=self.request.user)

class FileShareDetailView(generics.RetrieveAPIView):
    queryset = FileShare.objects.all()
    serializer_class = SharedFileSerializer
    permission_classes = (permissions.IsAuthenticated,)
    lookup_field = 'share_token'

    def get_object(self):
        share = super().get_object()
        if share.is_expired:
            raise permissions.exceptions.PermissionDenied("This share link has expired.")
        if share.shared_with and share.shared_with != self.request.user:
            raise permissions.exceptions.PermissionDenied("You don't have permission to access this file.")
        return share

class SharedWithMeListView(generics.ListAPIView):
    serializer_class = SharedFileSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        # Return all files shared with the user, including expired ones
        return FileShare.objects.filter(shared_with=self.request.user)
  