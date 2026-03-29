from fastapi import HTTPException, status

from .. import utils


def get_roles() -> list[dict]:
    return utils.get_industry_skills()


def find_role(role_name: str) -> dict:
    roles = get_roles()
    role_lookup = {role["role"]: role for role in roles}
    selected_role = role_lookup.get(role_name)
    if not selected_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role '{role_name}' not found in the industry dataset.",
        )
    return selected_role


def analyze_skill_gap(student_skills: list[str], role_name: str) -> dict:
    selected_role = find_role(role_name)
    return utils.calculate_skill_gap(student_skills, selected_role["skills"])
