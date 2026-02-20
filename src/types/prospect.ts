export type ProspectList = 'December 2025 – Dealers/Partners' | 'Master Ship Operator – End Users';
export type ProspectStatus = 'New Lead' | 'Contacted' | 'Meeting Scheduled' | 'Proposal Sent' | 'Negotiation' | 'Agreement Signed' | 'Lost' | 'On Hold';
export type ProspectPriority = 'High' | 'Medium' | 'Low';

export interface Prospect {
  id: string;
  prospect_list: ProspectList;
  company: string;
  country: string | null;
  segment: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  status: ProspectStatus;
  probability: number;
  estimated_value: number | null;
  weighted_value: number | null;
  fleet_size: number | null;
  priority: ProspectPriority;
  notes_internal: string | null;
  date_contacted: string | null;
  next_followup: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const STATUS_COLORS: Record<ProspectStatus, string> = {
  'New Lead': 'bg-info/10 text-info border-info/20',
  'Contacted': 'bg-info/20 text-info border-info/30',
  'Meeting Scheduled': 'bg-warning/10 text-warning border-warning/20',
  'Proposal Sent': 'bg-warning/20 text-warning border-warning/30',
  'Negotiation': 'bg-accent/20 text-accent-foreground border-accent/30',
  'Agreement Signed': 'bg-success/10 text-success border-success/20',
  'Lost': 'bg-destructive/10 text-destructive border-destructive/20',
  'On Hold': 'bg-muted text-muted-foreground border-border',
};

export const PRIORITY_COLORS: Record<ProspectPriority, string> = {
  'High': 'bg-destructive/10 text-destructive',
  'Medium': 'bg-warning/10 text-warning',
  'Low': 'bg-success/10 text-success',
};

export const STATUS_PROBABILITY: Record<ProspectStatus, number> = {
  'New Lead': 5,
  'Contacted': 15,
  'Meeting Scheduled': 30,
  'Proposal Sent': 50,
  'Negotiation': 70,
  'Agreement Signed': 100,
  'Lost': 0,
  'On Hold': 10,
};
