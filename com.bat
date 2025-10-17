@echo off
cd C:\Users\PCMOH\Desktop\gesta_test
call venv\Scripts\activate
cd django
cd project
py manage.py runserver 0.0.0.0:8000
