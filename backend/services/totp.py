import pyotp
import qrcode
import io
import base64
from typing import Tuple


class TOTPService:
    ISSUER = "RinoxAuth"

    @staticmethod
    def generate_secret() -> str:
        return pyotp.random_base32()

    @staticmethod
    def get_provisioning_uri(secret: str, email: str) -> str:
        return pyotp.totp.TOTP(secret).provisioning_uri(
            name=email, issuer_name=TOTPService.ISSUER
        )

    @staticmethod
    def generate_qr_base64(uri: str) -> str:
        qr = qrcode.QRCode(box_size=6, border=2)
        qr.add_data(uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return base64.b64encode(buf.getvalue()).decode()

    @staticmethod
    def verify_code(secret: str, code: str) -> bool:
        totp = pyotp.TOTP(secret)
        return totp.verify(code)

    @staticmethod
    def generate_backup_codes(count: int = 8) -> list[str]:
        import secrets
        return [secrets.token_hex(4).upper() for _ in range(count)]

    @staticmethod
    def verify_backup_code(stored: str, code: str) -> bool:
        return stored == code
