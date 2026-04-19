def root_payload() -> dict[str, str]:
    return {"message": "Hello from FastAPI"}


def health_payload() -> dict[str, str]:
    return {"status": "ok"}

