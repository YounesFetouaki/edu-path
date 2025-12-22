import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, TextField, Button, Typography, Box, Alert, Stack } from '@mui/material';
import { School as SchoolIcon } from '@mui/icons-material';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (await login(email, password)) {
            navigate('/dashboard');
        } else {
            setError('Invalid credentials');
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                p: 2,
            }}
        >
            <Container maxWidth="xs">
                <Paper
                    elevation={4}
                    sx={{
                        p: 4,
                        borderRadius: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        backdropFilter: 'blur(10px)',
                        background: 'rgba(255, 255, 255, 0.95)',
                    }}
                >
                    <Box
                        sx={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 2,
                            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.4)',
                        }}
                    >
                        <SchoolIcon sx={{ color: 'white', fontSize: 32 }} />
                    </Box>
                    <Typography component="h1" variant="h5" fontWeight="700" color="text.primary" gutterBottom>
                        Welcome Back
                    </Typography>
                    <Typography component="p" variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Sign in to the Teacher Console
                    </Typography>

                    {error && <Alert severity="error" sx={{ width: '100%', mb: 2, borderRadius: 2 }}>{error}</Alert>}

                    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                        <Stack spacing={2.5}>
                            <TextField
                                required
                                fullWidth
                                label="Email Address"
                                autoFocus
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                variant="outlined"
                                InputProps={{
                                    sx: { borderRadius: 2 }
                                }}
                            />
                            <TextField
                                required
                                fullWidth
                                label="Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                variant="outlined"
                                InputProps={{
                                    sx: { borderRadius: 2 }
                                }}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                sx={{
                                    py: 1.5,
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    borderRadius: 2,
                                    mt: 1,
                                }}
                            >
                                Sign In
                            </Button>
                        </Stack>
                    </Box>
                </Paper>
                <Typography variant="caption" display="block" align="center" sx={{ mt: 3, color: 'rgba(255,255,255,0.5)' }}>
                    © 2024 EduPath. All rights reserved.
                </Typography>
            </Container>
        </Box>
    );
}
