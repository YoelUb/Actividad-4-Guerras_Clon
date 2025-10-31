import logging
from fastapi import Request

def get_logger(request: Request) -> logging.Logger:
    """
    Dependencia para obtener un logger con el nombre
    del módulo que lo está pidiendo.
    """
    module_name = request.scope.get('endpoint', 'fastapi').__name__
    return logging.getLogger(module_name)