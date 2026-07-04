# Habit Game

Трекер привычек с геймификацией

## Стек

**Бэкенд:** Python + Django  
**Фронтенд:** HTML, CSS, JavaScript  
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
