from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.transaction import db_transaction
from core.deps import get_current_developer
from models.domain import DeveloperAccount
from schemas.dashboard import AgentCommand
from services.ai_agent import process_natural_language_command

router = APIRouter(prefix="/api/v1/developer/agent", tags=["AI Agent"])

@router.post("/command")
@db_transaction
async def run_agent_command(req: AgentCommand, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    result = await process_natural_language_command(req.command, dev.id, req.context, db)
    return result
