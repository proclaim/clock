'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
} from '@mui/material';
import {
  AccountCircle,
  AccessTime,
  Settings,
  Logout,
  Language,
  Lock,
  EventBusy,
  Payments,
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';

export const Header: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [langAnchorEl, setLangAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogoClick = () => {
    if (isAdmin) {
      router.push('/dashboard');
    } else {
      router.push('/attendance');
    }
  };

  const handleSettings = () => {
    handleClose();
    router.push('/settings');
  };

  const handleChangePassword = () => {
    handleClose();
    router.push('/settings#change-password');
  };

  const handleAttendance = () => {
    handleClose();
    router.push('/attendance');
  };

  const handleLeave = () => {
    handleClose();
    router.push('/leave');
  };

  const handlePayroll = () => {
    handleClose();
    router.push('/admin/payroll');
  };

  const handleLogout = async () => {
    handleClose();
    await logout();
  };

  const handleLangMenu = (event: React.MouseEvent<HTMLElement>) => {
    setLangAnchorEl(event.currentTarget);
  };

  const handleLangClose = () => {
    setLangAnchorEl(null);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    handleLangClose();
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        backdropFilter: 'blur(6px)',
      }}
    >
      <Toolbar sx={{ height: 70 }}>
        <Box
          onClick={handleLogoClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            flexGrow: 1,
            '&:hover': {
              opacity: 0.8,
            },
          }}
        >
          <AccessTime sx={{ mr: 2, color: 'primary.main' }} />
          <Typography
            variant="h6"
            component="div"
            sx={{ fontWeight: 700, color: 'text.primary' }}
          >
            {t('Clock')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            size="large"
            aria-label="change language"
            aria-controls="menu-language"
            aria-haspopup="true"
            onClick={handleLangMenu}
            sx={{ color: 'text.primary' }}
          >
            <Language />
          </IconButton>
          <Menu
            id="menu-language"
            anchorEl={langAnchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(langAnchorEl)}
            onClose={handleLangClose}
          >
            <MenuItem onClick={() => changeLanguage('en')}>English</MenuItem>
            <MenuItem onClick={() => changeLanguage('zh-TW')}>繁體中文</MenuItem>
          </Menu>

          <Typography variant="body2" sx={{ mr: 1, color: 'text.primary', fontWeight: 500 }}>
            {user?.name}
          </Typography>

          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            sx={{ color: 'text.primary' }}
          >
            <AccountCircle />
          </IconButton>

          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom', // changed to bottom to match language menu
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            {isAdmin ? (
              <MenuItem onClick={() => { handleClose(); router.push('/dashboard'); }}>
                <ListItemIcon>
                  <AccessTime fontSize="small" />
                </ListItemIcon>
                {t('Admin Dashboard')}
              </MenuItem>
            ) : (
              <MenuItem onClick={handleAttendance}>
                <ListItemIcon>
                  <AccessTime fontSize="small" />
                </ListItemIcon>
                {t('Attendance')}
              </MenuItem>
            )}
            <MenuItem onClick={handleLeave}>
              <ListItemIcon>
                <EventBusy fontSize="small" />
              </ListItemIcon>
              {t('Leave')}
            </MenuItem>
            {isAdmin && (
              <MenuItem onClick={handlePayroll}>
                <ListItemIcon>
                  <Payments fontSize="small" />
                </ListItemIcon>
                {t('Payroll')}
              </MenuItem>
            )}
            <MenuItem onClick={handleSettings}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              {t('Settings')}
            </MenuItem>
            <MenuItem onClick={handleChangePassword}>
              <ListItemIcon>
                <Lock fontSize="small" />
              </ListItemIcon>
              {t('Change Password')}
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              {t('Logout')}
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
