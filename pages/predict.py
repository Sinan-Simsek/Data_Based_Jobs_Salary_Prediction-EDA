import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from utils import (
    load_data,
    format_salary,
    EXPERIENCE_LABELS,
    EMPLOYMENT_LABELS,
    COMPANY_SIZE_LABELS,
    REMOTE_LABELS,
    TOP_JOB_TITLES,
)


def _get_salary_stats(df: pd.DataFrame, filters: dict) -> dict:
    """Calculate salary statistics for the given filters."""
    mask = pd.Series(True, index=df.index)
    for col, value in filters.items():
        if value is not None:
            mask &= df[col] == value

    matched = df[mask]
    if len(matched) < 3:
        # Relax filters: use only job_title and experience_level
        mask = pd.Series(True, index=df.index)
        for col in ["job_title", "experience_level"]:
            if col in filters and filters[col] is not None:
                mask &= df[col] == filters[col]
        matched = df[mask]

    if matched.empty:
        return None

    salary = matched["salary_in_usd"]
    return {
        "mean": salary.mean(),
        "median": salary.median(),
        "min": salary.min(),
        "max": salary.max(),
        "q25": salary.quantile(0.25),
        "q75": salary.quantile(0.75),
        "count": len(matched),
        "std": salary.std(),
    }


def _render_gauge(value: float, min_val: float, max_val: float):
    """Render a gauge chart for salary prediction."""
    fig = go.Figure(
        go.Indicator(
            mode="gauge+number",
            value=value,
            number={"prefix": "$", "valueformat": ",.0f"},
            gauge={
                "axis": {"range": [min_val, max_val], "tickformat": "$,.0f"},
                "bar": {"color": "#1f77b4"},
                "steps": [
                    {"range": [min_val, min_val + (max_val - min_val) * 0.33], "color": "#ff6b6b"},
                    {"range": [min_val + (max_val - min_val) * 0.33, min_val + (max_val - min_val) * 0.66], "color": "#ffd93d"},
                    {"range": [min_val + (max_val - min_val) * 0.66, max_val], "color": "#6bcb77"},
                ],
                "threshold": {
                    "line": {"color": "black", "width": 4},
                    "thickness": 0.75,
                    "value": value,
                },
            },
            title={"text": "Estimated Salary (USD)"},
        )
    )
    fig.update_layout(height=350)
    st.plotly_chart(fig, use_container_width=True)


def _render_comparison_bars(stats: dict, predicted: float):
    """Show how the prediction compares to dataset statistics."""
    labels = ["Min", "25th Pct", "Median", "Your Estimate", "75th Pct", "Max"]
    values = [stats["min"], stats["q25"], stats["median"], predicted, stats["q75"], stats["max"]]
    colors = ["#ff6b6b", "#ffa07a", "#ffd93d", "#1f77b4", "#87ceeb", "#6bcb77"]

    fig = go.Figure(
        go.Bar(
            x=labels,
            y=values,
            marker_color=colors,
            text=[f"${v:,.0f}" for v in values],
            textposition="outside",
        )
    )
    fig.update_layout(
        title="Your Estimate vs Market Range",
        yaxis_title="Salary (USD)",
        height=400,
        showlegend=False,
    )
    st.plotly_chart(fig, use_container_width=True)


def render_predict_page():
    """Salary prediction page."""
    st.markdown('<p class="main-header">Salary Prediction</p>', unsafe_allow_html=True)
    st.markdown(
        '<p class="sub-header">Enter job details to estimate the expected salary range</p>',
        unsafe_allow_html=True,
    )

    df = load_data()

    # Input form
    col1, col2 = st.columns(2)

    with col1:
        job_title = st.selectbox(
            "Job Title",
            options=sorted(df["job_title"].unique()),
            index=sorted(df["job_title"].unique()).index("Data Scientist")
            if "Data Scientist" in df["job_title"].unique()
            else 0,
        )

        experience = st.select_slider(
            "Experience Level",
            options=["EN", "MI", "SE", "EX"],
            format_func=lambda x: EXPERIENCE_LABELS[x],
            value="MI",
        )

        employment = st.selectbox(
            "Employment Type",
            options=list(EMPLOYMENT_LABELS.keys()),
            format_func=lambda x: EMPLOYMENT_LABELS[x],
            index=0,  # FT
        )

        company_size = st.selectbox(
            "Company Size",
            options=list(COMPANY_SIZE_LABELS.keys()),
            format_func=lambda x: COMPANY_SIZE_LABELS[x],
            index=1,  # M
        )

    with col2:
        remote = st.select_slider(
            "Remote Ratio",
            options=[0, 50, 100],
            format_func=lambda x: REMOTE_LABELS[x],
            value=100,
        )

        top_locations = (
            df["company_location"]
            .value_counts()
            .head(20)
            .index.tolist()
        )
        company_location = st.selectbox(
            "Company Location",
            options=top_locations,
            index=0,
        )

        top_residences = (
            df["employee_residence"]
            .value_counts()
            .head(20)
            .index.tolist()
        )
        employee_residence = st.selectbox(
            "Employee Residence",
            options=top_residences,
            index=0,
        )

        work_year = st.selectbox(
            "Reference Year",
            options=sorted(df["work_year"].unique(), reverse=True),
        )

    st.markdown("---")

    if st.button("Estimate Salary", type="primary", use_container_width=True):
        filters = {
            "job_title": job_title,
            "experience_level": experience,
            "employment_type": employment,
            "remote_ratio": remote,
            "company_location": company_location,
            "company_size": company_size,
        }

        stats = _get_salary_stats(df, filters)

        if stats is None:
            st.error("Not enough data for this combination. Try different parameters.")
            return

        predicted = stats["median"]

        # Results
        st.success(f"Based on **{stats['count']}** matching records:")

        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Estimated Salary", format_salary(predicted))
        col2.metric("Average", format_salary(stats["mean"]))
        col3.metric("Range Low (25%)", format_salary(stats["q25"]))
        col4.metric("Range High (75%)", format_salary(stats["q75"]))

        st.markdown("---")

        tab1, tab2 = st.tabs(["Gauge View", "Comparison View"])

        with tab1:
            _render_gauge(
                predicted,
                max(0, stats["min"] * 0.8),
                stats["max"] * 1.1,
            )

        with tab2:
            _render_comparison_bars(stats, predicted)

        # Insights
        st.markdown("### Insights")
        col1, col2 = st.columns(2)

        with col1:
            st.markdown("**Salary Range**")
            st.markdown(f"- Minimum: {format_salary(stats['min'])}")
            st.markdown(f"- Maximum: {format_salary(stats['max'])}")
            st.markdown(f"- Std Dev: {format_salary(stats['std'])}")

        with col2:
            # Compare with overall average
            overall_avg = df["salary_in_usd"].mean()
            diff = predicted - overall_avg
            pct = (diff / overall_avg) * 100
            direction = "above" if diff > 0 else "below"
            st.markdown("**Market Position**")
            st.markdown(
                f"- This role pays **{abs(pct):.1f}%** {direction} the overall average ({format_salary(overall_avg)})"
            )

            # Top paying locations for this role
            role_by_loc = (
                df[df["job_title"] == job_title]
                .groupby("company_location")["salary_in_usd"]
                .mean()
                .sort_values(ascending=False)
                .head(5)
            )
            if not role_by_loc.empty:
                st.markdown(f"- Top locations for **{job_title}**:")
                for loc, sal in role_by_loc.items():
                    st.markdown(f"  - {loc}: {format_salary(sal)}")
