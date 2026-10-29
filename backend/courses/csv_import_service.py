
import csv
import io
from decimal import Decimal, InvalidOperation

from django.db import transaction

from .models import Course, CourseModule


REQUIRED_COLUMNS = {
    "Course_Id",
    "Course_Name",
    "Course_Description",
    "Course_Duration_Month",
    "Category_Id",
    "Category_Name",
    "Module_Id",
    "Module_Name",
}


def map_category(category_name):
    name = (category_name or "").strip().lower()

    if any(x in name for x in ["artificial intelligence", "machine learning", "ai", "ml"]):
        return "ai_ml"

    if any(x in name for x in ["data science", "data analytics", "analytics"]):
        return "data_science"

    if any(x in name for x in ["web development", "web design", "frontend", "backend"]):
        return "web_development"

    if any(x in name for x in ["programming", "python", "java", "coding"]):
        return "programming"

    return "other"


def import_courses_csv(uploaded_file):
    if not uploaded_file.name.lower().endswith(".csv"):
        raise ValueError("Please upload a CSV file.")

    if uploaded_file.size > 10 * 1024 * 1024:
        raise ValueError("CSV file must be smaller than 10 MB.")

    try:
        content = uploaded_file.read().decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise ValueError("CSV must use UTF-8 encoding.") from exc

    reader = csv.DictReader(io.StringIO(content))

    if not reader.fieldnames:
        raise ValueError("CSV is empty or has no header row.")

    reader.fieldnames = [name.strip() for name in reader.fieldnames]

    missing = REQUIRED_COLUMNS - set(reader.fieldnames)
    if missing:
        raise ValueError(
            "Missing required columns: " + ", ".join(sorted(missing))
        )

    rows = list(reader)

    if not rows:
        raise ValueError("CSV contains no data rows.")

    # Validate all course IDs and names before changing the database.
    course_data = {}
    module_data = {}

    for line_number, row in enumerate(rows, start=2):
        try:
            course_id = int((row.get("Course_Id") or "").strip())
        except (ValueError, AttributeError) as exc:
            raise ValueError(
                f"Invalid Course_Id on CSV line {line_number}."
            ) from exc

        course_name = (row.get("Course_Name") or "").strip()
        if not course_name:
            raise ValueError(
                f"Course_Name is empty on CSV line {line_number}."
            )

        category_id_text = (row.get("Category_Id") or "").strip()
        category_id = int(category_id_text) if category_id_text else None

        category_name = (row.get("Category_Name") or "").strip()
        description = (row.get("Course_Description") or "").strip()
        duration_months = (
            row.get("Course_Duration_Month") or ""
        ).strip()

        if course_id not in course_data:
            course_data[course_id] = {
                "name": course_name,
                "description": description,
                "duration": (
                    f"{duration_months} months" if duration_months else ""
                ),
                "category_id": category_id,
                "category_name": category_name,
            }
        else:
            # A course appears on multiple rows because it can have modules.
            previous = course_data[course_id]
            if (
                previous["name"] != course_name
                or previous["category_id"] != category_id
            ):
                raise ValueError(
                    f"Inconsistent course data for Course_Id {course_id}."
                )

        module_id_text = (row.get("Module_Id") or "").strip()
        module_name = (row.get("Module_Name") or "").strip()

        if module_id_text and module_name:
            try:
                module_id = int(module_id_text)
            except ValueError as exc:
                raise ValueError(
                    f"Invalid Module_Id on CSV line {line_number}."
                ) from exc

            key = (course_id, module_id)
            module_data[key] = module_name

    created_courses = 0
    updated_courses = 0
    created_modules = 0
    updated_modules = 0

    with transaction.atomic():
        for source_id, data in course_data.items():
            course = Course.objects.filter(
                source_course_id=source_id
            ).first()

            if course is None:
                course = Course(
                    source_course_id=source_id,
                    name=data["name"],
                    description=data["description"],
                    duration=data["duration"],
                    source_category_id=data["category_id"],
                    source_category_name=data["category_name"],
                    category=map_category(data["category_name"]),
                    level="beginner",
                    is_published=False,
                )
                course.save()
                created_courses += 1
            else:
                course.name = data["name"]
                course.description = data["description"]
                course.duration = data["duration"]
                course.source_category_id = data["category_id"]
                course.source_category_name = data["category_name"]
                course.category = map_category(data["category_name"])
                course.save()
                updated_courses += 1

        for (source_course_id, source_module_id), title in module_data.items():
            course = Course.objects.get(
                source_course_id=source_course_id
            )

            module = CourseModule.objects.filter(
                course=course,
                source_module_id=source_module_id,
            ).first()

            if module is None:
                # Append after existing modules to avoid order conflicts.
                last_order = (
                    CourseModule.objects.filter(course=course)
                    .order_by("-order")
                    .values_list("order", flat=True)
                    .first()
                    or 0
                )

                CourseModule.objects.create(
                    course=course,
                    source_module_id=source_module_id,
                    title=title,
                    order=last_order + 1,
                )
                created_modules += 1
            else:
                module.title = title
                module.save(update_fields=["title"])

                updated_modules += 1

    return {
        "csv_rows": len(rows),
        "unique_courses": len(course_data),
        "created_courses": created_courses,
        "updated_courses": updated_courses,
        "created_modules": created_modules,
        "updated_modules": updated_modules,
    }
