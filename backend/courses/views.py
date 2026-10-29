
from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

from .models import Course, FAQ
from .serializers import CourseSerializer, FAQSerializer
from .csv_import_service import import_courses_csv


class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer

    def get_queryset(self):
        queryset = Course.objects.all()

        # Public users can see only published courses.
        if not self.request.user.is_authenticated or not self.request.user.is_staff:
            queryset = queryset.filter(is_published=True)

        return queryset

    def get_permissions(self):
        # Anyone can view courses.
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]

        # Only admin/staff users can create, update, or delete courses.
        return [IsAdminUser()]


class FAQViewSet(viewsets.ModelViewSet):
    serializer_class = FAQSerializer

    def get_queryset(self):
        queryset = FAQ.objects.select_related("course")

        # Public users can see only published FAQs.
        if not self.request.user.is_authenticated or not self.request.user.is_staff:
            queryset = queryset.filter(is_published=True)

        return queryset

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]

        return [IsAdminUser()]


class CourseCSVImportView(APIView):
    # Only authenticated admin/staff users can import CSV files.
    permission_classes = [IsAdminUser]

    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded_file = request.FILES.get("file")

        if not uploaded_file:
            return Response(
                {
                    "error": "Upload a CSV file using the 'file' field."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = import_courses_csv(uploaded_file)

        except (ValueError, TypeError) as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as exc:
            print("CSV IMPORT ERROR:", repr(exc))

            return Response(
                {
                    "error": "CSV import failed. Check the Django terminal."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "message": "CSV imported successfully.",
                "result": result,
                "ai_refresh": (
                    "Not run yet. RAG indexing will be added next."
                ),
            },
            status=status.HTTP_200_OK,
        )
