from rest_framework import serializers
from .models import Course, CourseModule
from .models import FAQ


class FAQSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(
        source="course.name",
        read_only=True
    )

    class Meta:
        model = FAQ
        fields = "__all__"

class CourseModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseModule
        fields = ["id", "title", "description", "order"]


class CourseSerializer(serializers.ModelSerializer):
    modules = CourseModuleSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = "__all__"
        read_only_fields = ["id", "slug", "created_at", "updated_at"]
