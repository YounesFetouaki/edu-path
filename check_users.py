import psycopg2
import os

DB_HOST = 'localhost'
DB_PORT = '5433'
DB_NAME = 'edupath_db'
DB_USER = 'admin'
DB_PASS = 'adminpassword'

try:
    conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME)
    cur = conn.cursor()
    
    cur.execute("SELECT id, username, role FROM users ORDER BY id LIMIT 5")
    rows = cur.fetchall()
    print("Users:")
    for r in rows:
        print(r)
except Exception as e:
    print(e)
