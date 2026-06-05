import { useState, useRef } from 'react'
import './App.css'

const API_URL = 'http://localhost:8080'

function App() {
  const [videoSrc, setVideoSrc] = useState(null)
  const [videoName, setVideoName] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState(null)
  const [roomCapacity, setRoomCapacity] = useState('')
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setVideoSrc(URL.createObjectURL(file))
    setVideoName(file.name)
    setVideoFile(file)
    setSummary(null)
    setError(null)
  }

  const handleAnalyse = async () => {
    if (!videoFile) return
    setLoading(true)
    setError(null)
    setSummary(null)

    const formData = new FormData()
    formData.append('video', videoFile)
    if (roomCapacity) formData.append('room_capacity', roomCapacity)

    try {
      const res = await fetch(`${API_URL}/process_video`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setSummary(data.summary)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const peakPerson  = summary?.peak_person  ?? '—'
  const peakMonitor = summary?.peak_monitor ?? '—'
  const peakDiff    = summary?.peak_person !== undefined && summary?.peak_monitor !== undefined
                        ? summary.peak_person - summary.peak_monitor
                        : '—'
  const personStd   = summary?.person_std
  const monitorStd  = summary?.monitor_std
  const status      = summary?.status ?? '—'
  const utilisation = summary?.utilisation
  const roomCap     = summary?.room_capacity
  const eventLog    = summary?.event_log ?? []
  const framesProcessed = summary?.total_frames_processed

  const statusColor = status === 'Over Capacity'
    ? '#e63946'
    : status === 'Within Capacity'
    ? '#2d9e5f'
    : '#4b5563'

  return (
    <div className="app">
      <header>
        <h1>ClassVision</h1>
        <span>by CapacityAI</span>
      </header>

      <main>
        <div className="video-area">
          {videoSrc
            ? <video src={videoSrc} controls />
            : <p>No video uploaded</p>
          }
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <div className="capacity-input-row">
          <label htmlFor="capacity">Known room capacity (optional)</label>
          <input
            id="capacity"
            type="number"
            min="1"
            placeholder="e.g. 40"
            value={roomCapacity}
            onChange={(e) => setRoomCapacity(e.target.value)}
            className="capacity-input"
          />
        </div>

        <div className="button-row">
          <button onClick={() => fileInputRef.current.click()}>
            Upload Video
          </button>
          {videoFile && (
            <button
              onClick={handleAnalyse}
              disabled={loading}
              className="analyse-btn"
            >
              {loading ? 'Analysing…' : 'Analyse'}
            </button>
          )}
        </div>

        {videoName && <p className="file-name">{videoName}</p>}
        {error && <p className="error-msg">Error: {error}</p>}

        <div className="counters">
          <div className="counter">
            <span>Peak People</span>
            <strong>{peakPerson}</strong>
          </div>
          <div className="counter">
            <span>Peak Monitors</span>
            <strong>{peakMonitor}</strong>
          </div>
          <div className="counter">
            <span>Peak Difference</span>
            <strong>{peakDiff}</strong>
          </div>
        </div>

        <div className="summary">
          <p>Status: <strong style={{ color: statusColor }}>{status}</strong></p>

          {utilisation !== null && utilisation !== undefined && (
            <p>
              Room Utilisation:{' '}
              <strong style={{ color: utilisation > 100 ? '#e63946' : utilisation > 80 ? '#f4a261' : '#2d9e5f' }}>
                {utilisation}%
              </strong>
              {roomCap && <span className="cap-note"> of {roomCap} seats</span>}
            </p>
          )}

          {personStd !== undefined && monitorStd !== undefined && (
            <p className="uncertainty-inline">
              Detection uncertainty: People ±{personStd} · Monitors ±{monitorStd}
            </p>
          )}

          <p className="uncertainty-note">
            Monitor detection has inherent uncertainty due to occlusion and camera angle.
            Counts reflect peak values across {framesProcessed ?? '—'} sampled frames.
          </p>

          {/* <div className="timeline-log">
            <p className="log-title">Event Log</p>
            <ul>
              {eventLog.length > 0
                ? eventLog.map((e, i) => <li key={i}>{e}</li>)
                : <li>No capacity events recorded</li>
              }
            </ul>
          </div> */}
        </div>
      </main>
    </div>
  )
}

export default App


























// import { useState, useRef } from 'react'
// import './App.css'

// function App() {
//   const [videoSrc, setVideoSrc] = useState(null)
//   const [videoName, setVideoName] = useState(null)
//   const fileInputRef = useRef(null)

//   const handleFileChange = (e) => {
//     const file = e.target.files[0]
//     if (!file) return
//     setVideoSrc(URL.createObjectURL(file))
//     setVideoName(file.name)
//   }

//   return (
//     <div className="app">
//       <header>
//         <h1>ClassVision</h1>
//         <span>by CapacityAI</span>
//       </header>

//       <main>
//         {/* Video area */}
//         <div className="video-area">
//           {videoSrc
//             ? <video src={videoSrc} controls />
//             : <p>No video uploaded</p>
//           }
//         </div>

//         {/* Upload */}
//         <input
//           ref={fileInputRef}
//           type="file"
//           accept="video/*"
//           onChange={handleFileChange}
//           style={{ display: 'none' }}
//         />
//         <button onClick={() => fileInputRef.current.click()}>
//           Upload Video
//         </button>
//         {videoName && <p>{videoName}</p>}

//         {/* Counters */}
//         <div className="counters">
//           <div className="counter">
//             <span>People</span>
//             <strong>—</strong>
//           </div>
//           <div className="counter">
//             <span>Monitor</span>
//             <strong>—</strong>
//           </div>
//           <div className="counter">
//             <span>Difference</span>
//             <strong>—</strong>
//           </div>
//         </div>
        
//         {/* Summary */}
//         <div className="summary">
//           <p>Status: <strong>—</strong></p>
//           <p>Peak Person Count: <strong>—</strong></p>
//           <p>Peak Monitor Count: <strong>—</strong></p>
          
//           <div className="timeline-log">
//             <p className="log-title">Event Log</p>
//             <ul>
//               <li>00:12 — Person count exceeded monitor count</li>
//               <li>01:45 — Capacity restored</li>
//             </ul>
//           </div>
//         </div>
//       </main>
//     </div>
//   )
// }

// export default App