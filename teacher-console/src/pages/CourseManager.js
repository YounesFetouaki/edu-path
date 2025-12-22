import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Button, TextField,
    Accordion, AccordionSummary, AccordionDetails, Select, MenuItem,
    FormControl, InputLabel, IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import QuizIcon from '@mui/icons-material/Quiz';
import AssignmentIcon from '@mui/icons-material/Assignment';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import { useAuth } from '../context/AuthContext';

// API Configuration
const API_URL = 'http://localhost:8000/lms'; // Via Gateway


export default function CourseManager() {
    const { user } = useAuth();
    // ... (existing states)
    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');

    const [courseStructure, setCourseStructure] = useState([]);
    const [allQuizzes, setAllQuizzes] = useState([]); // List of available quizzes
    const [allAssignments, setAllAssignments] = useState([]); // List of available assignments
    
    // Dialog States
    const [openModuleDialog, setOpenModuleDialog] = useState(false); // For Create
    const [openChapterDialog, setOpenChapterDialog] = useState(false); // For Create
    
    // Edit States
    const [editModuleData, setEditModuleData] = useState(null); // { id, title }
    const [editChapterData, setEditChapterData] = useState(null); // { id, title, type, url, duration, content }

    const [newModuleTitle, setNewModuleTitle] = useState('');
    const [selectedModuleId, setSelectedModuleId] = useState(null);
    // Enhanced newChapter statre to include 'content'
    const [newChapter, setNewChapter] = useState({ title: '', type: 'video', url: '', duration: 10, content: '' });

    // CREATE COURSE STATE
    const [openCourseDialog, setOpenCourseDialog] = useState(false);
    const [newCourseData, setNewCourseData] = useState({ title: '', description: '', category: '', thumbnail_url: '' });

    // ... (existing useEffects & fetch functions)

    useEffect(() => {
        if (user) {
            fetchCourses();
            fetchQuizzes();
            fetchAssignments();
        }
    }, [user]);

    useEffect(() => {
        if (selectedCourseId) {
            fetchStructure(selectedCourseId);
        } else {
            setCourseStructure([]);
        }
    }, [selectedCourseId]);

    const fetchCourses = async () => {
        try {
            const res = await axios.get(`${API_URL}/courses`);
            setCourses(res.data);
            if(res.data.length > 0 && !selectedCourseId) setSelectedCourseId(res.data[0].id);
        } catch (error) {
            console.error("Error fetching courses", error);
        }
    };

    const fetchStructure = async (id) => {
        try {
            const res = await axios.get(`${API_URL}/courses/${id}/structure`);
            setCourseStructure(res.data);
        } catch (error) {
            console.error("Error fetching structure", error);
        }
    };

    const fetchQuizzes = async () => {
        try {
            const res = await axios.get(`${API_URL}/quizzes`);
            setAllQuizzes(res.data);
        } catch (error) {
            console.error("Error fetching quizzes", error);
        }
    };

    const fetchAssignments = async () => {
        try {
            if (!user) return;
            // Using dynamic ID, fallback to 2 (Teacher)
            const teacherId = user.id || 2;
            const res = await axios.get(`${API_URL}/assignments/teacher/${teacherId}`);
            setAllAssignments(res.data);
        } catch (error) {
            console.error("Error fetching assignments", error);
        }
    };



    // CREATE COURSE LOGIC
    const handleCreateCourse = async () => {
        if (!newCourseData.title) return;
        try {
            await axios.post(`${API_URL}/courses`, {
                ...newCourseData,
                teacherId: 1 // Default to 1 (Admin/Teacher)
            });
            setOpenCourseDialog(false);
            setNewCourseData({ title: '', description: '', category: '', thumbnail_url: '' });
            fetchCourses(); // Refresh list
            alert('Course created successfully!');
        } catch (error) {
            console.error(error);
            alert('Failed to create course');
        }
    };
    const handleCreateModule = async () => {
        if (!newModuleTitle) return;
        try {
            await axios.post(`${API_URL}/courses/${selectedCourseId}/modules`, {
                title: newModuleTitle,
                orderIndex: courseStructure.length + 1
            });
            setOpenModuleDialog(false);
            setNewModuleTitle('');
            fetchStructure(selectedCourseId);
        } catch (error) {
            alert('Failed to create module');
        }
    };

    const handleCreateChapter = async () => {
        if (!newChapter.title || !selectedModuleId) return;
        try {
            await axios.post(`${API_URL}/modules/${selectedModuleId}/chapters`, {
                title: newChapter.title,
                contentType: newChapter.type,
                contentUrl: newChapter.url,
                durationMinutes: newChapter.duration,
                content: newChapter.content // New field for Custom Text
            });
            setOpenChapterDialog(false);
            setNewChapter({ title: '', type: 'video', url: '', duration: 10, content: '' });
            fetchStructure(selectedCourseId);
        } catch (error) {
            alert('Failed to create chapter');
        }
    };

    // EDIT Logic
    const openEditModule = (mod) => {
        setEditModuleData({ id: mod.id, title: mod.title });
    };

    const handleUpdateModule = async () => {
        if (!editModuleData || !editModuleData.title) return;
        try {
            await axios.put(`${API_URL}/modules/${editModuleData.id}`, {
                title: editModuleData.title
            });
            setEditModuleData(null);
            fetchStructure(selectedCourseId);
        } catch (error) {
            alert('Failed to update module');
        }
    };

    const openEditChapter = (chap) => {
        setEditChapterData({
            id: chap.id,
            title: chap.title,
            type: chap.content_type || 'video',
            url: chap.content_url || '',
            duration: chap.duration_minutes || 10,
            content: chap.content || ''
        });
    };

    const handleUpdateChapter = async () => {
        if (!editChapterData || !editChapterData.title) return;
        try {
            await axios.put(`${API_URL}/chapters/${editChapterData.id}`, {
                title: editChapterData.title,
                contentType: editChapterData.type,
                contentUrl: editChapterData.url,
                durationMinutes: editChapterData.duration,
                content: editChapterData.content
            });
            setEditChapterData(null);
            fetchStructure(selectedCourseId);
        } catch (error) {
            alert('Failed to update chapter');
        }
    };

    const openAddChapter = (moduleId) => {
        setSelectedModuleId(moduleId);
        setNewChapter({ title: '', type: 'video', url: '', duration: 10, content: '' });
        setOpenChapterDialog(true);
    };

    // Helper to render icon based on type
    const getIcon = (type) => {
        if(type === 'pdf') return <PictureAsPdfIcon color="error" />;
        if(type === 'text') return <DescriptionIcon color="info" />;
        if(type === 'quiz') return <QuizIcon color="warning" />;
        if(type === 'assignment') return <AssignmentIcon color="success" />;
        return <VideoLibraryIcon color="primary" />;
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="primary">Course Manager</Typography>
                <FormControl sx={{ minWidth: 250 }}>
                    <InputLabel>Select Course</InputLabel>
                    <Select
                        value={selectedCourseId}
                        label="Select Course"
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                    >
                        {courses.map(c => (
                            <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Button 
                    variant="contained" 
                    color="secondary" 
                    startIcon={<AddCircleOutlineIcon />} 
                    onClick={() => setOpenCourseDialog(true)}
                    sx={{ ml: 2 }}
                >
                    New Course
                </Button>
            </Box>

            {selectedCourseId && (
                <>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button 
                            variant="contained" 
                            startIcon={<AddCircleOutlineIcon />}
                            onClick={() => setOpenModuleDialog(true)}
                        >
                            Add Module
                        </Button>
                    </Box>

                    {courseStructure.map((module) => (
                        <Accordion key={module.id} defaultExpanded sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }} elevation={2}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', pr: 2 }}>
                                    <Typography variant="h6" fontWeight="bold">{module.title}</Typography>
                                    <Box 
                                        sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                        onClick={(e) => { e.stopPropagation(); openEditModule(module); }}
                                    >
                                        <EditIcon fontSize="small" />
                                    </Box>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                {module.chapters && module.chapters.length > 0 ? (
                                    <Grid container spacing={2}>
                                        {module.chapters.map((chap) => (
                                            <Grid size={{ xs: 12, md: 6 }} key={chap.id}>
                                                <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }}>
                                                    {getIcon(chap.content_type)}
                                                    <Box sx={{ flexGrow: 1 }}>
                                                        <Typography variant="subtitle1" fontWeight="bold">{chap.title}</Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {chap.duration_minutes || 10} mins • {(chap.content_type || 'video').toUpperCase()}
                                                        </Typography>
                                                    </Box>
                                                    <IconButton size="small" onClick={() => openEditChapter(chap)}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Paper>
                                            </Grid>
                                        ))}
                                    </Grid>
                                ) : (
                                    <Typography color="text.secondary" fontStyle="italic">No content yet.</Typography>
                                )}
                                <Box sx={{ mt: 2 }}>
                                    <Button size="small" variant="outlined" onClick={() => openAddChapter(module.id)}>
                                        + Add Lesson
                                    </Button>
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </>
            )}

            {/* Create Module Dialog */}
            <Dialog open={openModuleDialog} onClose={() => setOpenModuleDialog(false)}>
                <DialogTitle>Add New Module</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Module Title"
                        fullWidth
                        value={newModuleTitle}
                        onChange={(e) => setNewModuleTitle(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenModuleDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreateModule} variant="contained">Create</Button>
                </DialogActions>
            </Dialog>

             {/* EDIT Module Dialog */}
             <Dialog open={!!editModuleData} onClose={() => setEditModuleData(null)}>
                <DialogTitle>Edit Module</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Module Title"
                        fullWidth
                        value={editModuleData?.title || ''}
                        onChange={(e) => setEditModuleData({ ...editModuleData, title: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditModuleData(null)}>Cancel</Button>
                    <Button onClick={handleUpdateModule} variant="contained">Update</Button>
                </DialogActions>
            </Dialog>

            {/* Create Chapter Dialog */}
            <Dialog open={openChapterDialog} onClose={() => setOpenChapterDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Lesson Content</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Lesson Title"
                        fullWidth
                        value={newChapter.title}
                        onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
                        sx={{ mt: 1 }}
                    />
                    <FormControl fullWidth>
                        <InputLabel>Content Type</InputLabel>
                        <Select
                            value={newChapter.type}
                            label="Content Type"
                            onChange={(e) => setNewChapter({ ...newChapter, type: e.target.value })}
                        >
                            <MenuItem value="video">Video</MenuItem>
                            <MenuItem value="text">Custom Text / Article</MenuItem>
                            <MenuItem value="pdf">PDF Document</MenuItem>
                            <MenuItem value="quiz">Quiz</MenuItem>
                            <MenuItem value="assignment">Assignment</MenuItem>
                        </Select>
                    </FormControl>

                    {newChapter.type === 'video' && (
                        <TextField
                            label="Video URL (YouTube/Vimeo)"
                            fullWidth
                            value={newChapter.url}
                            onChange={(e) => setNewChapter({ ...newChapter, url: e.target.value })}
                        />
                    )}

                    {newChapter.type === 'pdf' && (
                        <TextField
                            label="PDF URL (Direct Link)"
                            fullWidth
                            value={newChapter.url}
                            onChange={(e) => setNewChapter({ ...newChapter, url: e.target.value })}
                            placeholder="https://example.com/document.pdf"
                        />
                    )}

                    {newChapter.type === 'text' && (
                        <TextField
                            label="Lesson Content (Markdown Supported)"
                            multiline
                            rows={6}
                            fullWidth
                            value={newChapter.content}
                            onChange={(e) => setNewChapter({ ...newChapter, content: e.target.value })}
                        />
                    )}

                    {newChapter.type === 'quiz' && (
                        <FormControl fullWidth>
                            <InputLabel>Select Quiz</InputLabel>
                            <Select
                                value={newChapter.url}
                                label="Select Quiz"
                                onChange={(e) => setNewChapter({ ...newChapter, url: e.target.value })}
                            >
                                {allQuizzes.map((quiz) => (
                                    <MenuItem key={quiz.id} value={quiz.id}>{quiz.title}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {newChapter.type === 'assignment' && (
                        <FormControl fullWidth>
                            <InputLabel>Select Assignment</InputLabel>
                            <Select
                                value={newChapter.url} // We store assignment ID in 'content_url'
                                label="Select Assignment"
                                onChange={(e) => setNewChapter({ ...newChapter, url: e.target.value })}
                            >
                                {allAssignments.map((assign) => (
                                    <MenuItem key={assign.id} value={assign.id}>
                                        {assign.title} ({assign.class_name})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                     <TextField
                        label="Duration (Minutes)"
                        type="number"
                        fullWidth
                        value={newChapter.duration}
                        onChange={(e) => setNewChapter({ ...newChapter, duration: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenChapterDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreateChapter} variant="contained">Add Lesson</Button>
                </DialogActions>
            </Dialog>

             {/* EDIT Chapter Dialog */}
             <Dialog open={!!editChapterData} onClose={() => setEditChapterData(null)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Lesson Content</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Lesson Title"
                        fullWidth
                        value={editChapterData?.title || ''}
                        onChange={(e) => setEditChapterData({ ...editChapterData, title: e.target.value })}
                        sx={{ mt: 1 }}
                    />
                    <FormControl fullWidth>
                        <InputLabel>Content Type</InputLabel>
                        <Select
                            value={editChapterData?.type || 'video'}
                            label="Content Type"
                            onChange={(e) => setEditChapterData({ ...editChapterData, type: e.target.value })}
                        >
                            <MenuItem value="video">Video</MenuItem>
                            <MenuItem value="text">Custom Text / Article</MenuItem>
                            <MenuItem value="pdf">PDF Document</MenuItem>
                            <MenuItem value="quiz">Quiz</MenuItem>
                            <MenuItem value="assignment">Assignment</MenuItem>
                        </Select>
                    </FormControl>

                    {editChapterData?.type === 'video' && (
                        <TextField
                            label="Video URL"
                            fullWidth
                            value={editChapterData?.url || ''}
                            onChange={(e) => setEditChapterData({ ...editChapterData, url: e.target.value })}
                        />
                    )}

                     {editChapterData?.type === 'pdf' && (
                        <TextField
                            label="PDF URL"
                            fullWidth
                            value={editChapterData?.url || ''}
                            onChange={(e) => setEditChapterData({ ...editChapterData, url: e.target.value })}
                        />
                    )}

                     {editChapterData?.type === 'text' && (
                        <TextField
                            label="Lesson Content"
                            multiline
                            rows={6}
                            fullWidth
                            value={editChapterData?.content || ''}
                            onChange={(e) => setEditChapterData({ ...editChapterData, content: e.target.value })}
                        />
                    )}

                    {editChapterData?.type === 'quiz' && (
                         <FormControl fullWidth>
                            <InputLabel>Select Quiz</InputLabel>
                            <Select
                                value={editChapterData?.url || ''}
                                label="Select Quiz"
                                onChange={(e) => setEditChapterData({ ...editChapterData, url: e.target.value })}
                            >
                                {allQuizzes.map((quiz) => (
                                    <MenuItem key={quiz.id} value={quiz.id}>{quiz.title}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {editChapterData?.type === 'assignment' && (
                         <FormControl fullWidth>
                            <InputLabel>Select Assignment</InputLabel>
                            <Select
                                value={editChapterData?.url || ''}
                                label="Select Assignment"
                                onChange={(e) => setEditChapterData({ ...editChapterData, url: e.target.value })}
                            >
                                {allAssignments.map((assign) => (
                                    <MenuItem key={assign.id} value={assign.id}>
                                        {assign.title} ({assign.class_name})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                     <TextField
                        label="Duration (Minutes)"
                        type="number"
                        fullWidth
                        value={editChapterData?.duration || 10}
                        onChange={(e) => setEditChapterData({ ...editChapterData, duration: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditChapterData(null)}>Cancel</Button>
                    <Button onClick={handleUpdateChapter} variant="contained">Update</Button>
                </DialogActions>
            </Dialog>

            {/* CREATE COURSE DIALOG */}
            <Dialog open={openCourseDialog} onClose={() => setOpenCourseDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        label="Course Title"
                        fullWidth
                        value={newCourseData.title}
                        onChange={(e) => setNewCourseData({ ...newCourseData, title: e.target.value })}
                    />
                    <TextField
                        label="Description"
                        multiline
                        rows={3}
                        fullWidth
                        value={newCourseData.description}
                        onChange={(e) => setNewCourseData({ ...newCourseData, description: e.target.value })}
                    />
                    <TextField
                        label="Category"
                        fullWidth
                        value={newCourseData.category}
                        onChange={(e) => setNewCourseData({ ...newCourseData, category: e.target.value })}
                    />
                    <TextField
                        label="Thumbnail URL (Visible in Mobile App)"
                        fullWidth
                        value={newCourseData.thumbnail_url}
                        onChange={(e) => setNewCourseData({ ...newCourseData, thumbnail_url: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCourseDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreateCourse} variant="contained" color="secondary">Create Course</Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
}
