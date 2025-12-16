# 🚀 Local RAG Demo with Ollama & Haystack

Bu proje, yerel LLM'ler (Ollama) kullanarak dokümanlarınızla sohbet etmenizi sağlayan modern bir **Retrieval-Augmented Generation (RAG)** uygulamasıdır. 

![Project Status](https://img.shields.io/badge/Status-Active-success)
![Python](https://img.shields.io/badge/Python-3.10+-blue)
![React](https://img.shields.io/badge/React-18-blue)
![Ollama](https://img.shields.io/badge/AI-Ollama-orange)

## ✨ Özellikler

- **🔒 %100 Yerel Çalışma**: Herhangi bir OpenAI veya bulut API anahtarına ihtiyaç duymaz. Tüm işlemler (Embedding & LLM) yerel cihazınızdaki [Ollama](https://ollama.com/) üzerinden gerçekleşir.
- **📄 Çoklu Format Desteği**: `.pdf`, `.docx`, ve `.txt` dosyalarını yükleyip analiz edebilirsiniz.
- **⚡ Streaming Yanıtlar**: Yapay zeka yanıtları, kelime kelime gerçek zamanlı olarak (typewriter effect) ekrana gelir.
- **🛠️ Geliştirici Modu (Developer Mode)**: Yanıt süreleri, token sayıları, benzerlik skorları (cosine similarity) ve alınan bağlamlar (context) hakkında detaylı metrikler sunar.
- **💅 Modern Arayüz**: Dark/Light mod desteği, sürükle-bırak dosya yükleme, temiz ve responsive tasarım.
- **🧠 Akıllı Hafıza**: Dosyalar `ChromaDB` üzerinde vektörel olarak saklanır (`chromadb_store` klasörü). Uygulamayı kapatıp açsanız bile dosyalarınız silinmez.

---

## 🏗️ Teknoloji Yığını

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

## 🚀 Kurulum

Projeyi çalıştırmak için bilgisayarınızda **Python**, **Node.js** ve **Ollama** kurulu olmalıdır.

### 1. Ollama ve Modellerin Hazırlanması
Bu proje varsayılan olarak `llama3` ve `bge-m3` modellerini kullanır. Terminalinizde şu komutları çalıştırarak modelleri indirin:

```bash
# Chat modeli (LLM)
ollama pull llama3

# Embedding modeli (Vektörleştirme)
ollama pull bge-m3:latest
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

---

## 📖 Kullanım

1. **Doküman Yükleme**: "Doküman yükle" alanına dosyalarınızı sürükleyin veya tıklayarak seçin. Ardından "Vektörle ve kaydet" butonuna basın.
2. **Bekleme**: Dosyalarınız okunup vektör veritabanına işlenecektir. Bu işlem dosya boyutuna ve bilgisayarınızın hızına göre değişebilir.
3. **Soru Sorma**: "Soru sor" alanına dokümanlarınızla ilgili sorunuzu yazın.
   - **Top-k**: Kaç farklı doküman parçasının bağlam olarak kullanılacağını seçebilirsiniz.
   - **Cevap Biçimi**: Kısa, maddeler halinde veya uzun cevaplar isteyebilirsiniz.
4. **Analiz**: Cevap geldikten sonra eğer **Geliştirici Modu (🔧)** açıksa, yanıtın altındaki detaylardan hangi dosyanın hangi bölümünden yararlanıldığını ve benzerlik oranlarını görebilirsiniz.

---

## ❓ Sorun Giderme

- **"Failed to fetch" Hatası**: Backend sunucusu (Python) çalışmıyor olabilir veya çok büyük bir dosya yüklerken zaman aşımına uğramış olabilir.
- **Ollama Bağlantı Hatası**: Ollama uygulamasının arka planda çalıştığından emin olun (Genellikle sağ alt köşedeki tepside görünür).
- **Hatalı Cevaplar**: "Top-k" değerini artırarak yapay zekaya daha fazla bağlam (context) verebilirsiniz.

---

## 📝 Lisans

Bu proje açık kaynaklıdır ve eğitim/demo amaçlı hazırlanmıştır.
