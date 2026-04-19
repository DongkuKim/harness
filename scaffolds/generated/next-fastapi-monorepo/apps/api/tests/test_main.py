from fastapi.testclient import TestClient
from hypothesis import given
from hypothesis import strategies as st

from app.domain.health import health_payload
from app.main import app

client = TestClient(app)


def test_root_endpoint_returns_payload() -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {"message": "Hello from FastAPI"}


def test_health_endpoint_returns_payload() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@given(st.just("ok"))
def test_health_payload_is_stable(expected_status: str) -> None:
    assert health_payload()["status"] == expected_status
