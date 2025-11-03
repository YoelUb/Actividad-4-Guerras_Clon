from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from src.Guerras_Clon.bd.database import Base
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="jugador")
    must_change_password = Column(Boolean, default=False, nullable=False)

    tournament_participations = relationship("TournamentParticipant", back_populates="user")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    username = Column(String, index=True)
    action = Column(String, index=True)
    details = Column(String, nullable=True)


class VerificationCode(Base):
    __tablename__ = "verification_codes"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, unique=True)
    username = Column(String)
    hashed_password = Column(String)
    code = Column(String, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)


class Tournament(Base):
    __tablename__ = "tournaments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    status = Column(String, default="pending")  # pending, active, completed
    winner_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # El User ID del ganador
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    winner = relationship("User")
    participants = relationship("TournamentParticipant", back_populates="tournament", lazy="joined")
    matches = relationship("TournamentMatch", back_populates="tournament", lazy="joined")


class TournamentParticipant(Base):
    __tablename__ = "tournament_participants"

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"))
    character_id = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    ai_name = Column(String, nullable=True)

    tournament = relationship("Tournament", back_populates="participants")
    user = relationship("User", back_populates="tournament_participations", lazy="joined")


class TournamentMatch(Base):
    __tablename__ = "tournament_matches"

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"))
    round = Column(Integer)
    match_index = Column(Integer)

    player1_id = Column(Integer, ForeignKey("tournament_participants.id"), nullable=True)
    player2_id = Column(Integer, ForeignKey("tournament_participants.id"), nullable=True)
    winner_id = Column(Integer, ForeignKey("tournament_participants.id"), nullable=True)

    status = Column(String, default="pending")

    tournament = relationship("Tournament", back_populates="matches")

    player1 = relationship("TournamentParticipant", foreign_keys=[player1_id], lazy="joined")
    player2 = relationship("TournamentParticipant", foreign_keys=[player2_id], lazy="joined")
    winner = relationship("TournamentParticipant", foreign_keys=[winner_id], lazy="joined")