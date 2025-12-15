import React, { useState, useEffect } from 'react';
import {
    Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, IconButton, Typography, Box, Chip, Dialog, DialogTitle, DialogContent,
    TextField, DialogActions, Alert, List, ListItem, ListItemText, Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function StudentList() {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);

    // Assign State
    const [openAssign, setOpenAssign] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [assignmentTitle, setAssignmentTitle] = useState('');
    const [assignmentDesc, setAssignmentDesc] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [msg, setMsg] = useState('');

    // Grades State
    const [openGrades, setOpenGrades] = useState(false);
    const [grades, setGrades] = useState([]);
    const [loadingGrades, setLoadingGrades] = useState(false);

    useEffect(() => {
        if (!user) return;
        const teacherId = user.id || 1; // Fallback to 1 if no user
        fetch(`http://localhost:8000/lms/students?teacherId=${teacherId}`)
            .then(res => res.json())
            .then(data => setStudents(data))
            .catch(err => console.error('Failed to fetch students', err));
    }, [user]);

    const handleOpenAssign = (student) => {
        setSelectedStudent(student);
        setOpenAssign(true);
        setMsg('');
    };

    const handleViewGrades = (student) => {
        setSelectedStudent(student);
        setOpenGrades(true);
        setLoadingGrades(true);
        fetch(`http://localhost:8000/lms/grades/${student.id}`)
            .then(res => res.json())
            .then(data => {
                setGrades(data);
                setLoadingGrades(false);
            })
            .catch(err => {
                console.error(err);
                setLoadingGrades(false);
            });
    };

    const handleAssign = async () => {
        try {
            const res = await fetch('http://localhost:8000/lms/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: selectedStudent.id,
                    title: assignmentTitle,
                    description: assignmentDesc,
                    teacherId: 1, // Hardcoded for demo
                    dueDate: dueDate
                })
            });
            if (res.ok) {
                setMsg('Assignment created successfully!');
                setTimeout(() => setOpenAssign(false), 1500);
            } else {
                setMsg('Failed to assign.');
            }
        } catch (e) {
            setMsg('Error assigning task.');
        }
    };

    return (
        <React.Fragment>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5">Class Roster</Typography>
                <Button variant="contained" startIcon={<AddIcon />}>Add Student</Button>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell>Name</TableCell>
                            <TableCell>Class</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Persona</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {students.map((student) => (
                            <TableRow key={student.id} hover>
                                <TableCell>{student.name}</TableCell>
                                <TableCell>
                                    <Chip label={student.class_name || 'N/A'} size="small" variant="outlined" />
                                </TableCell>
                                <TableCell>{student.email}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={student.persona || 'Standard'}
                                        color={student.persona === 'Risk' ? 'error' : student.persona === 'Star' ? 'success' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Button
                                        startIcon={<VisibilityIcon />}
                                        size="small"
                                        color="info"
                                        sx={{ mr: 1 }}
                                        onClick={() => handleViewGrades(student)}
                                    >
                                        Grades
                                    </Button>
                                    <Button
                                        startIcon={<AssignmentIcon />}
                                        size="small"
                                        sx={{ mr: 1 }}
                                        onClick={() => handleOpenAssign(student)}
                                    >
                                        Assign
                                    </Button>
                                    <IconButton size="small" color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Assign Modal */}
            <Dialog open={openAssign} onClose={() => setOpenAssign(false)}>
                <DialogTitle>Assign Task to {selectedStudent?.name}</DialogTitle>
                <DialogContent>
                    {msg && <Alert severity="success" sx={{ mb: 2 }}>{msg}</Alert>}
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Assignment Title"
                        fullWidth
                        value={assignmentTitle}
                        onChange={(e) => setAssignmentTitle(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="Description / URL"
                        fullWidth
                        multiline
                        rows={3}
                        value={assignmentDesc}
                        onChange={(e) => setAssignmentDesc(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="Due Date"
                        type="date"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAssign(false)}>Cancel</Button>
                    <Button onClick={handleAssign} variant="contained">Assign</Button>
                </DialogActions>
            </Dialog>

            {/* Grades Modal */}
            <Dialog open={openGrades} onClose={() => setOpenGrades(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Grade History: {selectedStudent?.name}</DialogTitle>
                <DialogContent dividers>
                    {loadingGrades ? <Typography>Loading...</Typography> : (
                        grades.length === 0 ? <Typography>No grades recorded.</Typography> : (
                            <List>
                                {grades.map((g) => (
                                    <React.Fragment key={g.id}>
                                        <ListItem>
                                            <ListItemText
                                                primary={g.quiz_title}
                                                secondary={`Submitted: ${new Date(g.submitted_at).toLocaleDateString()}`}
                                            />
                                            <Chip
                                                label={`${g.score}/${g.max_score}`}
                                                color={g.score < 50 ? 'error' : 'success'}
                                                variant="outlined"
                                            />
                                        </ListItem>
                                        <Divider />
                                    </React.Fragment>
                                ))}
                            </List>
                        )
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenGrades(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
