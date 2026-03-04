FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV
RUN apt-get update && \
    apt-get install -y --no-install-recommends libgl1 libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

# Install CPU-only PyTorch first (smaller image)
RUN pip install --no-cache-dir \
    torch==2.4.0+cpu \
    torchvision==0.19.0+cpu \
    --index-url https://download.pytorch.org/whl/cpu

# Install remaining dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code and data
COPY tool/ ./tool/
COPY data/ ./data/

EXPOSE 8080

CMD ["uvicorn", "tool.api_server:app", "--host", "0.0.0.0", "--port", "8080"]
