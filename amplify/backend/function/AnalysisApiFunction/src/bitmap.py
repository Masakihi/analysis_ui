import fabio
from PIL import Image
from io import BytesIO
import numpy as np
import matplotlib.pyplot as plt
from matplotlib import colors
import base64
import math
from bitmap_util import scan_horizontal, scan_vertical, scan_circular, scan_sector, get_center, find_peaks


class Bitmap:
    def __init__(self, data: np.ndarray):
        self.data = data

    @classmethod
    async def from_tif(cls, tif):
        tif_data = await tif.read()
        tif_image = Image.open(BytesIO(tif_data))
        tif_array = np.array(tif_image)
        return (cls(tif_array))

    def display(self):
        print(self.data)

    def image(self, vmin=10, vmax=10000, center=None, x_list=None, y_list=None):
        fig = plt.figure(figsize=(3, 3))
        ax = fig.add_subplot(1, 1, 1)
        ax.imshow(self.data, norm=colors.LogNorm(vmin=vmin, vmax=vmax),
                  origin='lower', cmap='hot')
        if center is not None:
            ax.scatter(center[0], center[1], c='green', s=50, marker="*")
        if x_list is not None and y_list is not None:
            print(len(x_list))
            print(len(y_list))
            ax.scatter(x_list, y_list, s=1)
        buffer = BytesIO()
        plt.savefig(buffer, format="png")
        buffer.seek(0)
        plt.close()
        image_data = base64.b64encode(buffer.read()).decode()
        return image_data

    def get_center_auto(self):
        x, y = get_center(self.data)
        return x, y

    def scan_horizontal(self, y_c):
        x_list, y_list, I_list = scan_horizontal(self.data, y_c)
        return I_list, x_list, y_list

    def scan_vertical(self, x_c):
        x_list, y_list, I_list = scan_vertical(self.data, x_c)
        return I_list, x_list, y_list

    def scan_circular(self, x_c, y_c):
        _, I_list = scan_circular(self.data, x_c, y_c)
        return (I_list)

    def scan_sector(self, x_c, y_c, angle_range_list):
        _, I_list, x_list, y_list = scan_sector(
            self.data, x_c, y_c, angle_range_list)
        return I_list, x_list, y_list

    def _get_peak_SAXS(self, x_c: int, y_c: int):
        _, I_list = scan_circular(self.data, x_c, y_c)
        logI_list = [math.log(I) for I in I_list]
        peaks, _ = find_peaks(logI_list, distance=200)
        idx = np.abs(np.asarray(peaks) - 380).argmin()
        return peaks[idx]

    def calibration(self, x_c: int, y_c: int, method: str, length: int):
        if method == "SAXS":
            d = 58.53  # AgBeの相関長
            coef = 2 * math.pi / d / self._get_peak_SAXS(x_c, y_c)
            q_list = [i * coef for i in range(length)]
            print(q_list)
            return q_list
        else:
            return []


if __name__ == "__main__":
    tif_path = './sample.tif'
    bitmap = Bitmap.from_tif(tif_path)
    bitmap.display()
