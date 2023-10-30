import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from aws_lambda_powertools import Logger
from pydantic import BaseModel
import boto3
import uuid

# 環境変数取得
ENV = os.environ['ENV']
STORAGE_TODODB_NAME = os.environ.get("STORAGE_TODODB_NAME")

# boto3 初期化
ddb = boto3.resource("dynamodb")
table = ddb.Table(STORAGE_TODODB_NAME)

## FastAPI 初期化
app = FastAPI(
    title="TodoAPI",
    root_path=f"/{ENV}",
    openapi_url="/openapi.json"
)

# ロガー初期化
app.logger = Logger(level="INFO", service=__name__)

# CORS設定
allow_origins = ['http://localhost:8080']
if 'ALLOW_ORIGIN' in os.environ.keys():
    allow_origins.append(os.environ['ALLOW_ORIGIN'])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


handler = Mangum(app)