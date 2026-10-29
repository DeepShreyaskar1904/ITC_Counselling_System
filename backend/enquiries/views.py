from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAdminUser
from .models import Enquiry
from .serializers import EnquirySerializer


class EnquiryViewSet(viewsets.ModelViewSet):
    serializer_class = EnquirySerializer

    def get_queryset(self):
        return Enquiry.objects.select_related("course").order_by("-created_at")

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        return [IsAdminUser()]