import React, { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = () => {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Connect to StudentProfiler API (Port 5002)
                const res = await axios.get('http://localhost:5002/profiles');
                setProfiles(res.data);
            } catch (error) {
                console.error("Error fetching profiles", error);
                // Fallback mock data if API fails to load during scratch/demo
                setProfiles([
                    { profile_type: 'At Risk', avg_score: 45 },
                    { profile_type: 'Standard', avg_score: 75 },
                    { profile_type: 'High Achiever', avg_score: 90 },
                    { profile_type: 'At Risk', avg_score: 40 },
                    { profile_type: 'Standard', avg_score: 70 }
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div>Loading Analytics...</div>;

    // Analytics Logic
    const riskCounts = { 'At Risk': 0, 'Standard': 0, 'High Achiever': 0, 'Unknown': 0 };
    profiles.forEach(p => {
        if (riskCounts[p.profile_type] !== undefined) riskCounts[p.profile_type]++;
        else riskCounts['Unknown']++;
    });

    const pieData = {
        labels: Object.keys(riskCounts),
        datasets: [{
            data: Object.values(riskCounts),
            backgroundColor: ['#ff6384', '#36a2eb', '#4bc0c0', '#ccc']
        }]
    };

    return (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '300px', border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
                <h3>Student Risk Distribution</h3>
                <Pie data={pieData} />
            </div>

            <div style={{ flex: 2, minWidth: '300px', border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
                <h3>Student List</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                            <th>ID</th>
                            <th>Email</th>
                            <th>Avg Score</th>
                            <th>Profile</th>
                        </tr>
                    </thead>
                    <tbody>
                        {profiles.slice(0, 10).map((p, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                <td>{p.student_id || i + 1}</td>
                                <td>{p.email || 'N/A'}</td>
                                <td>{p.avg_score?.toFixed(1) || p.avg_score}</td>
                                <td style={{
                                    color: p.profile_type === 'At Risk' ? 'red' :
                                        p.profile_type === 'High Achiever' ? 'green' : 'black',
                                    fontWeight: 'bold'
                                }}>{p.profile_type}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;
