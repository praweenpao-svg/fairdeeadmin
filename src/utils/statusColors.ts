// Status color configurations for dropdowns
// Format: { text: text color, bg: faded background color }

export interface StatusColorConfig {
  text: string;
  bg: string;
}

// Lead status colors (new_leads, coa stages)
// Using saturated text colors with faded matching backgrounds
export const leadStatusColors: Record<string, StatusColorConfig> = {
  pending: { text: '#2563EB', bg: 'rgba(37, 99, 235, 0.08)' }, // Blue
  waiting_for_insurer: { text: '#2563EB', bg: 'rgba(37, 99, 235, 0.08)' }, // Blue
  docs_missing: { text: '#D97706', bg: 'rgba(217, 119, 6, 0.08)' }, // Amber/Orange
  partially_added: { text: '#16A34A', bg: 'rgba(22, 163, 74, 0.08)' }, // Green
  completed: { text: '#16A34A', bg: 'rgba(22, 163, 74, 0.08)' }, // Green
  quotation_shared: { text: '#16A34A', bg: 'rgba(22, 163, 74, 0.08)' }, // Green
  invalid: { text: '#DC2626', bg: 'rgba(220, 38, 38, 0.08)' }, // Red
  // Renewal statuses
  price_pending: { text: '#2563EB', bg: 'rgba(37, 99, 235, 0.08)' }, // Blue
  revision_pending: { text: '#D97706', bg: 'rgba(217, 119, 6, 0.08)' }, // Amber
  renewal_rejected: { text: '#DC2626', bg: 'rgba(220, 38, 38, 0.08)' }, // Red
  price_ready: { text: '#16A34A', bg: 'rgba(22, 163, 74, 0.08)' }, // Green
  revision_required: { text: '#D97706', bg: 'rgba(217, 119, 6, 0.08)' }, // Amber
};

// Policy status colors (VMI/CMI)
export const policyStatusColors: Record<string, StatusColorConfig> = {
  pending_payment: { text: '#2563EB', bg: 'rgba(37, 99, 235, 0.08)' }, // Blue
  pending_review: { text: '#2563EB', bg: 'rgba(37, 99, 235, 0.08)' }, // Blue
  pending_issuance: { text: '#2563EB', bg: 'rgba(37, 99, 235, 0.08)' }, // Blue
  policy_issued: { text: '#16A34A', bg: 'rgba(22, 163, 74, 0.08)' }, // Green
  policy_shipped: { text: '#16A34A', bg: 'rgba(22, 163, 74, 0.08)' }, // Green
  policy_delivered: { text: '#16A34A', bg: 'rgba(22, 163, 74, 0.08)' }, // Green
  policy_cancelled: { text: '#DC2626', bg: 'rgba(220, 38, 38, 0.08)' }, // Red
  rework_required: { text: '#D97706', bg: 'rgba(217, 119, 6, 0.08)' }, // Amber
};

// Get inline styles for a status - applies color to text with bold font and faded background
export function getStatusStyles(status: string, colors: Record<string, StatusColorConfig>, disabled = false): React.CSSProperties {
  const config = colors[status];
  if (!config || !config.text) {
    return {}; // Return empty for default styling
  }
  
  return {
    color: config.text,
    backgroundColor: config.bg,
    fontWeight: 600, // Semi-bold for better readability
    opacity: disabled ? 0.7 : 1,
  };
}
