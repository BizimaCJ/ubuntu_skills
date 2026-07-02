from flask import Flask, request, jsonify
from datetime import datetime
import sqlite3
from config import DATABASE

app = Flask(__name__)

#database connection

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row  # lets us access columns by name
    return conn