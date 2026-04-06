DOMAIN_ROLE_SKILLS: dict[str, dict] = {
    "Business & Management": {
        "description": "Management, strategy, operations, and business execution careers.",
        "roles": {
            "Business Analyst": ["Business Communication", "Excel", "Data Interpretation", "Presentation", "Problem Solving"],
            "Marketing Specialist": ["Digital Marketing", "Market Research", "Content Strategy", "Branding", "Analytics"],
            "Operations Manager": ["Process Optimization", "Planning", "Excel", "Leadership", "Stakeholder Management"],
            "HR Executive": ["Recruitment", "Employee Relations", "Communication", "Policy Understanding", "Documentation"],
        },
    },
    "Commerce & Finance": {
        "description": "Accounting, finance, auditing, and commercial decision-making.",
        "roles": {
            "Accountant": ["Accounting Principles", "Financial Reporting", "Excel", "Tax Basics", "Attention to Detail"],
            "Financial Analyst": ["Financial Modeling", "Excel", "Economics", "Data Interpretation", "Presentation"],
            "Auditing Associate": ["Auditing Basics", "Compliance", "Documentation", "Analytical Thinking", "Ethics"],
            "Banking Operations Associate": ["Banking Products", "Customer Service", "KYC Compliance", "Documentation", "Communication"],
        },
    },
    "Medical & Healthcare": {
        "description": "Patient-centered, clinical-support, and healthcare operations roles.",
        "roles": {
            "Clinical Data Coordinator": ["Medical Terminology", "Data Entry", "Documentation", "Regulatory Compliance", "Attention to Detail"],
            "Healthcare Administrator": ["Hospital Operations", "Scheduling", "Communication", "Records Management", "Leadership"],
            "Public Health Analyst": ["Epidemiology Basics", "Statistics", "Data Interpretation", "Reporting", "Community Outreach"],
            "Medical Lab Technician": ["Lab Safety", "Sample Handling", "Equipment Operation", "Quality Control", "Documentation"],
        },
    },
    "Engineering - Core": {
        "description": "Mechanical, civil, electrical, and chemical engineering pathways.",
        "roles": {
            "Mechanical Design Engineer": ["CAD", "Engineering Drawing", "Material Science", "Problem Solving", "Quality Standards"],
            "Civil Site Engineer": ["AutoCAD", "Surveying", "Construction Planning", "Safety Standards", "Project Coordination"],
            "Electrical Engineer": ["Circuit Analysis", "Electrical Machines", "Troubleshooting", "Safety Practices", "Technical Documentation"],
            "Chemical Process Engineer": ["Process Design", "Thermodynamics", "Safety Compliance", "Data Analysis", "Process Optimization"],
        },
    },
    "Engineering - Software & IT": {
        "description": "Software, data, cloud, and infrastructure engineering careers.",
        "roles": {
            "Software Developer": ["Python", "DSA", "Git", "SQL", "Flask"],
            "Data Analyst": ["Python", "SQL", "Excel", "Statistics", "Tableau"],
            "DevOps Engineer": ["Linux", "Git", "Docker", "CI/CD", "AWS"],
            "Cloud Engineer": ["Linux", "Networking", "AWS", "Terraform", "Docker"],
        },
    },
    "Arts, Law & Psychology": {
        "description": "Creative, legal, behavioral, and social-impact professions.",
        "roles": {
            "Content Writer": ["Writing", "Research", "Editing", "SEO Basics", "Creativity"],
            "Legal Associate": ["Legal Research", "Drafting", "Case Analysis", "Documentation", "Communication"],
            "Counseling Assistant": ["Active Listening", "Empathy", "Case Notes", "Ethics", "Communication"],
            "Public Policy Associate": ["Policy Analysis", "Research", "Report Writing", "Stakeholder Communication", "Critical Thinking"],
        },
    },
}


def list_domains() -> list[dict]:
    rows = [
        {
            "domain": domain_name,
            "description": domain_data["description"],
            "roles_count": len(domain_data["roles"]),
            "sample_roles": list(domain_data["roles"].keys())[:3],
        }
        for domain_name, domain_data in DOMAIN_ROLE_SKILLS.items()
    ]
    return sorted(rows, key=lambda row: row["domain"])
