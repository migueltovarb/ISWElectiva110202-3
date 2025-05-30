import random

# Variable global para almacenar el último código generado
latest_auth_code = None

def generate_auth_code():
    """
    Genera un código de autenticación aleatorio de 6 dígitos y lo almacena en la variable global
    """
    global latest_auth_code
    latest_auth_code = ''.join(str(random.randint(0, 9)) for _ in range(6))
    return latest_auth_code

def get_latest_auth_code():
    """
    Devuelve el último código de autenticación generado
    """
    return latest_auth_code

def verify_auth_code(stored_code, input_code):
    """
    Verifica si el código introducido coincide con el código almacenado
    """
    return stored_code == input_code
