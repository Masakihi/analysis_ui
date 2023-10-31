from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import image_router
from mangum import Mangum


app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

app.include_router(image_router.router, prefix="/image", tags=["image"])

def handler(event, context):
  return Mangum(app)(event, context)