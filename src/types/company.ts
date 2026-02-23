export interface Company {
  id: string;
  code: string | null;
  company_type: string | null;
  company: string;
  country: string | null;
  region: string | null;
  vessel_type: string | null;
  vessel_segment: string | null;
  size: string | null;
  role: string | null;
  website: string | null;
  first_name: string | null;
  last_name: string | null;
  source: string | null;
  email: string | null;
  phone: string | null;
  last_contact_date: string | null;
  next_action: string | null;
  priority: string;
  status: string;
  fleet_size: number | null;
  partner_stage: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export type ActivityType = 'email' | 'phone' | 'meeting' | 'linkedin' | 'presentation' | 'internal';

export interface Activity {
  id: string;
  company_id: string;
  activity_text: string;
  activity_type: ActivityType;
  created_at: string;
  created_by: string | null;
  is_system_generated: boolean;
}

export const COMPANY_TYPES = [
  'Ship Operator',
  'Offshore Operator',
  'Yard',
  'Sales Partner',
  'Research / Government',
  'Supplier',
] as const;

export const PARTNER_STAGES = [
  'Identified',
  'Presented',
  'In Dialogue',
  'Proposal Sent',
  'Negotiation',
  'Active',
  'Rejected',
  'No Reply',
] as const;

export const PARTNER_STAGE_DESCRIPTIONS: Record<string, string> = {
  'Identified': 'Company mapped, no contact yet',
  'Presented': 'Intro or presentation shared',
  'In Dialogue': 'Active discussion or meeting',
  'Proposal Sent': 'Commercial proposal sent',
  'Negotiation': 'Terms under discussion',
  'Active': 'Agreement in place',
  'Rejected': 'Declined cooperation',
  'No Reply': 'Multiple attempts, no response',
};

export const COMPANY_STATUSES = ['New Lead', 'Contacted', 'Meeting Scheduled', 'Proposal Sent', 'Negotiation', 'Agreement Signed', 'Lost', 'On Hold'] as const;
export const COMPANY_PRIORITIES = ['High', 'Medium', 'Low'] as const;
export const ACTIVITY_TYPES: ActivityType[] = ['email', 'phone', 'meeting', 'linkedin', 'presentation', 'internal'];

export const STATUS_COLORS: Record<string, string> = {
  'New Lead': 'bg-info/10 text-info border-info/20',
  'Contacted': 'bg-info/20 text-info border-info/30',
  'Meeting Scheduled': 'bg-warning/10 text-warning border-warning/20',
  'Proposal Sent': 'bg-warning/20 text-warning border-warning/30',
  'Negotiation': 'bg-accent/20 text-accent-foreground border-accent/30',
  'Agreement Signed': 'bg-success/10 text-success border-success/20',
  'Lost': 'bg-destructive/10 text-destructive border-destructive/20',
  'On Hold': 'bg-muted text-muted-foreground border-border',
};

export const PRIORITY_COLORS: Record<string, string> = {
  'High': 'bg-destructive/10 text-destructive',
  'Medium': 'bg-warning/10 text-warning',
  'Low': 'bg-success/10 text-success',
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  email: '📧 Email',
  phone: '📞 Phone',
  meeting: '🤝 Meeting',
  linkedin: '💼 LinkedIn',
  presentation: '📊 Presentation',
  internal: '📝 Internal',
};
