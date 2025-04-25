import random

def generate_auth_code():
    return ''.join(str(random.randint(0, 9)) for _ in range(6))

def verify_auth_code(stored_code, input_code):

    return stored_code == input_code
