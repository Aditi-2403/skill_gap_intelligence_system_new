from fastapi import HTTPException, status

from .. import schemas
from .domain_catalog import DOMAIN_ROLE_SKILLS, list_domains


READINESS_RISK_THRESHOLD = 40.0
DEFAULT_SKILL_LEVEL = 5

ROLE_EXPERIENCE_HINT: dict[str, str] = {
    "Business Analyst": "0-2 years",
    "Marketing Specialist": "0-2 years",
    "Operations Manager": "1-3 years",
    "HR Executive": "0-2 years",
    "Accountant": "0-2 years",
    "Financial Analyst": "0-2 years",
    "Auditing Associate": "0-2 years",
    "Banking Operations Associate": "0-2 years",
    "Clinical Data Coordinator": "0-2 years",
    "Healthcare Administrator": "1-3 years",
    "Public Health Analyst": "0-2 years",
    "Medical Lab Technician": "0-2 years",
    "Mechanical Design Engineer": "0-2 years",
    "Civil Site Engineer": "0-2 years",
    "Electrical Engineer": "0-2 years",
    "Chemical Process Engineer": "0-2 years",
    "Software Developer": "0-2 years",
    "Data Analyst": "0-2 years",
    "DevOps Engineer": "1-3 years",
    "Cloud Engineer": "1-3 years",
    "Content Writer": "0-2 years",
    "Legal Associate": "0-2 years",
    "Counseling Assistant": "0-2 years",
    "Public Policy Associate": "0-2 years",
}


def normalize_skill(skill_name: str) -> str:
    return " ".join((skill_name or "").strip().split())


def classify_skill_level(level: int) -> str:
    if level < 5:
        return "Weak"
    if level <= 7:
        return "متوسط (medium)"
    return "Strong"


def calculate_readiness(matched_skills_count: int, total_required_skills: int) -> float:
    if total_required_skills == 0:
        return 100.0
    return round((matched_skills_count / total_required_skills) * 100.0, 2)


def generate_recommendations(missing_skills: list[str], weak_skills: list[dict]) -> list[str]:
    recommendations: list[str] = []

    for skill in missing_skills:
        recommendations.append(f"Learn {skill} basics")
        if len(recommendations) >= 2:
            break

    for weak in weak_skills:
        recommendations.append(f"Practice {weak['skill']} with weekly exercises")
        if len(recommendations) >= 3:
            break

    if len(recommendations) < 3:
        recommendations.append("Build a project using your target-role skills")

    unique: list[str] = []
    seen: set[str] = set()
    for action in recommendations:
        key = action.lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append(action)
    return unique[:3]


def get_domains() -> list[dict]:
    return list_domains()


def get_default_domain() -> str:
    return next(iter(DOMAIN_ROLE_SKILLS.keys()))


def get_roles(domain_name: str | None = None) -> list[dict]:
    if domain_name:
        domain_data = DOMAIN_ROLE_SKILLS.get(domain_name)
        if not domain_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Domain '{domain_name}' not found.",
            )
        roles = domain_data["roles"]
        rows = [
            {
                "domain": domain_name,
                "role": role_name,
                "skills": skills,
                "experience": ROLE_EXPERIENCE_HINT.get(role_name, ""),
            }
            for role_name, skills in roles.items()
        ]
        return sorted(rows, key=lambda row: row["role"])

    all_roles: list[dict] = []
    for domain, domain_data in DOMAIN_ROLE_SKILLS.items():
        for role_name, skills in domain_data["roles"].items():
            all_roles.append(
                {
                    "domain": domain,
                    "role": role_name,
                    "skills": skills,
                    "experience": ROLE_EXPERIENCE_HINT.get(role_name, ""),
                }
            )
    return sorted(all_roles, key=lambda row: (row["domain"], row["role"]))


def find_role(role_name: str, domain_name: str | None = None) -> dict:
    selected_domain = DOMAIN_ROLE_SKILLS.get(domain_name) if domain_name else None
    normalized_input = role_name.strip().lower()

    if selected_domain:
        matched_role_name = next(
            (name for name in selected_domain["roles"] if name.lower() == normalized_input),
            None,
        )
        if matched_role_name is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role '{role_name}' not found in domain '{domain_name}'.",
            )
        return {
            "domain": domain_name,
            "role": matched_role_name,
            "skills": selected_domain["roles"][matched_role_name],
            "experience": ROLE_EXPERIENCE_HINT.get(matched_role_name, ""),
        }

    for domain, domain_data in DOMAIN_ROLE_SKILLS.items():
        matched_role_name = next(
            (name for name in domain_data["roles"] if name.lower() == normalized_input),
            None,
        )
        if matched_role_name:
            return {
                "domain": domain,
                "role": matched_role_name,
                "skills": domain_data["roles"][matched_role_name],
                "experience": ROLE_EXPERIENCE_HINT.get(matched_role_name, ""),
            }

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Role '{role_name}' not found in domain catalog.",
    )


def find_default_role_for_domain(domain_name: str) -> str:
    domain_data = DOMAIN_ROLE_SKILLS.get(domain_name)
    if not domain_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Domain '{domain_name}' not found.",
        )
    return next(iter(domain_data["roles"].keys()))


def build_student_skill_map(
    student_skills: list[str] | None = None,
    skill_levels: list[schemas.SkillLevelInput] | None = None,
) -> dict[str, int]:
    normalized_levels: dict[str, int] = {}
    canonical_names: dict[str, str] = {}

    for item in skill_levels or []:
        normalized = normalize_skill(item.skill)
        if not normalized:
            continue
        key = normalized.lower()
        normalized_levels[key] = int(item.level)
        canonical_names[key] = normalized

    for skill in student_skills or []:
        normalized = normalize_skill(skill)
        if not normalized:
            continue
        key = normalized.lower()
        canonical_names.setdefault(key, normalized)
        normalized_levels.setdefault(key, DEFAULT_SKILL_LEVEL)

    return {
        canonical_names[key]: level
        for key, level in normalized_levels.items()
    }


def analyze_skill_gap(
    role_name: str,
    domain_name: str | None = None,
    student_skill_levels: dict[str, int] | None = None,
    student_skills: list[str] | None = None,
    skill_levels: list[schemas.SkillLevelInput] | None = None,
) -> dict:
    selected_role = find_role(role_name=role_name, domain_name=domain_name)
    role_skills = selected_role["skills"]

    combined_skill_levels = student_skill_levels or build_student_skill_map(
        student_skills=student_skills,
        skill_levels=skill_levels,
    )

    student_level_by_lower: dict[str, int] = {
        normalize_skill(name).lower(): int(level)
        for name, level in (combined_skill_levels or {}).items()
        if normalize_skill(name)
    }
    student_name_by_lower: dict[str, str] = {
        normalize_skill(name).lower(): normalize_skill(name)
        for name in (combined_skill_levels or {})
        if normalize_skill(name)
    }

    matched_skills: list[dict] = []
    weak_skills: list[dict] = []
    missing_skills: list[str] = []

    for required_skill in role_skills:
        key = normalize_skill(required_skill).lower()
        level = student_level_by_lower.get(key)
        if level is None:
            missing_skills.append(required_skill)
            continue

        skill_view = {
            "skill": student_name_by_lower.get(key, required_skill),
            "level": level,
            "strength": classify_skill_level(level),
        }
        matched_skills.append(skill_view)
        if level < 5:
            weak_skills.append(skill_view)

    readiness_score = calculate_readiness(
        matched_skills_count=len(matched_skills),
        total_required_skills=len(role_skills),
    )

    return {
        "domain": selected_role["domain"],
        "role": selected_role["role"],
        "required_skills": role_skills,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "weak_skills": weak_skills,
        "recommendations": generate_recommendations(missing_skills, weak_skills),
        "readiness_score": readiness_score,
        "risk_status": "At Risk" if readiness_score < READINESS_RISK_THRESHOLD else "On Track",
        "risk_threshold": READINESS_RISK_THRESHOLD,
        # Backward-compatible aliases used by existing frontend.
        "match_score": readiness_score,
        "match_count": len(matched_skills),
        "total_required": len(role_skills),
    }
