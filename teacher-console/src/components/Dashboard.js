import React, { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import axios from 'axios';
import { 
    Grid, Card, CardHeader, CardContent, Typography, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Skeleton, Box
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = () => {
    const { user } = useAuth();
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Teacher's Students (LMS Service)
                const teacherId = user?.id || 1; 
                const studentsRes = await axios.get(`http://localhost:8000/lms/students?teacherId=${teacherId}`);
                const myStudentIds = new Set(studentsRes.data.map(s => s.id));

                // 2. Fetch All Profiles (Profiler Service)
                // Note: ideally Profiler should support filtering, but valid workaround for now
                // 2. Fetch All Profiles (Profiler Service)
                // Use API Gateway (8000/profiler) which maps to 5001
                const profilesRes = await axios.get('http://localhost:8000/profiler/profiles');
                
                // 3. Filter Profiles
                const filteredProfiles = profilesRes.data.filter(p => myStudentIds.has(p.student_id));
                setProfiles(filteredProfiles);

            } catch (error) {
                console.error("Error fetching dashboard data", error);
                setProfiles([]); // Clear on error
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]);

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
            backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#cbd5e1'],
            borderWidth: 0,
        }]
    };

    if (loading) { 
        return (
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
                </Grid>
            </Grid>
        );
    }

    if (profiles.length === 0) {
         return (
             <Box sx={{ textAlign: 'center', mt: 5 }}>
                 <Typography variant="h6" color="text.secondary">No student data available for your classes.</Typography>
             </Box>
         );
    }

    return (
        <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
               <Typography variant="h4" gutterBottom fontWeight="700" color="text.primary">Dashboard Overview</Typography>
               <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                   Real-time metrics for your {profiles.length} students
               </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ height: '100%' }}>
                    <CardHeader title="Student Risk Distribution" titleTypographyProps={{ variant: 'h6', fontWeight: 600 }} />
                    <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                         <Box sx={{ width: '100%', maxWidth: 250 }}>
                            <Pie data={pieData} options={{ maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } }} />
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
                <Card sx={{ height: '100%' }}>
                     <CardHeader title="Recent Student Activity" titleTypographyProps={{ variant: 'h6', fontWeight: 600 }} />
                    <CardContent>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>Avg Score</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {profiles.slice(0, 10).map((p, i) => (
                                        <TableRow key={i} hover>
                                            <TableCell>#{p.student_id || i + 1}</TableCell>
                                            <TableCell>{p.email || 'student@example.com'}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>{p.avg_score?.toFixed(1) || p.avg_score}</TableCell>
                                            <TableCell align="center">
                                                <Chip 
                                                    label={p.profile_type} 
                                                    size="small"
                                                    color={
                                                        p.profile_type === 'At Risk' ? 'error' :
                                                        p.profile_type === 'High Achiever' ? 'success' :
                                                        p.profile_type === 'Standard' ? 'primary' : 'default'
                                                    }
                                                    variant="soft"
                                                    sx={{ fontWeight: 500 }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};

export default Dashboard;
