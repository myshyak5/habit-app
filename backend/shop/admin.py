from django.contrib import admin
from .models import Skin

@admin.register(Skin)
class SkinAdmin(admin.ModelAdmin):
    list_display = ('id', 'emoji', 'name', 'price')
    list_display_links = ('id', 'name')
    list_editable = ('price',)
    search_fields = ('name', 'emoji')
    ordering = ('price',)