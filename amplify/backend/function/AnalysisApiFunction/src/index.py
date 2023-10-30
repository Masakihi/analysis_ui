import json
from fastapi import FastAPI
from mangum import Mangum

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

def handler(event, context):
  return Mangum(app)(event, context)