from waitress import serve
from project.wsgi import application  # Remplace 'myproject' par le nom de ton projet Django
if __name__ == '__main__':
    serve(application, host='0.0.0.0', port=8000)