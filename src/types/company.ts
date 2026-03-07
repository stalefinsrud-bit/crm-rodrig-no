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
  strategic_insight: string | null;
  is_deleted: boolean;
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

// Stage = Pipeline progression (required)
export const STAGES = [
  'New',
  'Identified',
  'Contacted',
  'In Dialogue',
  'Presented',
  'Proposal',
  'Won',
  'Rejected',
] as const;

export const STAGE_DESCRIPTIONS: Record<string, string> = {
  'New': 'Newly added, not yet assessed',
  'Identified': 'Company mapped, no contact yet',
  'Contacted': 'Outreach initiated',
  'In Dialogue': 'Active discussion or meeting',
  'Presented': 'Intro or presentation shared',
  'Proposal': 'Commercial proposal sent',
  'Won': 'Agreement in place',
  'Rejected': 'Declined cooperation',
};

// Backward-compatible aliases
export const PARTNER_STAGES = STAGES;
export const PARTNER_STAGE_DESCRIPTIONS = STAGE_DESCRIPTIONS;

// Status = Operational state (optional)
export const COMPANY_STATUSES = ['Active', 'On Hold', 'Dormant', 'Not Relevant'] as const;

export const COMPANY_PRIORITIES = ['High', 'Medium', 'Low'] as const;
export const ACTIVITY_TYPES: ActivityType[] = ['email', 'phone', 'meeting', 'linkedin', 'presentation', 'internal'];

export const STATUS_COLORS: Record<string, string> = {
  'Active': 'bg-success/10 text-success border-success/20',
  'On Hold': 'bg-warning/10 text-warning border-warning/20',
  'Dormant': 'bg-muted text-muted-foreground border-border',
  'Not Relevant': 'bg-destructive/10 text-destructive border-destructive/20',
};

export const STAGE_COLORS: Record<string, string> = {
  'New': 'bg-info/10 text-info border-info/20',
  'Identified': 'bg-info/20 text-info border-info/30',
  'Contacted': 'bg-warning/10 text-warning border-warning/20',
  'In Dialogue': 'bg-warning/20 text-warning border-warning/30',
  'Presented': 'bg-accent/20 text-accent-foreground border-accent/30',
  'Proposal': 'bg-accent/30 text-accent-foreground border-accent/40',
  'Won': 'bg-success/10 text-success border-success/20',
  'Rejected': 'bg-destructive/10 text-destructive border-destructive/20',
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
