# Habit Game

Трекер привычек с геймификацией

## Стек

**Бэкенд:** Django + DRF  
**Фронтенд:** HTML, CSS, JS  
**БД:** SQLite  
**Графики:** Chart.js  

## Что сделано

- Регистрация / вход
- Привычки
- Опыт, уровни, золото
- Ежедневные задания
- Магазин скинов
- График активности

## Запуск

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
open index.html
