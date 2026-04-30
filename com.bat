@echo off
cd C:\Users\PCMOH\Desktop\gesta_test
call venv\Scripts\activate
cd django
cd project
python manage.py runserver_plus 0.0.0.0:8000 --cert-file cert.crt
