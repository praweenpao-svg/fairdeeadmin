// Status color configurations for dropdowns
// Format: { bg: background color, border: border color }

export interface StatusColorConfig {
  bg: string;
  border: string;
}

// Lead status colors (new_leads, coa stages)
export const leadStatusColors: Record<string, StatusColorConfig> = {
  pending: { bg: '', border: '' }, // No color (default)
  waiting_for_insurer: { bg: '#E7F1F9', border: '#1253A4' },
  docs_missing: { bg: '#FFFEF2', border: '#FFC107' },
  partially_added: { bg: '#E6F8F0', border: '#66BE88' },
  completed: { bg: '#E6F8F0', border: '#66BE88' },
  quotation_shared: { bg: '#E6F8F0', border: '#66BE88' },
  invalid: { bg: '#FFF5F5', border: '#D5596C' },
  // Renewal statuses - use similar patterns
  price_pending: { bg: '', border: '' },
  revision_pending: { bg: '#E7F1F9', border: '#1253A4' },
  renewal_rejected: { bg: '#FFF5F5', border: '#D5596C' },
  price_ready: { bg: '#E6F8F0', border: '#66BE88' },
  revision_required: { bg: '#E7F1F9', border: '#1253A4' },
};

// Policy status colors (VMI/CMI)
export const policyStatusColors: Record<string, StatusColorConfig> = {
  pending_payment: { bg: '', border: '' }, // No color (default/pending)
  pending_review: { bg: '#E7F1F9', border: '#1253A4' },
  pending_issuance: { bg: '#E7F1F9', border: '#1253A4' },
  policy_issued: { bg: '#E6F8F0', border: '#66BE88' },
  policy_shipped: { bg: '#E6F8F0', border: '#66BE88' },
  policy_delivered: { bg: '#E6F8F0', border: '#66BE88' },
  policy_cancelled: { bg: '#FFF5F5', border: '#D5596C' },
  rework_required: { bg: '#FFFEF2', border: '#FFC107' },
};

// Get inline styles for a status
export function getStatusStyles(status: string, colors: Record<string, StatusColorConfig>, disabled = false): React.CSSProperties {
  const config = colors[status];
  
  if (!config || (!config.bg && !config.border)) {
    return {}; // Return empty for default styling
  }
  
  const opacity = disabled ? 0.5 : 1;
  
  return {
    backgroundColor: config.bg,
    borderColor: config.border,
    opacity,
  };
}
