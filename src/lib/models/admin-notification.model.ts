export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  type?: string;
  link?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

export interface AdminNotificationsResponse {
  notifications: AdminNotification[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface UnreadNotificationsCountResponse {
  count: number;
}
