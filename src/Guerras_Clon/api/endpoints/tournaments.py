from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func  # Modificado: importación moderna de 'select'
from sqlalchemy.orm import selectinload, joinedload
from typing import List
import random
from datetime import datetime, timezone
import logging

from src.Guerras_Clon.bd import models
from src.Guerras_Clon.security import security
from src.Guerras_Clon.bd.database import get_db
from src.Guerras_Clon.api.schemas import star_wars_models as schemas
from src.Guerras_Clon.services import battle_service, swapi_service
from src.Guerras_Clon.security.auditing import create_audit_log

router = APIRouter()
logger = logging.getLogger(__name__)

MAX_PARTICIPANTS = 16
AI_PARTICIPANTS_COUNT = 15


async def _inject_character_data_into_schema(tournament: models.Tournament) -> schemas.TournamentSchema:
    character_ids = {p.character_id for p in tournament.participants}
    character_map = {}
    for char_id in character_ids:
        if char_id not in character_map:
            character_map[char_id] = await swapi_service.get_character_by_id(char_id)

    participant_map = {}
    for p in tournament.participants:
        p_schema = schemas.TournamentParticipantSchema.from_orm(p)
        p_schema.character = character_map.get(p.character_id)
        participant_map[p.id] = p_schema

    tournament_schema = schemas.TournamentSchema.from_orm(tournament)
    tournament_schema.participants = list(participant_map.values())

    match_schemas = []
    for m in sorted(tournament.matches, key=lambda x: (x.round, x.match_index)):
        m_schema = schemas.TournamentMatchSchema.from_orm(m)
        if m.player1_id:
            m_schema.player1 = participant_map.get(m.player1_id)
        if m.player2_id:
            m_schema.player2 = participant_map.get(m.player2_id)
        if m.winner_id:
            m_schema.winner = participant_map.get(m.winner_id)
        match_schemas.append(m_schema)

    tournament_schema.matches = match_schemas
    return tournament_schema


@router.post("/create", response_model=schemas.TournamentSchema)
async def create_tournament(
        request: schemas.TournamentCreateRequest,
        db: AsyncSession = Depends(get_db),
        current_user: models.User = Depends(security.get_current_user)
):
    new_tournament = models.Tournament(name=request.name, status="pending")
    db.add(new_tournament)
    await create_audit_log(db, current_user.username, "CREATE_TOURNAMENT", f"Torneo '{request.name}' creado.")
    await db.commit()
    await db.refresh(new_tournament)
    return new_tournament


@router.get("/open", response_model=List[schemas.TournamentSchema])
async def get_open_tournaments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(models.Tournament)
        .where(models.Tournament.status == "pending")
        .options(selectinload(models.Tournament.participants).joinedload(models.TournamentParticipant.user))
    )
    tournaments = result.scalars().unique().all()

    schema_list = []
    for t in tournaments:
        schema_list.append(await _inject_character_data_into_schema(t))
    return schema_list


@router.get("/leaderboard", response_model=List[schemas.LeaderboardEntrySchema])
async def get_leaderboard(db: AsyncSession = Depends(get_db)):
    duration = func.extract('epoch', models.Tournament.end_time - models.Tournament.start_time)

    result = await db.execute(
        select(
            models.Tournament.name.label("tournament_name"),
            models.User.username.label("winner_name"),
            duration.label("duration_seconds"),
            models.Tournament.end_time.label("completed_at")
        )
        .join(models.User, models.Tournament.winner_id == models.User.id)
        .where(
            models.Tournament.status == "completed",
            models.Tournament.winner_id.isnot(None),
            models.Tournament.start_time.isnot(None),
            models.Tournament.end_time.isnot(None)
        )
        .order_by(duration.asc())
        .limit(20)
    )

    leaderboard_entries = result.mappings().all()
    return leaderboard_entries


@router.get("/{tournament_id}", response_model=schemas.TournamentSchema)
async def get_tournament_details(tournament_id: int, db: AsyncSession = Depends(get_db)):
    tournament = await db.get(
        models.Tournament,
        tournament_id,
        options=[
            selectinload(models.Tournament.participants).joinedload(models.TournamentParticipant.user),
            selectinload(models.Tournament.matches).options(
                selectinload(models.TournamentMatch.player1).joinedload(models.TournamentParticipant.user),
                selectinload(models.TournamentMatch.player2).joinedload(models.TournamentParticipant.user),
                selectinload(models.TournamentMatch.winner).joinedload(models.TournamentParticipant.user),
            ),
            selectinload(models.Tournament.winner)
        ]
    )
    if not tournament:
        raise HTTPException(status_code=404, detail="Torneo no encontrado")

    return await _inject_character_data_into_schema(tournament)


@router.post("/{tournament_id}/join", response_model=schemas.TournamentSchema)
async def join_and_start_tournament(
        tournament_id: int,
        request: schemas.TournamentJoinRequest,
        db: AsyncSession = Depends(get_db),
        current_user: models.User = Depends(security.get_current_user)
):
    tournament = await db.get(models.Tournament, tournament_id, options=[selectinload(models.Tournament.participants)])
    if not tournament:
        raise HTTPException(status_code=404, detail="Torneo no encontrado")
    if tournament.status != "pending":
        raise HTTPException(status_code=400, detail="Este torneo ya ha comenzado o ha finalizado.")

    human_participant = next((p for p in tournament.participants if p.user_id is not None), None)
    if human_participant:
        if human_participant.user_id == current_user.id:
            raise HTTPException(status_code=400, detail="Ya estás inscrito en este torneo.")
        else:
            raise HTTPException(status_code=400, detail="El torneo ya tiene un jugador humano. Está lleno.")

    character = await swapi_service.get_character_by_id(request.character_id)
    if not character:
        raise HTTPException(status_code=404, detail="Personaje no encontrado.")

    participant_list = []
    human_participant = models.TournamentParticipant(
        tournament_id=tournament_id,
        user_id=current_user.id,
        character_id=request.character_id
    )
    db.add(human_participant)
    participant_list.append(human_participant)

    await create_audit_log(db, current_user.username, "JOIN_TOURNAMENT",
                           f"Unido a '{tournament.name}' con {character.nombre}")

    all_characters = await swapi_service.get_all_characters()
    available_bots = [c for c in all_characters if c.id != request.character_id]

    if len(available_bots) < AI_PARTICIPANTS_COUNT:
        raise HTTPException(status_code=500, detail="No hay suficientes personajes únicos para los bots.")

    selected_bots = random.sample(available_bots, AI_PARTICIPANTS_COUNT)

    for bot_char in selected_bots:
        bot_participant = models.TournamentParticipant(
            tournament_id=tournament_id,
            user_id=None,
            ai_name=f"IA: {bot_char.nombre}",
            character_id=bot_char.id
        )
        db.add(bot_participant)
        participant_list.append(bot_participant)

    random.shuffle(participant_list)

    await db.flush()

    for i in range(MAX_PARTICIPANTS // 2):
        match = models.TournamentMatch(
            tournament_id=tournament_id,
            round=1,
            match_index=i,
            player1_id=participant_list[i * 2].id,
            player2_id=participant_list[i * 2 + 1].id,
            status="pending"
        )
        db.add(match)

    tournament.status = "active"
    tournament.start_time = datetime.now(timezone.utc)

    await db.commit()

    return await get_tournament_details(tournament_id, db)


def _simulate_battle(p1: schemas.Personaje, p2: schemas.Personaje) -> (schemas.Personaje, List[str]):
    hp1 = p1.info.defensa
    hp2 = p2.info.defensa
    spec1_usado = False
    spec2_usado = False
    log = [f"¡Comienza la simulación entre {p1.nombre} y {p2.nombre}!"]

    while hp1 > 0 and hp2 > 0:
        accion_1 = "ataque_normal"
        if not spec1_usado and random.random() < 0.3:
            accion_1 = "ataque_especial"
            spec1_usado = True

        habilidad_1 = battle_service.factory_habilidades.get_habilidad(accion_1)
        daño, msg = habilidad_1.ejecutar(p1, p2)
        hp2 = max(0, hp2 - daño)
        log.append(msg)
        if hp2 <= 0:
            log.append(f"¡{p1.nombre} ha ganado la batalla!")
            return p1, log

        accion_2 = "ataque_normal"
        if not spec2_usado and random.random() < 0.3:
            accion_2 = "ataque_especial"
            spec2_usado = True

        habilidad_2 = battle_service.factory_habilidades.get_habilidad(accion_2)
        daño_ia, msg_ia = habilidad_2.ejecutar(p2, p1)
        hp1 = max(0, hp1 - daño_ia)
        log.append(msg_ia)
        if hp1 <= 0:
            log.append(f"¡{p2.nombre} ha ganado la batalla!")
            return p2, log

    return p1 if hp1 > 0 else p2, log


@router.post("/match/{match_id}/simulate", response_model=schemas.TournamentMatchSchema)
async def simulate_match(
        match_id: int,
        db: AsyncSession = Depends(get_db),
        current_user: models.User = Depends(security.get_current_user)
):
    logger.info(f"Simulación de partido {match_id} iniciada por {current_user.username}")

    match = await db.get(
        models.TournamentMatch,
        match_id,
        options=[
            selectinload(models.TournamentMatch.player1).joinedload(models.TournamentParticipant.user),
            selectinload(models.TournamentMatch.player2).joinedload(models.TournamentParticipant.user),
            selectinload(models.TournamentMatch.tournament).selectinload(models.Tournament.matches)
        ]
    )

    if not match:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    if match.status != "pending":
        raise HTTPException(status_code=400, detail="Este partido ya se ha jugado.")
    if not match.player1 or not match.player2:
        raise HTTPException(status_code=400, detail="El partido aún no tiene a los dos jugadores asignados.")

    char1 = await swapi_service.get_character_by_id(match.player1.character_id)
    char2 = await swapi_service.get_character_by_id(match.player2.character_id)

    winner_char, battle_log = _simulate_battle(char1, char2)

    winner_participant = match.player1 if winner_char.id == char1.id else match.player2
    match.winner_id = winner_participant.id
    match.status = "completed"
    db.add(match)

    tournament = match.tournament
    current_round = match.round

    round_matches = [m for m in tournament.matches if m.round == current_round]
    all_round_matches_completed = all(m.status == "completed" or m.id == match.id for m in round_matches)

    if all_round_matches_completed:
        winner_ids = [m.winner_id for m in sorted(round_matches, key=lambda x: x.match_index)]

        if current_round == 4:
            if winner_participant.user_id:
                tournament.winner_id = winner_participant.user_id
            else:

                tournament.winner_id = None

            tournament.status = "completed"
            tournament.end_time = datetime.now(timezone.utc)
            db.add(tournament)

            winner_name = winner_participant.user.username if winner_participant.user else winner_participant.ai_name
            await create_audit_log(db, winner_name, "TOURNAMENT_WIN", f"Ganador de '{tournament.name}': {winner_name}")

        else:
            next_round = current_round + 1
            for i in range(len(winner_ids) // 2):
                new_match = models.TournamentMatch(
                    tournament_id=tournament.id,
                    round=next_round,
                    match_index=i,
                    player1_id=winner_ids[i * 2],
                    player2_id=winner_ids[i * 2 + 1],
                    status="pending"
                )
                db.add(new_match)

    await db.commit()

    await db.refresh(match)

    p1_schema = schemas.TournamentParticipantSchema.from_orm(match.player1)
    p1_schema.character = await swapi_service.get_character_by_id(match.player1.character_id)

    p2_schema = schemas.TournamentParticipantSchema.from_orm(match.player2)
    p2_schema.character = await swapi_service.get_character_by_id(match.player2.character_id)

    winner_schema = None
    if match.winner_id:
        winner_p_model = await db.get(models.TournamentParticipant, match.winner_id,
                                      options=[joinedload(models.TournamentParticipant.user)])
        if winner_p_model:
            winner_schema = schemas.TournamentParticipantSchema.from_orm(winner_p_model)
            winner_schema.character = await swapi_service.get_character_by_id(winner_p_model.character_id)

    final_match_schema = schemas.TournamentMatchSchema.from_orm(match)
    final_match_schema.player1 = p1_schema
    final_match_schema.player2 = p2_schema
    final_match_schema.winner = winner_schema

    return final_match_schema