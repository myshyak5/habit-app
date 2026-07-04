# Habit Game

Трекер привычек с геймификацией

## Стек

**Backend:** Python, Django, SQLite  
**Frontend:** HTML, CSS, JavaScript  
**Графики:** Chart.js

## Что реализовано

- Авторизация (регистрация, вход, выход)
- Работа с привычками (создание, выполнение, удаление)
- Система прогресса (опыт, уровни, золото)
- Ежедневные задания с наградами
- Магазин скинов
- Профиль пользователя с графиком активности
- Уведомления о действиях и ошибках

## Запуск

**cmd**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
Открыть frontend/index.html
