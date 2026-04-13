from fastapi import APIRouter

from app.domain.health import health_payload, root_payload

router = APIRouter()


@router.get("/")
async def read_root() -> dict[str, str]:
    return root_payload()


@router.get("/health")
async def healthcheck() -> dict[str, str]:
    return health_payload()

