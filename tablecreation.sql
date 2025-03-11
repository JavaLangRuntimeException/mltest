-- 解析結果（各顔ごとの基本情報）
CREATE TABLE analysis_results (
                                  id INT AUTO_INCREMENT PRIMARY KEY,
                                  bucket VARCHAR(255) NOT NULL,
                                  image_key VARCHAR(255) NOT NULL,
                                  dominant_emotion VARCHAR(50) NOT NULL,
                                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 解析結果に紐づく、各 emotion とそのスコア
CREATE TABLE analysis_emotions (
                                   id INT AUTO_INCREMENT PRIMARY KEY,
                                   result_id INT NOT NULL,
                                   emotion VARCHAR(50) NOT NULL,
                                   score DOUBLE NOT NULL,
                                   CONSTRAINT fk_analysis_result FOREIGN KEY (result_id) REFERENCES analysis_results(id) ON DELETE CASCADE
);