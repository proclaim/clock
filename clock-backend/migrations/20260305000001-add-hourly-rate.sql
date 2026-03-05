-- +migrate Up
ALTER TABLE employees ADD COLUMN hourly_rate INTEGER;

UPDATE employees SET hourly_rate = 200 WHERE id = 12; -- 倩瑜
UPDATE employees SET hourly_rate = 200 WHERE id = 11; -- 姿瑤
UPDATE employees SET hourly_rate = 200 WHERE id = 8;  -- 彭翧
UPDATE employees SET hourly_rate = 220 WHERE id = 7;  -- 沛儀
UPDATE employees SET hourly_rate = 210 WHERE id = 9;  -- Asa
UPDATE employees SET hourly_rate = 210 WHERE id = 10; -- Anika

-- +migrate Down
ALTER TABLE employees DROP COLUMN hourly_rate;
