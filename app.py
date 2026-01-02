from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import os
import base64
from cryptography.fernet import Fernet
from sqlalchemy.exc import IntegrityError

from database import db, get_database_uri
from models import Informacoes, Creche, gerar_hash

# =========================
# LOAD ENV
# =========================

load_dotenv()

FERNET_KEY = os.getenv("SECRET_KEY")
if not FERNET_KEY:
    raise RuntimeError("SECRET_KEY não definida no .env")

cipher = Fernet(FERNET_KEY.encode())

# =========================
# APP
# =========================

app = Flask(
    __name__,
    template_folder="templates",
    static_folder="static"
)


# =========================
# CONFIG
# =========================

app.config["SQLALCHEMY_DATABASE_URI"] = get_database_uri()
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")

db.init_app(app)

# =========================
# ROTAS
# =========================

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/home")
def home():
    return render_template("home.html")


# =========================
# API - INFORMACOES
# =========================

@app.route("/api/informacoes", methods=["POST"])
def criar_informacoes():
    try:
        data = request.get_json()

        cpf = data.get("cpf")
        telefone = data.get("telefone")
        nome = data.get("nome", "Sem Nome")

        if not cpf or not telefone:
            return jsonify({"erro": "Dados inválidos"}), 400

        # =========================
        # GERA HASHES
        # =========================
        cpf_hash = gerar_hash(cpf)
        telefone_hash = gerar_hash(telefone)

        # =========================
        # BUSCAS
        # =========================
        registro_cpf = Informacoes.query.filter_by(cpf_hash=cpf_hash).first()
        registro_tel = Informacoes.query.filter_by(telefone_hash=telefone_hash).first()

        # =========================
        # CPF E TELEFONE EXISTEM (LOGIN)
        # =========================
        if registro_cpf and registro_tel:
            if registro_cpf.id == registro_tel.id:
                return jsonify({"sucesso": True, "tipo": "login"}), 200
            else:
                return jsonify({"erro": "CPF e telefone não correspondem"}), 403

        # =========================
        # CPF EXISTE, TELEFONE NÃO
        # =========================
        if registro_cpf and not registro_tel:
            return jsonify({"erro": "Telefone incorreto para este CPF"}), 403

        # =========================
        # TELEFONE EXISTE, CPF NÃO
        # =========================
        if registro_tel and not registro_cpf:
            return jsonify({"erro": "CPF incorreto para este telefone"}), 403

        # =========================
        # NENHUM EXISTE (CADASTRO)
        # =========================
        info = Informacoes()
        info.set_nome(nome)
        info.set_cpf(cpf)
        info.set_telefone(telefone)

        db.session.add(info)
        db.session.commit()

        return jsonify({"sucesso": True, "tipo": "cadastro"}), 201

    except IntegrityError:
        db.session.rollback()
        return jsonify({"erro": "CPF ou telefone já cadastrado"}), 400

    except Exception as e:
        print("ERRO:", e)
        db.session.rollback()
        return jsonify({"erro": "Erro interno"}), 500


# =========================
# API - CRECHE
# =========================

@app.route("/api/creche", methods=["GET"])
def get_creche():
    creche = Creche.query.first()
    if not creche:
        return jsonify({"erro": "Dados não encontrados"}), 404

    return jsonify({
        "existentes": creche.total_existentes,
        "prometidas": creche.total_prometidas
    })


# =========================
# INIT DB
# =========================

def inicializar_banco():
    with app.app_context():
        print("📦 Criando tabelas (se não existirem)...")
        db.create_all()

        print("🏫 Verificando tabela CRECHE...")
        creche = Creche.query.first()

        if not creche:
            print("➕ Inserindo linha inicial em CRECHE")
            creche = Creche(
                total_existentes=0,
                total_prometidas=0
            )
            db.session.add(creche)
            db.session.commit()
        else:
            print("✅ Linha única da CRECHE já existe")


# =========================
# START
# =========================

if __name__ == "__main__":
    inicializar_banco()
    app.run(debug=True)