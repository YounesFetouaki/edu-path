

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, TextField, Button, Grid, Card, CardContent,
    CircularProgress, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
    DialogActions, FormControl, InputLabel, Select, MenuItem, Tabs, Tab
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';

export default function QuizBuilder() {
    const [topic, setTopic] = useState('');
    const [numQuestions, setNumQuestions] = useState(5);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Saving State
    const [openSaveDialog, setOpenSaveDialog] = useState(false);
    const [courses, setCourses] = useState([]);
    const [modules, setModules] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedModuleId, setSelectedModuleId] = useState('');
    const [quizTitle, setQuizTitle] = useState('');

    useEffect(() => {
        if (openSaveDialog) {
            fetchCourses();
        }
    }, [openSaveDialog]);

    useEffect(() => {
        if (selectedCourseId) {
            fetchModules(selectedCourseId);
        }
    }, [selectedCourseId]);

    const fetchCourses = async () => {
        try {
            const res = await axios.get('http://localhost:8000/lms/courses');
            setCourses(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchModules = async (courseId) => {
        try {
            // Reusing structure endpoint or we could make a specific one. 
            // Structure returns modules with chapters, which is fine.
            const res = await axios.get(`http://localhost:8000/lms/courses/${courseId}/structure`);
            setModules(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    // Call Python Backend for Quizzes
    const handleGenerateAI = async () => {
        if (!topic) return;
        setLoading(true);

        try {
            // Direct call to Python Service (CORS is enabled)
            const res = await fetch('http://localhost:8000/student/quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, count: parseInt(numQuestions) || 5 })
            });

            if (res.ok) {
                const data = await res.json();
                const transformed = data.map(item => ({
                    q: item.question,
                    options: item.options,
                    correct: item.correct
                }));
                setQuestions(transformed);
                setQuizTitle(`${topic} Quiz`);
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

    const handleSaveConfirm = async () => {
        if (!selectedModuleId || !quizTitle) return;

        try {
            // 1. Save Quiz Definition
            const quizData = {
                title: quizTitle,
                topic: topic || 'General',
                questions: questions.map(q => ({
                     question: q.q,
                     options: q.options,
                     correct: q.correct
                }))
            };
            
            const quizRes = await axios.post('http://localhost:8000/lms/quizzes', quizData);
            const quizId = quizRes.data.id;

            // 2. Link to Module (Create Chapter)
            await axios.post(`http://localhost:8000/lms/modules/${selectedModuleId}/chapters`, {
                title: quizTitle,
                contentType: 'quiz',
                contentUrl: quizId.toString(), // Storing Quiz ID in content_url for linking
                durationMinutes: 15
            });

            alert('Quiz Saved and Added to Course!');
            setOpenSaveDialog(false);
        } catch (e) {
            console.error(e);
            alert('Failed to save quiz.');
        }
    };

    // CRUD Operations
    const handleAdd = () => {
        setQuestions([...questions, { q: 'New Question', options: ['Option A', 'Option B'], correct: 0 }]);
    };

    const handleDelete = (index) => {
        const newQ = [...questions];
        newQ.splice(index, 1);
        setQuestions(newQ);
    };

    const handleEdit = (index, field, value, optIndex = null) => {
        const newQ = [...questions];
        if (field === 'q') {
            newQ[index].q = value;
        } else if (field === 'option') {
            newQ[index].options[optIndex] = value;
        } else if (field === 'correct') {
            newQ[index].correct = value; // logic not fully UI exposed but good to have
        }
        setQuestions(newQ);
    };

    const [tabValue, setTabValue] = useState(0); // 0: List, 1: Generator
    const [existingQuizzes, setExistingQuizzes] = useState([]);

    useEffect(() => {
        if (tabValue === 0) {
            fetchQuizzes();
        }
    }, [tabValue]);

    const fetchQuizzes = async () => {
        try {
            const res = await axios.get('http://localhost:8000/lms/quizzes');
            setExistingQuizzes(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    // ... (existing state)
    const [editingQuizId, setEditingQuizId] = useState(null);

    // ... (existing effects/functions)

    const loadQuizForEdit = async (quizId) => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:8000/lms/quizzes/${quizId}`);
            const quiz = res.data;

            setTopic(quiz.topic || '');
            setNumQuestions(quiz.total_questions || 5);
            setQuizTitle(quiz.title);
            
            // Map backend questions to frontend format
            const mappedQuestions = quiz.questions.map(q => ({
                q: q.question_text,
                options: q.options,
                correct: q.correct_option
            }));
            
            setQuestions(mappedQuestions);
            setEditingQuizId(quiz.id);
            setTabValue(1); // Switch to Generator/Editor Tab
        } catch (e) {
            console.error("Failed to load quiz", e);
            alert("Failed to load quiz details");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingQuizId || !quizTitle) return;
        try {
            const quizData = {
                title: quizTitle,
                topic: topic || 'General',
                questions: questions.map(q => ({
                     question: q.q,
                     options: q.options,
                     correct: q.correct
                }))
            };
            await axios.put(`http://localhost:8000/lms/quizzes/${editingQuizId}`, quizData);
            alert('Quiz Updated Successfully!');
            setEditingQuizId(null);
            setTabValue(0); // Go back to list
            fetchQuizzes(); // Refresh list
        } catch (e) {
            console.error(e);
            alert('Failed to update quiz');
        }
    };

    const resetEditor = () => {
        setQuestions([]);
        setTopic('');
        setQuizTitle('');
        setEditingQuizId(null);
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={(e, v) => { setTabValue(v); if(v===1 && !editingQuizId) resetEditor(); }}>
                    <Tab label="My Quizzes" />
                    <Tab label="AI Generator / Editor" />
                </Tabs>
            </Box>

            {/* TAB 0: QUIZ LIST */}
            {tabValue === 0 && (
                <Grid container spacing={3}>
                    {existingQuizzes.map((quiz) => (
                        <Grid size={{ xs: 12, md: 4 }} key={quiz.id}>
                            <Card variant="outlined" sx={{ position: 'relative' }}>
                                <IconButton 
                                    size="small" 
                                    sx={{ position: 'absolute', top: 5, right: 5 }}
                                    onClick={() => loadQuizForEdit(quiz.id)}
                                >
                                    <EditIcon />
                                </IconButton>
                                <CardContent>
                                    <Typography variant="h6" fontWeight="bold">{quiz.title}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {quiz.total_questions || '?'} Questions
                                    </Typography>
                                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                        Created: {new Date(quiz.created_at).toLocaleDateString()}
                                    </Typography>
                                    <Button size="small" sx={{ mt: 1 }} onClick={() => loadQuizForEdit(quiz.id)}>
                                        Edit / View Questions
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                    {existingQuizzes.length === 0 && (
                        <Grid size={{ xs: 12 }}>
                            <Typography color="text.secondary" align="center">No quizzes found. Generate one!</Typography>
                        </Grid>
                    )}
                </Grid>
            )}

            {/* TAB 1: GENERATOR */}
            {tabValue === 1 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight="bold" color="#1976d2">
                            {editingQuizId ? 'Edit Quiz' : 'AI Quiz Generator'}
                        </Typography>
                        {editingQuizId && (
                            <Button variant="outlined" color="secondary" onClick={() => { setEditingQuizId(null); resetEditor(); }}>
                                Cancel Edit & Clear
                            </Button>
                        )}
                    </Box>

                    {!editingQuizId && (
                        <>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                Enter a topic and let our AI generate a custom quiz for you instantly.
                            </Typography>
                            <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    <TextField
                                        label="Topic (e.g. React Hooks)"
                                        variant="outlined"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        fullWidth
                                    />
                                    <TextField
                                        label="Count"
                                        type="number"
                                        variant="outlined"
                                        value={numQuestions}
                                        onChange={(e) => setNumQuestions(e.target.value)}
                                        sx={{ width: 100 }}
                                    />
                                    <Button
                                        variant="contained"
                                        size="large"
                                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
                                        onClick={handleGenerateAI}
                                        disabled={loading || !topic}
                                        sx={{ minWidth: 150, height: 56, fontWeight: 'bold' }}
                                    >
                                        Generate
                                    </Button>
                                </Box>
                            </Paper>
                        </>
                    )}

                    {/* EDIT TITLE (Visible when items loaded) */}
                    {(questions.length > 0 || editingQuizId) && (
                         <TextField
                            label="Quiz Title"
                            fullWidth
                            variant="outlined"
                            value={quizTitle}
                            onChange={(e) => setQuizTitle(e.target.value)}
                            sx={{ mb: 3 }}
                        />
                    )}

                    {questions.length > 0 && (
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                                <Typography variant="h5">Questions ({questions.length})</Typography>
                                <Box>
                                     <Button variant="outlined" sx={{ mr: 1 }} onClick={handleAdd}>
                                        + Add Question
                                    </Button>
                                    {editingQuizId ? (
                                        <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleUpdate}>
                                            Update Quiz
                                        </Button>
                                    ) : (
                                        <Button variant="contained" color="success" startIcon={<SaveIcon />} onClick={() => setOpenSaveDialog(true)}>
                                            Save As New
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                            <Grid container spacing={3}>
                                {questions.map((q, idx) => (
                                    <Grid size={{ xs: 12, md: 6 }} key={idx}>
                                        <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', position: 'relative' }}>
                                            <IconButton 
                                                size="small" 
                                                color="error" 
                                                sx={{ position: 'absolute', top: 5, right: 5, zIndex: 10 }}
                                                onClick={() => handleDelete(idx)}
                                            >
                                                <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>×</Typography>
                                            </IconButton>
                                            <CardContent>
                                                <TextField 
                                                    fullWidth 
                                                    variant="standard" 
                                                    value={q.q} 
                                                    onChange={(e) => handleEdit(idx, 'q', e.target.value)}
                                                    InputProps={{ disableUnderline: true, style: { fontWeight: 'bold', fontSize: '1.1rem' } }}
                                                />
                                                
                                                <Grid container spacing={1} sx={{ mt: 1 }}>
                                                    {q.options.map((opt, i) => (
                                                        <Grid size={{ xs: 6 }} key={i}>
                                                            <Box
                                                                sx={{
                                                                    p: 1,
                                                                    border: `1px solid ${i === q.correct ? '#4caf50' : '#e0e0e0'}`,
                                                                    borderRadius: 1,
                                                                    bgcolor: i === q.correct ? '#e8f5e9' : 'transparent',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                }}
                                                            >
                                                                <TextField 
                                                                    fullWidth 
                                                                    variant="standard" 
                                                                    value={opt} 
                                                                    onChange={(e) => handleEdit(idx, 'option', e.target.value, i)}
                                                                    InputProps={{ disableUnderline: true }}
                                                                />
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

                    {/* SAVE DIALOG - ONLY FOR NEW QUIZZES */}
                     <Dialog open={openSaveDialog} onClose={() => setOpenSaveDialog(false)} fullWidth maxWidth="sm">
                        <DialogTitle>Save & Assign to Course</DialogTitle>
                        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                This will save the quiz and insert it into a course module module.
                            </Typography>
                            {/* Title is already edited above, but we keep it sync or just rely on main title */}
                            
                            <FormControl fullWidth>
                                <InputLabel>Select Course</InputLabel>
                                <Select
                                    value={selectedCourseId}
                                    label="Select Course"
                                    onChange={(e) => setSelectedCourseId(e.target.value)}
                                >
                                    {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth disabled={!selectedCourseId}>
                                <InputLabel>Select Module</InputLabel>
                                <Select
                                    value={selectedModuleId}
                                    label="Select Module"
                                    onChange={(e) => setSelectedModuleId(e.target.value)}
                                >
                                    {modules.map(m => <MenuItem key={m.id} value={m.id}>{m.title}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setOpenSaveDialog(false)}>Cancel</Button>
                            <Button onClick={handleSaveConfirm} variant="contained" disabled={!selectedModuleId}>
                                Save & Assign
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Box>
            )}
        </Box>
    );
}
