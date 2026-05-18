import { useState, useRef } from 'react'
import './App.css'

function App() {
  const [videoSrc, setVideoSrc] = useState(null)
  const [videoName, setVideoName] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setVideoSrc(URL.createObjectURL(file))
    setVideoName(file.name)
  }

  return (
    <div className="app">
      <header>
        <h1>ClassVision</h1>
        <span>by CapacityAI</span>
      </header>

      <main>
        {/* Video area */}
        <div className="video-area">
          {videoSrc
            ? <video src={videoSrc} controls />
            : <p>No video uploaded</p>
          }
        </div>

        {/* Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button onClick={() => fileInputRef.current.click()}>
          Upload Video
        </button>
        {videoName && <p>{videoName}</p>}

        {/* Counters */}
        <div className="counters">
          <div className="counter">
            <span>People</span>
            <strong>—</strong>
          </div>
          <div className="counter">
            <span>Monitor</span>
            <strong>—</strong>
          </div>
          <div className="counter">
            <span>Difference</span>
            <strong>—</strong>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App