// Status color configurations for dropdowns
// Format: { bg: background color }

export interface StatusColorConfig {
  bg: string;
}

// Lead status colors (new_leads, coa stages)
export const leadStatusColors: Record<string, StatusColorConfig> = {
  pending: { bg: '#E7F1F9' }, // Light blue - pending
  waiting_for_insurer: { bg: '#E7F1F9' },
  docs_missing: { bg: '#FFFEF2' },
  partially_added: { bg: '#E6F8F0' },
  completed: { bg: '#E6F8F0' },
  quotation_shared: { bg: '#E6F8F0' },
  invalid: { bg: '#FFF5F5' },
  // Renewal statuses
  price_pending: { bg: '#E7F1F9' },
  revision_pending: { bg: '#E7F1F9' },
  renewal_rejected: { bg: '#FFF5F5' },
  price_ready: { bg: '#E6F8F0' },
  revision_required: { bg: '#E7F1F9' },
};

// Policy status colors (VMI/CMI)
export const policyStatusColors: Record<string, StatusColorConfig> = {
  pending_payment: { bg: '#E7F1F9' }, // Light blue - pending
  pending_review: { bg: '#E7F1F9' },
  pending_issuance: { bg: '#E7F1F9' },
  policy_issued: { bg: '#E6F8F0' },
  policy_shipped: { bg: '#E6F8F0' },
  policy_delivered: { bg: '#E6F8F0' },
  policy_cancelled: { bg: '#FFF5F5' },
  rework_required: { bg: '#FDE68A' }, // Stronger amber - like hover state
};

// Get inline styles for a status
export function getStatusStyles(status: string, colors: Record<string, StatusColorConfig>, disabled = false): React.CSSProperties {
  const config = colors[status];
  
  if (!config || !config.bg) {
    return {}; // Return empty for default styling
  }
  
  const opacity = disabled ? 0.65 : 1;
  
  return {
    backgroundColor: config.bg,
    opacity,
  };
}
