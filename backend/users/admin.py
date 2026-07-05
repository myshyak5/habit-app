from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Админка для модели User с игровыми полями
    """
    # Поля, которые отображаются в списке пользователей
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
    
    # Поля, по которым можно фильтровать
    list_filter = (
        'level',
        'is_active',
        'is_staff',
        'date_joined'
    )
    
    # Поля для поиска
    search_fields = ('username', 'email')
    
    # Сортировка по умолчанию
    ordering = ('-date_joined',)
    
    # Поля, которые отображаются при редактировании пользователя
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
    
    # Поля, которые отображаются при создании нового пользователя
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
    
    # Поля только для чтения
    readonly_fields = ('date_joined', 'last_login')