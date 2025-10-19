import sqlite3
import json
from datetime import datetime

class UBloomDB:
    def __init__(self, db_path='ubloom.db'):
        self.db_path = db_path
        self.init_db()
    
    def init_db(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                avatar_id INTEGER,
                is_premium BOOLEAN DEFAULT FALSE,
                coins INTEGER DEFAULT 120,
                streak INTEGER DEFAULT 0,
                points_today INTEGER DEFAULT 0,
                goals_completed_today INTEGER DEFAULT 0,
                journal_count_today INTEGER DEFAULT 0,
                last_active_date TEXT,
                daily_journal_awarded TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Goals table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS goals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                text TEXT NOT NULL,
                status TEXT DEFAULT 'active',
                rewarded BOOLEAN DEFAULT FALSE,
                points_awarded BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                skipped_at TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Journal entries table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS journal_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                text TEXT NOT NULL,
                reflection_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def create_user(self, username, email, password_hash, avatar_id=1):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO users (username, email, password_hash, avatar_id)
                VALUES (?, ?, ?, ?)
            ''', (username, email, password_hash, avatar_id))
            
            user_id = cursor.lastrowid
            conn.commit()
            return user_id
        except sqlite3.IntegrityError:
            return None
        finally:
            conn.close()
    
    def get_user_by_email(self, email):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
        user = cursor.fetchone()
        conn.close()
        
        return user
    
    def update_user_stats(self, user_id, **kwargs):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        set_clause = ', '.join([f"{key} = ?" for key in kwargs.keys()])
        values = list(kwargs.values()) + [user_id]
        
        cursor.execute(f'UPDATE users SET {set_clause} WHERE id = ?', values)
        conn.commit()
        conn.close()
    
    def save_goal(self, user_id, text, status='active', rewarded=False, points_awarded=False):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO goals (user_id, text, status, rewarded, points_awarded)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, text, status, rewarded, points_awarded))
        
        goal_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return goal_id
    
    def update_goal(self, goal_id, **kwargs):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        set_clause = ', '.join([f"{key} = ?" for key in kwargs.keys()])
        values = list(kwargs.values()) + [goal_id]
        
        cursor.execute(f'UPDATE goals SET {set_clause} WHERE id = ?', values)
        conn.commit()
        conn.close()
    
    def get_user_goals(self, user_id):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
        goals = cursor.fetchall()
        conn.close()
        return goals
    
    def save_journal_entry(self, user_id, text, reflection_data=None):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO journal_entries (user_id, text, reflection_data)
            VALUES (?, ?, ?)
        ''', (user_id, text, json.dumps(reflection_data) if reflection_data else None))
        
        entry_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return entry_id
    
    def get_user_journal_entries(self, user_id):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM journal_entries WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
        entries = cursor.fetchall()
        conn.close()
        return entries

# Initialize database
db = UBloomDB()