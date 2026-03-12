# Local RAG Demo

Bu proje, yerel Ollama modelleriyle dokuman yukleyip onlar uzerinden soru-cevap yapmanizi saglayan bir RAG uygulamasidir. Backend FastAPI ile, arayuz React + Vite ile, vektor depolama ise ChromaDB ile calisir.

## Ozet

- Tamamen lokal calisir; harici API anahtari gerekmez.
- Varsayilan modeller `qwen3.5:9b` ve `bge-m3:567m` olarak tanimlidir.
- TXT, PDF, DOCX ve DOC dosyalari yuklenebilir.
- Yanitlar streaming olarak gelir.
- Gelistirici modu ile context, sure ve skor detaylari gorulebilir.
- Yuklenen veriler ChromaDB icinde kalici olarak tutulur.
- Docker kurulumu ayri bir Ollama container'i kullanmaz; host makinedeki Ollama'ya baglanir.

## Teknoloji Yigini

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

## Varsayilan Modeller

```bash
LLM_MODEL=qwen3.5:9b
EMBEDDING_MODEL=bge-m3:567m
```

Host makinede bu modellerin kurulu olmasi gerekir:

```bash
ollama pull qwen3.5:9b
ollama pull bge-m3:567m
ollama list
```

## Ortam Degiskenleri

Backend su degiskenleri destekler:

```bash
OLLAMA_URL= http://localhost:11434
LLM_MODEL=qwen3.5:9b
EMBEDDING_MODEL=bge-m3:567m
GENERATION_NUM_PREDICT=1024
CHUNK_SIZE=1200
CHUNK_OVERLAP=200
ALLOWED_ORIGINS= http://localhost:5173, http://127.0.0.1:5173
```

Frontend gelistirme ortaminda Vite proxy kullanilir:

```bash
VITE_PROXY_TARGET= http://localhost:8000
```

Isterseniz frontend tarafinda dogrudan API base adresi de verebilirsiniz:

```bash
VITE_API_BASE_URL= http://localhost:8000
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

Ardindan:

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

Erisim adresleri:

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://localhost:8000`
- Ollama: `http://localhost:11434`

## Docker ile Calistirma

Docker yapisi iki servisten olusur:

- `backend`
- `frontend`

Ollama Docker icinde calismaz. Backend, host makinedeki Ollama'ya baglanir.

### Baslatma

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

### Docker erisim adresleri

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:8000`
- Host Ollama API: `http://localhost:11434`

### Docker notlari

- Backend varsayilan olarak `http://host.docker.internal:11434` adresindeki host Ollama'ya baglanir.
- Frontend, Nginx uzerinden `/api` isteklerini backend servisine proxy eder.
- `ollama list` ciktisinda model gorunuyorsa Docker backend de ayni modeli kullanir.
- `docker compose down -v` sadece ChromaDB volume'unu temizler; host Ollama modellerini silmez.

## Uygulama Davranisi

### Dosya yukleme

- Desteklenen uzantilar: `.txt`, `.pdf`, `.docx`, `.doc`
- Maksimum dosya sayisi: `10`
- Tek dosya boyut limiti: `50MB`
- Ayni dosya adi tekrar yuklenirse eski kayitlar silinir ve yeni icerik yazilir.

### Sorgu

- Maksimum sorgu uzunlugu: `2000` karakter
- `top_k` araligi: `1-10`
- Streaming endpoint mevcuttur.

### Koleksiyon sifirlama

`Koleksiyonu sifirla` islemi ChromaDB icindeki `documents` koleksiyonunu tamamen silip bos olarak yeniden olusturur. Bu islem:

- Yuklenen dokuman embedding'lerini siler.
- Dosya listesini bosaltir.
- Ollama modellerini silmez.
- Kod veya Docker image'larini etkilemez.

## API Ozeti

- `GET /api/health`: Servis ve model bilgisi doner.
- `GET /api/files`: Yuklenmis kaynak dosyalari listeler.
- `DELETE /api/files/{source}`: Belirli kaynaga ait kayitlari siler.
- `POST /api/reindex`: Tum koleksiyonu temizler.
- `POST /api/embed`: Dosyalari vektorlestirir.
- `POST /api/query`: Normal sorgu yaniti uretir.
- `POST /api/query/stream`: Streaming sorgu yaniti uretir.

## Guvenlik ve Sinirlar

- CORS varsayilan olarak lokal origin'lerle sinirlidir.
- Yanitlarda `Cache-Control: no-store` kullanilir.
- Ic hata detaylari dogrudan istemciye sizdirilmaz.
- Frontend ve backend dosya tipi, adet ve boyut sinirlarini uygular.
- Dosya adlari normalize edilir.

## Yarali Komutlar

### Docker durumunu kontrol et

```bash
docker compose ps
docker compose logs --tail 100 backend
```

### Host Ollama durumunu kontrol et

```bash
ollama list
```

### Koleksiyonu temizlemeden Docker verisini sifirla

```bash
docker compose down -v
docker compose up --build -d
```

## Sorun Giderme

- `Failed to fetch`: Backend kapali olabilir veya ag baglantisi kurulamiyordur.
- Ollama baglanti hatasi: Host makinede Ollama servisinin calistigini kontrol edin.
- Docker'da yanit gelmiyor: Once `ollama list` ile gerekli modellerin hostta oldugunu kontrol edin.
- Docker'da 502 hatasi: `docker compose logs --tail 200 backend` ciktilarina bakin.
- Yanit kalitesi dusuk: `top_k` degerini artirip daha fazla baglam deneyin.

## Paylasim Oncesi Kontrol

Repo paylasmadan once su kontrolu calistirabilirsiniz:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\prepublish_check.ps1
```

Gercek dokumanlarla olusan lokal vektor verisini temizlemek isterseniz:

```cmd
rmdir /s /q chromadb_store
```

Host Ollama model temizligi gerekiyorsa:

```bash
ollama rm <model>
```
