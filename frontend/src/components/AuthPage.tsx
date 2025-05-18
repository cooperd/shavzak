import React from 'react';
import { Descope } from '@descope/react-sdk';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography } from '@mui/material';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5', // A light background color
      }}
    >
      <Paper elevation={6} sx={{ padding: 4, borderRadius: 2, maxWidth: '400px', width: '100%' }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Welcome to Shavzak
        </Typography>
        <Descope
          flowId={import.meta.env.VITE_DESCOPE_SIGN_UP_OR_IN_FLOW_ID || "sign-up-or-in"} // Or your specific invite flow ID
          onSuccess={(e) => {
            console.log('Descope onSuccess: User authenticated', e.detail.user);
            navigate('/'); // Navigate to dashboard or home page on success
          }}
          onError={(e) => console.log('Descope onError: Could not logged in!', e)}
          // theme="light" // or "dark" or OS theme
        />
      </Paper>
    </Box>
  );
};

export default AuthPage;