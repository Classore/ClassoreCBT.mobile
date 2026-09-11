import { api } from './api';
import { Platform } from 'react-native';

export interface SupportTicket {
  id: number;
  user: number;
  username: string;
  user_email: string;
  topic: string;
  message: string;
  attachment?: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppIssueReport {
  id: number;
  user: number;
  username: string;
  user_email: string;
  issue_type: string;
  description: string;
  screenshot?: string | null;
  device_info?: Record<string, any>;
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmitSupportTicketParams {
  topic: string;
  message: string;
  attachmentUri?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
}

export interface SubmitIssueReportParams {
  issue_type: string;
  description: string;
  screenshotUri?: string | null;
  screenshotName?: string | null;
  screenshotType?: string | null;
  device_info?: Record<string, any>;
}

export const submitSupportTicket = async (params: SubmitSupportTicketParams): Promise<SupportTicket> => {
  if (params.attachmentUri) {
    const formData = new FormData();
    formData.append('topic', params.topic);
    formData.append('message', params.message);

    const filename = params.attachmentName || 'attachment.jpg';
    const mimeType = params.attachmentType || 'image/jpeg';

    formData.append('attachment', {
      uri: params.attachmentUri,
      name: filename,
      type: mimeType,
    } as any);

    const res = await api.post<SupportTicket>('/api/user/support-tickets/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  }

  const res = await api.post<SupportTicket>('/api/user/support-tickets/', {
    topic: params.topic,
    message: params.message,
  });
  return res.data;
};

export const submitIssueReport = async (params: SubmitIssueReportParams): Promise<AppIssueReport> => {
  const defaultDeviceInfo = {
    platform: Platform.OS,
    version: Platform.Version,
    ...params.device_info,
  };

  if (params.screenshotUri) {
    const formData = new FormData();
    formData.append('issue_type', params.issue_type);
    formData.append('description', params.description);
    formData.append('device_info', JSON.stringify(defaultDeviceInfo));

    const filename = params.screenshotName || 'screenshot.jpg';
    const mimeType = params.screenshotType || 'image/jpeg';

    formData.append('screenshot', {
      uri: params.screenshotUri,
      name: filename,
      type: mimeType,
    } as any);

    const res = await api.post<AppIssueReport>('/api/user/issue-reports/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  }

  const res = await api.post<AppIssueReport>('/api/user/issue-reports/', {
    issue_type: params.issue_type,
    description: params.description,
    device_info: defaultDeviceInfo,
  });
  return res.data;
};

export const getUserSupportTickets = async (): Promise<SupportTicket[]> => {
  const res = await api.get<SupportTicket[]>('/api/user/support-tickets/');
  return res.data;
};

export const getUserIssueReports = async (): Promise<AppIssueReport[]> => {
  const res = await api.get<AppIssueReport[]>('/api/user/issue-reports/');
  return res.data;
};
