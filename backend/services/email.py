import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from core.config import settings

class EmailService:
    @staticmethod
    def send_email(to_email: str, subject: str, body: str):
        if settings.MOCK_EMAIL:
            print(f"\n--- MOCK EMAIL SENT ---")
            print(f"To: {to_email}")
            print(f"Subject: {subject}")
            print(f"Body: {body}")
            print(f"------------------------\n")
            return True

        try:
            msg = MIMEMultipart()
            msg['From'] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
            msg['To'] = to_email
            msg['Subject'] = subject

            msg.attach(MIMEText(body, 'html'))

            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()
            return True
        except Exception as e:
            print(f"Error sending email: {e}")
            return False

    @staticmethod
    def send_verification_code(email: str, code: str):
        subject = "Verify your AuthSys Account"
        body = f"""
        <html>
            <body>
                <h2>Welcome to AuthSys!</h2>
                <p>Your verification code is: <strong>{code}</strong></p>
                <p>This code will expire in 10 minutes.</p>
            </body>
        </html>
        """
        return EmailService.send_email(email, subject, body)

    @staticmethod
    def send_password_reset_code(email: str, code: str):
        subject = "Password Reset Request - AuthSys"
        body = f"""
        <html>
            <body>
                <h2>Password Reset Request</h2>
                <p>You requested a password reset. Your 6-digit code is: <strong>{code}</strong></p>
                <p>If you didn't request this, please ignore this email.</p>
                <p>This code will expire in 10 minutes.</p>
            </body>
        </html>
        """
        return EmailService.send_email(email, subject, body)
