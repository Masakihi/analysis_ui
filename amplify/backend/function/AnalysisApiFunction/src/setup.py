from distutils.core import setup

setup(
    name='src',
    version='1.0',
    install_requires=[
        "fastapi",
        "uvicorn",
        "mangum",
        "numba",
        "numpy",
        "matplotlib",
        "fabio",
        "scipy",
        "python-multipart"
    ]
)
