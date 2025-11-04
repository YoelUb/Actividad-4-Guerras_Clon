

import pytest
import re
from src.Guerras_Clon.api.endpoints.auth import USERNAME_REGEX, PASSWORD_REGEX

PASSWORD_REGEX = re.compile(
    r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)"
    r"(?=.*[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?]).{8,}$"
)


@pytest.mark.parametrize("username, debe_pasar", [
    ("usuario123", True),
    ("UsuarioValido", True),
    ("user", True),
    ("12345", False),
    ("us", False),
    ("unnombredeusuariomuyexcesivamentelargo", False),
    ("user-con-guion", False),
    (" user ", False),
])
def test_username_regex(username, debe_pasar):
    """Valida la expresión regular de nombres de usuario."""
    assert bool(re.fullmatch(USERNAME_REGEX, username)) == debe_pasar


@pytest.mark.parametrize("password, debe_pasar", [
    ("Password123!", True),
    ("pass", False),
    ("password123!", False),
    ("Password!", False),
    ("Password123", False),
    ("PASSWORD123!", False),
])
def test_password_regex(password, debe_pasar):
    """Valida la expresión regular de contraseñas seguras."""
    assert bool(PASSWORD_REGEX.fullmatch(password)) == debe_pasar
