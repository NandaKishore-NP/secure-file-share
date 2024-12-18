from django.urls import path
from .views import (
    FileListCreateView,
    FileDetailView,
    FileUploadView,
    FileDownloadView,
    FileShareCreateView,
    FileShareDetailView,
    SharedWithMeListView,
)

urlpatterns = [
    path('', FileListCreateView.as_view(), name='file-list'),
    path('<int:pk>/', FileDetailView.as_view(), name='file-detail'),
    path('upload/', FileUploadView.as_view(), name='file-upload'),
    path('<int:pk>/download/', FileDownloadView.as_view(), name='file-download'),
    path('share/', FileShareCreateView.as_view(), name='file-share-create'),
    path('share/<uuid:share_token>/', FileShareDetailView.as_view(), name='file-share-detail'),
    path('shared-with-me/', SharedWithMeListView.as_view(), name='shared-with-me'),
] 