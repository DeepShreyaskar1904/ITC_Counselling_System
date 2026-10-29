from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("courses.urls")),
    path("api-auth/", include("rest_framework.urls")),
    path("api/v1/", include("enquiries.urls")),
    path("api/v1/", include("counselling.urls")),
    
]