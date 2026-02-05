import streamlit as st

st.set_page_config(
    page_title="Data Jobs Salary Explorer",
    page_icon="💰",
    layout="wide",
    initial_sidebar_state="expanded",
)

# --- Custom CSS ---
st.markdown(
    """
    <style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 700;
        color: #1f77b4;
        margin-bottom: 0.2rem;
    }
    .sub-header {
        font-size: 1.1rem;
        color: #666;
        margin-bottom: 1.5rem;
    }
    .metric-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1.2rem;
        border-radius: 0.8rem;
        color: white;
        text-align: center;
    }
    .metric-card h3 {
        margin: 0;
        font-size: 0.9rem;
        opacity: 0.85;
    }
    .metric-card h2 {
        margin: 0.3rem 0 0 0;
        font-size: 1.6rem;
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
    }
    .stTabs [data-baseweb="tab"] {
        padding: 8px 20px;
        border-radius: 6px 6px 0 0;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

from pages.explore import render_explore_page
from pages.predict import render_predict_page
from pages.compare import render_compare_page

# --- Sidebar ---
st.sidebar.markdown("## Data Jobs Salary Explorer")
st.sidebar.markdown("---")

page = st.sidebar.radio(
    "Navigate",
    ["Dashboard", "Salary Prediction", "Job Comparison"],
    index=0,
)

st.sidebar.markdown("---")
st.sidebar.markdown(
    """
    **About**
    Explore data job salaries, predict earnings,
    and compare roles across the industry.

    *Data: 3,755 salary records (2020-2023)*
    """
)

# --- Page routing ---
if page == "Dashboard":
    render_explore_page()
elif page == "Salary Prediction":
    render_predict_page()
elif page == "Job Comparison":
    render_compare_page()
