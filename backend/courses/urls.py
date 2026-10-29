from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, FAQViewSet
from .views import CourseCSVImportView

from django.urls import path
router = DefaultRouter()
router.register("courses", CourseViewSet, basename="course")
router.register("faqs", FAQViewSet, basename="faq")
urlpatterns = router.urls


urlpatterns += [
    path(
        "admin/import-csv/",
        CourseCSVImportView.as_view(),
        name="course-csv-import",
    ),
]
