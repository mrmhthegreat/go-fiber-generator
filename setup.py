import os
from setuptools import setup, find_packages

# Read the README file for the long description
with open(os.path.join(os.path.dirname(__file__), "README.md"), "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="gofiber-generator",  # A professional and descriptive name
    version="0.2.0",
    author="Mrmhthegreat",     # Replace this with your actual name/handle
    author_email="mrmhthegreat@gmail.com", # Replace with your email
    description="A complete configuration-driven generator for Go Fiber applications",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/mrmhthegreat/go-fiber-generator",
    project_urls={
        "Bug Tracker": "https://github.com/mrmhthegreat/go-fiber-generator/issues",
    },
    packages=find_packages(),
    py_modules=["generator", "launcher", "server"],
    include_package_data=True,
    package_data={
        "": ["web_assets/*", "web_assets/**/*"],
    },
    install_requires=[
        "Jinja2>=3.0.0",
        "PyYAML>=6.0",
        "customtkinter>=5.2.0",
        "fastapi",
        "uvicorn",
        "pydantic",
    ],
    entry_points={
        "console_scripts": [
            "gofiber-gen=generator:main",
            "gofiber-gui=launcher:main",
            "gofiber-serve=server:main",
        ],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Code Generators",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
)
