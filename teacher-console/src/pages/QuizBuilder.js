import React, { useState } from 'react';
import {
    Box, Typography, Paper, TextField, Button, Grid, Card, CardContent,
    CircularProgress, IconButton, Tooltip
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function QuizBuilder() {
    const [topic, setTopic] = useState('');
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Call Python Backend for Quizzes
    const handleGenerateAI = async () => {
        if (!topic) return;
        setLoading(true);

        try {
            // Direct call to Python Service (CORS is enabled)
            const res = await fetch('http://localhost:8000/student/quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic })
            });

            if (res.ok) {
                const data = await res.json();
                // Backend returns {question, options, correct}
                // Frontend expects {q, options, correct}
                const transformed = data.map(item => ({
                    q: item.question,
                    options: item.options,
                    correct: item.correct
                }));
                setQuestions(transformed);
            } else {
                console.error("Backend Error");
                setQuestions([
                    { q: 'Backend Error - Showing Generic', options: ['A', 'B'], correct: 0 }
                ]);
            }
        } catch (e) {
            console.error("Network Error", e);
            alert("Could not connect to AI Service (Port 8001). Ensure backend is running.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        alert('Quiz Saved to Class! (Mock)');
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                AI Quiz Builder
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Enter a topic and let our AI generate a 5-question quiz for you instantly.
            </Typography>

            <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        fullWidth
                        label="Enter Topic (e.g. React Hooks, Thermodynamics, History of Rome)"
                        variant="outlined"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleGenerateAI()}
                    />
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
                        onClick={handleGenerateAI}
                        disabled={loading || !topic}
                        sx={{ minWidth: 200, height: 56, fontWeight: 'bold' }}
                    >
                        {loading ? 'Generate' : 'Generate'}
                    </Button>
                </Box>
            </Paper>

            {questions.length > 0 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                        <Typography variant="h5">Preview: {topic} Quiz</Typography>
                        <Box>
                            <Tooltip title="Regenerate">
                                <IconButton onClick={handleGenerateAI} color="primary" sx={{ mr: 1 }}>
                                    <RefreshIcon />
                                </IconButton>
                            </Tooltip>
                            <Button variant="contained" color="success" startIcon={<SaveIcon />} onClick={handleSave}>
                                Save to Class
                            </Button>
                        </Box>
                    </Box>
                    <Grid container spacing={3}>
                        {questions.map((q, idx) => (
                            <Grid item xs={12} md={6} key={idx}>
                                <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                                    <CardContent>
                                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                            {idx + 1}. {q.q}
                                        </Typography>
                                        <Grid container spacing={1} sx={{ mt: 1 }}>
                                            {q.options.map((opt, i) => (
                                                <Grid item xs={6} key={i}>
                                                    <Box
                                                        sx={{
                                                            p: 1.5,
                                                            border: `1px solid ${i === q.correct ? '#4caf50' : '#e0e0e0'}`,
                                                            borderRadius: 1,
                                                            bgcolor: i === q.correct ? '#e8f5e9' : 'transparent',
                                                            color: i === q.correct ? '#2e7d32' : 'inherit',
                                                            fontWeight: i === q.correct ? 'bold' : 'normal',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            textAlign: 'center',
                                                            height: '100%'
                                                        }}
                                                    >
                                                        {opt}
                                                    </Box>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}
        </Box>
    );
}
