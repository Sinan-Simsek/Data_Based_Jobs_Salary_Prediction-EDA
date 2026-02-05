import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from utils import (
    load_data,
    format_salary,
    EXPERIENCE_LABELS,
    TOP_JOB_TITLES,
)


def _render_job_comparison(df: pd.DataFrame, jobs: list):
    """Side-by-side comparison of selected jobs."""
    if len(jobs) < 2:
        st.info("Select at least 2 job titles to compare.")
        return

    df_jobs = df[df["job_title"].isin(jobs)]

    # Summary table
    summary = (
        df_jobs.groupby("job_title")["salary_in_usd"]
        .agg(["mean", "median", "min", "max", "count", "std"])
        .round(0)
        .reset_index()
    )
    summary.columns = [
        "Job Title", "Mean", "Median", "Min", "Max", "Records", "Std Dev"
    ]

    for col in ["Mean", "Median", "Min", "Max", "Std Dev"]:
        summary[col] = summary[col].apply(lambda x: f"${x:,.0f}")
    summary["Records"] = summary["Records"].astype(int)

    st.markdown("#### Summary Statistics")
    st.dataframe(summary, use_container_width=True, hide_index=True)

    st.markdown("---")

    # Violin plot
    fig_violin = px.violin(
        df_jobs,
        x="job_title",
        y="salary_in_usd",
        color="job_title",
        box=True,
        points="outliers",
        color_discrete_sequence=px.colors.qualitative.Set2,
    )
    fig_violin.update_layout(
        title="Salary Distribution Comparison",
        xaxis_title="",
        yaxis_title="Salary (USD)",
        showlegend=False,
        height=500,
    )
    st.plotly_chart(fig_violin, use_container_width=True)

    # By experience level
    agg_exp = (
        df_jobs.groupby(["job_title", "experience_label"])["salary_in_usd"]
        .mean()
        .reset_index()
    )
    fig_exp = px.bar(
        agg_exp,
        x="experience_label",
        y="salary_in_usd",
        color="job_title",
        barmode="group",
        color_discrete_sequence=px.colors.qualitative.Set2,
        category_orders={
            "experience_label": [
                EXPERIENCE_LABELS[k] for k in ["EN", "MI", "SE", "EX"]
            ]
        },
    )
    fig_exp.update_layout(
        title="Average Salary by Experience Level",
        xaxis_title="Experience Level",
        yaxis_title="Average Salary (USD)",
        height=450,
    )
    st.plotly_chart(fig_exp, use_container_width=True)


def _render_growth_analysis(df: pd.DataFrame, jobs: list):
    """Year-over-year salary growth for selected jobs."""
    if len(jobs) < 1:
        st.info("Select at least 1 job title.")
        return

    df_jobs = df[df["job_title"].isin(jobs)]

    agg = (
        df_jobs.groupby(["work_year", "job_title"])["salary_in_usd"]
        .mean()
        .reset_index()
    )

    fig = px.line(
        agg,
        x="work_year",
        y="salary_in_usd",
        color="job_title",
        markers=True,
        color_discrete_sequence=px.colors.qualitative.Bold,
    )
    fig.update_layout(
        title="Salary Trend by Job Title",
        xaxis_title="Year",
        yaxis_title="Average Salary (USD)",
        height=450,
        xaxis=dict(dtick=1),
    )
    st.plotly_chart(fig, use_container_width=True)

    # Growth table
    st.markdown("#### Year-over-Year Growth")
    pivot = agg.pivot(index="job_title", columns="work_year", values="salary_in_usd")
    years = sorted(pivot.columns)

    growth_data = []
    for job in pivot.index:
        row = {"Job Title": job}
        for i in range(1, len(years)):
            prev = pivot.loc[job, years[i - 1]]
            curr = pivot.loc[job, years[i]]
            if pd.notna(prev) and pd.notna(curr) and prev > 0:
                growth = ((curr - prev) / prev) * 100
                row[f"{years[i-1]}-{years[i]}"] = f"{growth:+.1f}%"
            else:
                row[f"{years[i-1]}-{years[i]}"] = "N/A"
        growth_data.append(row)

    st.dataframe(pd.DataFrame(growth_data), use_container_width=True, hide_index=True)


def _render_demand_analysis(df: pd.DataFrame, jobs: list):
    """Job demand and market analysis."""
    if len(jobs) < 1:
        st.info("Select at least 1 job title.")
        return

    df_jobs = df[df["job_title"].isin(jobs)]

    # Job count by year
    count_by_year = (
        df_jobs.groupby(["work_year", "job_title"])
        .size()
        .reset_index(name="count")
    )

    fig_count = px.bar(
        count_by_year,
        x="work_year",
        y="count",
        color="job_title",
        barmode="group",
        color_discrete_sequence=px.colors.qualitative.Pastel,
    )
    fig_count.update_layout(
        title="Job Posting Count by Year",
        xaxis_title="Year",
        yaxis_title="Number of Records",
        height=400,
        xaxis=dict(dtick=1),
    )
    st.plotly_chart(fig_count, use_container_width=True)

    # Remote ratio breakdown
    remote_by_job = (
        df_jobs.groupby(["job_title", "remote_label"])
        .size()
        .reset_index(name="count")
    )
    fig_remote = px.bar(
        remote_by_job,
        x="job_title",
        y="count",
        color="remote_label",
        barmode="stack",
        color_discrete_sequence=["#ff6b6b", "#ffd93d", "#6bcb77"],
    )
    fig_remote.update_layout(
        title="Remote Work Distribution by Job",
        xaxis_title="",
        yaxis_title="Count",
        height=400,
    )
    st.plotly_chart(fig_remote, use_container_width=True)

    # Top locations heatmap
    top_locs = df_jobs["company_location"].value_counts().head(10).index.tolist()
    df_heat = df_jobs[df_jobs["company_location"].isin(top_locs)]
    heat_data = (
        df_heat.groupby(["job_title", "company_location"])["salary_in_usd"]
        .mean()
        .reset_index()
    )
    heat_pivot = heat_data.pivot(
        index="job_title", columns="company_location", values="salary_in_usd"
    )

    fig_heat = px.imshow(
        heat_pivot.values,
        x=heat_pivot.columns.tolist(),
        y=heat_pivot.index.tolist(),
        color_continuous_scale="YlOrRd",
        labels=dict(color="Avg Salary (USD)"),
        text_auto=".0f",
    )
    fig_heat.update_layout(
        title="Avg Salary Heatmap: Job Title vs Location (Top 10 Locations)",
        height=450,
    )
    st.plotly_chart(fig_heat, use_container_width=True)


def render_compare_page():
    """Job comparison page."""
    st.markdown('<p class="main-header">Job Comparison & Analysis</p>', unsafe_allow_html=True)
    st.markdown(
        '<p class="sub-header">Compare roles, analyze growth trends, and explore market demand</p>',
        unsafe_allow_html=True,
    )

    df = load_data()

    # Job selector
    available_jobs = df["job_title"].value_counts()
    popular_jobs = available_jobs[available_jobs >= 10].index.tolist()

    selected_jobs = st.multiselect(
        "Select Job Titles to Compare",
        options=popular_jobs,
        default=[j for j in TOP_JOB_TITLES[:4] if j in popular_jobs],
    )

    if not selected_jobs:
        st.info("Please select at least one job title to begin comparison.")
        return

    st.markdown("---")

    tab1, tab2, tab3 = st.tabs(
        ["Salary Comparison", "Growth Analysis", "Market Demand"]
    )

    with tab1:
        _render_job_comparison(df, selected_jobs)

    with tab2:
        _render_growth_analysis(df, selected_jobs)

    with tab3:
        _render_demand_analysis(df, selected_jobs)
