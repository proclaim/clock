'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  useMediaQuery,
  useTheme,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Check, Close } from '@mui/icons-material';
import { adminService } from '@/services/adminService';
import { AdminEditRequest } from '@/types/admin';
import { formatDate, formatTime } from '@/utils/dateUtils';

interface PendingApprovalsTableProps {
  onApprovalAction?: () => void;
}

export const PendingApprovalsTable: React.FC<PendingApprovalsTableProps> = ({
  onApprovalAction,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<AdminEditRequest[]>([]);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AdminEditRequest | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const response = await adminService.getPendingEditRequests();
      setRequests(response.edit_requests || []);
    } catch (error) {
      console.error('Failed to load pending edit requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (request: AdminEditRequest) => {
    setIsProcessing(true);
    try {
      await adminService.approveEditRequest(request.id);
      loadRequests();
      if (onApprovalAction) onApprovalAction();
    } catch (error) {
      console.error('Failed to approve edit request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectClick = (request: AdminEditRequest) => {
    setSelectedRequest(request);
    setReviewNote('');
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedRequest) return;
    setIsProcessing(true);
    try {
      await adminService.rejectEditRequest(selectedRequest.id, reviewNote);
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      loadRequests();
      if (onApprovalAction) onApprovalAction();
    } catch (error) {
      console.error('Failed to reject edit request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatChange = (original: string | null, requested: string | null, lang: string) => {
    if (!requested) return null;
    const origDisplay = original ? formatTime(original, lang) : '—';
    const reqDisplay = formatTime(requested, lang);
    return `${origDisplay} → ${reqDisplay}`;
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" sx={{ py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (requests.length === 0) {
    return null;
  }

  const MobileCard = ({ request }: { request: AdminEditRequest }) => (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        boxShadow: 'rgb(145 158 171 / 30%) 0px 0px 2px 0px, rgb(145 158 171 / 12%) 0px 12px 24px -4px',
        borderLeft: '4px solid',
        borderLeftColor: 'warning.main',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {request.employee_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatDate(request.original_check_in_time, i18n.language)}
          </Typography>
        </Box>
        <Chip label={t('Pending')} color="warning" size="small" />
      </Box>

      {request.requested_check_in_time && (
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          {t('Check-In')}: {formatChange(request.original_check_in_time, request.requested_check_in_time, i18n.language)}
        </Typography>
      )}
      {request.requested_check_out_time && (
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          {t('Check-Out')}: {formatChange(request.original_check_out_time, request.requested_check_out_time, i18n.language)}
        </Typography>
      )}
      {request.note && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontStyle: 'italic' }}>
          {request.note}
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <Button
          size="small"
          variant="contained"
          color="success"
          startIcon={<Check />}
          onClick={() => handleApprove(request)}
          disabled={isProcessing}
        >
          {t('Approve')}
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="error"
          startIcon={<Close />}
          onClick={() => handleRejectClick(request)}
          disabled={isProcessing}
        >
          {t('Reject')}
        </Button>
      </Box>
    </Paper>
  );

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
            {t('Pending Edit Requests')}
          </Typography>
          <Chip label={requests.length} color="warning" size="small" />
        </Box>

        {isMobile ? (
          <Stack spacing={1.5}>
            {requests.map((request) => (
              <MobileCard key={request.id} request={request} />
            ))}
          </Stack>
        ) : (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: 2,
              boxShadow: 'rgb(145 158 171 / 30%) 0px 0px 2px 0px, rgb(145 158 171 / 12%) 0px 12px 24px -4px',
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'warning.lighter' }}>
                  <TableCell sx={{ fontWeight: 600 }}>{t('Employee')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('Date')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('Requested Changes')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('Reason')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">{t('Actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {request.employee_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(request.original_check_in_time, i18n.language)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {request.requested_check_in_time && (
                        <Typography variant="body2">
                          {t('Check-In')}: {formatChange(request.original_check_in_time, request.requested_check_in_time, i18n.language)}
                        </Typography>
                      )}
                      {request.requested_check_out_time && (
                        <Typography variant="body2">
                          {t('Check-Out')}: {formatChange(request.original_check_out_time, request.requested_check_out_time, i18n.language)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {request.note || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<Check />}
                          onClick={() => handleApprove(request)}
                          disabled={isProcessing}
                          sx={{ textTransform: 'none' }}
                        >
                          {t('Approve')}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<Close />}
                          onClick={() => handleRejectClick(request)}
                          disabled={isProcessing}
                          sx={{ textTransform: 'none' }}
                        >
                          {t('Reject')}
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Reject Confirmation Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('Reject Edit Request')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t('Reason for Rejection (optional)')}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            multiline
            rows={3}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={isProcessing}>
            {t('Cancel')}
          </Button>
          <Button
            onClick={handleRejectConfirm}
            variant="contained"
            color="error"
            disabled={isProcessing}
          >
            {isProcessing ? t('Rejecting...') : t('Reject')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
