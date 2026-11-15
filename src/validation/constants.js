export const STATUSES = {
  publish: 'Published',
  future: 'Scheduled',
  draft: 'Draft',
  pending: 'Pending review',
  private: 'Private',
  trash: 'Trash',
};

export const LIMITS = {
  title: 200,
  excerpt: 600,
  content: 100000,
  username: 60,
  imageBytes: 5 * 1024 * 1024,
};

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
