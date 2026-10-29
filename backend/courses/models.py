# from django.db import models
# from django.utils.text import slugify


# class Course(models.Model):
#     CATEGORY_CHOICES = [
#         ("programming", "Programming"),
#         ("web_development", "Web Development"),
#         ("data_science", "Data Science"),
#         ("ai_ml", "AI & Machine Learning"),
#         ("other", "Other"),
#     ]

#     LEVEL_CHOICES = [
#         ("beginner", "Beginner"),
#         ("intermediate", "Intermediate"),
#         ("advanced", "Advanced"),
#     ]

#     ADMISSION_CHOICES = [
#         ("open", "Open"),
#         ("closed", "Closed"),
#         ("upcoming", "Upcoming"),
#     ]

#     name = models.CharField(max_length=200)
#     slug = models.SlugField(max_length=220, unique=True, blank=True)
#     description = models.TextField()
#     category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
#     level = models.CharField(max_length=20, choices=LEVEL_CHOICES)
#     duration = models.CharField(max_length=100)

#     fees = models.DecimalField(
#         max_digits=10, decimal_places=2, null=True, blank=True
#     )

#     eligibility = models.TextField(blank=True)
#     prerequisites = models.JSONField(default=list, blank=True)
#     projects = models.JSONField(default=list, blank=True)
#     skills = models.JSONField(default=list, blank=True)
#     career_paths = models.JSONField(default=list, blank=True)
#     batches = models.JSONField(default=list, blank=True)

#     admission_status = models.CharField(
#         max_length=20,
#         choices=ADMISSION_CHOICES,
#         default="upcoming",
#     )

#     is_published = models.BooleanField(default=False)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     def save(self, *args, **kwargs):
#         if not self.slug:
#             base_slug = slugify(self.name)
#             self.slug = base_slug
#             counter = 1

#             while Course.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
#                 self.slug = f"{base_slug}-{counter}"
#                 counter += 1

#         super().save(*args, **kwargs)

#     def __str__(self):
#         return self.name

#     class Meta:
#         ordering = ["name"]


# class CourseModule(models.Model):
#     course = models.ForeignKey(
#         Course,
#         on_delete=models.CASCADE,
#         related_name="modules",
#     )
#     title = models.CharField(max_length=200)
#     description = models.TextField(blank=True)
#     order = models.PositiveIntegerField(default=1)

#     class Meta:
#         ordering = ["order"]
#         constraints = [
#             models.UniqueConstraint(
#                 fields=["course", "order"],
#                 name="unique_course_module_order",
#             )
#         ]

#     def __str__(self):
#         return f"{self.course.name} - {self.title}"

# class FAQ(models.Model):
#     question = models.CharField(max_length=500)
#     answer = models.TextField()

#     course = models.ForeignKey(
#         Course,
#         on_delete=models.SET_NULL,
#         null=True,
#         blank=True,
#         related_name="faqs",
#     )

#     is_published = models.BooleanField(default=False)
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return self.question

from django.db import models
from django.utils.text import slugify


class Course(models.Model):
    CATEGORY_CHOICES = [
        ("programming", "Programming"),
        ("web_development", "Web Development"),
        ("data_science", "Data Science"),
        ("ai_ml", "AI & Machine Learning"),
        ("other", "Other"),
    ]

    LEVEL_CHOICES = [
        ("beginner", "Beginner"),
        ("intermediate", "Intermediate"),
        ("advanced", "Advanced"),
    ]

    ADMISSION_CHOICES = [
        ("open", "Open"),
        ("closed", "Closed"),
        ("upcoming", "Upcoming"),
    ]

    # Original IDs from the SQL Server dataset
    source_course_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        unique=True,
    )

    source_category_id = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    source_category_name = models.CharField(
        max_length=200,
        blank=True,
    )

    # Course information
    name = models.CharField(max_length=200)

    slug = models.SlugField(
        max_length=220,
        unique=True,
        blank=True,
    )

    description = models.TextField(blank=True)

    category = models.CharField(
        max_length=30,
        choices=CATEGORY_CHOICES,
        default="other",
    )

    level = models.CharField(
        max_length=20,
        choices=LEVEL_CHOICES,
        default="beginner",
    )

    duration = models.CharField(
        max_length=100,
        blank=True,
    )

    fees = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )

    eligibility = models.TextField(blank=True)

    prerequisites = models.JSONField(
        default=list,
        blank=True,
    )

    projects = models.JSONField(
        default=list,
        blank=True,
    )

    skills = models.JSONField(
        default=list,
        blank=True,
    )

    career_paths = models.JSONField(
        default=list,
        blank=True,
    )

    batches = models.JSONField(
        default=list,
        blank=True,
    )

    admission_status = models.CharField(
        max_length=20,
        choices=ADMISSION_CHOICES,
        default="upcoming",
    )

    is_published = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name) or "course"
            self.slug = base_slug
            counter = 1

            while (
                Course.objects.filter(slug=self.slug)
                .exclude(pk=self.pk)
                .exists()
            ):
                self.slug = f"{base_slug}-{counter}"
                counter += 1

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["name"]


class CourseModule(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="modules",
    )

    # Original module ID from the SQL Server dataset
    source_module_id = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["order"]

        constraints = [
            models.UniqueConstraint(
                fields=["course", "order"],
                name="unique_course_module_order",
            )
        ]

    def __str__(self):
        return f"{self.course.name} - {self.title}"


class FAQ(models.Model):
    question = models.CharField(max_length=500)
    answer = models.TextField()

    course = models.ForeignKey(
        Course,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="faqs",
    )

    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.question
