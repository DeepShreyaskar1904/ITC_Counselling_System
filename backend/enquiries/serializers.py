from rest_framework import serializers
from .models import Enquiry


class EnquirySerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(
        source="course.name",
        read_only=True
    )

    class Meta:
        model = Enquiry
        fields = "__all__"
        read_only_fields = ["id", "status", "created_at"]