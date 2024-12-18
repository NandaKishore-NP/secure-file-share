from rest_framework import permissions
from django.utils import timezone

class IsOwnerOrSharedWith(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Check if user is the owner
        if obj.owner == request.user:
            return True

        # Check if the file is shared with the user
        share = obj.shares.filter(shared_with=request.user).first()
        if share:
            # Check if share has expired
            if share.expires_at and share.expires_at < timezone.now():
                return False
            
            # For download views, check if the action matches the permission
            if view.__class__.__name__ == 'FileDownloadView':
                is_download = request.query_params.get('download', 'true').lower() == 'true'
                if is_download:
                    return share.permission == 'DOWNLOAD'
                return share.permission in ['VIEW', 'DOWNLOAD']
            
            return True

        return False 