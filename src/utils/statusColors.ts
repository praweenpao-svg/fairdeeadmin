// Status color configurations for dropdowns
// Format: { text: text color }

export interface StatusColorConfig {
  text: string;
}

// Lead status colors (new_leads, coa stages)
// Using saturated text colors for clarity
export const leadStatusColors: Record<string, StatusColorConfig> = {
  pending: { text: '#2563EB' }, // Blue - pending
  waiting_for_insurer: { text: '#2563EB' }, // Blue
  docs_missing: { text: '#D97706' }, // Amber/Orange - warning
  partially_added: { text: '#16A34A' }, // Green - partial progress
  completed: { text: '#16A34A' }, // Green - success
  quotation_shared: { text: '#16A34A' }, // Green - success
  invalid: { text: '#DC2626' }, // Red - error
  // Renewal statuses
  price_pending: { text: '#2563EB' }, // Blue - pending
  revision_pending: { text: '#D97706' }, // Amber - needs attention
  renewal_rejected: { text: '#DC2626' }, // Red - rejected
  price_ready: { text: '#16A34A' }, // Green - ready
  revision_required: { text: '#D97706' }, // Amber - needs revision
};

// Policy status colors (VMI/CMI)
export const policyStatusColors: Record<string, StatusColorConfig> = {
  pending_payment: { text: '#2563EB' }, // Blue - pending
  pending_review: { text: '#2563EB' }, // Blue - pending
  pending_issuance: { text: '#2563EB' }, // Blue - pending
  policy_issued: { text: '#16A34A' }, // Green - success
  policy_shipped: { text: '#16A34A' }, // Green - success
  policy_delivered: { text: '#16A34A' }, // Green - success
  policy_cancelled: { text: '#DC2626' }, // Red - cancelled
  rework_required: { text: '#D97706' }, // Amber - needs attention
};

// Get inline styles for a status - applies color to text with bold font
export function getStatusStyles(status: string, colors: Record<string, StatusColorConfig>, disabled = false): React.CSSProperties {
  const config = colors[status];
  if (!config || !config.text) {
    return {}; // Return empty for default styling
  }
  
  return {
    color: config.text,
    fontWeight: 600, // Semi-bold for better readability
    opacity: disabled ? 0.7 : 1,
  };
}
