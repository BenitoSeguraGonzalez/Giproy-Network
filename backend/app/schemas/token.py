from pydantic import BaseModel
from typing import Optional


class LoginNotice(BaseModel):
    level: str
    title: str
    message: str
    end_date: str
    days_remaining: int

class Token(BaseModel):
    access_token: str
    token_type: str
    login_notice: Optional[LoginNotice] = None

class TokenPayload(BaseModel):
    sub: str | None = None
    sid: str | None = None
