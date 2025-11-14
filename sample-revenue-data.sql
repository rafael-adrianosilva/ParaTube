-- Sample Revenue Data for Testing

-- Insert sample video revenue (you'll need to replace video_id with actual video IDs from your database)
-- This is commented out because it needs actual video IDs
/*
INSERT INTO video_revenue (video_id, revenue_source_id, amount, currency, transaction_date, impressions, clicks, rpm, cpm, notes) VALUES
(1, 1, 45.50, 'BRL', '2024-01-20', 10000, 250, 4.55, 182.00, 'Receita de AdSense Janeiro'),
(1, 1, 52.30, 'BRL', '2024-01-21', 12000, 280, 4.36, 186.79, 'Receita de AdSense Janeiro'),
(2, 1, 38.90, 'BRL', '2024-01-20', 8500, 190, 4.58, 204.74, 'Receita de AdSense Janeiro'),
(1, 3, 25.00, 'BRL', '2024-01-18', NULL, NULL, NULL, NULL, 'Super Chat durante live'),
(2, 2, 99.90, 'BRL', '2024-01-15', NULL, NULL, NULL, NULL, 'Nova inscrição de membro');
*/

-- Insert sample channel revenue (safe to run - doesn't depend on video_id)
-- This will work if you have user_id = 1 in your users table
INSERT INTO channel_revenue (user_id, revenue_source_id, amount, currency, transaction_date, notes) VALUES
(1, 4, 150.00, 'BRL', CURDATE() - INTERVAL 5 DAY, 'Patrocínio - Empresa ABC'),
(1, 5, 45.00, 'BRL', CURDATE() - INTERVAL 10 DAY, 'Doação via PIX'),
(1, 4, 200.00, 'BRL', CURDATE() - INTERVAL 15 DAY, 'Patrocínio - Empresa XYZ'),
(1, 7, 80.00, 'BRL', CURDATE() - INTERVAL 20 DAY, 'Venda de mercadorias'),
(1, 5, 30.00, 'BRL', CURDATE() - INTERVAL 25 DAY, 'Doação via PayPal');

-- To add video revenue, first get your video IDs by running:
-- SELECT id, title FROM videos WHERE user_id = 1;
-- Then uncomment the INSERT statement above and replace the video_id values
