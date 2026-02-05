import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from utils import (
    load_data,
    format_salary,
    filter_dataframe,
    EXPERIENCE_LABELS,
    EMPLOYMENT_LABELS,
    REMOTE_LABELS,
    TOP_JOB_TITLES,
)


def _sidebar_filters(df: pd.DataFrame) -> dict:
    """Render sidebar filters and return selected values."""
    st.sidebar.markdown("### Filters")

    years = st.sidebar.multiselect(
        "Work Year",
        options=sorted(df["work_year"].unique()),
        default=sorted(df["work_year"].unique()),
    )

    jobs = st.sidebar.multiselect(
        "Job Title",
        options=sorted(df["job_title"].unique()),
        default=TOP_JOB_TITLES,
    )

    experience = st.sidebar.multiselect(
        "Experience Level",
        options=list(EXPERIENCE_LABELS.keys()),
        format_func=lambda x: EXPERIENCE_LABELS[x],
        default=list(EXPERIENCE_LABELS.keys()),
    )

    remote = st.sidebar.multiselect(
        "Remote Ratio",
        options=list(REMOTE_LABELS.keys()),
        format_func=lambda x: REMOTE_LABELS[x],
        default=list(REMOTE_LABELS.keys()),
    )

    return {
        "work_year": years,
        "job_title": jobs,
        "experience_level": experience,
        "remote_ratio": remote,
    }


def _render_kpi_cards(df: pd.DataFrame):
    """Display key metric cards."""
    cols = st.columns(4)
    metrics = [
        ("Total Records", f"{len(df):,}"),
        ("Avg Salary", format_salary(df["salary_in_usd"].mean())),
        ("Median Salary", format_salary(df["salary_in_usd"].median())),
        ("Unique Roles", f"{df['job_title'].nunique()}"),
    ]
    for col, (label, value) in zip(cols, metrics):
        col.metric(label, value)


def _salary_by_job(df: pd.DataFrame):
    """Bar chart: average salary by job title."""
    agg = (
        df.groupby("job_title")["salary_in_usd"]
        .agg(["mean", "count"])
        .reset_index()
        .sort_values("mean", ascending=True)
        .tail(15)
    )
    agg.columns = ["job_title", "avg_salary", "count"]

    fig = px.bar(
        agg,
        y="job_title",
        x="avg_salary",
        orientation="h",
        text=agg["avg_salary"].apply(lambda x: f"${x:,.0f}"),
        color="avg_salary",
        color_continuous_scale="Viridis",
    )
    fig.update_layout(
        title="Average Salary by Job Title (Top 15)",
        xaxis_title="Average Salary (USD)",
        yaxis_title="",
        showlegend=False,
        coloraxis_showscale=False,
        height=500,
    )
    fig.update_traces(textposition="outside")
    st.plotly_chart(fig, use_container_width=True)


def _salary_by_experience(df: pd.DataFrame):
    """Box plot: salary distribution by experience level."""
    order = ["EN", "MI", "SE", "EX"]
    df_sorted = df.copy()
    df_sorted["exp_order"] = df_sorted["experience_level"].map(
        {v: i for i, v in enumerate(order)}
    )
    df_sorted = df_sorted.sort_values("exp_order")

    fig = px.box(
        df_sorted,
        x="experience_label",
        y="salary_in_usd",
        color="experience_label",
        color_discrete_sequence=px.colors.qualitative.Set2,
        category_orders={"experience_label": [EXPERIENCE_LABELS[k] for k in order]},
    )
    fig.update_layout(
        title="Salary Distribution by Experience Level",
        xaxis_title="Experience Level",
        yaxis_title="Salary (USD)",
        showlegend=False,
        height=450,
    )
    st.plotly_chart(fig, use_container_width=True)


def _salary_trend(df: pd.DataFrame):
    """Line chart: salary trends over years."""
    agg = (
        df.groupby("work_year")["salary_in_usd"]
        .agg(["mean", "median"])
        .reset_index()
    )
    agg.columns = ["work_year", "mean", "median"]

    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=agg["work_year"],
            y=agg["mean"],
            mode="lines+markers",
            name="Mean",
            line=dict(width=3, color="#1f77b4"),
            marker=dict(size=10),
        )
    )
    fig.add_trace(
        go.Scatter(
            x=agg["work_year"],
            y=agg["median"],
            mode="lines+markers",
            name="Median",
            line=dict(width=3, color="#ff7f0e", dash="dash"),
            marker=dict(size=10),
        )
    )
    fig.update_layout(
        title="Salary Trends Over Years",
        xaxis_title="Year",
        yaxis_title="Salary (USD)",
        height=400,
        xaxis=dict(dtick=1),
    )
    st.plotly_chart(fig, use_container_width=True)


def _remote_distribution(df: pd.DataFrame):
    """Pie chart: remote ratio distribution."""
    counts = df["remote_label"].value_counts().reset_index()
    counts.columns = ["remote_type", "count"]

    fig = px.pie(
        counts,
        values="count",
        names="remote_type",
        color_discrete_sequence=px.colors.qualitative.Pastel,
        hole=0.4,
    )
    fig.update_layout(title="Remote Work Distribution", height=400)
    st.plotly_chart(fig, use_container_width=True)


def _company_size_analysis(df: pd.DataFrame):
    """Grouped bar: salary by company size and experience."""
    agg = (
        df.groupby(["size_label", "experience_label"])["salary_in_usd"]
        .mean()
        .reset_index()
    )
    fig = px.bar(
        agg,
        x="size_label",
        y="salary_in_usd",
        color="experience_label",
        barmode="group",
        color_discrete_sequence=px.colors.qualitative.Set2,
    )
    fig.update_layout(
        title="Average Salary by Company Size & Experience",
        xaxis_title="Company Size",
        yaxis_title="Average Salary (USD)",
        height=450,
    )
    st.plotly_chart(fig, use_container_width=True)


def _geo_map(df: pd.DataFrame):
    """Choropleth map of average salaries by company location."""
    agg = (
        df.groupby("company_location")["salary_in_usd"].mean().reset_index()
    )
    agg.columns = ["country", "avg_salary"]

    fig = px.choropleth(
        agg,
        locations="country",
        locationmode="ISO-3",
        color="avg_salary",
        color_continuous_scale="YlOrRd",
        projection="natural earth",
        labels={"avg_salary": "Avg Salary (USD)"},
    )
    fig.update_layout(
        title="Average Salary by Company Location",
        height=500,
        geo=dict(showframe=False, showcoastlines=True),
    )
    st.plotly_chart(fig, use_container_width=True)


def _employment_type_chart(df: pd.DataFrame):
    """Bar chart: salary by employment type over years."""
    df_copy = df.copy()
    df_copy["work_year"] = df_copy["work_year"].astype(str)
    agg = (
        df_copy.groupby(["employment_label", "work_year"])["salary_in_usd"]
        .mean()
        .reset_index()
    )
    fig = px.bar(
        agg,
        x="employment_label",
        y="salary_in_usd",
        color="work_year",
        barmode="group",
        color_discrete_sequence=px.colors.qualitative.Bold,
    )
    fig.update_layout(
        title="Average Salary by Employment Type & Year",
        xaxis_title="Employment Type",
        yaxis_title="Average Salary (USD)",
        height=450,
    )
    st.plotly_chart(fig, use_container_width=True)


def render_explore_page():
    """Main explore/dashboard page."""
    st.markdown('<p class="main-header">Data Jobs Salary Dashboard</p>', unsafe_allow_html=True)
    st.markdown(
        '<p class="sub-header">Explore salary trends across 3,755 data job records (2020-2023)</p>',
        unsafe_allow_html=True,
    )

    df = load_data()
    filters = _sidebar_filters(df)
    df_filtered = filter_dataframe(df, filters)

    if df_filtered.empty:
        st.warning("No data matches the selected filters. Please adjust your selections.")
        return

    _render_kpi_cards(df_filtered)
    st.markdown("---")

    # Tab layout for charts
    tab1, tab2, tab3, tab4 = st.tabs(
        ["Salary Overview", "Trends & Time", "Geography", "Detailed Data"]
    )

    with tab1:
        _salary_by_job(df_filtered)
        col1, col2 = st.columns(2)
        with col1:
            _salary_by_experience(df_filtered)
        with col2:
            _company_size_analysis(df_filtered)

    with tab2:
        _salary_trend(df_filtered)
        col1, col2 = st.columns(2)
        with col1:
            _employment_type_chart(df_filtered)
        with col2:
            _remote_distribution(df_filtered)

    with tab3:
        _geo_map(df_filtered)

    with tab4:
        st.dataframe(
            df_filtered[
                [
                    "work_year",
                    "job_title",
                    "experience_label",
                    "employment_label",
                    "salary_in_usd",
                    "employee_residence",
                    "company_location",
                    "size_label",
                    "remote_label",
                ]
            ].rename(
                columns={
                    "work_year": "Year",
                    "job_title": "Job Title",
                    "experience_label": "Experience",
                    "employment_label": "Employment",
                    "salary_in_usd": "Salary (USD)",
                    "employee_residence": "Residence",
                    "company_location": "Company Location",
                    "size_label": "Company Size",
                    "remote_label": "Remote",
                }
            ),
            use_container_width=True,
            height=500,
        )
        st.download_button(
            "Download Filtered Data (CSV)",
            df_filtered.to_csv(index=False).encode("utf-8"),
            "filtered_salaries.csv",
            "text/csv",
        )
