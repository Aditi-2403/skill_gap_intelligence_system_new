import PyPDF2
import pandas as pd
import io
import re

def extract_skills_from_resume(file_bytes):
    skills_list = ["Python", "JavaScript", "SQL", "Git", "Docker", "React", "AWS", "Kubernetes", "Jenkins", "Terraform", "Linux", "Node.js", "Java", "C++", "HTML", "CSS", "Tableau", "Power BI", "Excel", "Statistics"]
    
    text = ""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        for page in pdf_reader.pages:
            text += page.extract_text()
    except Exception as e:
        print(f"Error parsing PDF: {e}")
        return []

    found_skills = []
    text_lower = text.lower()
    for skill in skills_list:
        if re.search(r'\b' + re.escape(skill.lower()) + r'\b', text_lower):
            found_skills.append(skill)
    
    return list(set(found_skills))

def calculate_skill_gap(student_skills, role_required_skills):
    # student_skills is a list of strings
    # role_required_skills is a list of strings
    
    student_skills_set = set([s.strip().lower() for s in student_skills])
    required_skills_set = set([s.strip().lower() for s in role_required_skills])
    
    missing_skills = list(required_skills_set - student_skills_set)
    match_count = len(required_skills_set & student_skills_set)
    total_required = len(required_skills_set)
    
    match_score = (match_count / total_required) * 100 if total_required > 0 else 100
    
    return {
        "missing_skills": missing_skills,
        "match_score": round(match_score, 2),
        "total_required": total_required,
        "match_count": match_count
    }

_roles_cache = None

def get_industry_skills():
    global _roles_cache
    if _roles_cache is not None:
        return _roles_cache
        
    try:
        import os
        base_path = os.path.dirname(__file__)
        csv_path = os.path.join(base_path, "dataset.csv")
        df = pd.read_csv(csv_path)
        roles = []
        for _, row in df.iterrows():
            roles.append({
                "role": row["Role"],
                "skills": [s.strip() for s in row["RequiredSkills"].split(",")],
                "experience": row["Experience"]
            })
        _roles_cache = roles
        return roles
    except Exception as e:
        print(f"Error reading dataset: {e}")
        return []
