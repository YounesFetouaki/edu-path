import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Card, CardContent, Button,
    Dialog, DialogTitle, DialogContent, TextField, DialogActions, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SchoolIcon from '@mui/icons-material/School';
import BookIcon from '@mui/icons-material/Book';

export default function CourseManager() {
    const [courses, setCourses] = useState([]);
    const [open, setOpen] = useState(false);
    const [newCourse, setNewCourse] = useState({ title: '', description: '', category: '' });

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await fetch('http://localhost:8000/lms/courses');
            const data = await res.json();
            setCourses(data);
        } catch (err) {
            console.error('Failed to fetch courses', err);
        }
    };

    const handleCreate = async () => {
        try {
            await fetch('http://localhost:8000/lms/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newCourse, teacherId: 1 })
            });
            setOpen(false);
            setNewCourse({ title: '', description: '', category: '' });
            fetchCourses();
        } catch (err) {
            alert('Error creating course');
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" color="primary" fontWeight="bold">Course Management</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
                    Create Course
                </Button>
            </Box>

            <Grid container spacing={3}>
                {courses.map((course) => (
                    <Grid item xs={12} md={4} key={course.id}>
                        <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ p: 2, bgcolor: 'primary.light', color: 'white', display: 'flex', alignItems: 'center' }}>
                                <SchoolIcon sx={{ mr: 1 }} />
                                <Typography variant="h6">{course.title}</Typography>
                            </Box>
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {course.description || 'No description provided.'}
                                </Typography>
                                <Chip label={course.category || 'General'} size="small" sx={{ mt: 1 }} />
                            </CardContent>
                            <Box sx={{ p: 2, borderTop: '1px solid #eee' }}>
                                <Button size="small" startIcon={<BookIcon />}>View Content</Button>
                            </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Course Title"
                        fullWidth
                        value={newCourse.title}
                        onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Description"
                        fullWidth
                        multiline
                        rows={3}
                        value={newCourse.description}
                        onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Category (e.g. AI, Math, History)"
                        fullWidth
                        value={newCourse.category}
                        onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate} variant="contained">Create</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
