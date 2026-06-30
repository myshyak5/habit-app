from django.core.management.base import BaseCommand
from habits.models import Skin

class Command(BaseCommand):
    help = 'Создаёт начальные скины для магазина'

    def handle(self, *args, **kwargs):
        skins = [
            {'name': 'Мышь', 'emoji': '🐭', 'price': 200},
            {'name': 'Панда', 'emoji': '🐼', 'price': 250},
            {'name': 'Танцор', 'emoji': '💃', 'price': 300},
            {'name': 'Динозавр', 'emoji': '🦖', 'price': 350},
            {'name': 'Осьминог', 'emoji': '🐙', 'price': 400},
            {'name': 'Рыцарь', 'emoji': '🛡️', 'price': 450},
            {'name': 'Попугай', 'emoji': '🦜', 'price': 500},
            {'name': 'Пришелец', 'emoji': '👽', 'price': 550},
        ]

        for skin_data in skins:
            skin, created = Skin.objects.get_or_create(
                name=skin_data['name'],
                defaults=skin_data
            )
            if created:
                self.stdout.write(f'✅ Создан скин: {skin.emoji} {skin.name}')
            else:
                self.stdout.write(f'⏩ Скин уже существует: {skin.emoji} {skin.name}')

        self.stdout.write(self.style.SUCCESS('🎉 Все скины созданы!'))