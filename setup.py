from setuptools import setup,find_packages

with open("requirements.txt") as f:
    requirements = f.read().splitlines()

setup(
    name="RAG Medical Chatbot",
    version="0.1",
    author="Sajjad Khan Yousafzai",
    packages=find_packages(),
    install_requires = requirements,
)