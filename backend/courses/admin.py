from django.contrib import admin
from .models import Course, CourseModule


class CourseModuleInline(admin.TabularInline):
    model = CourseModule
    extra = 1


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "level",
        "fees",
        "admission_status",
        "is_published",
    )
    list_filter = ("category", "level", "admission_status", "is_published")
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [CourseModuleInline]


admin.site.register(CourseModule)
from .models import FAQ

admin.site.register(FAQ)