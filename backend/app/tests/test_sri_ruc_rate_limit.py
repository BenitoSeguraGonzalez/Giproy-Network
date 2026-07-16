from starlette.requests import Request

from app.api.endpoints.sri_ruc import _lookup_client_address


def _request(headers: list[tuple[bytes, bytes]], client: tuple[str, int] = ("172.18.0.4", 41000)) -> Request:
    return Request({"type": "http", "method": "GET", "path": "/", "headers": headers, "client": client})


def test_lookup_client_address_uses_nearest_public_forwarded_address():
    request = _request(
        [(b"x-forwarded-for", b"1.1.1.1, 8.8.8.8, 172.18.0.2")],
    )

    assert _lookup_client_address(request) == "8.8.8.8"


def test_lookup_client_address_ignores_invalid_forwarded_values_and_uses_real_ip():
    request = _request(
        [(b"x-forwarded-for", b"forged, 172.18.0.2"), (b"x-real-ip", b"9.9.9.9")],
    )

    assert _lookup_client_address(request) == "9.9.9.9"
