import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Button, TextField,
    Select, MenuItem, FormControl, InputLabel, Dialog, 
    DialogTitle, DialogContent, DialogActions, Chip
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
// Using generic icons as AssignmentIcon might need import check
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:8000/lms';

export default function AssignmentManager() {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [classes, setClasses] = useState([]);
    
    // Create State
    const [openDialog, setOpenDialog] = useState(false);
    const [newAssign, setNewAssign] = useState({ 
        title: '', 
        description: '', 
        classId: '', 
        dueDate: '' 
    });

    useEffect(() => {
        if (user) {
            fetchAssignments();
            fetchClasses();
        }
    }, [user]);

    const fetchAssignments = async () => {
        try {
            // Use user.id or fallback to 1 ONLY for dev, but 2 is likely the teacher
            const teacherId = user?.id || 2; 
            const res = await axios.get(`${API_URL}/assignments/teacher/${teacherId}`);
            setAssignments(res.data);
        } catch (error) {
            console.error("Error fetching assignments", error);
        }
    };

    const fetchClasses = async () => {
        try {
            const teacherId = user?.id || 2;
            const res = await axios.get(`${API_URL}/classes/teacher/${teacherId}`);
            setClasses(res.data);
        } catch (error) {
            console.error("Error fetching classes", error);
        }
    };

    const handleCreate = async () => {
        if (!newAssign.title || !newAssign.classId) return;

        try {
            const teacherId = user?.id || 2;
            await axios.post(`${API_URL}/assign`, {
                teacherId: teacherId,
                title: newAssign.title,
                description: newAssign.description,
                classId: newAssign.classId,
                dueDate: newAssign.dueDate || null 
                // dueDate format: YYYY-MM-DD
            });
            setOpenDialog(false);
            setNewAssign({ title: '', description: '', classId: '', dueDate: '' });
            fetchAssignments();
            alert('Assignment Created!');
        } catch (error) {
            console.error(error);
            alert('Failed to create assignment');
        }
    };

    return (
        <Box sx={{ p: 4, maxWidth: 1200, margin: '0 auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="primary">
                    Assignment Manager
                </Typography>
                <Button 
                    variant="contained" 
                    startIcon={<AddCircleIcon />}
                    onClick={() => setOpenDialog(true)}
                >
                    Create Assignment
                </Button>
            </Box>

            <Grid container spacing={3}>
                {assignments.map(assign => (
                    <Grid item xs={12} md={6} lg={4} key={assign.id}>
                        <Paper sx={{ p: 3, borderRadius: 2 }} elevation={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <AutoStoriesIcon color="secondary" sx={{ mr: 1 }} />
                                <Typography variant="h6" fontWeight="bold" noWrap>
                                    {assign.title}
                                </Typography>
                            </Box>
                            
                            <Chip 
                                label={assign.class_name || 'Class ' + assign.class_id} 
                                size="small" 
                                color="primary" 
                                variant="outlined" 
                                sx={{ mb: 2 }}
                            />

                            <Typography variant="body2" color="text.secondary" paragraph sx={{ height: 40, overflow: 'hidden' }}>
                                {assign.description || 'No description provided.'}
                            </Typography>
                            
                            <Typography variant="caption" display="block" color="text.disabled">
                                Due: {assign.due_date ? new Date(assign.due_date).toLocaleDateString() : 'No Due Date'}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
                {assignments.length === 0 && (
                    <Typography variant="body1" sx={{ ml: 3, mt: 2 }} fontStyle="italic">
                        No assignments found. Create one to get started!
                    </Typography>
                )}
            </Grid>

            {/* CREATE DIALOG */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Assignment</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        label="Title"
                        fullWidth
                        value={newAssign.title}
                        onChange={(e) => setNewAssign({ ...newAssign, title: e.target.value })}
                    />
                    <FormControl fullWidth>
                        <InputLabel>Assign to Class</InputLabel>
                        <Select
                            value={newAssign.classId}
                            label="Assign to Class"
                            onChange={(e) => setNewAssign({ ...newAssign, classId: e.target.value })}
                        >
                            {classes.map(c => (
                                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        label="Description"
                        multiline
                        rows={3}
                        fullWidth
                        value={newAssign.description}
                        onChange={(e) => setNewAssign({ ...newAssign, description: e.target.value })}
                    />
                     <TextField
                        label="Due Date"
                        type="date"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={newAssign.dueDate}
                        onChange={(e) => setNewAssign({ ...newAssign, dueDate: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreate} variant="contained">Create</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
