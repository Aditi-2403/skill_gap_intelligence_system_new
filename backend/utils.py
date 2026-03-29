import io
import logging
import os
import re
from functools import lru_cache

import pandas as pd
import PyPDF2


logger = logging.getLogger(__name__)

KNOWN_SKILLS = [
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby",
    "Swift", "Kotlin", "Scala", "R", "MATLAB",
    "React", "Angular", "Vue", "Next.js", "Node.js", "Express", "Django", "FastAPI", "Flask",
    "HTML", "CSS", "Tailwind", "Bootstrap", "GraphQL", "REST API",
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
    "Pandas", "NumPy", "Scikit-learn", "TensorFlow", "PyTorch", "Keras",
    "Tableau", "Power BI", "Excel", "Statistics", "Machine Learning", "Deep Learning",
    "NLP", "Computer Vision", "Data Analysis",
    "Git", "Docker", "Kubernetes", "Jenkins", "Terraform", "Ansible", "Linux",
    "AWS", "GCP", "Azure", "CI/CD", "GitHub Actions", "Nginx",
    "Agile", "Scrum", "Jira", "Figma", "Postman",
]
_SKILLS_LOWER = {skill.lower(): skill for skill in KNOWN_SKILLS}


def extract_skills_from_resume(file_bytes: bytes) -> list[str]:
    text = ""
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        for page in reader.pages:
            text += (page.extract_text() or "") + " "
    except Exception as exc:
        logger.warning("PDF parsing failed: %s", exc)
        return []

    text_lower = text.lower()
    found: list[str] = []
    for lower_skill, canonical in _SKILLS_LOWER.items():
        if re.search(r"\b" + re.escape(lower_skill) + r"\b", text_lower):
            found.append(canonical)

    deduped = sorted(set(found))
    logger.info("Extracted %d skills from resume.", len(deduped))
    return deduped


def calculate_skill_gap(student_skills: list[str], role_required_skills: list[str]) -> dict:
    student_set = {s.strip().lower() for s in student_skills if s.strip()}
    required_set = {s.strip().lower() for s in role_required_skills if s.strip()}

    if not required_set:
        return {
            "missing_skills": [],
            "match_score": 100.0,
            "total_required": 0,
            "match_count": 0,
        }

    matched_count = len(required_set & student_set)
    missing = sorted(required_set - student_set)
    match_score = round((matched_count / len(required_set)) * 100, 1)

    return {
        "missing_skills": missing,
        "match_score": match_score,
        "total_required": len(required_set),
        "match_count": matched_count,
    }


@lru_cache(maxsize=1)
def get_industry_skills() -> list[dict]:
    try:
        csv_path = os.path.join(os.path.dirname(__file__), "dataset.csv")
        df = pd.read_csv(csv_path)
        roles = [
            {
                "role": row["Role"],
                "skills": [s.strip() for s in str(row["RequiredSkills"]).split(",") if s.strip()],
                "experience": row.get("Experience", ""),
            }
            for _, row in df.iterrows()
        ]
        logger.info("Loaded %d industry roles from dataset.", len(roles))
        return roles
    except Exception as exc:
        logger.error("Failed to read industry dataset: %s", exc)
        return []
