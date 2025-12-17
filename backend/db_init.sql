CREATE TABLE IF NOT EXISTS predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  predicted_disease TEXT,
  confidence REAL,
  probabilities TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

