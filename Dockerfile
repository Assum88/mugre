FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1 OMP_NUM_THREADS=2 TOKENIZERS_PARALLELISM=false HF_HUB_DISABLE_XET=1
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg libgomp1 && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN python -c "from faster_whisper import download_model; download_model('base', output_dir='/opt/whisper-base')"
ENV WHISPER_MODEL=/opt/whisper-base
COPY app.py index.html ./
CMD ["python", "app.py"]
