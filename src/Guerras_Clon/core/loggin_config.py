import logging.config
import sys

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,

    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - (%(funcName)s:%(lineno)d) - %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
        "simple": {
            "format": "%(asctime)s - %(levelname)s - %(message)s",
        },
    },

    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
            "stream": sys.stdout,
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "formatter": "default",
            "filename": "ministerio_marvel.log",
            "maxBytes": 10485760,
            "backupCount": 5,
            "encoding": "utf8",
        },
    },

    "loggers": {
        "ministerio_marvel.auditoria": {
            "level": "INFO",
            "handlers": ["console", "file"],
            "propagate": False,
        },
        "uvicorn.error": {
            "level": "INFO",
            "handlers": ["console"],
            "propagate": False,
        },
        "uvicorn.access": {
            "level": "WARNING",
            "handlers": ["console"],
            "propagate": False,
        },
    },

    "root": {
        "level": "INFO",
        "handlers": ["console", "file"],
    },
}


def setup_logging():

    logging.config.dictConfig(LOGGING_CONFIG)
    logging.info("Logging configurado exitosamente usando dictConfig.")