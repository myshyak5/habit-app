from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = (
        'username', 
        'email', 
        'level', 
        'experience', 
        'gold', 
        'avatar_skin',
        'is_active',
        'date_joined'
    )

    list_filter = (
        'level',
        'is_active',
        'is_staff',
        'date_joined'
    )
    
    search_fields = ('username', 'email')
    ordering = ('-date_joined',)
  
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Личная информация', {'fields': ('email', 'first_name', 'last_name')}),
        ('Игровые поля', {
            'fields': ('experience', 'level', 'gold', 'avatar_skin', 'owned_skins'),
            'classes': ('wide',),
        }),
        ('Права доступа', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Важные даты', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
        ('Игровые поля', {
            'classes': ('wide',),
            'fields': ('level', 'gold', 'experience', 'avatar_skin'),
        }),
    )
    
    readonly_fields = ('date_joined', 'last_login')