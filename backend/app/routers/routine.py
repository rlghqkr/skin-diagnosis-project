from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.routine import SkincareRoutineCreate, SkincareRoutineRead, SkincareRoutineUpdate
from app.services import routine_service

router = APIRouter(prefix="/api/v1/routines", tags=["routines"])


@router.post("", response_model=SkincareRoutineRead, status_code=status.HTTP_201_CREATED)
def create_routine(
    data: SkincareRoutineCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data.user_id = current_user.user_id
    routine = routine_service.create_routine(db, data)
    return routine


@router.get("", response_model=list[SkincareRoutineRead])
def list_routines(
    date: date = Query(default_factory=date.today),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return routine_service.get_routines_by_date(db, current_user.user_id, date)


@router.get("/range", response_model=list[SkincareRoutineRead])
def list_routines_range(
    from_date: date = Query(..., alias="from"),
    to_date: date = Query(..., alias="to"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return routine_service.get_routines_by_range(db, current_user.user_id, from_date, to_date)


@router.get("/templates", response_model=list[SkincareRoutineRead])
def list_templates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return routine_service.get_templates(db, current_user.user_id)


@router.post("/templates", response_model=SkincareRoutineRead, status_code=status.HTTP_201_CREATED)
def create_template(
    data: SkincareRoutineCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data.user_id = current_user.user_id
    data.is_template = True
    routine = routine_service.create_routine(db, data)
    return routine


@router.get("/streak")
def get_streak(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = routine_service.get_streak(db, current_user.user_id)
    return {"streak": count}


@router.put("/{routine_id}", response_model=SkincareRoutineRead)
def update_routine(
    routine_id: str,
    data: SkincareRoutineUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    routine = routine_service.get_routine_by_id(db, routine_id)
    if routine is None or routine.user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="루틴을 찾을 수 없습니다.")
    return routine_service.update_routine(db, routine, data)


@router.delete("/{routine_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_routine(
    routine_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    routine = routine_service.get_routine_by_id(db, routine_id)
    if routine is None or routine.user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="루틴을 찾을 수 없습니다.")
    routine_service.delete_routine(db, routine)
