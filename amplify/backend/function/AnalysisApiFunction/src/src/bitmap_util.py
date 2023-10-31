import numpy as np
import matplotlib.pyplot as plt
from matplotlib import colors
import fabio
import math
from numba import jit, njit, types
from typing import Dict, List
from scipy.signal import find_peaks

# scanメソッド（circular, sector, symmetric_sector, horizontal, vertical）

# 円環平均をscan


@jit(nopython=True)
def scan_circular(img, x_c, y_c):
    y_max, x_max = img.shape
    r2I_dict: Dict[int, int] = {}
    r2ISum_dict: Dict[int, int] = {}
    r2hit_dict: Dict[int, int] = {}
    for x in range(x_max):
        for y in range(y_max):
            I = img[y, x]
            if I > 0:
                r = round(math.sqrt((x - x_c)**2 + (y - y_c)**2))
                try:
                    r2ISum_dict[r] += I
                    r2hit_dict[r] += 1
                except:
                    r2ISum_dict[r] = I
                    r2hit_dict[r] = 1
    for r in r2hit_dict.keys():
        r2I_dict[r] = r2ISum_dict[r] / r2hit_dict[r]
    sorted_arr = np.array(sorted(r2I_dict.items()))
    return list(sorted_arr[:, 0]), list(sorted_arr[:, 1])

# 角度の周期性排除メソッド
# @jit(nopython=True)
# def standard_angle(x, low_lim) -> float:
#     while x < low_lim:
#         x += 360
#     return (x - low_lim) % 360 + low_lim

# 角度と中心からセクター内に位置するための条件を返す
# @jit(nopython=True)
# def get_condition(x: int, y: int, x_c: int, y_c: int, angle_0: float, angle_1: float) -> bool:
#     a0 = angle_0
#     a1 = angle_1
#     while a0 < 0:
#         a0 += 360
#     a0 = (a0 - 0) % 360 + 0
#     while a1 < a0:
#         a1 += 360
#     a1 = (a1 - a0) % 360 + a0
#     a0_quadrant = (a0 % 360) // 90 + 1
#     a1_quadrant = (a1 % 360) // 90 + 1
#     # print(a0_quadrant)
#     # print(a1_quadrant)
#     if a0_quadrant == 1 or a0_quadrant == 4:
#         if a1_quadrant == 1 or a1_quadrant == 4:
#             if a1 - a0 <= 180:
#                 return y - y_c > math.tan(math.radians(a0))*(x - x_c) and y - y_c < math.tan(math.radians(a1))*(x - x_c)
#             elif a1 - a0 >= 180:
#                 return y - y_c > math.tan(math.radians(a0))*(x - x_c) or y - y_c < math.tan(math.radians(a1))*(x - x_c)
#         elif a1_quadrant == 2 or a1_quadrant == 3:
#             if a1 - a0 <= 180:
#                 return y - y_c > math.tan(math.radians(a0))*(x - x_c) and y - y_c > math.tan(math.radians(a1))*(x - x_c)
#             elif a1 - a0 >= 180:
#                 return y - y_c > math.tan(math.radians(a0))*(x - x_c) or y - y_c > math.tan(math.radians(a1))*(x - x_c)
#     elif a0_quadrant == 2 or a0_quadrant == 3:
#         if a1_quadrant == 1 or a1_quadrant == 4:
#             if a1 - a0 <= 180:
#                 return y - y_c < math.tan(math.radians(a0))*(x - x_c) and y - y_c < math.tan(math.radians(a1))*(x - x_c)
#             elif a1 - a0 >= 180:
#                 return y - y_c < math.tan(math.radians(a0))*(x - x_c) or y - y_c < math.tan(math.radians(a1))*(x - x_c)
#         elif a1_quadrant == 2 or a1_quadrant == 3:
#             if a1 - a0 <= 180:
#                 return y - y_c < math.tan(math.radians(a0))*(x - x_c) and y - y_c > math.tan(math.radians(a1))*(x - x_c)
#             elif a1 - a0 >= 180:
#                 return y - y_c < math.tan(math.radians(a0))*(x - x_c) or y - y_c > math.tan(math.radians(a1))*(x - x_c)

# 複数の方位角範囲のセクター平均をscan
# @jit


# def in_region(angles, x, y, xc, yc):
#     while angles[0] < 0:
#         angles[0] += 360
#     angles[0] = (angles[0] - 0) % 360 + 0
#     while angles[1] < angles[0]:
#         angles[1] += 360
#     angles[1] = (angles[1] - angles[0]) % 360 + angles[0]
#     if angles[0] == 90 or angles[0] == 270:
#         angles[0] += 0.001
#     if angles[1] == 90 or angles[1] == 270:
#         angles[1] += 0.001
#     a0_quadrant = (angles[0] % 360) // 90 + 1
#     a1_quadrant = (angles[1] % 360) // 90 + 1
#     # print(a0_quadrant)
#     # print(a1_quadrant)
#     if a0_quadrant == 1 or a0_quadrant == 4:
#         if a1_quadrant == 1 or a1_quadrant == 4:
#             if angles[1] - angles[0] <= 180:
#                 # print("type1")
#                 return y - yc > math.tan(math.radians(angles[0]))*(x - xc) and y - yc < math.tan(math.radians(angles[1]))*(x - xc)
#             elif angles[1] - angles[0] >= 180:
#                 # print("type2")
#                 return y - yc > math.tan(math.radians(angles[0]))*(x - xc) or y - yc < math.tan(math.radians(angles[1]))*(x - xc)
#         elif a1_quadrant == 2 or a1_quadrant == 3:
#             if angles[1] - angles[0] <= 180:
#                 # print("type3")
#                 return y - yc > math.tan(math.radians(angles[0]))*(x - xc) and y - yc > math.tan(math.radians(angles[1]))*(x - xc)
#             elif angles[1] - angles[0] >= 180:
#                 # print("type4")
#                 return y - yc > math.tan(math.radians(angles[0]))*(x - xc) or y - yc > math.tan(math.radians(angles[1]))*(x - xc)
#     elif a0_quadrant == 2 or a0_quadrant == 3:
#         if a1_quadrant == 1 or a1_quadrant == 4:
#             if angles[1] - angles[0] <= 180:
#                 # print("type5")
#                 return y - yc < math.tan(math.radians(angles[0]))*(x - xc) and y - yc < math.tan(math.radians(angles[1]))*(x - xc)
#             elif angles[1] - angles[0] >= 180:
#                 # print("type6")
#                 return y - yc < math.tan(math.radians(angles[0]))*(x - xc) or y - yc < math.tan(math.radians(angles[1]))*(x - xc)
#         elif a1_quadrant == 2 or a1_quadrant == 3:
#             if angles[1] - angles[0] <= 180:
#                 # print("type7")
#                 return y - yc < math.tan(math.radians(angles[0]))*(x - xc) and y - yc > math.tan(math.radians(angles[1]))*(x - xc)
#             elif angles[1] - angles[0] >= 180:
#                 # print("type8")
#                 return y - yc < math.tan(math.radians(angles[0]))*(x - xc) or y - yc > math.tan(math.radians(angles[1]))*(x - xc)


# @jit(nopython=True)
def scan_sector(img, xc, yc, angles_list):
    print(angles_list)
    y_max, x_max = img.shape
    angles_list_2 = angles_list
    r2I_dict: Dict[int, int] = {}
    r2ISum_dict: Dict[int, int] = {}
    r2hit_dict: Dict[int, int] = {}
    x_list = []
    y_list = []

    counter = 0
    for x in range(x_max):
        for y in range(y_max):
            I = img[y, x]
            flag: bool = False
            for angles in angles_list_2:
                while angles[0] < 0:
                    angles[0] += 360
                angles[0] = (angles[0] - 0) % 360 + 0
                while angles[1] < angles[0]:
                    angles[1] += 360
                angles[1] = (angles[1] - angles[0]) % 360 + angles[0]
                if angles[0] == 90 or angles[0] == 270:
                    angles[0] += 0.001
                if angles[1] == 90 or angles[1] == 270:
                    angles[1] += 0.001
                a0_quadrant = (angles[0] % 360) // 90 + 1
                a1_quadrant = (angles[1] % 360) // 90 + 1
                # print(a0_quadrant)
                # print(a1_quadrant)
                if a0_quadrant == 1 or a0_quadrant == 4:
                    if a1_quadrant == 1 or a1_quadrant == 4:
                        if angles[1] - angles[0] <= 180:
                            # print("type1")
                            if y - yc > math.tan(math.radians(angles[0]))*(x - xc) and y - yc < math.tan(math.radians(angles[1]))*(x - xc):
                                flag = True
                        elif angles[1] - angles[0] >= 180:
                            # print("type2")
                            if y - yc > math.tan(math.radians(angles[0]))*(x - xc) or y - yc < math.tan(math.radians(angles[1]))*(x - xc):
                                flag = True
                    elif a1_quadrant == 2 or a1_quadrant == 3:
                        if angles[1] - angles[0] <= 180:
                            # print("type3")
                            if y - yc > math.tan(math.radians(angles[0]))*(x - xc) and y - yc > math.tan(math.radians(angles[1]))*(x - xc):
                                flag = True
                        elif angles[1] - angles[0] >= 180:
                            # print("type4")
                            if y - yc > math.tan(math.radians(angles[0]))*(x - xc) or y - yc > math.tan(math.radians(angles[1]))*(x - xc):
                                flag = True
                elif a0_quadrant == 2 or a0_quadrant == 3:
                    if a1_quadrant == 1 or a1_quadrant == 4:
                        if angles[1] - angles[0] <= 180:
                            # print("type5")
                            if y - yc < math.tan(math.radians(angles[0]))*(x - xc) and y - yc < math.tan(math.radians(angles[1]))*(x - xc):
                                flag = True
                        elif angles[1] - angles[0] >= 180:
                            # print("type6")
                            if y - yc < math.tan(math.radians(angles[0]))*(x - xc) or y - yc < math.tan(math.radians(angles[1]))*(x - xc):
                                flag = True
                    elif a1_quadrant == 2 or a1_quadrant == 3:
                        if angles[1] - angles[0] <= 180:
                            # print("type7")
                            if y - yc < math.tan(math.radians(angles[0]))*(x - xc) and y - yc > math.tan(math.radians(angles[1]))*(x - xc):
                                flag = True
                        elif angles[1] - angles[0] >= 180:
                            # print("type8")
                            if y - yc < math.tan(math.radians(angles[0]))*(x - xc) or y - yc > math.tan(math.radians(angles[1]))*(x - xc):
                                flag = True

                        if I != 0 and flag:
                            counter += 1
                            r = round(math.sqrt((x - xc)**2 + (y - yc)**2))
                            x_list.append(x)
                            y_list.append(y)
                            try:
                                r2ISum_dict[r] += I
                                r2hit_dict[r] += 1
                            except:
                                r2ISum_dict[r] = I
                                r2hit_dict[r] = 1
            if I != 0 and flag:
                r = round(math.sqrt((x - xc)**2 + (y - yc)**2))
                x_list.append(x)
                y_list.append(y)
                try:
                    r2ISum_dict[r] += I
                    r2hit_dict[r] += 1
                except:
                    r2ISum_dict[r] = I
                    r2hit_dict[r] = 1
    for r in r2hit_dict.keys():
        r2I_dict[r] = r2ISum_dict[r] / r2hit_dict[r]
    sorted_arr = np.array(sorted(r2I_dict.items()))
    print(len(x_list))
    print(len(y_list))
    print(counter)
    return list(sorted_arr[:, 0]), list(sorted_arr[:, 1]), x_list, y_list

# 横方向のscan


@jit(nopython=True)
def scan_horizontal(img, y_h):
    y_max, x_max = img.shape
    x_list = []
    y_list = []
    I_list = []
    for x in range(x_max):
        I = img[y_h, x]
        if I > 0:
            x_list.append(x)
            y_list.append(y_h)
            I_list.append(I)
    return x_list, y_list, I_list

# 縦方向のscan


@jit(nopython=True)
def scan_vertical(img, x_v):
    y_max, x_max = img.shape
    x_list = []
    y_list = []
    I_list = []
    for y in range(y_max):
        I = img[y, x_v]
        if I > 0:
            x_list.append(x_v)
            y_list.append(y)
            I_list.append(I)
    return x_list, y_list, I_list

# 中心の座標を求める(1ステップ)


def get_center_step(img, x_v, y_h, d, show_scan=False, show_img=True):
    x_list, y_list, I_list = scan_horizontal(img, y_h)
    x_arr = np.array(x_list)
    I_arr_h = np.array(I_list)
    logI_arr_h = np.array([math.log(I) for I in I_arr_h])
    peaks_h, _ = find_peaks(logI_arr_h, distance=d)
    peak_d_arr = np.array([[abs(logI_arr_h[i] - logI_arr_h[j])
                          for i in peaks_h] for j in peaks_h])
    i = np.argpartition(peak_d_arr.flatten(), len(peaks_h))[len(peaks_h)]
    index = np.unravel_index(i, peak_d_arr.shape)
    peak_1 = peaks_h[index[0]]
    peak_2 = peaks_h[index[1]]
    x_v2 = (x_list[peak_1] + x_list[peak_2]) / 2

    x_list, y_list, I_list = scan_vertical(img, x_v)
    y_arr = np.array(y_list)
    I_arr_v = np.array(I_list)
    logI_arr_v = np.array([math.log(I) for I in I_arr_v])
    peaks_v, _ = find_peaks(logI_arr_v, distance=d)
    peak_d_arr = np.array([[abs(logI_arr_v[i] - logI_arr_v[j])
                          for i in peaks_v] for j in peaks_v])
    i = np.argpartition(peak_d_arr.flatten(), len(peaks_v))[len(peaks_v)]
    index = np.unravel_index(i, peak_d_arr.shape)
    peak_1 = peaks_v[index[0]]
    peak_2 = peaks_v[index[1]]
    y_h2 = (y_list[peak_1] + y_list[peak_2]) / 2

    return round(x_v2), round(y_h2)


def get_center(img, max_num: int = 10, method: str = "SAXS") -> None:
    if method == "SAXS":
        peak_distance = 200
    elif method == "WAXS":
        peak_distance = 20
    y_max, x_max = img.shape
    xv = round(x_max / 2) - 10
    yh = round(y_max / 2)
    for i in range(max_num):
        xv_new, yh_new = get_center_step(
            img, xv, yh, d=peak_distance)
        if xv == xv_new and yh == yh_new:
            print(f'値が収束しました。計算結果：({xv}, {yh})')
            print("中心座標をセットしました")
            return xv, yh
        xv = xv_new
        yh = yh_new
        print(f'現在の値:({xv}, {yh})')
    print("処理が終わりませんでした")
    return
