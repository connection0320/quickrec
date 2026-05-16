from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    embedding_model: str = "intfloat/multilingual-e5-base"
    ollama_host: str = "http://host.docker.internal:11434"


settings = Settings()
