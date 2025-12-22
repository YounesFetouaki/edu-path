import React, { useState, useEffect } from 'react';
import {
    Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, IconButton, Typography, Box, Chip, Dialog, DialogTitle, DialogContent,
    TextField, DialogActions, Alert, List, ListItem, ListItemText, Divider, Card, CardHeader, CardContent,
    Stack, Avatar, Tooltip, useTheme
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useAuth } from '../context/AuthContext';

export default function StudentList() {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const theme = useTheme();

    // Assign State
    const [openAssign, setOpenAssign] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [assignmentTitle, setAssignmentTitle] = useState('');
    const [assignmentDesc, setAssignmentDesc] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [msg, setMsg] = useState('');
    const [openCreateStudent, setOpenCreateStudent] = useState(false);

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
            .catch(err => {
                 console.error('Failed to fetch students', err);
                 // Mock data for demo if fetch fails
                 setStudents([
                     { id: 1, name: "Alice Johnson", class_name: "Grade 10-A", email: "alice@example.com", persona: "Star" },
                     { id: 2, name: "Bob Smith", class_name: "Grade 10-B", email: "bob@example.com", persona: "Risk" },
                     { id: 3, name: "Charlie Brown", class_name: "Grade 10-A", email: "charlie@example.com", persona: "Standard" },
                 ]);
            });
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
                // Mock grades
                setGrades([ 
                    { id: 101, quiz_title: 'Math Quiz 1', submitted_at: new Date().toISOString(), score: 85, max_score: 100 },
                    { id: 102, quiz_title: 'History Essay', submitted_at: new Date().toISOString(), score: 40, max_score: 100 }
                ]);
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
            setMsg('Error assigning task.'); // Demo fallback
             setTimeout(() => setOpenAssign(false), 1500);
        }
    };

    return (
        <Card sx={{ width: '100%', mb: 4, overflow: 'hidden' }}>
            <CardHeader 
                title={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight="700">Class Roster</Typography>
                        <Button 
                            variant="contained" 
                            startIcon={<AddIcon />} 
                            size="small"
                            sx={{ borderRadius: 2 }}
                            onClick={() => setOpenCreateStudent(true)}
                        >
                            Add Student
                        </Button>
                    </Box>
                }
                sx={{ bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider', py: 2 }} 
            />
            <CardContent sx={{ p: 0 }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'background.paper' }}>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Class</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Persona</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {students.map((student) => (
                                <TableRow key={student.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.light }}>
                                                {student.name[0]}
                                            </Avatar>
                                            <Typography variant="body2" fontWeight="500">{student.name}</Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={student.class_name || 'N/A'} size="small" variant="outlined" sx={{ borderRadius: 1 }} />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">{student.email}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={student.persona || 'Standard'}
                                            color={student.persona === 'Risk' ? 'error' : student.persona === 'Star' ? 'success' : 'default'}
                                            size="small"
                                            sx={{ fontWeight: 500 }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="View Grades">
                                            <IconButton 
                                                size="small" 
                                                onClick={() => handleViewGrades(student)}
                                                sx={{ color: 'info.main', bgcolor: 'info.lighter', mr: 1 }}
                                            >
                                                <VisibilityIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Assign Task">
                                            <IconButton 
                                                size="small" 
                                                onClick={() => handleOpenAssign(student)}
                                                sx={{ color: 'primary.main', bgcolor: 'primary.lighter', mr: 1 }}
                                            >
                                                <AssignmentIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton size="small" color="error">
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>

            {/* Assign Modal */}
            <Dialog 
                open={openAssign} 
                onClose={() => setOpenAssign(false)} 
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                {/* ... existing assign modal content ... */}
                 <DialogTitle sx={{ fontWeight: 700 }}>Assign Task to {selectedStudent?.name}</DialogTitle>
                <DialogContent>
                    {msg && <Alert severity="success" sx={{ mb: 2 }}>{msg}</Alert>}
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Assignment Title"
                            fullWidth
                            value={assignmentTitle}
                            onChange={(e) => setAssignmentTitle(e.target.value)}
                            variant="outlined"
                        />
                        <TextField
                            label="Description / URL"
                            fullWidth
                            multiline
                            rows={3}
                            value={assignmentDesc}
                            onChange={(e) => setAssignmentDesc(e.target.value)}
                            variant="outlined"
                        />
                        <TextField
                            label="Due Date"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            variant="outlined"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpenAssign(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
                    <Button onClick={handleAssign} variant="contained" disabled={!assignmentTitle}>Assign</Button>
                </DialogActions>
            </Dialog>

             {/* CREATE STUDENT DIALOG - NEW */}
             <CreateStudentDialog 
                open={openCreateStudent} 
                onClose={() => setOpenCreateStudent(false)} 
                onCreated={() => {
                    // refresh list?
                    const teacherId = user?.id || 1; 
                    fetch(`http://localhost:8000/lms/students?teacherId=${teacherId}`)
                        .then(res => res.json())
                        .then(data => setStudents(data));
                }}
             />

            {/* Grades Modal */}
            <Dialog 
                open={openGrades} 
                onClose={() => setOpenGrades(false)} 
                maxWidth="sm" 
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
               {/* ... existing grades modal ... */}
                <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    Grade History: <Typography component="span" fontWeight="700" color="primary">{selectedStudent?.name}</Typography>
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    {loadingGrades ? <Box sx={{ p: 3 }}><Typography>Loading...</Typography></Box> : (
                        grades.length === 0 ? <Box sx={{ p: 3 }}><Typography color="text.secondary">No grades recorded.</Typography></Box> : (
                            <List sx={{ pt: 0 }}>
                                {grades.map((g) => (
                                    <React.Fragment key={g.id}>
                                        <ListItem sx={{ px: 3, py: 2 }}>
                                            <ListItemText
                                                primary={<Typography fontWeight="500">{g.quiz_title}</Typography>}
                                                secondary={`Submitted: ${new Date(g.submitted_at).toLocaleDateString()}`}
                                            />
                                            <Chip
                                                label={`${g.score}/${g.max_score}`}
                                                color={g.score < 50 ? 'error' : 'success'}
                                                variant="filled"
                                                size="small"
                                            />
                                        </ListItem>
                                        <Divider component="li" />
                                    </React.Fragment>
                                ))}
                            </List>
                        )
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenGrades(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
}

// Sub-component for clarity
function CreateStudentDialog({ open, onClose, onCreated }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [classId, setClassId] = useState('');
    const [classes, setClasses] = useState([]);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        if(open) {
             fetch('http://localhost:8000/lms/classes/teacher/1')
             .then(res => res.json())
             .then(data => setClasses(data))
             .catch(console.error);
        }
    }, [open]);

    const handleCreate = async () => {
        if(!name || !email || !classId) return;
        try {
            const res = await fetch('http://localhost:8000/lms/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, classId })
            });
            if(res.ok) {
                setMsg('Student Created!');
                setTimeout(() => {
                    setMsg('');
                    onCreated();
                    onClose();
                    setName(''); setEmail(''); setClassId('');
                }, 1000);
            } else {
                setMsg('Failed to create student');
            }
        } catch(e) {
            console.error(e);
            setMsg('Error creating student');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle>Add New Student</DialogTitle>
            <DialogContent>
                {msg && <Alert severity="info" sx={{mb:2}}>{msg}</Alert>}
                <Stack spacing={2} sx={{mt:1}}>
                    <TextField label="Name" fullWidth value={name} onChange={e=>setName(e.target.value)} />
                    <TextField label="Email" fullWidth value={email} onChange={e=>setEmail(e.target.value)} />
                    <TextField 
                        select 
                        label="Class" 
                        fullWidth 
                        value={classId} 
                        onChange={e=>setClassId(e.target.value)}
                        SelectProps={{ native: true }}
                    >
                        <option value="">Select Class</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </TextField>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={handleCreate}>Create</Button>
            </DialogActions>
        </Dialog>
    );
}
