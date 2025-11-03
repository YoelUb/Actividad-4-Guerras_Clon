from pydantic import BaseModel
from typing import Literal, List
from src.Guerras_Clon.security import security
from datetime import datetime


class InfoPersonaje(BaseModel):
    daño: int
    defensa: int
    ataque_especial: int


class Personaje(BaseModel):
    id: str
    nombre: str
    tipo: Literal["heroe", "villano"]
    mundo_id: int
    info: InfoPersonaje
    imagen: str


class Mundo(BaseModel):
    id: int
    nombre: str
    imagen: str


class TournamentParticipantSchema(BaseModel):
    id: int
    user: security.UserResponse | None = None
    ai_name: str | None = None
    character_id: str
    character: Personaje | None = None

    class Config:
        from_attributes = True


class TournamentMatchSchema(BaseModel):
    id: int
    round: int
    match_index: int
    player1: TournamentParticipantSchema | None = None
    player2: TournamentParticipantSchema | None = None
    winner: TournamentParticipantSchema | None = None
    status: str

    class Config:
        from_attributes = True


class TournamentSchema(BaseModel):
    id: int
    name: str
    status: str
    winner: security.UserResponse | None = None
    participants: List[TournamentParticipantSchema] = []
    matches: List[TournamentMatchSchema] = []
    start_time: datetime | None = None
    end_time: datetime | None = None

    class Config:
        from_attributes = True


class TournamentCreateRequest(BaseModel):
    name: str


class TournamentJoinRequest(BaseModel):
    character_id: str


class LeaderboardEntrySchema(BaseModel):
    tournament_name: str
    winner_name: str
    duration_seconds: float
    completed_at: datetime

    class Config:
        from_attributes = True