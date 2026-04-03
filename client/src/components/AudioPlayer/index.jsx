import { useEffect, useRef } from 'react';

function AudioPlayer({ audioBase64, autoPlay, onEnded }) {
  const audioRef = useRef(null);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    if (!audioBase64 || !audioRef.current) return;

    hasPlayedRef.current = false;

    if (autoPlay) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn('Audio autoplay blocked:', error.message);
        });
      }
    }
  }, [audioBase64, autoPlay]);

  const handleEnded = () => {
    hasPlayedRef.current = true;
    if (onEnded) {
      onEnded();
    }
  };

  if (!audioBase64) {
    return null;
  }

  return (
    <div className="audio-player-shell">
      <audio
        ref={audioRef}
        className="audio-player-element"
        src={`data:audio/mpeg;base64,${audioBase64}`}
        controls
        onEnded={handleEnded}
        controlsList="nodownload noplaybackrate"
        preload="auto"
      />
    </div>
  );
}

export default AudioPlayer;
