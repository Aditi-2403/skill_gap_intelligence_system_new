from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from .. import models
from . import analysis_service, profile_service


def get_admin_dashboard_data(db: Session, student_limit: int = 200) -> dict:
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
        .limit(max(1, min(student_limit, 1000)))
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

    students_below_threshold = 0
    readiness_scores: list[float] = []
    missing_skill_counter: dict[str, int] = {}
    domain_counter: dict[str, int] = {}

    for user in users:
        if not user.profile:
            continue

        student_skill_levels = profile_service.get_student_skill_levels(
            user_id=user.id,
            db=db,
            profile=user.profile,
        )
        target_domain = profile_service.get_target_domain(user_id=user.id, db=db) or analysis_service.get_default_domain()
        role_name = (
            profile_service.get_target_role(user_id=user.id, db=db)
            or analysis_service.find_default_role_for_domain(target_domain)
        )
        analysis = analysis_service.analyze_skill_gap(
            role_name=role_name,
            domain_name=target_domain,
            student_skill_levels=student_skill_levels,
        )

        readiness_scores.append(float(analysis["readiness_score"]))
        if analysis["readiness_score"] < analysis_service.READINESS_RISK_THRESHOLD:
            students_below_threshold += 1

        for skill in analysis["missing_skills"]:
            missing_skill_counter[skill] = missing_skill_counter.get(skill, 0) + 1
        domain_name = analysis["domain"]
        domain_counter[domain_name] = domain_counter.get(domain_name, 0) + 1

    most_common_missing_skills = [
        {"skill": skill, "count": count}
        for skill, count in sorted(
            missing_skill_counter.items(),
            key=lambda item: item[1],
            reverse=True,
        )[:5]
    ]
    average_readiness_score = round(sum(readiness_scores) / len(readiness_scores), 2) if readiness_scores else 0.0
    domain_stats = [
        {"domain": domain, "students": count}
        for domain, count in sorted(domain_counter.items(), key=lambda item: item[1], reverse=True)
    ]

    return {
        "total_students": total_students,
        "average_cgpa": average_cgpa,
        "students_below_threshold": students_below_threshold,
        "risk_threshold": analysis_service.READINESS_RISK_THRESHOLD,
        "average_readiness_score": average_readiness_score,
        "most_common_missing_skills": most_common_missing_skills,
        "domain_stats": domain_stats,
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
