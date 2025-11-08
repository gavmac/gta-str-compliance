-- GTA Compliance Digest - Seed Data
-- This migration adds initial cities and their compliance rules

-- Insert GTA cities
INSERT INTO cities (name, slug, region, is_active) VALUES
('Toronto', 'toronto', 'GTA', true),
('Mississauga', 'mississauga', 'GTA', true),
('Brampton', 'brampton', 'GTA', true),
('Markham', 'markham', 'GTA', true);

-- Insert common compliance rules for Toronto
INSERT INTO rules (city_id, key, name, frequency_iso, notes_markdown) VALUES
-- Toronto rules
((SELECT id FROM cities WHERE slug = 'toronto'), 'str_license', 'Short-Term Rental License', 'P1Y', 'Annual renewal required for all STR properties in Toronto'),
((SELECT id FROM cities WHERE slug = 'toronto'), 'fire_inspection', 'Fire Safety Inspection', 'P1Y', 'Annual fire safety inspection required for multi-unit properties'),
((SELECT id FROM cities WHERE slug = 'toronto'), 'insurance', 'Property Insurance', 'P1Y', 'Valid property insurance must be maintained at all times'),
((SELECT id FROM cities WHERE slug = 'toronto'), 'mat', 'Municipal Accommodation Tax', 'P3M', 'Quarterly MAT remittance required for STR properties'),
((SELECT id FROM cities WHERE slug = 'toronto'), 'business_license', 'Business License', 'P1Y', 'Annual business license for commercial rental operations');

-- Insert common compliance rules for Mississauga
INSERT INTO rules (city_id, key, name, frequency_iso, notes_markdown) VALUES
((SELECT id FROM cities WHERE slug = 'mississauga'), 'str_license', 'Short-Term Rental License', 'P1Y', 'Annual STR license required with zoning compliance'),
((SELECT id FROM cities WHERE slug = 'mississauga'), 'fire_inspection', 'Fire Safety Inspection', 'P1Y', 'Annual fire inspection for rental properties'),
((SELECT id FROM cities WHERE slug = 'mississauga'), 'insurance', 'Property Insurance', 'P1Y', 'Comprehensive property insurance required'),
((SELECT id FROM cities WHERE slug = 'mississauga'), 'zoning_compliance', 'Zoning Compliance Certificate', 'P2Y', 'Biennial zoning compliance verification');

-- Insert common compliance rules for Brampton
INSERT INTO rules (city_id, key, name, frequency_iso, notes_markdown) VALUES
((SELECT id FROM cities WHERE slug = 'brampton'), 'str_license', 'Short-Term Rental Permit', 'P1Y', 'Annual permit required for all STR operations'),
((SELECT id FROM cities WHERE slug = 'brampton'), 'fire_inspection', 'Fire Safety Inspection', 'P1Y', 'Annual fire safety compliance check'),
((SELECT id FROM cities WHERE slug = 'brampton'), 'insurance', 'Property Insurance', 'P1Y', 'Valid insurance coverage required'),
((SELECT id FROM cities WHERE slug = 'brampton'), 'rental_license', 'Rental Housing License', 'P1Y', 'Annual license for rental housing providers');

-- Insert common compliance rules for Markham
INSERT INTO rules (city_id, key, name, frequency_iso, notes_markdown) VALUES
((SELECT id FROM cities WHERE slug = 'markham'), 'str_license', 'Short-Term Rental License', 'P1Y', 'Annual licensing with property inspection'),
((SELECT id FROM cities WHERE slug = 'markham'), 'fire_inspection', 'Fire Safety Inspection', 'P1Y', 'Annual fire safety inspection required'),
((SELECT id FROM cities WHERE slug = 'markham'), 'insurance', 'Property Insurance', 'P1Y', 'Comprehensive property insurance coverage'),
((SELECT id FROM cities WHERE slug = 'markham'), 'building_permit', 'Building Permit Compliance', 'P5Y', 'Five-year building permit compliance review');

-- Insert some sample rule updates for testing
INSERT INTO rule_updates (city_id, title, summary_markdown, effective_date, source_url, is_published, published_at) VALUES
((SELECT id FROM cities WHERE slug = 'toronto'), 
 'Updated STR License Requirements', 
 '## New Requirements\n\nEffective January 1, 2024, all short-term rental operators must:\n\n- Provide proof of primary residence\n- Submit annual safety inspection reports\n- Maintain $2M liability insurance\n\n**Action Required:** Renew your license with updated documentation.',
 '2024-01-01',
 'https://toronto.ca/str-updates',
 true,
 NOW()),

((SELECT id FROM cities WHERE slug = 'mississauga'), 
 'Fire Safety Inspection Changes', 
 '## Updated Inspection Process\n\nNew fire safety inspection requirements include:\n\n- Carbon monoxide detector verification\n- Emergency exit lighting checks\n- Updated fire extinguisher requirements\n\n**Deadline:** All properties must comply by March 31, 2024.',
 '2024-03-31',
 'https://mississauga.ca/fire-safety',
 true,
 NOW()),

((SELECT id FROM cities WHERE slug = 'brampton'), 
 'Rental Housing License Fee Update', 
 '## Fee Structure Changes\n\nStarting April 1, 2024:\n\n- Base license fee: $150 (was $125)\n- Multi-unit surcharge: $25 per additional unit\n- Late renewal penalty: $50\n\n**Note:** Early renewal discount available until March 15.',
 '2024-04-01',
 'https://brampton.ca/rental-fees',
 true,
 NOW());