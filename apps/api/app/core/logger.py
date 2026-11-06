"""
either Terminal or .log file logging

1. formatter (e.g 02/11/26 11:32:00AM "Error description" "Error origin" "Proper Error" )
2. _configure_root 
3. get_logger

"""
from logging.handlers import RotatingFileHandler
from email import message
from sqlite3.dbapi2 import Timestamp
from pathlib import Path
import sys
import logging
from logging.handlers import RotatingFileHandler


LOG_DIR = Path(__file__).resolve().parents[2] / "log" 
LOG_FILE = LOG_DIR / "app.log"



class LogFormatter(logging.Formatter):

    def format(self, record: logging.LogRecord):
        """
        Time Stamp, 
        """

        timestamp = self.formatTime(record, '%Y-%m-%d %H:%M:%S')

        message = f"{timestamp} [{record.levelname}] -> {record.name} | {record.getMessage()}"

        return message
    

_Configured = False

def _configure_root():

    """
    1. connect the log file directory
    2. setup the formatter to print consistently
    3. show errors with proper descriptions
    4. if this function fails then also let me know
    """
    global _Configured
    # if configured then ignore this function call (skip the function)
    if _Configured:
        return
    
    # formatter object
    formatter = LogFormatter()

    # 1. Console handler (terminal handler)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    
    # 2. file handler
    try:
        LOG_DIR.mkdir(parents=True, exist_ok=True)

        file_handler = RotatingFileHandler(
            LOG_FILE,
            maxBytes=10 * 1024 * 1024,
            backupCount=5,
            encoding="utf-8"
        )
        file_handler.setFormatter(formatter)

    except:
        print(f"[logging] warning: failed to initalize the log file")
        file_handler = None
    

    # 3. configure "app" logger
    app_logger = logging.getLogger("app")
    app_logger.setLevel(logging.INFO)
    
    app_logger.addHandler(console_handler)

    if file_handler:
        app_logger.addHandler(file_handler)
    
    app_logger.propagate = False

    # handle server logs
    if file_handler:
        for uvicorn_name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
            u_logger = logging.getLogger(uvicorn_name)
            u_logger.addHandler(file_handler)
    _Configured = True


def get_logger(name: str):

    _configure_root()
    return logging.getLogger(name)
