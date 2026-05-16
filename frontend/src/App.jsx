import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'

const API = 'http://localhost:8000'

// ── Icons ─────────────────────────────────────────────────────────────────
const IconUpload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IconDB = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
)
const IconChat = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)
const IconRefresh = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
)
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
)

const SAMPLE_FILES = [
  { name: 'helpdesk_categories.csv', label: 'Helpdesk',       meta: 'question / category' },
  { name: 'approval_lines.csv',      label: 'Approval Lines', meta: '기안자,기안부서,양식명 / 결재선' },
  { name: 'product_tags.csv',        label: 'Product Tags',   meta: 'input / label' },
]

function Spinner() { return <span className="spinner" /> }

function StatusBadge({ ok }) {
  return (
    <span className={`status-badge ${ok ? 'ok' : 'err'}`}>
      <span className="status-dot" />
      {ok ? 'API Connected' : 'Offline'}
    </span>
  )
}

function parseCsvColumns(file) {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => {
      const cols = (e.target.result.split('\n')[0] || '')
        .split(',').map(c => c.trim().replace(/^"|"$/g, '')).filter(Boolean)
      resolve(cols)
    }
    reader.readAsText(file)
  })
}

// ── Upload Pane ─────────────────────────────────────────────────────────────
function UploadPane() {
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [columns, setColumns] = useState([])
  const [collectionName, setCollectionName] = useState('default')
  const [selectedInputCols, setSelectedInputCols] = useState([])
  const [labelColumn, setLabelColumn] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const applyFile = useCallback(async f => {
    setFile(f); setResult(null)
    const cols = await parseCsvColumns(f)
    setColumns(cols)
    setSelectedInputCols(cols.length > 0 ? [cols[0]] : [])
    setLabelColumn(cols.length > 1 ? cols[cols.length - 1] : '')
  }, [])

  const handleDrop = useCallback(e => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]; if (f) applyFile(f)
  }, [applyFile])

  const toggleInputCol = col =>
    setSelectedInputCols(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    )

  const handleSubmit = async () => {
    if (!file) { setError('CSV 파일을 선택해주세요.'); return }
    if (selectedInputCols.length === 0) { setError('Input Column을 하나 이상 선택해주세요.'); return }
    setLoading(true); setError(''); setResult(null)
    const form = new FormData()
    form.append('file', file)
    form.append('collection_name', collectionName)
    form.append('input_columns', selectedInputCols.join(','))
    form.append('label_column', labelColumn)
    try {
      const res = await fetch(`${API}/upload`, { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Upload failed')
      setResult(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="pane">
      <div className="pane-header">
        <div>
          <h2 className="pane-title">Data Upload</h2>
          <p className="pane-desc">CSV 파일을 업로드하고 벡터 인덱싱을 실행합니다.</p>
        </div>
      </div>

      <div className="pane-body">
        <div className="section">
          <div className="section-label">Sample Datasets</div>
          <div className="sample-row">
            {SAMPLE_FILES.map(f => (
              <a key={f.name} href={`${API}/examples/${f.name}`} download={f.name} className="sample-chip">
                <span className="sample-chip-name">↓ {f.label}</span>
                <span className="sample-chip-meta">{f.meta}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section-label">CSV File</div>
          <div
            className={`dropzone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input').click()}
          >
            <input id="file-input" type="file" accept=".csv" style={{ display: 'none' }}
              onChange={e => e.target.files[0] && applyFile(e.target.files[0])} />
            {file ? (
              <div className="drop-has">
                <span className="drop-ok-icon">✓</span>
                <div>
                  <div className="drop-fname">{file.name}</div>
                  <div className="drop-fmeta">{(file.size / 1024).toFixed(1)} KB · {columns.length} columns detected</div>
                </div>
              </div>
            ) : (
              <div className="drop-empty">
                <div className="drop-arrow">↑</div>
                <div className="drop-text">Drop CSV here or <span className="drop-link">browse file</span></div>
                <div className="drop-sub">Columns are auto-detected on upload</div>
              </div>
            )}
          </div>
        </div>

        <div className="section">
          <div className="section-label">Configuration</div>
          <div className="form-grid-2">
            <div className="form-field">
              <label className="form-label">Collection Name</label>
              <input className="form-input" value={collectionName}
                onChange={e => setCollectionName(e.target.value)} placeholder="default" />
            </div>
            <div className="form-field">
              <label className="form-label">Label Column <span className="label-sub">추천 결과로 반환될 값</span></label>
              {columns.length > 0
                ? <select className="form-input" value={labelColumn} onChange={e => setLabelColumn(e.target.value)}>
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                : <input className="form-input" value={labelColumn} onChange={e => setLabelColumn(e.target.value)}
                    placeholder="파일 선택 후 자동 감지" />
              }
            </div>
          </div>

          {columns.length > 0 && (
            <div className="form-field mt-12">
              <label className="form-label">
                Input Columns
                <span className="label-sub">임베딩할 컬럼 — 복수 선택 시 조합하여 임베딩</span>
              </label>
              <div className="chip-group">
                {columns.map(col => (
                  <button key={col} type="button"
                    className={`chip ${selectedInputCols.includes(col) ? 'chip-on' : ''}`}
                    onClick={() => toggleInputCol(col)}>
                    {col}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedInputCols.length > 1 && (
            <div className="code-preview mt-8">
              <span className="code-label">Embed format</span>
              <code>{selectedInputCols.map(c => `${c}: {val}`).join(' | ')}</code>
            </div>
          )}
        </div>

        <div className="action-bar">
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <><Spinner /> Indexing...</> : 'Run Indexing'}
          </button>
          {error && <span className="msg-error">⚠ {error}</span>}
          {result && (
            <span className="msg-ok">
              ✓ <strong>{result.indexed_count.toLocaleString()}</strong> vectors indexed
              into <strong>{result.collection}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Recommend Pane ──────────────────────────────────────────────────────────
function RecommendPane() {
  const [mode, setMode] = useState('simple')
  const [text, setText] = useState('')
  const [multiFields, setMultiFields] = useState([{ key: '', value: '' }])
  const [collections, setCollections] = useState([])
  const [collectionName, setCollectionName] = useState('')
  const [topK, setTopK] = useState(5)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API}/collections`)
      .then(r => r.json())
      .then(data => {
        const names = (data.collections || []).map(c => c.name)
        setCollections(names)
        if (names.length > 0) setCollectionName(names[0])
      })
      .catch(() => {})
  }, [])

  const buildQuery = () => mode === 'simple'
    ? text
    : multiFields.filter(f => f.key && f.value).map(f => `${f.key}: ${f.value}`).join(' | ')

  const handleSearch = async () => {
    const query = buildQuery()
    if (!query.trim()) { setError('검색어를 입력하세요.'); return }
    setLoading(true); setError(''); setResults([])
    try {
      const res = await fetch(`${API}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query, collection_name: collectionName, top_k: topK }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Search failed')
      setResults(data.recommendations)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const addField    = () => setMultiFields(p => [...p, { key: '', value: '' }])
  const removeField = i  => setMultiFields(p => p.filter((_, idx) => idx !== i))
  const updateField = (i, k, v) => setMultiFields(p => p.map((f, idx) => idx === i ? { ...f, [k]: v } : f))

  const maxScore = results[0]?.score ?? 1

  return (
    <div className="pane">
      <div className="pane-header">
        <div>
          <h2 className="pane-title">Similarity Search</h2>
          <p className="pane-desc">쿼리 텍스트와 유사한 항목을 벡터 DB에서 검색합니다.</p>
        </div>
        <div className="header-controls">
          <div className="ctrl-group">
            <label className="form-label">Collection</label>
            {collections.length > 0
              ? <select className="form-input" value={collectionName} onChange={e => setCollectionName(e.target.value)}>
                  {collections.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              : <input className="form-input" value={collectionName} onChange={e => setCollectionName(e.target.value)}
                  placeholder="No collections" style={{ width: 140 }} />
            }
          </div>
          <div className="ctrl-group">
            <label className="form-label">Top K</label>
            <select className="form-input" value={topK} onChange={e => setTopK(Number(e.target.value))} style={{ width: 64 }}>
              {[1,2,3,5,7,10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="pane-body">
        <div className="section">
          <div className="mode-bar">
            <button className={`mode-btn ${mode === 'simple' ? 'active' : ''}`} onClick={() => setMode('simple')}>Free Text</button>
            <button className={`mode-btn ${mode === 'multi'  ? 'active' : ''}`} onClick={() => setMode('multi')}>Structured Fields</button>
          </div>

          {mode === 'simple'
            ? <textarea className="query-box"
                placeholder={"쿼리 텍스트 입력...\n\n복수 컬럼 포맷:\n기안자: 홍길동 | 기안부서: 인사팀 | 양식명: 휴가신청서\n\nCtrl+Enter 로 검색"}
                value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && e.ctrlKey && handleSearch()}
                rows={5}
              />
            : <div className="multi-fields">
                {multiFields.map((f, i) => (
                  <div key={i} className="multi-row">
                    <input className="form-input mkey" placeholder="Field name" value={f.key} onChange={e => updateField(i, 'key', e.target.value)} />
                    <span className="colon">:</span>
                    <input className="form-input mval" placeholder="Value" value={f.value} onChange={e => updateField(i, 'value', e.target.value)} />
                    {multiFields.length > 1 &&
                      <button className="btn-rm" onClick={() => removeField(i)}>✕</button>}
                  </div>
                ))}
                <button className="btn-ghost" onClick={addField}>+ Add field</button>
                {buildQuery() && (
                  <div className="code-preview">
                    <span className="code-label">Query</span>
                    <code>{buildQuery()}</code>
                  </div>
                )}
              </div>
          }

          <div className="action-bar mt-12">
            <button className="btn-primary" onClick={handleSearch} disabled={loading}>
              {loading ? <><Spinner /> Searching...</> : 'Search'}
            </button>
            {error && <span className="msg-error">⚠ {error}</span>}
          </div>
        </div>

        {results.length > 0 && (
          <div className="section">
            <div className="section-label">{results.length} Results</div>
            <div className="result-list">
              {results.map((item, i) => {
                const pct = (item.score * 100).toFixed(1)
                const rel = item.score / maxScore
                return (
                  <div key={i} className="result-row">
                    <div className="result-rank">#{i + 1}</div>
                    <div className="result-body">
                      <div className="result-top">
                        <span className="result-label">{item.label}</span>
                        <span className="result-score">{pct}%</span>
                      </div>
                      <div className="result-bar-track">
                        <div className="result-bar-fill" style={{ width: `${rel * 100}%` }} />
                      </div>
                      <div className="result-origin">{item.original_text}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Collections Pane ────────────────────────────────────────────────────────
function CollectionsPane() {
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchCollections = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/collections`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Fetch failed')
      setCollections(data.collections)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCollections() }, [fetchCollections])

  const handleDelete = async name => {
    if (!confirm(`Delete collection "${name}"?`)) return
    try {
      const res = await fetch(`${API}/collections/${name}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail) }
      setCollections(p => p.filter(c => c.name !== name))
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="pane">
      <div className="pane-header">
        <div>
          <h2 className="pane-title">Collections</h2>
          <p className="pane-desc">Qdrant에 등록된 벡터 컬렉션 목록입니다.</p>
        </div>
        <button className="btn-secondary" onClick={fetchCollections} disabled={loading}>
          <IconRefresh /> Refresh
        </button>
      </div>

      <div className="pane-body">
        {error && <div className="alert-error">⚠ {error}</div>}

        <div className="coll-table">
          <div className="coll-head">
            <div className="coll-th th-name">Name</div>
            <div className="coll-th th-num">Vectors</div>
            <div className="coll-th th-num">Dimension</div>
            <div className="coll-th th-act"></div>
          </div>

          {loading ? (
            <div className="coll-state"><Spinner /> Loading...</div>
          ) : collections.length === 0 ? (
            <div className="coll-state">No collections found. Upload a CSV to create one.</div>
          ) : (
            collections.map(col => (
              <div key={col.name} className="coll-row">
                <div className="coll-td th-name">
                  <span className="coll-dot" />
                  <span className="coll-name">{col.name}</span>
                </div>
                <div className="coll-td th-num mono">{col.vectors_count.toLocaleString()}</div>
                <div className="coll-td th-num mono">{col.dimension}</div>
                <div className="coll-td th-act">
                  <button className="btn-trash" onClick={() => handleDelete(col.name)} title="Delete">
                    <IconTrash />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ── Chat Pane ───────────────────────────────────────────────────────────────
function ChatPane() {
  const [collections, setCollections] = useState([])
  const [models, setModels]           = useState([])
  const [collection, setCollection]   = useState('')
  const [model, setModel]             = useState('')
  const [topK, setTopK]               = useState(5)
  const [question, setQuestion]       = useState('')
  const [history, setHistory]         = useState([])  // [{role, content, sources?}]
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const bottomRef                     = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, loading])

  useEffect(() => {
    fetch(`${API}/collections`)
      .then(r => r.json())
      .then(d => {
        const names = (d.collections || []).map(c => c.name)
        setCollections(names)
        if (names.length > 0) setCollection(names[0])
      }).catch(() => {})

    fetch(`${API}/chat/models`)
      .then(r => r.json())
      .then(d => {
        setModels(d.models || [])
        if (d.models?.length > 0) setModel(d.models[0])
      }).catch(() => {})
  }, [])

  const handleSend = async () => {
    if (!question.trim()) return
    const q = question.trim()
    setQuestion('')
    setError('')
    setHistory(h => [...h, { role: 'user', content: q }])
    setLoading(true)
    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, collection_name: collection, top_k: topK, model }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Chat failed')
      setHistory(h => [...h, { role: 'assistant', content: data.answer, sources: data.sources }])
    } catch (e) {
      setError(e.message)
      setHistory(h => [...h, { role: 'error', content: e.message }])
    } finally { setLoading(false) }
  }

  return (
    <div className="pane">
      <div className="pane-header">
        <div>
          <h2 className="pane-title">RAG Chat</h2>
          <p className="pane-desc">Qdrant 검색 결과를 컨텍스트로 Ollama LLM이 자연어로 답변합니다.</p>
        </div>
        <div className="header-controls">
          <div className="ctrl-group">
            <label className="form-label">Collection</label>
            {collections.length > 0
              ? <select className="form-input" value={collection} onChange={e => setCollection(e.target.value)}>
                  {collections.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              : <input className="form-input" value={collection} onChange={e => setCollection(e.target.value)} placeholder="없음" style={{ width: 120 }} />
            }
          </div>
          <div className="ctrl-group">
            <label className="form-label">Model</label>
            {models.length > 0
              ? <select className="form-input" value={model} onChange={e => setModel(e.target.value)}>
                  {models.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              : <input className="form-input" value={model} onChange={e => setModel(e.target.value)} placeholder="qwen3:1.7b" style={{ width: 120 }} />
            }
          </div>
          <div className="ctrl-group">
            <label className="form-label">Top K</label>
            <select className="form-input" value={topK} onChange={e => setTopK(Number(e.target.value))} style={{ width: 64 }}>
              {[3,5,7,10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="pane-body">
        {/* 채팅 히스토리 */}
        <div className="chat-history">
          {history.length === 0 && (
            <div className="chat-empty">
              <div className="chat-empty-icon">◈</div>
              <div className="chat-empty-text">질문을 입력하면 Qdrant에서 관련 데이터를 찾아 LLM이 답변합니다.</div>
            </div>
          )}
          {history.map((msg, i) => (
            <div key={i} className={`chat-msg chat-${msg.role}`}>
              <div className="chat-role">{msg.role === 'user' ? 'You' : msg.role === 'assistant' ? model || 'Assistant' : 'Error'}</div>
              <div className="chat-content">{msg.content}</div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="chat-sources">
                  <div className="sources-label">References ({msg.sources.length})</div>
                  <ul className="sources-list">
                    {msg.sources.map((s, j) => <li key={j}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="chat-msg chat-assistant">
              <div className="chat-role">{model || 'Assistant'}</div>
              <div className="chat-thinking"><Spinner /> 생각 중...</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* 입력창 */}
        <div className="chat-input-wrap">
          {error && <div className="alert-error" style={{ marginBottom: 8 }}>⚠ {error}</div>}
          <div className="chat-input-row">
            <textarea
              className="chat-input"
              placeholder="질문을 입력하세요... (Enter로 전송, Shift+Enter 줄바꿈)"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!loading) handleSend() }
              }}
              rows={3}
              disabled={loading}
            />
            <button className="btn-send" onClick={handleSend} disabled={loading || !question.trim()}>
              {loading ? <Spinner /> : '↑'}
            </button>
          </div>
          {history.length > 0 && (
            <button className="btn-ghost" style={{ marginTop: 8 }} onClick={() => setHistory([])}>
              대화 초기화
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Root ─────────────────────────────────────────────────────────────────────
const NAV = [
  { label: 'Upload',      Icon: IconUpload },
  { label: 'Recommend',   Icon: IconSearch },
  { label: 'Collections', Icon: IconDB },
  { label: 'Chat',        Icon: IconChat  },
]

export default function App() {
  const [active, setActive] = useState(0)
  const [apiOk, setApiOk] = useState(null)

  useEffect(() => {
    fetch(`${API}/health`)
      .then(r => setApiOk(r.ok))
      .catch(() => setApiOk(false))
  }, [])

  return (
    <div className="shell">
      <header className="topbar">
        <span className="brand">quickrec</span>
        <span className="brand-slash">/</span>
        <span className="brand-sub">Vector Recommendation Engine</span>
        <div className="topbar-right">
          {apiOk !== null && <StatusBadge ok={apiOk} />}
        </div>
      </header>

      <div className="workspace">
        <nav className="sidebar">
          <div className="nav-section-label">Menu</div>
          {NAV.map(({ label, Icon }, i) => (
            <button key={label} className={`nav-item ${active === i ? 'active' : ''}`}
              onClick={() => setActive(i)}>
              <Icon />
              <span>{label}</span>
            </button>
          ))}
          <div className="sidebar-bottom">
            <span className="sidebar-ver">v0.1.0</span>
          </div>
        </nav>

        <main className="content">
          {active === 0 && <UploadPane />}
          {active === 1 && <RecommendPane />}
          {active === 2 && <CollectionsPane />}
          {active === 3 && <ChatPane />}
        </main>
      </div>
    </div>
  )
}
