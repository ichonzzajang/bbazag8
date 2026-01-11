const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

// [중요] 현재 폴더의 파일들(index.html 등)을 정적으로 서빙
app.use(express.static(__dirname));

// 루트 접속 시 index.html 파일 전송
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 테이블 자동 생성
pool.query(`
    CREATE TABLE IF NOT EXISTS scores (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50),
        time_ms INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`);

// 점수 저장 (POST)
app.post('/api/score', async (req, res) => {
    try {
        const { name, time_ms } = req.body;
        await pool.query('INSERT INTO scores (name, time_ms) VALUES ($1, $2)', [name, time_ms]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 랭킹 조회 (GET)
app.get('/api/ranking', async (req, res) => {
    try {
        const result = await pool.query('SELECT name, time_ms FROM scores ORDER BY time_ms ASC LIMIT 10');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));