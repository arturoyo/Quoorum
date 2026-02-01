-- Migration: Add RAG Templates System
-- Purpose: Pre-built document templates by industry/use-case

-- ============================================================================
-- RAG TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS rag_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template info
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Categorization
  category VARCHAR(50) NOT NULL, -- 'legal', 'tech', 'finance', 'marketing', 'sales', 'hr', etc.
  industry VARCHAR(50),           -- 'saas', 'ecommerce', 'consulting', etc.

  -- Template content
  template_files JSONB NOT NULL,  -- Array of { filename, content, type }

  -- Metadata
  use_cases TEXT[],
  tags TEXT[],
  author VARCHAR(255) DEFAULT 'Quoorum',

  -- Stats
  usage_count INTEGER DEFAULT 0,
  avg_rating REAL,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rag_templates_category ON rag_templates(category);
CREATE INDEX idx_rag_templates_industry ON rag_templates(industry);
CREATE INDEX idx_rag_templates_featured ON rag_templates(is_featured);
CREATE INDEX idx_rag_templates_usage ON rag_templates(usage_count);

-- ============================================================================
-- TEMPLATE USAGE TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS rag_template_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES rag_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Tracking
  documents_created INTEGER DEFAULT 0,
  used_at TIMESTAMP DEFAULT NOW(),

  -- Feedback
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT
);

CREATE INDEX idx_rag_template_usage_template ON rag_template_usage(template_id);
CREATE INDEX idx_rag_template_usage_user ON rag_template_usage(user_id);

-- ============================================================================
-- SEED DEFAULT TEMPLATES
-- ============================================================================

-- Legal: Due Diligence Checklist
INSERT INTO rag_templates (slug, name, description, category, industry, template_files, use_cases, tags, is_featured)
VALUES (
  'legal-due-diligence',
  'Legal Due Diligence Checklist',
  'Comprehensive checklist for legal due diligence in M&A transactions',
  'legal',
  'consulting',
  '[
    {
      "filename": "due_diligence_checklist.md",
      "content": "# Legal Due Diligence Checklist\n\n## Corporate Structure\n- Articles of Incorporation\n- Bylaws\n- Shareholder Agreements\n- Cap Table\n\n## Contracts\n- Customer Contracts\n- Vendor Agreements\n- Partnership Agreements\n\n## Intellectual Property\n- Patents\n- Trademarks\n- Copyrights\n- Trade Secrets\n\n## Litigation\n- Pending Litigation\n- Settled Cases\n- Regulatory Issues\n\n## Employment\n- Employment Agreements\n- Non-Compete Agreements\n- Benefits Plans\n\n## Compliance\n- Licenses & Permits\n- Regulatory Compliance\n- Privacy Policies",
      "type": "md"
    }
  ]'::jsonb,
  ARRAY['M&A', 'Due Diligence', 'Investment'],
  ARRAY['legal', 'due-diligence', 'm&a'],
  true
);

-- Tech: Product Roadmap Template
INSERT INTO rag_templates (slug, name, description, category, industry, template_files, use_cases, tags, is_featured)
VALUES (
  'tech-product-roadmap',
  'Product Roadmap Template',
  'Strategic product roadmap template for SaaS companies',
  'tech',
  'saas',
  '[
    {
      "filename": "product_roadmap.md",
      "content": "# Product Roadmap\n\n## Vision & Strategy\n- Product Vision\n- Target Market\n- Key Differentiators\n\n## Q1 2026\n### Features\n- Feature A: Description\n- Feature B: Description\n\n### Improvements\n- Performance optimization\n- UX enhancements\n\n## Q2 2026\n### New Capabilities\n- Integration X\n- API v2\n\n## Q3-Q4 2026\n### Strategic Initiatives\n- Mobile app\n- Enterprise features\n\n## Metrics\n- User Growth Target\n- Retention Goals\n- Revenue Milestones",
      "type": "md"
    }
  ]'::jsonb,
  ARRAY['Product Planning', 'Strategy', 'Roadmapping'],
  ARRAY['product', 'roadmap', 'planning'],
  true
);

-- Finance: Budget Template
INSERT INTO rag_templates (slug, name, description, category, industry, template_files, use_cases, tags)
VALUES (
  'finance-annual-budget',
  'Annual Budget Template',
  'Complete annual budget template with P&L and cash flow',
  'finance',
  'saas',
  '[
    {
      "filename": "annual_budget.md",
      "content": "# Annual Budget 2026\n\n## Revenue\n- Monthly Recurring Revenue (MRR)\n- Annual Contracts\n- Professional Services\n\n## Costs of Goods Sold (COGS)\n- Hosting & Infrastructure\n- Support Costs\n\n## Operating Expenses\n### Sales & Marketing\n- Paid Advertising\n- Marketing Team\n- Sales Commissions\n\n### R&D\n- Engineering Team\n- Product Team\n- Infrastructure\n\n### G&A\n- Executive Team\n- Finance & Legal\n- Office & Admin\n\n## Cash Flow\n- Beginning Balance\n- Collections\n- Payments\n- Ending Balance",
      "type": "md"
    }
  ]'::jsonb,
  ARRAY['Financial Planning', 'Budgeting'],
  ARRAY['finance', 'budget', 'planning']
);

-- Marketing: Go-to-Market Plan
INSERT INTO rag_templates (slug, name, description, category, industry, template_files, use_cases, tags)
VALUES (
  'marketing-gtm-plan',
  'Go-to-Market Plan',
  'Comprehensive GTM strategy for product launches',
  'marketing',
  'saas',
  '[
    {
      "filename": "gtm_plan.md",
      "content": "# Go-to-Market Plan\n\n## Product Overview\n- Problem Statement\n- Solution\n- Value Proposition\n\n## Target Market\n- Ideal Customer Profile (ICP)\n- Market Size\n- Segments\n\n## Positioning & Messaging\n- Core Message\n- Key Differentiators\n- Competitive Analysis\n\n## Launch Strategy\n### Pre-Launch (Month -2 to -1)\n- Beta Program\n- Content Creation\n- Sales Enablement\n\n### Launch (Month 0)\n- PR Campaign\n- Social Media\n- Email Blast\n\n### Post-Launch (Month +1 to +3)\n- Customer Success\n- Feedback Loop\n- Iteration\n\n## Success Metrics\n- Signups\n- Activation Rate\n- Revenue",
      "type": "md"
    }
  ]'::jsonb,
  ARRAY['Product Launch', 'Marketing Strategy'],
  ARRAY['marketing', 'gtm', 'launch']
);

-- Sales: Territory Planning
INSERT INTO rag_templates (slug, name, description, category, industry, template_files, use_cases, tags)
VALUES (
  'sales-territory-plan',
  'Sales Territory Plan',
  'Strategic sales territory planning template',
  'sales',
  'saas',
  '[
    {
      "filename": "territory_plan.md",
      "content": "# Sales Territory Plan\n\n## Territory Overview\n- Geography\n- Market Size\n- Current Customers\n\n## Target Account List\n### Tier 1 (>$100K ARR potential)\n- Company A\n- Company B\n\n### Tier 2 ($50K-$100K ARR)\n- Company C\n- Company D\n\n### Tier 3 (<$50K ARR)\n- Company E\n- Company F\n\n## Strategy\n- Outbound Approach\n- Partnership Channels\n- Events & Conferences\n\n## Quarterly Goals\n- Pipeline Target\n- Close Rate\n- Revenue Goal\n\n## Resources Needed\n- SDR Support\n- Marketing Budget\n- Tools & Software",
      "type": "md"
    }
  ]'::jsonb,
  ARRAY['Sales Planning', 'Territory Management'],
  ARRAY['sales', 'territory', 'planning']
);
