from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
import pyotp
import qrcode
import io
import base64
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    MFASerializer,
    MFASetupSerializer,
)

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class UserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

class MFASetupView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if request.user.mfa_enabled:
            return Response({"detail": "MFA is already enabled."}, status=status.HTTP_400_BAD_REQUEST)

        # Generate secret key
        secret = pyotp.random_base32()
        request.user.mfa_secret = secret
        request.user.save()

        # Generate QR code
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(request.user.email, issuer_name="Secure File Share")
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        qr_code = base64.b64encode(buffer.getvalue()).decode()

        return Response({
            "secret": secret,
            "qr_code": qr_code
        })

    def post(self, request):
        serializer = MFASetupSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.mfa_enabled = True
            request.user.save()
            return Response({"detail": "MFA enabled successfully."})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MFAVerifyView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = MFASerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            refresh = RefreshToken.for_user(request.user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MFADisableView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = MFASerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.mfa_enabled = False
            request.user.mfa_secret = None
            request.user.save()
            return Response({"detail": "MFA disabled successfully."})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST) 