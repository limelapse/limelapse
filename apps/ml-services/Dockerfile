FROM python:3.10.18-slim

RUN apt-get update
RUN apt-get upgrade -y

WORKDIR /app

COPY requirements/ .

RUN pip install --default-timeout=1000 --no-cache-dir -r requirements.txt

# Accept SERVICE_TYPE as an argument (passed at build time)
ARG SERVICE_TYPE
ENV SERVICE_TYPE=${SERVICE_TYPE}

# Accept WORKERS as an argument (passed at build time)
ARG WORKERS=1
ENV WORKERS=${WORKERS}

COPY fetch_deps.py .

RUN python fetch_deps.py

COPY . .

# JSON format with shell command to allow variable substitution
CMD ["bash", "-c", "gunicorn -w ${WORKERS} -b 0.0.0.0:5000 run:app"]