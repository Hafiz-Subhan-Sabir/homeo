export type AffiliateStats = {
  affiliate_id: string;
  section?: string;
  click_count: number;
  lead_count: number;
  sale_count?: number;
  point_total?: number;
  earnings_total?: string;
  last_click_at: string | null;
  last_lead_at: string | null;
  last_sale_at?: string | null;
  lead_emails: string[];
  overall?: {
    click_count: number;
    lead_count: number;
    sale_count: number;
    conversion_rate: number;
    point_total: number;
    earnings_total: string;
    last_click_at: string | null;
    last_lead_at: string | null;
    last_sale_at: string | null;
    lead_emails: string[];
  };
  current_section?: {
    section: "complete" | "single" | "exclusive";
    affiliate_id: string;
    click_count: number;
    lead_count: number;
    sale_count: number;
    conversion_rate: number;
    earnings_total: string;
    last_click_at: string | null;
    last_lead_at: string | null;
    last_sale_at: string | null;
    lead_emails: string[];
  };
  by_section?: Record<
    "complete" | "single" | "exclusive",
    {
      section: "complete" | "single" | "exclusive";
      affiliate_id: string;
      click_count: number;
      lead_count: number;
      sale_count: number;
      conversion_rate: number;
      earnings_total: string;
      last_click_at: string | null;
      last_lead_at: string | null;
      last_sale_at: string | null;
      lead_emails: string[];
    }
  >;
};

export type AffiliateVisitor = {
  visitor_id: string;
  clicked_at: string | null;
  lead_email: string | null;
  lead_at: string | null;
};

export type AffiliateVisitorsResponse = {
  affiliate_id: string;
  visitors: AffiliateVisitor[];
};

export type FunnelStage = {
  stage: "Clicks" | "Leads" | "Conversions";
  value: number;
};

export type AffiliateFunnelResponse = {
  affiliate_id: string;
  stages: FunnelStage[];
};

export type RecentReferralItem = {
  visitor_id: string;
  status: "joined" | "purchased";
  at: string | null;
};

export type RecentReferralsResponse = {
  affiliate_id: string;
  items: RecentReferralItem[];
};

export type AuthLoginResponse = {
  success: boolean;
  token: string;
  user: {
    display_name: string;
    email?: string;
    referral_ids: {
      complete: string;
      single: string;
      exclusive: string;
    };
  };
};

export type AuthOtpRequestResponse = {
  success: boolean;
  message: string;
  dev_otp?: string;
  debug_error?: string;
  delivery?: "console" | "smtp";
};
