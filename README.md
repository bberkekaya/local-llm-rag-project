# Local RAG Demo

Bu proje, yerel Ollama modelleriyle doküman yükleyip onlar üzerinden soru-cevap yapmanızı sağlayan bir RAG uygulamasıdır. Backend FastAPI ile, arayüz React + Vite ile, vektör depolama ise ChromaDB ile çalışır.

## Özet

- Tamamen lokal çalışır; harici API anahtarı gerekmez.
- Varsayılan modeller `qwen3.5:9b` ve `bge-m3:567m` olarak tanımlıdır.
- TXT, PDF, DOCX ve DOC dosyaları yüklenebilir.
- Yanıtlar streaming olarak gelir.
- Geliştirici modu ile context, süre ve skor detayları görülebilir.
- Yüklenen veriler ChromaDB içinde kalıcı olarak tutulur.
- Docker kurulumu ayrı bir Ollama container'ı kullanmaz; host makinedeki Ollama'ya bağlanır.

## Teknoloji Yığını

### Backend

- FastAPI
- Haystack
- ChromaDB
- Ollama Haystack integrations
- Uvicorn

### Frontend

- React 18
- Vite 5
- react-markdown
- react-syntax-highlighter

## Varsayılan Modeller

```bash
LLM_MODEL=qwen3.5:9b
EMBEDDING_MODEL=bge-m3:567m
```

Host makinede bu modellerin kurulu olması gerekir:

```bash
ollama pull qwen3.5:9b
ollama pull bge-m3:567m
ollama list
```

## Ortam Değişkenleri

Backend şu değişkenleri destekler:

```bash
OLLAMA_URL=http://localhost:11434
LLM_MODEL=qwen3.5:9b
EMBEDDING_MODEL=bge-m3:567m
GENERATION_NUM_PREDICT=1024
CHUNK_SIZE=1200
CHUNK_OVERLAP=200
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Frontend geliştirme ortamında Vite proxy kullanılır:

```bash
VITE_PROXY_TARGET=http://localhost:8000
```

İsterseniz frontend tarafında doğrudan API base adresi de verebilirsiniz:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

## Local Kurulum

Gereksinimler:

- Python
- Node.js
- Ollama

### 1. Backend

```bash
python -m venv venv
```

Windows:

```bash
.\venv\Scripts\activate
```

macOS/Linux:

```bash
source venv/bin/activate
```

Ardından:

```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Erişim adresleri:

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://localhost:8000`
- Ollama: `http://localhost:11434`

## Docker ile Çalıştırma

Docker yapısı iki servisten oluşur:

- `backend`
- `frontend`

Ollama Docker içinde çalışmaz. Backend, host makinedeki Ollama'ya bağlanır.

### Başlatma

```bash
ollama list
docker compose up --build -d
```

### Temiz yeniden build

```bash
docker compose down
docker compose build --no-cache backend frontend
docker compose up -d
```

### Docker erişim adresleri

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:8000`
- Host Ollama API: `http://localhost:11434`

### Docker notları

- Backend varsayılan olarak `http://host.docker.internal:11434` adresindeki host Ollama'ya bağlanır.
- Frontend, Nginx üzerinden `/api` isteklerini backend servisine proxy eder.
- `ollama list` çıktısında model görünüyorsa Docker backend de aynı modeli kullanır.
- `docker compose down -v` sadece ChromaDB volume'unu temizler; host Ollama modellerini silmez.

## Uygulama Davranışı

### Dosya yükleme

- Desteklenen uzantılar: `.txt`, `.pdf`, `.docx`, `.doc`
- Maksimum dosya sayısı: `10`
- Tek dosya boyut limiti: `50MB`
- Aynı dosya adı tekrar yüklenirse eski kayıtlar silinir ve yeni içerik yazılır.

### Sorgu

- Maksimum sorgu uzunluğu: `2000` karakter
- `top_k` aralığı: `1-10`
- Streaming endpoint mevcuttur.

### Koleksiyon sıfırlama

`Koleksiyonu sıfırla` işlemi ChromaDB içindeki `documents` koleksiyonunu tamamen silip boş olarak yeniden oluşturur. Bu işlem:

- Yüklenen doküman embedding'lerini siler.
- Dosya listesini boşaltır.
- Ollama modellerini silmez.
- Kod veya Docker image'larını etkilemez.

## API Özeti

- `GET /api/health`: Servis ve model bilgisi döner.
- `GET /api/files`: Yüklenmiş kaynak dosyaları listeler.
- `DELETE /api/files/{source}`: Belirli kaynağa ait kayıtları siler.
- `POST /api/reindex`: Tüm koleksiyonu temizler.
- `POST /api/embed`: Dosyaları vektörleştirir.
- `POST /api/query`: Normal sorgu yanıtı üretir.
- `POST /api/query/stream`: Streaming sorgu yanıtı üretir.

## Güvenlik ve Sınırlar

- CORS varsayılan olarak lokal origin'lerle sınırlıdır.
- Yanıtlarda `Cache-Control: no-store` kullanılır.
- İç hata detayları doğrudan istemciye sızdırılmaz.
- Frontend ve backend dosya tipi, adet ve boyut sınırlarını uygular.
- Dosya adları normalize edilir.

## Yararlı Komutlar

### Docker durumunu kontrol et

```bash
docker compose ps
docker compose logs --tail 100 backend
```

### Host Ollama durumunu kontrol et

```bash
ollama list
```

### Koleksiyonu temizlemeden Docker verisini sıfırla

```bash
docker compose down -v
docker compose up --build -d
```

## Sorun Giderme

- `Failed to fetch`: Backend kapalı olabilir veya ağ bağlantısı kurulamıyordur.
- Ollama bağlantı hatası: Host makinede Ollama servisinin çalıştığını kontrol edin.
- Docker'da yanıt gelmiyor: Önce `ollama list` ile gerekli modellerin hostta olduğunu kontrol edin.
- Docker'da 502 hatası: `docker compose logs --tail 200 backend` çıktılarına bakın.
- Yanıt kalitesi düşük: `top_k` değerini artırıp daha fazla bağlam deneyin.

## Paylaşım Öncesi Kontrol

Repo paylaşmadan önce şu kontrolü çalıştırabilirsiniz:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\prepublish_check.ps1
```

Gerçek dokümanlarla oluşan lokal vektör verisini temizlemek isterseniz:

```cmd
rmdir /s /q chromadb_store
```

Host Ollama model temizliği gerekiyorsa:

```bash
ollama rm <model>
```
