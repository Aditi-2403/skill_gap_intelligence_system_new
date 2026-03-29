from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from .. import models


def get_admin_dashboard_data(db: Session) -> dict:
    total_students = (
        db.query(func.count(models.User.id))
        .filter(models.User.role == "student")
        .scalar()
        or 0
    )

    average_cgpa = db.query(func.avg(models.Profile.cgpa)).scalar()
    average_cgpa = round(float(average_cgpa), 2) if average_cgpa is not None else 0.0

    users = (
        db.query(models.User)
        .filter(models.User.role == "student")
        .options(joinedload(models.User.profile))
        .all()
    )

    branch_rows = (
        db.query(
            models.Profile.branch.label("branch"),
            func.count(models.Profile.id).label("total"),
            func.avg(models.Profile.cgpa).label("avg_cgpa"),
        )
        .join(models.User, models.User.id == models.Profile.user_id)
        .filter(models.User.role == "student")
        .group_by(models.Profile.branch)
        .order_by(func.count(models.Profile.id).desc())
        .all()
    )

    branch_stats = [
        {
            "branch": row.branch,
            "total": int(row.total),
            "avg_cgpa": round(float(row.avg_cgpa), 2) if row.avg_cgpa is not None else 0.0,
        }
        for row in branch_rows
    ]

    return {
        "total_students": total_students,
        "average_cgpa": average_cgpa,
        "students": [
            {
                "email": user.email,
                "name": user.profile.full_name if user.profile else "N/A",
                "cgpa": user.profile.cgpa if user.profile else 0,
            }
            for user in users
        ],
        "branch_stats": branch_stats,
    }
