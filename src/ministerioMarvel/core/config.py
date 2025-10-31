import logging
from fastapi import Request

def get_logger(request: Request) -> logging.Logger:

    nombre_modulo = request.scope.get("endpoint", "fastapi")
    return logging.getLogger(nombre_modulo)