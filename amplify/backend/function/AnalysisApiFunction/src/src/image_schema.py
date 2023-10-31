from typing import Union, List

from fastapi import FastAPI, File, UploadFile, Form
from pydantic import BaseModel


class TifImageSchema(BaseModel):
    tif_image: bytes = File(...)


class BitmapSchema(BaseModel):
    bitmap: List[List[float]]


class ImageDataSchema(BaseModel):
    image_data: str


class CenterSchema(BaseModel):
    x_c: int
    y_c: int


class CalibrationResponseSchema(BaseModel):
    q_list: List[float]


class ScanCircularResponseSchema(BaseModel):
    I_list: List[float]


class ScanSectorResponseSchema(BaseModel):
    I_list: List[float]
    image_data: str


class ScanHorizontalResponseSchema(BaseModel):
    I_list: List[float]
    image_data: str


class ScanVerticalResponseSchema(BaseModel):
    I_list: List[float]
    image_data: str
