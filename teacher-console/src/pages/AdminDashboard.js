import React, { useState } from 'react';
import {
    Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton,
    ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
import QuizIcon from '@mui/icons-material/Quiz';
import SchoolIcon from '@mui/icons-material/School';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import StudentList from '../components/StudentList';
import Dashboard from '../components/Dashboard';
import CourseManager from '../components/CourseManager';
import QuizBuilder from './QuizBuilder';

const drawerWidth = 240;

export default function AdminDashboard() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [view, setView] = useState('dashboard'); // 'dashboard', 'users', 'quiz'

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <IconButton color="inherit" edge="start" sx={{ mr: 2, display: { sm: 'none' } }}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        EduPath-MS Teacher Console
                    </Typography>
                    <Typography variant="body1" sx={{ mr: 2 }}>
                        Welcome, {user?.name || 'Teacher'}
                    </Typography>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>T</Avatar>
                </Toolbar>
            </AppBar>
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
                }}
            >
                <Toolbar />
                <Box sx={{ overflow: 'auto' }}>
                    <List>
                        <ListItem disablePadding>
                            <ListItemButton selected={view === 'dashboard'} onClick={() => setView('dashboard')}>
                                <ListItemIcon><DashboardIcon /></ListItemIcon>
                                <ListItemText primary="Overview" />
                            </ListItemButton>
                        </ListItem>
                        <ListItem disablePadding>
                            <ListItemButton selected={view === 'courses'} onClick={() => setView('courses')}>
                                <ListItemIcon><SchoolIcon /></ListItemIcon>
                                <ListItemText primary="My Courses" />
                            </ListItemButton>
                        </ListItem>
                        <ListItem disablePadding>
                            <ListItemButton selected={view === 'users'} onClick={() => setView('users')}>
                                <ListItemIcon><PeopleIcon /></ListItemIcon>
                                <ListItemText primary="Class Management" />
                            </ListItemButton>
                        </ListItem>
                        <ListItem disablePadding>
                            <ListItemButton selected={view === 'quiz'} onClick={() => setView('quiz')}>
                                <ListItemIcon><QuizIcon /></ListItemIcon>
                                <ListItemText primary="Quiz Builder" />
                            </ListItemButton>
                        </ListItem>
                    </List>
                    <Divider />
                    <List>
                        <ListItem disablePadding>
                            <ListItemButton onClick={handleLogout}>
                                <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
                                <ListItemText primary="Logout" sx={{ color: 'error.main' }} />
                            </ListItemButton>
                        </ListItem>
                    </List>
                </Box>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Toolbar />
                {view === 'dashboard' ? <Dashboard /> :
                    view === 'courses' ? <CourseManager /> :
                        view === 'users' ? <StudentList /> : <QuizBuilder />}
            </Box>
        </Box>
    );
}
