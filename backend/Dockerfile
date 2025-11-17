FROM python:3.11-slim

WORKDIR /app

# copy requirements first
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# copy backend code
COPY . .

# expose port
EXPOSE 5000

# start flask
CMD ["python", "app.py"]
