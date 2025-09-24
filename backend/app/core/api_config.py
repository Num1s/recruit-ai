"""
Конфигурация API ключей для интеграций
"""

import os
from typing import Optional

class APIConfig:
    """Конфигурация API ключей"""
    
    # LinkedIn API
    LINKEDIN_CLIENT_ID: Optional[str] = os.getenv("LINKEDIN_CLIENT_ID")
    LINKEDIN_CLIENT_SECRET: Optional[str] = os.getenv("LINKEDIN_CLIENT_SECRET")
    LINKEDIN_REDIRECT_URI: Optional[str] = os.getenv("LINKEDIN_REDIRECT_URI")
    
    # Lalafo API
    LALAFO_API_KEY: Optional[str] = os.getenv("LALAFO_API_KEY")
    LALAFO_API_URL: str = os.getenv("LALAFO_API_URL", "https://lalafo.kg/api")
    
    # HH.ru API
    HH_CLIENT_ID: Optional[str] = os.getenv("HH_CLIENT_ID")
    HH_CLIENT_SECRET: Optional[str] = os.getenv("HH_CLIENT_SECRET")
    
    # SuperJob API
    SUPERJOB_CLIENT_ID: Optional[str] = os.getenv("SUPERJOB_CLIENT_ID")
    SUPERJOB_CLIENT_SECRET: Optional[str] = os.getenv("SUPERJOB_CLIENT_SECRET")
    
    @classmethod
    def is_linkedin_configured(cls) -> bool:
        """Проверяет, настроен ли LinkedIn API"""
        return bool(cls.LINKEDIN_CLIENT_ID and cls.LINKEDIN_CLIENT_SECRET)
    
    @classmethod
    def is_lalafo_configured(cls) -> bool:
        """Проверяет, настроен ли Lalafo API"""
        return bool(cls.LALAFO_API_KEY)
    
    @classmethod
    def is_hh_configured(cls) -> bool:
        """Проверяет, настроен ли HH.ru API"""
        return bool(cls.HH_CLIENT_ID and cls.HH_CLIENT_SECRET)
    
    @classmethod
    def is_superjob_configured(cls) -> bool:
        """Проверяет, настроен ли SuperJob API"""
        return bool(cls.SUPERJOB_CLIENT_ID and cls.SUPERJOB_CLIENT_SECRET)
