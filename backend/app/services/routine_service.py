from datetime import date, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.skincare_routine import SkincareRoutine
from app.schemas.routine import SkincareRoutineCreate, SkincareRoutineUpdate


def create_routine(db: Session, data: SkincareRoutineCreate) -> SkincareRoutine:
    steps_data = [s.model_dump() for s in data.steps] if data.steps else []
    routine = SkincareRoutine(
        user_id=data.user_id,
        routine_date=data.routine_date,
        time_of_day=data.time_of_day,
        steps=steps_data,
        notes=data.notes,
        is_template=data.is_template,
        template_name=data.template_name,
        total_products=len(steps_data),
    )
    db.add(routine)
    db.commit()
    db.refresh(routine)
    return routine


def get_routines_by_date(
    db: Session, user_id: str, target_date: date
) -> list[SkincareRoutine]:
    return (
        db.query(SkincareRoutine)
        .filter(
            SkincareRoutine.user_id == user_id,
            SkincareRoutine.routine_date == target_date,
            SkincareRoutine.is_template == False,
        )
        .order_by(SkincareRoutine.time_of_day)
        .all()
    )


def get_routine_by_id(db: Session, routine_id: str) -> SkincareRoutine | None:
    return (
        db.query(SkincareRoutine)
        .filter(SkincareRoutine.routine_id == routine_id)
        .first()
    )


def update_routine(
    db: Session, routine: SkincareRoutine, data: SkincareRoutineUpdate
) -> SkincareRoutine:
    update_data = data.model_dump(exclude_unset=True)
    if "steps" in update_data and update_data["steps"] is not None:
        update_data["steps"] = [s.model_dump() for s in data.steps]
        update_data["total_products"] = len(update_data["steps"])
    for field, value in update_data.items():
        setattr(routine, field, value)
    db.commit()
    db.refresh(routine)
    return routine


def delete_routine(db: Session, routine: SkincareRoutine) -> None:
    db.delete(routine)
    db.commit()


def get_routines_by_range(
    db: Session, user_id: str, from_date: date, to_date: date
) -> list[SkincareRoutine]:
    return (
        db.query(SkincareRoutine)
        .filter(
            SkincareRoutine.user_id == user_id,
            SkincareRoutine.routine_date >= from_date,
            SkincareRoutine.routine_date <= to_date,
            SkincareRoutine.is_template == False,
        )
        .order_by(SkincareRoutine.routine_date.desc(), SkincareRoutine.time_of_day)
        .all()
    )


def get_templates(db: Session, user_id: str) -> list[SkincareRoutine]:
    return (
        db.query(SkincareRoutine)
        .filter(
            SkincareRoutine.user_id == user_id,
            SkincareRoutine.is_template == True,
        )
        .order_by(SkincareRoutine.created_at.desc())
        .all()
    )


def get_streak(db: Session, user_id: str) -> int:
    """Calculate consecutive days with at least one routine record."""
    today = date.today()
    dates_with_routines = (
        db.query(SkincareRoutine.routine_date)
        .filter(
            SkincareRoutine.user_id == user_id,
            SkincareRoutine.is_template == False,
            SkincareRoutine.routine_date <= today,
        )
        .distinct()
        .order_by(SkincareRoutine.routine_date.desc())
        .all()
    )

    if not dates_with_routines:
        return 0

    routine_dates = {row[0] for row in dates_with_routines}
    streak = 0
    check_date = today

    while check_date in routine_dates:
        streak += 1
        check_date -= timedelta(days=1)

    return streak
