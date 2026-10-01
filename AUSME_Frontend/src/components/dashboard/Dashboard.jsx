import React, { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    LabelList,
    ResponsiveContainer,
} from "recharts";

const API_BASE = (
    import.meta.env.VITE_API_BASE || "/api"
).replace(/\/+$/, "");

function Histogram({
    title,
    data,
    note,
    axisLabel = "Word-count range",
    unit = "words",
}) {
    return (
        <div style={chartCard}>
            <h3>{title}</h3>
            {note && <p style={{ color: "#666" }}>{note}</p>}

            <ResponsiveContainer width="100%" height={340}>
                <BarChart
                    data={data}
                    margin={{
                        top: 30,
                        right: 25,
                        left: 10,
                        bottom: 30,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis
                        dataKey="range"
                        interval={0}
                        tick={{ fontSize: 12 }}
                        label={{
                            value: axisLabel,
                            position: "insideBottom",
                            offset: -20,
                        }}
                    />

                    <YAxis allowDecimals={false} />

                    <Tooltip
                        formatter={(value) => [value, "Records"]}
                        labelFormatter={(label) => `${label} ${unit}`}
                    />

                    <Bar dataKey="count" fill="#236FA5">
                        <LabelList dataKey="count" position="top" />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        async function loadStats() {
            setLoading(true);
            setError("");

            try {
                const response = await fetch(
                    `${API_BASE}/dashboard/`,
                    {
                        signal: controller.signal,
                        cache: "no-store",
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch dashboard data (${response.status})`
                    );
                }

                const data = await response.json();
                setStats(data);
            } catch (err) {
                if (err.name !== "AbortError") {
                    setError(err.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        loadStats();
        return () => controller.abort();
    }, []);

    return (
        <div style={{ padding: "40px" }}>
            <h1>Research Dashboard</h1>

            {error && <p role="alert" style={{ color: "red" }}>{error}</p>}

            {stats && (
                <>
                    <div style={statsContainer}>
                        {[
                            ["Researchers", stats.researchers],
                            ["Research Papers", stats.papers],
                            ["Funding Opportunities", stats.opportunities],
                        ].map(([label, count]) => (
                            <div key={label} style={cardStyle}>
                                <h2>{label}</h2>
                                <div style={{ fontSize: "36px", fontWeight: 700 }}>
                                    {count}
                                </div>
                            </div>
                        ))}
                    </div>

                    <h2 style={{ marginTop: "40px" }}>Dataset Analysis</h2>
                    <p>Calculated from the current database on each refresh.</p>

                    <div style={chartsContainer}>
                        <Histogram
                            title="Paper Title Lengths"
                            data={stats.paper_title_lengths}
                        />

                        <Histogram
                            title="Paper Abstract Lengths"
                            data={stats.paper_abstract_lengths}
                            note={`Empty abstracts: ${stats.missingness?.paper_abstract ?? 0}. The 0 bucket represents empty text.`}
                        />

                        <Histogram
                            title="Funding Description Lengths"
                            data={stats.funding_description_lengths}
                            note={`Empty descriptions: ${stats.missingness?.funding_description ?? 0}. Uses cleaned descriptions when available.`}
                        />

                                               <Histogram
                            title="Full Funding Announcement Lengths"
                            data={stats.funding_full_announcement_lengths}
                            note={`Missing or empty announcements: ${
                                stats.missing_full_announcements ?? 0
                            }.`}
                        />

                        <Histogram
                            title="Estimated RAG Chunks per Announcement"
                            data={stats.funding_rag_chunk_counts}
                            axisLabel="Chunk-count range"
                            unit="chunks"
                            note={`Estimated using ${
                                stats.rag_chunk_settings?.size_words ?? 500
                            } words per chunk and ${
                                stats.rag_chunk_settings?.overlap_words ?? 100
                            } words of overlap.`}
                        />
                    </div>
                </>
            )}
        </div>
    );
}

const statsContainer = {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    marginTop: "20px",
};

const cardStyle = {
    padding: "25px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    minWidth: "220px",
    backgroundColor: "white",
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
};

const chartsContainer = {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "20px",
    marginTop: "20px",
};

const chartCard = {
    backgroundColor: "white",
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    minWidth: 0,
};

export default Dashboard;