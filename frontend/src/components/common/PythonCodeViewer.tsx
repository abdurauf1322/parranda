import React, { useState } from 'react';
import {
  FileCode2,
  FolderTree,
  Copy,
  Check,
  Terminal,
  Server,
  Database
} from 'lucide-react';

const FOLDER_STRUCTURE = `uychi_parranda/
├── app.py                      # Flask asosiy dasturi, API marshrutlar, RBAC & Slesar scheduler
├── models.py                   # SQLAlchemy ORM modellari (User, Attendance, Task, Report...)
├── requirements.txt            # Python kutubxonalari (Flask, SQLAlchemy, APScheduler...)
├── templates/                  # Jinja2 HTML shablonlari
│   ├── base.html              # Asosiy dizayn va Tailwind CDN
│   ├── login.html             # Kirish sahifasi va avtomatik davomat
│   └── dashboard.html         # Rol bo'yicha boshqaruv sahifalari
├── static/                     # Statik fayllar (CSS, JS, Rasmlar)
│   ├── js/
│   │   ├── slesar_timer.js    # 3 daqiqalik ogohlantirish audiosi va taymer
│   │   └── chat_poll.js       # Umumiy chat polling mexanizmi
│   └── css/
│       └── custom.css         # Fabrika maxsus uslublari
└── uychi_parranda.db          # SQLite ma'lumotlar bazasi (avtomatik yaratiladi)`;

const PYTHON_APP_SNIPPET = `# app.py
from flask import Flask, request, jsonify, session
from models import db, User, Attendance, Task, SlesarMilestoneModel, DailyFactoryReportModel, PhotoReportModel, ChatMessageModel

app = Flask(__name__)
app.config['SECRET_KEY'] = 'uychi-parranda-secret-key-2026'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///uychi_parranda.db'
db.init_app(app)

# 1. Davomat & O'rinbosarlik (Substitution Mode)
@app.route('/api/attendance/check-in', methods=['POST'])
def check_in():
    data = request.json or {}
    user_id = session.get('user_id', 1)
    is_sub = data.get('isSubstitution', False)
    # Original worker & substitute worker capture
    att = Attendance(
        user_id=user_id,
        is_substitution=is_sub,
        original_worker_name=data.get('originalWorkerName'),
        substitute_worker_name=data.get('substituteWorkerName'),
        status='orinbosar_bilan' if is_sub else 'keldi'
    )
    db.session.add(att)
    db.session.commit()
    return jsonify({'success': True, 'attendance': att.to_dict()})

# 2. Slesar 10-Milestone Schedule with 3-minute alerts
@app.route('/api/slesar/milestones', methods=['GET'])
def get_milestones():
    milestones = SlesarMilestoneModel.query.all()
    return jsonify([m.to_dict() for m in milestones])

# 3. Tasks with 1-5 Star Evaluation
@app.route('/api/tasks/<int:task_id>/evaluate', methods=['POST'])
def evaluate_task(task_id):
    task = Task.query.get_or_404(task_id)
    task.evaluation_score = request.json.get('score') # 1-5 yulduz
    task.evaluation_note = request.json.get('note')
    task.status = 'tasdiqlandi'
    db.session.commit()
    return jsonify({'success': True})`;

const PYTHON_MODELS_SNIPPET = `# models.py
from flask_sqlalchemy import SQLAlchemy
db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    full_name = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(64), nullable=False) # 11 ta rol

class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    is_substitution = db.Column(db.Boolean, default=False)
    original_worker_name = db.Column(db.String(128))
    substitute_worker_name = db.Column(db.String(128))
    check_in_time = db.Column(db.String(16))
    status = db.Column(db.String(32)) # keldi, orinbosar_bilan

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(256), nullable=False)
    assigned_to_role = db.Column(db.String(64))
    evaluation_score = db.Column(db.Integer) # 1-5 stars
    evaluation_note = db.Column(db.String(256))`;

export const PythonCodeViewer: React.FC = () => {
  const [activeFile, setActiveFile] = useState<'structure' | 'app' | 'models' | 'req'>('structure');
  const [copied, setCopied] = useState(false);

  const getActiveContent = () => {
    switch (activeFile) {
      case 'structure':
        return FOLDER_STRUCTURE;
      case 'app':
        return PYTHON_APP_SNIPPET;
      case 'models':
        return PYTHON_MODELS_SNIPPET;
      case 'req':
        return `Flask>=3.0.0\nFlask-SQLAlchemy>=3.1.1\nFlask-Login>=0.6.3\nWerkzeug>=3.0.1\nAPScheduler>=3.10.4\nrequests>=2.31.0\ngunicorn>=21.2.0`;
      default:
        return '';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-3xl border border-slate-700 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Server className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Python Backend & Arxitektura Loyihasi
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Loyiha fayllar tuzilmasi, Flask marshrutlari, SQLAlchemy modellari va requirements.txt
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Nusxalandi!' : 'Kodni nusxalash'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveFile('structure')}
          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
            activeFile === 'structure'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Papka Tuzilmasi (Folder Tree)</span>
        </button>

        <button
          onClick={() => setActiveFile('app')}
          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
            activeFile === 'app'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileCode2 className="w-4 h-4" />
          <span>app.py (Flask Backend)</span>
        </button>

        <button
          onClick={() => setActiveFile('models')}
          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
            activeFile === 'models'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>models.py (SQLAlchemy)</span>
        </button>

        <button
          onClick={() => setActiveFile('req')}
          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
            activeFile === 'req'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>requirements.txt</span>
        </button>
      </div>

      {/* Code Display Area */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl p-5 font-mono text-xs text-emerald-400 leading-relaxed max-h-[600px] overflow-y-auto">
        <pre className="whitespace-pre-wrap">{getActiveContent()}</pre>
      </div>
    </div>
  );
};
