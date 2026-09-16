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
  attachmentFile?: any;
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
  if (params.attachmentUri || params.attachmentFile) {
    const formData = new FormData();
    formData.append('topic', params.topic);
    formData.append('message', params.message);

    const filename = params.attachmentName || 'attachment.jpg';
    const mimeType = params.attachmentType || 'application/octet-stream';

    if (Platform.OS === 'web') {
      if (params.attachmentFile) {
        formData.append('attachment', params.attachmentFile, filename);
      } else if (params.attachmentUri) {
        const response = await fetch(params.attachmentUri);
        const blob = await response.blob();
        formData.append('attachment', blob, filename);
      }
    } else {
      formData.append('attachment', {
        uri: params.attachmentUri,
        name: filename,
        type: mimeType,
      } as any);
    }

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

export interface VideoTutorialItem {
  id: number;
  title: string;
  duration: string;
  category: string;
  thumbnail_url?: string;
  video_url: string;
}

export interface UserGuideItem {
  id: number;
  title: string;
  category: string;
  read_time: string;
  content?: string;
  article_url?: string;
}

export const getVideoTutorials = async (): Promise<VideoTutorialItem[]> => {
  try {
    const res = await api.get<any>('/api/user/content/video-tutorials/');
    const data = res.data.results ? res.data.results : res.data;
    if (Array.isArray(data) && data.length > 0) return data;
  } catch {
    // Graceful fallback
  }

  return [
    {
      id: 1,
      title: 'Getting Started with CBT Practice Exams',
      duration: '4:15',
      category: 'Basics',
      video_url: 'https://classore.com/tutorials/getting-started',
    },
    {
      id: 2,
      title: 'How to Master IELTS Reading & Writing Sections',
      duration: '8:30',
      category: 'IELTS Prep',
      video_url: 'https://classore.com/tutorials/ielts-mastery',
    },
    {
      id: 3,
      title: 'Using AI Explanations & Remedial Practice',
      duration: '5:45',
      category: 'AI Tools',
      video_url: 'https://classore.com/tutorials/ai-explanations',
    },
    {
      id: 4,
      title: 'Joining Contests & Earning Tokens',
      duration: '3:50',
      category: 'Contests',
      video_url: 'https://classore.com/tutorials/contests-tokens',
    },
  ];
};

export const getUserGuides = async (): Promise<UserGuideItem[]> => {
  try {
    const res = await api.get<any>('/api/user/content/user-guides/');
    const data = res.data.results ? res.data.results : res.data;
    if (Array.isArray(data) && data.length > 0) return data;
  } catch {
    // Graceful fallback
  }

  return [
    {
      id: 1,
      title: 'Comprehensive Guide to JAMB UTME Subject Setup',
      category: 'Exams',
      read_time: '5 min read',
      content: 'Learn how to select your 4 core subjects, set custom timers, and simulate realistic CBT exam conditions.',
    },
    {
      id: 2,
      title: 'Understanding IELTS Band Score Calculations',
      category: 'IELTS',
      read_time: '7 min read',
      content: 'A detailed breakdown of how raw scores map to Band Scores 1.0 - 9.0 in Reading, Listening, Writing, and Speaking.',
    },
    {
      id: 3,
      title: 'How to Track & Improve Your Weak Topics',
      category: 'Analytics',
      read_time: '4 min read',
      content: 'Discover how Classore AI analyzes your question response patterns to recommend targeted topic practice.',
    },
  ];
};
