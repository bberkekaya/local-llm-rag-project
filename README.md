# Local RAG Demo (Ollama & Haystack)

Bu proje, yerel LLM'ler (Ollama) kullanarak dokümanlarınızla sohbet etmenizi sağlayan modern bir **Retrieval-Augmented Generation (RAG)** uygulamasıdır. 

![Project Status](https://img.shields.io/badge/Status-Active-success)
![Python](https://img.shields.io/badge/Python-3.10+-blue)
![React](https://img.shields.io/badge/React-18-blue)
![Ollama](https://img.shields.io/badge/AI-Ollama-orange)

## Özellikler

- **🔒 %100 Yerel Çalışma**: Herhangi bir sohbet platformu veya bulut API anahtarına ihtiyaç duymaz. Tüm işlemler (Embedding & LLM) yerel cihazınızdaki [Ollama](https://ollama.com/) üzerinden gerçekleşir.
- **🛡️ Sıkılaştırılmış Güvenlik**: API erişimi varsayılan olarak yalnızca yerel origin'lerle sınırlandırılmıştır, yanıtlar `no-store` ile döner ve hata detayları dışarı sızdırılmaz.
- **🧼 Veri Gizliliği Koruması**: Yüklenen dosya adları normalize edilir, desteklenmeyen türler reddedilir ve aynı kaynak yeniden yüklenirse eski vektör kayıtları temizlenir.
- **⚙️ Kontrollü Kaynak Kullanımı**: Sorgu uzunluğu, dosya adedi ve dosya boyutu limitleriyle servis aşırı yüklenmeye karşı korunur.
- **📄 Çoklu Format Desteği**: `.pdf`, `.docx`, ve `.txt` dosyalarını yükleyip analiz edebilirsiniz.
- **⚡ Streaming Yanıtlar**: Yapay zeka yanıtları, kelime kelime gerçek zamanlı olarak (typewriter effect) ekrana gelir.
- **🛠️ Geliştirici Modu (Developer Mode)**: Yanıt süreleri, token sayıları, benzerlik skorları (cosine similarity) ve alınan bağlamlar (context) hakkında detaylı metrikler sunar.
- **💅 Modern Arayüz**: Dark/Light mod desteği, sürükle-bırak dosya yükleme, temiz ve responsive tasarım.
- **🧠 Akıllı Hafıza**: Dosyalar `ChromaDB` üzerinde vektörel olarak saklanır (`chromadb_store` klasörü). Uygulamayı kapatıp açsanız bile dosyalarınız silinmez.

---

## Teknoloji Yığını

### Backend (Python)
- **FastAPI**: Hızlı ve modern REST API.
- **Haystack 2.x**: RAG pipeline ve prompt yönetimi.
- **ChromaDB**: Vektör veritabanı (Persistent).
- **Ollama Integrations**: Embedding (BGE-M3) ve Generation (Llama 3) işlemleri.

### Frontend (React)
- **Vite**: Hızlı geliştirme ortamı.
- **React Markdown**: Markdown formatındaki yapay zeka yanıtlarını render etmek için.
- **Native CSS**: Harici kütüphane bağımlılığı olmadan (Tailwind vb. kullanmadan) modern stil.

---

## Kurulum

Projeyi çalıştırmak için bilgisayarınızda **Python**, **Node.js** ve **Ollama** kurulu olmalıdır.

Docker ile çalıştırmak isterseniz ayrıca **Docker Desktop** veya Docker Engine + Docker Compose eklentisi kurulu olmalıdır.

### Ortam Değişkenleri

Backend aşağıdaki değişkenleri destekler:

```bash
OLLAMA_URL=http://localhost:11434
LLM_MODEL=qwen3.5:9b
EMBEDDING_MODEL=bge-m3:567m
GENERATION_NUM_PREDICT=1024
CHUNK_SIZE=1200
CHUNK_OVERLAP=200
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Frontend geliştirme ortamında API çağrıları Vite proxy üzerinden `/api` yoluna gider. Gerekirse hedef backend adresini aşağıdaki değişkenle değiştirebilirsiniz:

```bash
VITE_PROXY_TARGET=http://localhost:8000
```

Not: Daha doğru bağlam yakalamak için varsayılan chunk boyutu artırıldı. İsterseniz `CHUNK_SIZE` ve `CHUNK_OVERLAP` değerlerini ortam değişkenleriyle değiştirebilirsiniz. Daha büyük chunk daha fazla bağlam sağlar; ancak aşırı büyütmek retrieval hassasiyetini düşürebilir.

---

## Docker ile Çalıştırma

Bu repo Docker ile iki servis halinde çalışır ve Ollama'yı host makineden kullanır:

- **frontend**: Nginx üzerinden React build'i sunar.
- **backend**: FastAPI uygulamasını çalıştırır.
- **host Ollama**: Windows/macOS/Linux tarafında kurulu Ollama servisidir; Docker içinden buna bağlanılır.

### Docker Dosyaları

- `Dockerfile`: Backend image tanımı.
- `docker-compose.yml`: Frontend ve backend servis orkestrasyonu.
- `.dockerignore`: Root build context temizliği.
- `frontend/Dockerfile`: Frontend multi-stage build.
- `frontend/nginx.conf`: Frontend + `/api` reverse proxy ayarı.
- `frontend/.dockerignore`: Frontend build context temizliği.

### Docker Kurulum Adımları

1. Repo kök dizinine gelin.
2. Host makinede Ollama'nın çalıştığını ve gerekli modellerin indiğini doğrulayın.
3. Docker servislerini build edip başlatın.
4. Tarayıcıdan uygulamayı açın.

```bash
# 1) Gerekli modeller host makinede hazır olsun
ollama pull qwen3.5:9b
ollama pull bge-m3:567m

# 2) Ollama servisinin hostta çalıştığını doğrula
ollama list

# 3) Docker servislerini ayağa kaldır
docker compose up --build -d
```

Eğer Docker tarafında dependency veya Dockerfile değişikliği yaptıysanız, eski backend image'ı önbellekten gelmesin diye şu komut daha güvenlidir:

```bash
docker compose down
docker compose build --no-cache backend frontend
docker compose up -d
```

Uygulama açıldıktan sonra erişim adresleri:

- **Frontend**: `http://localhost:8080`
- **Backend API**: `http://localhost:8000`
- **Host Ollama API**: `http://localhost:11434`

### Docker Ortamında Kalıcılık

- ChromaDB verileri `chromadb_data` volume içinde saklanır.
- Ollama modelleri Docker volume'unda değil, doğrudan host makinedeki Ollama kurulumunda saklanır.
- Container'ları silseniz bile hosttaki Ollama modelleri korunur.

### Docker Komutları

```bash
# Çalışan servisleri görüntüle
docker compose ps

# Logları izle
docker compose logs -f

# Sadece backend loglarını izle
docker compose logs -f backend

# Servisleri durdur
docker compose down

# Servisleri ve ChromaDB volume'unu tamamen kaldır
docker compose down -v
```

### Docker Notları

- Backend container, host makinedeki Ollama'ya varsayılan olarak `http://host.docker.internal:11434` adresinden bağlanır.
- Frontend container doğrudan backend'e gitmez; Nginx `/api` isteklerini backend servisine proxy eder.
- `cmd` veya PowerShell içinde `ollama list` çıktısında gerekli modeller görünüyorsa Docker tarafı da aynı modelleri kullanır.
- Hostta Ollama çalışmıyorsa backend model üretimi yapamaz.

---

## Local Kurulum

### 1. Ollama ve Modellerin Hazırlanması
Bu proje varsayılan olarak `qwen3.5:9b` ve `bge-m3:567m` modellerini kullanır. Terminalinizde şu komutları çalıştırarak modelleri indirin:

```bash
# Chat modeli (LLM)
ollama pull qwen3.5:9b

# Embedding modeli (Vektörleştirme)
ollama pull bge-m3:567m
```

*Not: Farklı bir model kullanmak isterseniz `main.py` dosyasındaki `LLM_MODEL` ve `EMBEDDING_MODEL` değişkenlerini güncelleyebilirsiniz.*

### 2. Backend (Sunucu) Kurulumu

Projeyi klonladıktan veya indirdikten sonra ana dizinde (`main.py` dosyasının olduğu yer) şu adımları izleyin:

```bash
# 1. Sanal ortam oluşturun (Önerilen)
python -m venv venv

# Windows için sanal ortamı aktif etme:
.\venv\Scripts\activate

# Mac/Linux için:
source venv/bin/activate

# 2. Gerekli kütüphaneleri yükleyin
pip install -r requirements.txt
```

Paketler yüklendikten sonra sunucuyu başlatın:

```bash
python main.py
```
Sunucu `http://localhost:8000` adresinde çalışmaya başlayacaktır.

Varsayılan korumalar:

- En fazla `10` dosya yüklenebilir.
- Tek dosya boyutu en fazla `50MB` olabilir.
- Sorgu uzunluğu en fazla `2000` karakterdir.
- Aynı dosya adı tekrar yüklenirse eski kayıtlar silinip yeni içerik yazılır.

### 3. Frontend (Arayüz) Kurulumu

Yeni bir terminal açın ve `frontend` klasörüne gidin:

```bash
cd frontend

# Bağımlılıkları yükleyin
npm install

# Uygulamayı başlatın
npm run dev
```

Uygulama genellikle `http://localhost:5173` adresinde açılacaktır. Tarayıcınızda bu adrese giderek kullanmaya başlayabilirsiniz!

> Hızlı başlangıç için lokal kurulum yerine Docker kurulumunu tercih edebilirsiniz. GitHub paylaşımı ve demo gösterimi için en pratik yöntem genellikle `docker compose up --build -d` akışıdır.

---

## Kullanım

1. **Doküman Yükleme**: "Doküman yükle" alanına dosyalarınızı sürükleyin veya tıklayarak seçin. Ardından "Vektörle ve kaydet" butonuna basın.
2. **Bekleme**: Dosyalarınız okunup vektör veritabanına işlenecektir. Bu işlem dosya boyutuna ve bilgisayarınızın hızına göre değişebilir.
3. **Soru Sorma**: "Soru sor" alanına dokümanlarınızla ilgili sorunuzu yazın.
   - **Top-k**: Kaç farklı doküman parçasının bağlam olarak kullanılacağını seçebilirsiniz.
   - **Cevap Biçimi**: Kısa, maddeler halinde veya uzun cevaplar isteyebilirsiniz.
4. **Analiz**: Cevap geldikten sonra eğer **Geliştirici Modu (🔧)** açıksa, yanıtın altındaki detaylardan hangi dosyanın hangi bölümünden yararlanıldığını ve benzerlik oranlarını görebilirsiniz.

---

## Güvenlik ve Gizlilik Notları

- Uygulama varsayılan olarak yalnızca yerel ağdaki geliştirme origin'lerine izin verir; farklı bir domain kullanacaksanız `ALLOWED_ORIGINS` değerini açıkça tanımlayın.
- API yanıtları önbelleğe alınmaz; özellikle doküman ve sorgu içeriklerinin tarayıcı cache'ine yazılması engellenir.
- İç hata detayları istemciye ham haliyle dönmez; ayrıntılı teknik hata kayıtları yalnızca backend loglarında tutulur.
- Frontend yükleme öncesinde dosya tipi, adet ve boyut kontrolü yapar; backend aynı kontrolleri tekrar uygulayarak istemci tarafı atlatmalarını engeller.
- Yerel vektör veritabanı `chromadb_store/` altında tutulur ve Git ile Docker build context'inden hariç tutulur. Docker tarafında ise veriler sadece `chromadb_data` volume içinde kalır; repo içine yazılmaz.
- Repo paylaşımından önce `powershell -ExecutionPolicy Bypass -File .\scripts\prepublish_check.ps1` çalıştırın. Bu kontrol, track edilen dosyalar içinde vektör DB, `.env`, `.venv`, `frontend/dist` ve belirgin secret kalıpları olup olmadığını denetler.
- Eğer workspace içinde gerçek dokümanlarınızla oluşturulmuş yerel veri varsa ve repo klasörünü zip olarak da paylaşma ihtimaliniz bulunuyorsa, ayrıca `rmdir /s /q chromadb_store` komutuyla yerel vektör verisini temizleyin. Docker volume verisini temizlemek için `docker compose down -v` kullanın. Ollama model temizliği gerekiyorsa bunu host makinede `ollama rm <model>` ile yapın.

---

## Sorun Giderme

- **"Failed to fetch" Hatası**: Backend sunucusu (Python) çalışmıyor olabilir veya çok büyük bir dosya yüklerken zaman aşımına uğramış olabilir.
- **Ollama Bağlantı Hatası**: Ollama uygulamasının arka planda çalıştığından emin olun (Genellikle sağ alt köşedeki tepside görünür).
- **Hatalı Cevaplar**: "Top-k" değerini artırarak yapay zekaya daha fazla bağlam (context) verebilirsiniz.
- **CORS / Erişim Hatası**: Frontend farklı bir origin'den açılıyorsa backend tarafında `ALLOWED_ORIGINS` ayarını güncelleyin.
- **Docker'da Yanıt Gelmiyor**: Önce host terminalinde `ollama list` komutuyla modellerin gerçekten indiğini ve Ollama servisinin çalıştığını kontrol edin.
- **Docker'da İlk Açılış Yavaş**: İlk build süresi doğaldır; model indirme bir kez host Ollama tarafında yapılır.
- **Docker'da HTTP 502 Hatası**: `docker compose logs --tail=200 backend` çıktısına bakın. Eğer `ModuleNotFoundError` görüyorsanız image eski bağımlılıklarla build edilmiştir; `docker compose build --no-cache backend frontend` sonrası yeniden başlatın.

---

## Lisans

Bu proje açık kaynaklıdır ve demo amaçlı hazırlanmıştır.
