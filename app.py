import hmac
import json
import os
from pathlib import Path
import re
import secrets
import subprocess
import sys
import tempfile
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

ROOT = Path(__file__).parent
KEY = os.environ.get('MUGRE_ACCESS_KEY', '')
jobs = {}
lock = threading.Lock()
busy = threading.Lock()

def canonical(value):
    if not isinstance(value, str) or len(value) > 2048:
        raise ValueError('Cole o link de um Reel público do Instagram.')
    url = urlsplit(value.strip())
    if url.scheme != 'https' or url.netloc.lower() not in ('instagram.com', 'www.instagram.com', 'm.instagram.com'):
        raise ValueError('Use um link https://www.instagram.com/reel/...')
    match = re.fullmatch(r'/(?:reel|reels|p)/([A-Za-z0-9_-]{5,40})/?', url.path)
    if not match:
        raise ValueError('Use o link de um único vídeo público, não um perfil ou Story.')
    return 'https://www.instagram.com/p/' + match[1] + '/'

def update(job, **fields):
    with lock:
        if job in jobs:
            jobs[job].update(fields)

def run(job, url):
    try:
        with tempfile.TemporaryDirectory(prefix='mugre-') as folder:
            command = [sys.executable, '-m', 'yt_dlp', '--no-playlist', '--playlist-end', '2', '--socket-timeout', '15', '--retries', '0', '--max-filesize', '32M', '--match-filter', '!is_live & duration <=? 180', '-f', 'worst[ext=mp4]/worst', '-o', folder + '/%(id)s.%(ext)s', '--', url]
            command.insert(3, '--write-info-json')
            result = subprocess.run(command, capture_output=True, timeout=120)
            for metadata in Path(folder).glob('*.info.json'):
                if json.loads(metadata.read_text()).get('_type') in ('playlist', 'multi_video'):
                    raise ValueError('Carrosséis não são aceitos. Cole o link de um Reel individual.')
            files = list(Path(folder).glob('*.mp4'))
            if result.returncode or len(files) != 1:
                raise ValueError('Não consegui obter um vídeo único desse link. O Instagram pode exigir login ou limitar o acesso. Carrosséis não são aceitos.')
            if files[0].stat().st_size > 32 * 1024 * 1024:
                raise ValueError('Vídeo maior que o limite de 32 MB.')
            probe = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'json', str(files[0])], capture_output=True, check=True, timeout=15)
            duration = float(json.loads(probe.stdout)['format']['duration'])
            if duration <= 0 or duration > 180:
                raise ValueError('Esta versão aceita vídeos de até 3 minutos.')
            update(job, status='audio', message='Preparando o áudio…')
            audio = folder + '/audio.wav'
            subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(files[0]), '-vn', '-ac', '1', '-ar', '16000', audio], capture_output=True, check=True, timeout=45)
            files[0].unlink()
            update(job, status='transcribing', message='Transcrevendo a fala…')
            result = subprocess.run([sys.executable, str(ROOT / 'app.py'), '--transcribe', audio], capture_output=True, timeout=180)
            if result.returncode:
                raise ValueError('O motor de transcrição falhou. Tente novamente em alguns instantes.')
            text = result.stdout.decode().strip()
            if not text:
                raise ValueError('Não foi possível reconhecer fala nesse vídeo.')
        update(job, status='done', message='Transcrição pronta. Revise nomes e termos técnicos.', text=text)
    except ValueError as exc:
        update(job, status='error', message=str(exc))
    except subprocess.TimeoutExpired:
        update(job, status='error', message='O processamento demorou demais. Tente novamente mais tarde.')
    except Exception:
        update(job, status='error', message='Falha ao processar o vídeo. Tente novamente.')
    finally:
        update(job, finished=time.monotonic())
        busy.release()

def purge():
    while True:
        time.sleep(30)
        with lock:
            for key, item in list(jobs.items()):
                if item.get('finished') and time.monotonic() - item['finished'] > 600:
                    del jobs[key]

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def reply(self, code, payload, mime='application/json; charset=utf-8'):
        data = payload.encode() if isinstance(payload, str) else json.dumps(payload, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'")
        self.end_headers()
        self.wfile.write(data)

    def authorized(self):
        if not KEY:
            self.reply(503, {'message': 'O acesso ainda precisa ser configurado.'})
            return False
        if not hmac.compare_digest(self.headers.get('Authorization', ''), 'Bearer ' + KEY):
            self.reply(401, {'message': 'Informe o código de acesso do seu app.'})
            return False
        return True

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == '/':
            return self.reply(200, (ROOT / 'index.html').read_text(), 'text/html; charset=utf-8')
        if path == '/health':
            return self.reply(200, {'ok': True})
        if path.startswith('/api/jobs/') and self.authorized():
            with lock:
                job = dict(jobs.get(path.rsplit('/', 1)[-1], {}))
            return self.reply(200 if job else 404, job or {'message': 'Resultado expirado. Transcreva novamente.'})
        if not path.startswith('/api/'):
            self.reply(404, {'message': 'Não encontrado.'})

    def do_POST(self):
        if self.path != '/api/jobs':
            return self.reply(404, {'message': 'Não encontrado.'})
        if not self.authorized():
            return
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if not 0 < size <= 4096:
                raise ValueError('Pedido inválido.')
            url = canonical(json.loads(self.rfile.read(size)).get('url'))
        except (ValueError, AttributeError):
            return self.reply(400, {'message': 'Cole um link válido de Reel ou vídeo público do Instagram.'})
        if not busy.acquire(blocking=False):
            return self.reply(429, {'message': 'Já existe uma transcrição em andamento. Aguarde terminar.'})
        job = secrets.token_urlsafe(24)
        with lock:
            jobs[job] = {'status': 'downloading', 'message': 'Buscando o vídeo no Instagram…'}
        threading.Thread(target=run, args=(job, url), daemon=True).start()
        self.reply(202, {'id': job})

    def do_DELETE(self):
        if not self.authorized():
            return
        with lock:
            key = urlsplit(self.path).path.rsplit('/', 1)[-1]
            if key in jobs and jobs[key].get('finished'):
                del jobs[key]
        self.reply(200, {'ok': True})

if __name__ == '__main__':
    if len(sys.argv) == 3 and sys.argv[1] == '--transcribe':
        from faster_whisper import WhisperModel
        model = WhisperModel(os.environ.get('WHISPER_MODEL', 'base'), device='cpu', compute_type='int8', cpu_threads=2)
        segments, _ = model.transcribe(sys.argv[2], beam_size=3, vad_filter=True)
        print('\n\n'.join(s.text.strip() for s in segments if s.text.strip()))
    else:
        threading.Thread(target=purge, daemon=True).start()
        ThreadingHTTPServer(('0.0.0.0', int(os.environ.get('PORT', '8000'))), Handler).serve_forever()
