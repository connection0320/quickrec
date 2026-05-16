import { useState, useEffect, useCallback } from 'react'
import './App.css'

const API = 'http://localhost:8000'

function Spinner() {
  return <div className="spinner" />
}

function ErrorMsg({ msg }) {
  return msg ? <div className="error-msg">⚠ {msg}</div> : null
}

// ── Upload Tab ──────────────────────────────────────────────────────────────

function UploadTab() {
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [collectionName, setCollectionName] = useState('default')
  const [inputColumn, setInputColumn] = useState('question')
  const [labelColumn, setLabelColumn] = useState('category')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) setFile(dropped)
  }, [])

  const handleSubmit = async () => {
    if (!file) { setError('CSV 파일을 선택해주세요.'); return }
    setLoading(true); setError(''); setResult(null)
    const form = new FormData()
    form.append('file', file)
    form.append('collection_name', collectionName)
    form.append('input_column', inputColumn)
    form.append('label_column', labelColumn)
    try {
      const res = await fetch(`${API}/upload`, { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || '업로드 실패')
      setResult(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="tab-content">
      <div
        className={`dropzone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
      >
        <input
          id="file-input" type="file" accept=".csv"
          style={{ display: 'none' }}
          onChange={(e) => setFile(e.target.files[0])}
        />
        {file
          ? <><span className="drop-icon">📄</span><span className="drop-label">{file.name}</span></>
          : <><span className="drop-icon">⬆</span><span className="drop-label">CSV 파일을 드래그하거나 클릭해서 선택</span></>
        }
      </div>

      <div className="field-row">
        <label>Collection Name</label>
        <input value={collectionName} onChange={e => setCollectionName(e.target.value)} />
      </div>
      <div className="field-row">
        <label>Input Column</label>
        <input value={inputColumn} onChange={e => setInputColumn(e.target.value)} />
      </div>
      <div className="field-row">
        <label>Label Column</label>
        <input value={labelColumn} onChange={e => setLabelColumn(e.target.value)} />
      </div>

      <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
        {loading ? <Spinner /> : '업로드 & 인덱싱'}
      </button>

      <ErrorMsg msg={error} />
      {result && (
        <div className="success-msg">
          ✅ <strong>{result.collection}</strong> 컬렉션에 {result.indexed_count}개 데이터 인덱싱 완료
        </div>
      )}
    </div>
  )
}

// ── Recommend Tab ───────────────────────────────────────────────────────────

function RecommendTab() {
  const [text, setText] = useState('')
  const [collectionName, setCollectionName] = useState('default')
  const [topK, setTopK] = useState(3)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!text.trim()) { setError('검색어를 입력해주세요.'); return }
    setLoading(true); setError(''); setResults([])
    try {
      const res = await fetch(`${API}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, collection_name: collectionName, top_k: topK }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || '추천 실패')
      setResults(data.recommendations)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const maxScore = results.length > 0 ? results[0].score : 1

  return (
    <div className="tab-content">
      <textarea
        className="query-input"
        placeholder="추천받을 텍스트를 입력하세요..."
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && e.ctrlKey && handleSearch()}
        rows={3}
      />

      <div className="field-row">
        <label>Collection Name</label>
        <input value={collectionName} onChange={e => setCollectionName(e.target.value)} />
      </div>
      <div className="field-row slider-row">
        <label>Top K — <strong>{topK}</strong></label>
        <input type="range" min={1} max={10} value={topK} onChange={e => setTopK(Number(e.target.value))} />
      </div>

      <button className="btn-primary" onClick={handleSearch} disabled={loading}>
        {loading ? <Spinner /> : '추천 검색'}
      </button>

      <ErrorMsg msg={error} />

      {results.length > 0 && (
        <div className="rec-list">
          {results.map((item, i) => {
            const emphasis = item.score / maxScore
            return (
              <div
                key={i}
                className="rec-card"
                style={{ borderColor: `rgba(99,102,241,${0.3 + emphasis * 0.7})` }}
              >
                <div className="rec-header">
                  <span className="rec-label">{item.label}</span>
                  <span className="rec-score" style={{ color: `rgba(99,102,241,${0.5 + emphasis * 0.5})` }}>
                    {(item.score * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="rec-text">{item.original_text}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Collections Tab ─────────────────────────────────────────────────────────

function CollectionsTab() {
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchCollections = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/collections`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || '조회 실패')
      setCollections(data.collections)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCollections() }, [fetchCollections])

  const handleDelete = async (name) => {
    if (!confirm(`"${name}" 컬렉션을 삭제할까요?`)) return
    try {
      const res = await fetch(`${API}/collections/${name}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail) }
      setCollections(prev => prev.filter(c => c !== name))
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="tab-content">
      <div className="col-header">
        <h3>컬렉션 목록</h3>
        <button className="btn-secondary" onClick={fetchCollections} disabled={loading}>
          {loading ? <Spinner /> : '↻ 새로고침'}
        </button>
      </div>
      <ErrorMsg msg={error} />
      {collections.length === 0 && !loading && (
        <p className="empty-msg">등록된 컬렉션이 없습니다.</p>
      )}
      <ul className="col-list">
        {collections.map(name => (
          <li key={name} className="col-item">
            <span className="col-name">🗂 {name}</span>
            <button className="btn-danger" onClick={() => handleDelete(name)}>삭제</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Root App ─────────────────────────────────────────────────────────────────

const TABS = ['Upload', 'Recommend', 'Collections']

export default function App() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div className="app">
      <header className="header">
        <div className="logo">quickrec</div>
        <p className="tagline">CSV 한 개로 5분 만에 동작하는 온프레미스 추천 API</p>
      </header>

      <main className="main">
        <div className="card">
          <div className="tabs">
            {TABS.map((t, i) => (
              <button
                key={t}
                className={`tab-btn ${activeTab === i ? 'active' : ''}`}
                onClick={() => setActiveTab(i)}
              >
                {t}
              </button>
            ))}
          </div>
          {activeTab === 0 && <UploadTab />}
          {activeTab === 1 && <RecommendTab />}
          {activeTab === 2 && <CollectionsTab />}
        </div>
      </main>
    </div>
  )
}
