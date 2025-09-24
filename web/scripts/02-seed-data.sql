-- Insert sample strategies for demo purposes
INSERT INTO public.strategies (id, user_id, name, description, entry_conditions, exit_conditions, risk_management, status) VALUES
(gen_random_uuid(), auth.uid(), 'RSI Mean Reversion', 'Buy when RSI < 30, sell when RSI > 70', 
 '[{"indicator": "RSI", "condition": "less_than", "value": 30}]',
 '[{"indicator": "RSI", "condition": "greater_than", "value": 70}]',
 '{"stop_loss": 2, "take_profit": 4, "position_size": 10}',
 'active'),
(gen_random_uuid(), auth.uid(), 'MACD Crossover', 'Buy on MACD bullish crossover, sell on bearish crossover',
 '[{"indicator": "MACD", "condition": "crosses_above", "value": "signal_line"}]',
 '[{"indicator": "MACD", "condition": "crosses_below", "value": "signal_line"}]',
 '{"stop_loss": 3, "take_profit": 6, "position_size": 15}',
 'active');

-- Insert default paper trading portfolio
INSERT INTO public.portfolios (user_id, cash_balance, total_value, portfolio_type) VALUES
(auth.uid(), 100000.00, 100000.00, 'paper');
