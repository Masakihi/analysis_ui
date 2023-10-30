import json
from aws_lambda_context import LambdaContext
from fastapi import FastAPI
from fastapi.concurrency import AsyncExitStack
from mangum import Mangum

# FastAPIアプリケーションを作成
app = FastAPI()

# FastAPIルートを追加
@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}

# FastAPIアプリケーションをMangumにラップ
handler = Mangum(app)

def handler(event: dict, context: LambdaContext):
    # Lambdaハンドラ関数の本体
    async def run_app(event, context):
        async with AsyncExitStack() as stack:
            async with stack:
                return await handler(event, context)

    return run_app(event, context)

# Lambdaハンドラを呼び出すためのコード
def lambda_handler(event, context):
    return handler(event, context)
