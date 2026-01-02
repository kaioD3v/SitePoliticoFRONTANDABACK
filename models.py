import os
from database import db
from cryptography.fernet import Fernet
from dotenv import load_dotenv
import base64
import hashlib  # Para hash de verificação de duplicidade

load_dotenv()

FERNET_KEY = os.getenv("SECRET_KEY")
if not FERNET_KEY:
    raise RuntimeError("SECRET_KEY não definida no .env")

cipher = Fernet(FERNET_KEY.encode())


def gerar_hash(valor):
    """Gera um hash SHA256 para duplicidade"""
    return hashlib.sha256(valor.encode()).hexdigest()


class Informacoes(db.Model):
    __tablename__ = "informacoes"

    id = db.Column(db.Integer, primary_key=True)

    # Campos criptografados
    nome_criptografado = db.Column(db.String(512), nullable=False)
    cpf_criptografado = db.Column(db.String(512), nullable=False)
    telefone_criptografado = db.Column(db.String(512), nullable=False)

    # Campos para verificar duplicidade
    cpf_hash = db.Column(db.String(64), nullable=False, unique=True)
    telefone_hash = db.Column(db.String(64), nullable=False, unique=True)

    # =========================
    # Métodos de criptografia
    # =========================
    def set_nome(self, nome):
        encrypted = cipher.encrypt(nome.encode())
        self.nome_criptografado = base64.b64encode(encrypted).decode()

    def set_cpf(self, cpf):
        encrypted = cipher.encrypt(cpf.encode())
        self.cpf_criptografado = base64.b64encode(encrypted).decode()
        self.cpf_hash = gerar_hash(cpf)

    def set_telefone(self, telefone):
        encrypted = cipher.encrypt(telefone.encode())
        self.telefone_criptografado = base64.b64encode(encrypted).decode()
        self.telefone_hash = gerar_hash(telefone)


class Creche(db.Model):
    __tablename__ = "creche"

    id = db.Column(db.Integer, primary_key=True)
    total_existentes = db.Column(db.Integer, nullable=False)
    total_prometidas = db.Column(db.Integer, nullable=False)
