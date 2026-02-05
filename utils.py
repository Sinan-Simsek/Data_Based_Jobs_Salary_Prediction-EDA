import pandas as pd
import streamlit as st
import pickle
from pathlib import Path

DATA_PATH = Path(__file__).parent / "ds_salaries.csv"
MODEL_PATH = Path(__file__).parent / "saved_steps.pkl"

EXPERIENCE_LABELS = {
    "EN": "Entry Level",
    "MI": "Mid Level",
    "SE": "Senior",
    "EX": "Executive",
}

EMPLOYMENT_LABELS = {
    "FT": "Full Time",
    "PT": "Part Time",
    "CT": "Contract",
    "FL": "Freelance",
}

COMPANY_SIZE_LABELS = {
    "S": "Small (<50)",
    "M": "Medium (50-250)",
    "L": "Large (250+)",
}

REMOTE_LABELS = {
    0: "On-site",
    50: "Hybrid",
    100: "Remote",
}

TOP_JOB_TITLES = [
    "Data Engineer",
    "Data Scientist",
    "Data Analyst",
    "Machine Learning Engineer",
    "Analytics Engineer",
    "Data Architect",
]


@st.cache_data
def load_data() -> pd.DataFrame:
    """Load and prepare the salary dataset."""
    df = pd.read_csv(DATA_PATH)
    df["experience_label"] = df["experience_level"].map(EXPERIENCE_LABELS)
    df["employment_label"] = df["employment_type"].map(EMPLOYMENT_LABELS)
    df["size_label"] = df["company_size"].map(COMPANY_SIZE_LABELS)
    df["remote_label"] = df["remote_ratio"].map(REMOTE_LABELS)
    return df


@st.cache_resource
def load_model():
    """Load the pre-trained model and scaler from pickle."""
    if not MODEL_PATH.exists():
        return None, None
    with open(MODEL_PATH, "rb") as f:
        data = pickle.load(f)
    return data.get("model"), data.get("scaler")


def format_salary(value: float) -> str:
    """Format a salary value as USD string."""
    return f"${value:,.0f}"


def filter_dataframe(df: pd.DataFrame, filters: dict) -> pd.DataFrame:
    """Apply sidebar filters to the dataframe."""
    mask = pd.Series(True, index=df.index)
    for col, values in filters.items():
        if values is not None and len(values) > 0:
            mask &= df[col].isin(values)
    return df[mask]
