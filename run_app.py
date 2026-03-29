#!/usr/bin/env python3
import socket
import uvicorn


def get_local_ip() -> str:
    """Return the machine LAN IP used for outbound traffic."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("8.8.8.8", 80))
        return sock.getsockname()[0]
    except Exception:
        return "127.0.0.1"
    finally:
        sock.close()


if __name__ == "__main__":
    host = "0.0.0.0"
    port = 8000
    local_ip = get_local_ip()

    print("Starting Skill Gap Intelligence System...")
    print(f"Local access: http://127.0.0.1:{port}")
    print(f"LAN access:   http://{local_ip}:{port}")

    uvicorn.run("backend.main:app", host=host, port=port, reload=False)
