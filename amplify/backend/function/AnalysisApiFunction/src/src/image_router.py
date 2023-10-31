from fastapi import APIRouter, File, UploadFile, Form
from image_schema import TifImageSchema, BitmapSchema, ImageDataSchema, CenterSchema, CalibrationResponseSchema, ScanCircularResponseSchema, ScanSectorResponseSchema, ScanHorizontalResponseSchema, ScanVerticalResponseSchema
from bitmap import Bitmap
import logging
from typing import List, Tuple

router = APIRouter()


@router.post("/convert_tif2bitmap", response_model=BitmapSchema)
async def convert_tif_to_bitmap(tif: UploadFile):
    bitmap = await Bitmap.from_tif(tif)
    return BitmapSchema(bitmap=bitmap.data.tolist())


@router.post("/get_image", response_model=ImageDataSchema)
async def convert_tif_to_image(tif: UploadFile, vmin: str = Form(...), vmax: str = Form(...), x_c: str = Form(None), y_c: str = Form(None), tif_background: UploadFile = File(None)):
    bitmap = await Bitmap.from_tif(tif)
    if tif_background is not None:
        bitmap_background = await Bitmap.from_tif(tif_background)
        bitmap.data -= bitmap_background.data
    if x_c is not None and y_c is not None:
        image_data = bitmap.image(vmin=int(vmin), vmax=int(
            vmax), center=[int(x_c), int(y_c)])
    else:
        image_data = bitmap.image(vmin=int(vmin), vmax=int(vmax))
    return {"image_data": image_data}


@router.post("/get_center_auto", response_model=CenterSchema)
async def get_center_auto(tif: UploadFile):
    bitmap = await Bitmap.from_tif(tif)
    x_c, y_c = bitmap.get_center_auto()
    return CenterSchema(x_c=x_c, y_c=y_c)


@router.post("/calibration", response_model=CalibrationResponseSchema)
async def calibration(tif: UploadFile, x_c: str = Form(...), y_c: str = Form(...), length=Form(None), method=Form(None)):
    bitmap = await Bitmap.from_tif(tif)
    if length is None:
        length = 800
    if method is None:
        method = "SAXS"
    q_list = bitmap.calibration(x_c=int(x_c), y_c=int(
        y_c), method=method, length=length)
    return CalibrationResponseSchema(q_list=q_list)


@router.post("/scan_circular", response_model=ScanCircularResponseSchema)
async def scan_circular(tif: UploadFile, x_c: str = Form(...), y_c: str = Form(...), tif_background: UploadFile = File(None)):
    bitmap = await Bitmap.from_tif(tif)
    if tif_background is not None:
        bitmap_background = await Bitmap.from_tif(tif_background)
        bitmap.data -= bitmap_background.data
    I_list = bitmap.scan_circular(x_c=int(x_c), y_c=int(y_c))
    return ScanCircularResponseSchema(I_list=I_list)


@router.post("/scan_sector", response_model=ScanSectorResponseSchema)
async def scan_sector(tif: UploadFile, vmin: str = Form(...), vmax: str = Form(...), x_c: str = Form(...), y_c: str = Form(...), tif_background: UploadFile = File(None), angle_range_list: str = Form(...)):
    print("scan開始")
    bitmap = await Bitmap.from_tif(tif)
    if tif_background is not None:
        bitmap_background = await Bitmap.from_tif(tif_background)
        bitmap.data -= bitmap_background.data
    angle_ranges = angle_range_list.split('],[')  # カンマで区切ってリストに変換
    angle_range_list = [[val.replace("[", "").replace(
        "]", "").replace(" ", "") for val in range_str.split(",")]for range_str in angle_ranges]
    angle_range_list = [[int(val) for val in range_list]
                        for range_list in angle_range_list]
    print(angle_range_list)
    I_list, x_list, y_list = bitmap.scan_sector(
        x_c=int(x_c), y_c=int(y_c), angle_range_list=angle_range_list)
    print("image作成")
    image_data = bitmap.image(vmin=int(vmin), vmax=int(vmax), center=[
                              int(x_c), int(y_c)], x_list=x_list, y_list=y_list)
    print("scan終了")
    return ScanSectorResponseSchema(I_list=I_list, image_data=image_data)


@router.post("/scan_horizontal", response_model=ScanHorizontalResponseSchema)
async def scan_horizontal(tif: UploadFile, vmin: str = Form(...), vmax: str = Form(...), x_c: str = Form(...), y_c: str = Form(...), tif_background: UploadFile = File(None)):
    bitmap = await Bitmap.from_tif(tif)
    if tif_background is not None:
        bitmap_background = await Bitmap.from_tif(tif_background)
        bitmap.data -= bitmap_background.data
    I_list, x_list, y_list = bitmap.scan_horizontal(int(y_c))
    image_data = bitmap.image(vmin=int(vmin), vmax=int(vmax), center=[
                              int(x_c), int(y_c)], x_list=x_list, y_list=y_list)
    return ScanHorizontalResponseSchema(I_list=I_list, image_data=image_data)


@router.post("/scan_vertical", response_model=ScanVerticalResponseSchema)
async def scan_vertical(tif: UploadFile, vmin: str = Form(...), vmax: str = Form(...), x_c: str = Form(...), y_c: str = Form(...), tif_background: UploadFile = File(None)):
    bitmap = await Bitmap.from_tif(tif)
    if tif_background is not None:
        bitmap_background = await Bitmap.from_tif(tif_background)
        bitmap.data -= bitmap_background.data
    I_list, x_list, y_list = bitmap.scan_vertical(int(x_c))
    image_data = bitmap.image(vmin=int(vmin), vmax=int(vmax), center=[
                              int(x_c), int(y_c)], x_list=x_list, y_list=y_list)
    return ScanVerticalResponseSchema(I_list=I_list, image_data=image_data)


routes = router.routes