import React, { useState } from 'react';
import {
    Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton,
    ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Container, useTheme
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
import CourseManager from './CourseManager';
import QuizBuilder from './QuizBuilder';

const drawerWidth = 260;

export default function AdminDashboard() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [view, setView] = useState('dashboard'); // 'dashboard', 'users', 'quiz'
    const theme = useTheme();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const renderView = () => {
        switch (view) {
            case 'courses': return <CourseManager />;
            case 'users': return <StudentList />;
            case 'quiz': return <QuizBuilder />;
            default: return <Dashboard />;
        }
    };

    return (
        <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
            <AppBar 
                position="fixed" 
                elevation={0}
                sx={{ 
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    bgcolor: 'white',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    color: 'text.primary'
                }}
            >
                <Toolbar>
                    <IconButton color="inherit" edge="start" sx={{ mr: 2, display: { sm: 'none' } }}>
                        <MenuIcon />
                    </IconButton>
                    <SchoolIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1, color: 'primary.main' }} />
                    <Typography 
                        variant="h6" 
                        noWrap 
                        component="div" 
                        sx={{ 
                            flexGrow: 1, 
                            fontWeight: 700,
                            letterSpacing: '-0.5px',
                            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            backgroundClip: 'text',
                            textFillColor: 'transparent',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        EduPath Console
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, display: { xs: 'none', sm: 'block' } }}>
                            {user?.name || 'Instructor'}
                        </Typography>
                        <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                            {(user?.name || 'T')[0]}
                        </Avatar>
                    </Box>
                </Toolbar>
            </AppBar>
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { 
                        width: drawerWidth, 
                        boxSizing: 'border-box',
                        borderRight: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                    },
                }}
            >
                <Toolbar />
                <Box sx={{ overflow: 'auto', mt: 2 }}>
                    <List sx={{ px: 2 }}>
                        {[
                            { id: 'dashboard', icon: <DashboardIcon />, label: 'Overview' },
                            { id: 'courses', icon: <SchoolIcon />, label: 'My Courses' },
                            { id: 'users', icon: <PeopleIcon />, label: 'Class Management' },
                            { id: 'quiz', icon: <QuizIcon />, label: 'Quiz Builder' },
                        ].map((item) => (
                            <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
                                <ListItemButton 
                                    selected={view === item.id} 
                                    onClick={() => setView(item.id)}
                                    sx={{
                                        borderRadius: 2,
                                        '&.Mui-selected': {
                                            bgcolor: 'primary.main',
                                            color: 'primary.contrastText',
                                            '&:hover': {
                                                bgcolor: 'primary.dark',
                                            },
                                            '& .MuiListItemIcon-root': {
                                                color: 'primary.contrastText',
                                            }
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 500 }} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                    <Divider sx={{ my: 2, mx: 2 }} />
                    <List sx={{ px: 2 }}>
                        <ListItem disablePadding>
                            <ListItemButton 
                                onClick={handleLogout}
                                sx={{ 
                                    borderRadius: 2, 
                                    color: 'error.main',
                                    '&:hover': { bgcolor: 'error.lighter' } 
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}><LogoutIcon color="error" /></ListItemIcon>
                                <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 500 }} />
                            </ListItemButton>
                        </ListItem>
                    </List>
                </Box>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: 'background.default' }}>
                <Toolbar />
                <Container maxWidth="xl" sx={{ mt: 2 }}>
                    {renderView()}
                </Container>
            </Box>
        </Box>
    );
}
