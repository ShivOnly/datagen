from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    # Core API Credentials
    groq_api_key: str
    
    # Model Selection - Set to your 2B preference
    model_name: str = "allam-2-2b"
    
    # Matching your .env precisely
    default_country: str = "hi_IN" 
    
    # Project Constraints
    max_columns: int = 6 
    max_rows: int = 20
    
    # extra="ignore" prevents crashes from unexpected .env keys
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

@lru_cache()
def get_settings():
    return Settings()