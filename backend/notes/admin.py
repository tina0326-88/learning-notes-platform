from django.contrib import admin

from .models import Note


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ("title", "tags", "created_at", "updated_at")
    search_fields = ("title", "content", "tags")
    list_filter = ("created_at",)
    ordering = ("-created_at",)
