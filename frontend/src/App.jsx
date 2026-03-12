import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_FILE_COUNT = 10;
const ALLOWED_EXTENSIONS = [".txt", ".pdf", ".docx", ".doc"];

function isValidUploadFile(file) {
  const lowerName = file.name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

function buildApiUrl(path) {
  return API_BASE ? `${API_BASE}${path}` : path;
}

function mergeUploadFiles(existingFiles, incomingFiles) {
  const fileMap = new Map();

  [...existingFiles, ...incomingFiles].forEach((file) => {
    const key = `${file.name}:${file.size}:${file.lastModified}`;
    if (!fileMap.has(key)) {
      fileMap.set(key, file);
    }
  });

  return Array.from(fileMap.values());
}

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved !== null ? saved === "true" : true;
  });

  const [developerMode, setDeveloperMode] = useState(() => {
    const saved = localStorage.getItem("developerMode");
    return saved !== null ? saved === "true" : false;
  });

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [added, setAdded] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadWarnings, setUploadWarnings] = useState([]);
  const [abortController, setAbortController] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const [fileList, setFileList] = useState([]);
  const [fileListLoading, setFileListLoading] = useState(false);
  const [fileFilter, setFileFilter] = useState("");

  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(4);
  const [answerStyle, setAnswerStyle] = useState("default");
  const [answer, setAnswer] = useState("");
  const [contexts, setContexts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);

  const fileInputRef = useRef(null);

  const fetchFiles = async () => {
    setFileListLoading(true);
    setError(null);
    try {
      const res = await fetch(buildApiUrl("/api/files"));
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setFileList(data.files || []);
    } catch (err) {
      console.error("Dosya listesi alınamadı:", err);
      setError("Dosya listesi alınamadı. Backend çalışıyor mu kontrol edin.");
      setFileList([]);
    } finally {
      setFileListLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode.toString());
    const theme = darkMode ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("developerMode", developerMode.toString());
  }, [developerMode]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      const validFiles = droppedFiles.filter((file) => isValidUploadFile(file));

      if (validFiles.length === 0) {
        setError("Lütfen sadece TXT, PDF veya Word dosyaları yükleyin.");
        return;
      }

      const mergedFiles = mergeUploadFiles(files, validFiles);

      if (mergedFiles.length > MAX_FILE_COUNT) {
        setError(`En fazla ${MAX_FILE_COUNT} dosya yükleyebilirsiniz.`);
        return;
      }

      const oversizedFile = mergedFiles.find((file) => file.size > MAX_FILE_SIZE_BYTES);
      if (oversizedFile) {
        setError(`${oversizedFile.name} 50MB sınırını aşıyor.`);
        return;
      }

      setFiles(mergedFiles);
      setAdded(null);
      setError(null);
      setUploadProgress(0);
      setUploadWarnings([]);
    }
  };

  const onFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter((file) => isValidUploadFile(file));
    const mergedFiles = mergeUploadFiles(files, validFiles);

    if (mergedFiles.length > MAX_FILE_COUNT) {
      setError(`En fazla ${MAX_FILE_COUNT} dosya yükleyebilirsiniz.`);
      e.target.value = "";
      return;
    }

    const oversizedFile = mergedFiles.find((file) => file.size > MAX_FILE_SIZE_BYTES);
    if (oversizedFile) {
      setError(`${oversizedFile.name} 50MB sınırını aşıyor.`);
      e.target.value = "";
      return;
    }

    if (selectedFiles.length !== validFiles.length) {
      setError("Sadece TXT, PDF ve Word dosyaları seçilebilir.");
    }

    setFiles(mergedFiles);
    setAdded(null);
    if (selectedFiles.length === validFiles.length) {
      setError(null);
    }
    setUploadProgress(0);
    setUploadWarnings([]);
    e.target.value = "";
  };

  const handleUpload = async () => {
    if (!files.length) {
      setError("Lütfen en az bir TXT, PDF veya Word dosyası seçin.");
      return;
    }
    setUploading(true);
    setError(null);
    setUploadProgress(5);
    setUploadWarnings([]);

    let timer = null;
    let timeoutId = null;

    timer = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 90) {
          clearInterval(timer);
          return 90;
        }
        return Math.min(p + 5, 90);
      });
    }, 500);

    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));

      const controller = new AbortController();
      setAbortController(controller);
      timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000);

      const res = await fetch(buildApiUrl("/api/embed"), {
        method: "POST",
        body: form,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      setAbortController(null);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Yükleme başarısız (HTTP ${res.status})`);
      }

      const data = await res.json();
      clearInterval(timer);
      setAdded(data.added_chunks);
      setUploadProgress(100);
      setUploadWarnings(data.warnings || []);
      await fetchFiles();
    } catch (err) {
      clearInterval(timer);
      if (timeoutId) clearTimeout(timeoutId);
      setAbortController(null);

      if (err.name === 'AbortError') {
        if (uploadProgress > 0 && uploadProgress < 100) {
          setError("Yükleme iptal edildi.");
        } else {
          setError("İşlem zaman aşımına uğradı. Dosya çok büyük olabilir veya backend yanıt vermiyor.");
        }
      } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError("Backend'e bağlanılamıyor. Sunucunun çalıştığını kontrol edin.");
      } else {
        setError(err.message || "Yükleme sırasında bir hata oluştu.");
      }
      setUploadProgress(0);
    } finally {
      setUploading(false);
      if (timer) clearInterval(timer);
      if (timeoutId) clearTimeout(timeoutId);
      setAbortController(null);
    }
  };

  const handleCancelUpload = () => {
    if (abortController) {
      abortController.abort();
      setUploadProgress(0);
      setUploading(false);
      setAbortController(null);
    }
  };

  const handleQueryStreaming = async () => {
    if (!query.trim()) {
      setError("Soru boş olamaz.");
      return;
    }
    setLoading(true);
    setStreaming(true);
    setError(null);
    setAnswer("");
    setContexts([]);
    setMetadata(null);

    try {
      const res = await fetch(buildApiUrl("/api/query/stream"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, top_k: topK, answer_style: answerStyle }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Sorgu başarısız");
      }

      if (!res.body) {
        throw new Error("Akış yanıtı alınamadı.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            let data;
            try {
              data = JSON.parse(line.slice(6));
            } catch (e) {
              console.error("Parse error:", e);
              continue;
            }

            if (data.type === 'contexts') {
              setContexts(data.content);
            } else if (data.type === 'token') {
              setAnswer(prev => prev + data.content);
            } else if (data.type === 'metadata') {
              setMetadata(data.content);
            } else if (data.type === 'done') {
              setLoading(false);
              setStreaming(false);
            } else if (data.type === 'error') {
              throw new Error(data.content || "Akış sırasında hata oluştu.");
            }
          }
        }
      }
    } catch (err) {
      setError(err.message);
      setAnswer("");
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  const handleQuery = handleQueryStreaming;

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuery();
    }
  };

  const handleDelete = async (source) => {
    if (!window.confirm(`${source} dosyasına ait tüm parçalar silinsin mi?`)) return;
    setFileListLoading(true);
    setError(null);
    try {
      const res = await fetch(buildApiUrl(`/api/files/${encodeURIComponent(source)}`), {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Silme başarısız");
      }
      await fetchFiles();
    } catch (err) {
      setError(err.message);
    } finally {
      setFileListLoading(false);
    }
  };

  const handleReindex = async () => {
    if (!window.confirm("Tüm koleksiyon sıfırlanacak. Emin misiniz?")) return;
    setFileListLoading(true);
    setError(null);
    try {
      const res = await fetch(buildApiUrl("/api/reindex"), { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Reindex başarısız");
      }
      setFileList([]);
      setAdded(null);
      await fetchFiles();
    } catch (err) {
      setError(err.message);
    } finally {
      setFileListLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    if (answer) {
      handleQuery();
    } else if (files.length > 0) {
      handleUpload();
    }
  };

  const filteredFiles = fileList.filter((f) =>
    f.source.toLowerCase().includes(fileFilter.toLowerCase())
  );

  return (
    <div className="page">
      <header className="hero">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <h1>RAG Project</h1>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setDeveloperMode(!developerMode)}
              className="theme-toggle"
              title={developerMode ? "Developer Mode: Açık" : "Developer Mode: Kapalı"}
            >
              {developerMode ? "🔧" : "👤"}
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="theme-toggle"
              title={darkMode ? "Light mode'a geç" : "Dark mode'a geç"}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
        <div className="model-box">
          <div><strong>Embedding:</strong> bge-m3:567m (Ollama)</div>
          <div><strong>LLM:</strong> qwen3.5:9b (Ollama)</div>
        </div>
      </header>

      <section className="card">
        <h2>1) Doküman yükle</h2>
        <div
          className={`drop-zone ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="drop-zone-content">
            <span className="drop-zone-icon">📁</span>
            <p className="drop-zone-text">
              {files.length > 0
                ? `${files.length} dosya seçildi`
                : "Dosyaları buraya sürükleyin veya tıklayın"}
            </p>
            <p className="drop-zone-hint">TXT, PDF, DOCX formatları desteklenir</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.pdf,.docx,.doc"
            onChange={onFileChange}
            style={{ display: 'none' }}
          />
        </div>

        {files.length > 0 && (
          <div style={{ marginTop: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <strong>Seçilen dosyalar:</strong>
              {added !== null && (
                <span className="ok" style={{ margin: 0, fontSize: "14px" }}>
                  {files.map(f => f.name).join(", ")} başarıyla yüklendi.
                </span>
              )}
            </div>
            <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
              {files.map((f, i) => (
                <li key={i}>{f.name} ({(f.size / 1024).toFixed(1)} KB)</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
          <button onClick={handleUpload} disabled={uploading}>
            {uploading ? "Yükleniyor..." : "Vektörle ve kaydet"}
          </button>
          {uploading && (
            <button onClick={handleCancelUpload} className="danger" style={{ flexShrink: 0 }}>
              İptal Et
            </button>
          )}
        </div>
        {uploadProgress > 0 && (
          <div className="progress">
            <div className="progress-bar" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}
        {added !== null && <p className="ok">Eklenen parça sayısı: {added}</p>}
        {uploadWarnings.length > 0 && (
          <div style={{ marginTop: "8px", padding: "8px", background: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.3)", borderRadius: "8px", fontSize: "14px" }}>
            <strong>Uyarılar:</strong>
            <ul style={{ margin: "4px 0", paddingLeft: "20px" }}>
              {uploadWarnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}
      </section>

      <section className="card">
        <h2>2) Soru sor</h2>
        <label>Top-k bağlam: {topK}</label>
        <input
          type="range"
          min="1"
          max="8"
          value={topK}
          onChange={(e) => setTopK(Number(e.target.value))}
        />
        <label style={{ display: "block", marginBottom: 8 }}>
          Cevap biçimi:
          <select
            value={answerStyle}
            onChange={(e) => setAnswerStyle(e.target.value)}
            className="select"
          >
            <option value="default">Standart</option>
            <option value="short">Kısa (1-2 cümle)</option>
            <option value="bullet">Madde madde</option>
            <option value="long">Uzun/açıklayıcı</option>
          </select>
        </label>
        <textarea
          rows={3}
          placeholder="Sorunuzu yazın (Enter ile gönder)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button onClick={handleQuery} disabled={loading}>
          {loading ? (streaming ? "Yanıt alınıyor..." : "Sorgulanıyor...") : "Yanıtla"}
        </button>
      </section>

      {error && (
        <div className="error">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Hata: {error}</span>
            <button onClick={handleRetry} className="ghost" style={{ marginLeft: "12px" }}>
              🔄 Tekrar Dene
            </button>
          </div>
        </div>
      )}

      {answer && (
        <section className="card answer-card">
          <h2>Cevap</h2>
          <div className="markdown-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {answer}
            </ReactMarkdown>
          </div>

          {developerMode && metadata && (
            <div className="dev-metadata">
              <h3 style={{ margin: "16px 0 12px 0", fontSize: "16px", color: "var(--text-primary)" }}>
                🔧 Developer Metadata
              </h3>
              <div className="metadata-grid">
                <div className="metadata-item">
                  <span className="metadata-label">⏱️ Total Time:</span>
                  <span className="metadata-value">{metadata.total_time}s</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">🔢 Tokens:</span>
                  <span className="metadata-value">{metadata.token_count}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">📊 Avg Similarity:</span>
                  <span className="metadata-value">{(metadata.avg_similarity * 100).toFixed(1)}%</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">🎯 Top Similarity:</span>
                  <span className="metadata-value">{(metadata.top_similarity * 100).toFixed(1)}%</span>
                </div>
              </div>

              <details style={{ marginTop: "12px" }}>
                <summary style={{ cursor: "pointer", fontWeight: 600, padding: "4px 0" }}>
                  Timing Breakdown
                </summary>
                <div className="metadata-grid" style={{ marginTop: "8px" }}>
                  <div className="metadata-item">
                    <span className="metadata-label">Embedding:</span>
                    <span className="metadata-value">{metadata.embed_time}s</span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">Retrieval:</span>
                    <span className="metadata-value">{metadata.retrieval_time}s</span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">Generation:</span>
                    <span className="metadata-value">{metadata.generation_time}s</span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">Prompt Length:</span>
                    <span className="metadata-value">{metadata.prompt_length} chars</span>
                  </div>
                </div>
              </details>

              {contexts.length > 0 && (
                <details style={{ marginTop: "12px" }}>
                  <summary style={{ cursor: "pointer", fontWeight: 600, padding: "4px 0" }}>
                    Kullanılan bağlamlar ({contexts.length})
                  </summary>
                  <ol style={{ marginTop: "8px" }}>
                    {contexts.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ol>
                </details>
              )}

              {metadata.sources && metadata.sources.length > 0 && (
                <details style={{ marginTop: "12px" }}>
                  <summary style={{ cursor: "pointer", fontWeight: 600, padding: "4px 0" }}>
                    Sources & Similarities
                  </summary>
                  <div style={{ marginTop: "8px" }}>
                    {metadata.sources.map((source, i) => (
                      <div key={i} style={{
                        padding: "6px 8px",
                        marginBottom: "4px",
                        background: "var(--bg-secondary)",
                        borderRadius: "6px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <span style={{ fontSize: "14px" }}>{source}</span>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                          {metadata.raw_distances && (
                            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                              dist: {metadata.raw_distances[i]}
                            </span>
                          )}
                          <span style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: metadata.similarities[i] > 0.8 ? "#22c55e" : metadata.similarities[i] > 0.6 ? "#f59e0b" : "#ef4444"
                          }}>
                            {(metadata.similarities[i] * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </section>
      )}

      <section className="card">
        <h2>Doküman yönetimi</h2>
        <div className="file-actions">
          <button onClick={fetchFiles} disabled={fileListLoading}>
            {fileListLoading ? "Yenileniyor..." : "Listeyi yenile"}
          </button>
          <button onClick={handleReindex} disabled={fileListLoading} className="danger">
            Koleksiyonu sıfırla
          </button>
        </div>
        <input
          className="filter"
          placeholder="Kaynak adına göre filtrele..."
          value={fileFilter}
          onChange={(e) => setFileFilter(e.target.value)}
        />
        {fileListLoading && <p>Yükleniyor...</p>}
        {!fileListLoading && filteredFiles.length === 0 && <p>Dosya bulunamadı.</p>}
        {!fileListLoading && filteredFiles.length > 0 && (
          <ul className="file-list">
            {filteredFiles.map((f) => (
              <li key={f.source}>
                <span>{f.source} ({f.chunks} parça)</span>
                <button onClick={() => handleDelete(f.source)} className="ghost">
                  Sil
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
