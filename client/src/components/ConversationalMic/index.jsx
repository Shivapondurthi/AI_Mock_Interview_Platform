import { useState, useEffect } from 'react';
import { BsMicFill } from 'react-icons/bs';
import './index.css';

const SILENCE_TIMEOUT = 3000;

function ConversationalMic({ onTranscriptReady, onAutoSubmit, disabled }) {
  const [isListening, setIsListening] = useState(false);
  const [liveText, setLiveText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState(null);
  const [recognition, setRecognition] = useState(null);
  const [silenceTimer, setSilenceTimer] = useState(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recog = new SpeechRecognition();
    recog.continuous = true;
    recog.interimResults = true;

    recog.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i].transcript;

        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      if (final) {
        setFinalText((prev) => prev + final);
        clearSilenceTimer();
        startSilenceTimer();
      }

      setLiveText(interim);
      if (onTranscriptReady && (final || interim)) {
        onTranscriptReady(final + interim);
      }
    };

    recog.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };

    recog.onend = () => {
      setIsListening(false);
    };

    setRecognition(recog);

    return () => {
      if (recog) {
        recog.stop();
      }
    };
  }, [onTranscriptReady]);

  useEffect(() => {
    if (recognition && !isListening && !finalText && !autoSubmitCountdown) {
      startListening();
    }
  }, [recognition, isListening, finalText, autoSubmitCountdown]);

  const clearSilenceTimer = () => {
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      setSilenceTimer(null);
    }
  };

  const startSilenceTimer = () => {
    clearSilenceTimer();
    let countdown = 3;
    setAutoSubmitCountdown(countdown);

    const timer = setInterval(() => {
      countdown -= 1;
      setAutoSubmitCountdown(countdown);

      if (countdown === 0) {
        clearInterval(timer);
        handleAutoSubmit();
      }
    }, 1000);

    setSilenceTimer(timer);
  };

  const startListening = () => {
    if (recognition && !isListening) {
      recognition.start();
      setIsListening(true);
      clearSilenceTimer();
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const handleAutoSubmit = () => {
    clearSilenceTimer();
    const fullText = (finalText + ' ' + liveText).trim();
    if (onAutoSubmit && fullText) {
      onAutoSubmit(fullText);
    }
  };

  const handleManualSubmit = () => {
    stopListening();
    const fullText = (finalText + ' ' + liveText).trim();
    if (onTranscriptReady) {
      onTranscriptReady(fullText);
    }
  };

  const handleRestart = () => {
    setFinalText('');
    setLiveText('');
    setAutoSubmitCountdown(null);
    clearSilenceTimer();
    if (recognition) {
      recognition.start();
      setIsListening(true);
    }
  };

  const displayText = (finalText + ' ' + liveText).trim();

  if (!isSupported) {
    return (
      <div className="cm-unsupported">
        <p className="cm-unsupported-text">
          Voice recognition is not supported in this browser. Please use Chrome
          or Edge.
        </p>
      </div>
    );
  }

  return (
    <div className="cm-container">
      <div className="cm-mic-button-wrapper">
        <button
          className={`cm-mic-button ${isListening ? 'cm-mic-active' : ''} ${disabled ? 'cm-mic-button-disabled' : ''}`}
          onClick={isListening ? stopListening : startListening}
          disabled={disabled}
        >
          <BsMicFill className="cm-mic-icon" />
        </button>
      </div>

      <div className="cm-status">
        {isListening && !displayText && (
          <p className="cm-status-listening">Listening...</p>
        )}
        {isListening && displayText && !autoSubmitCountdown && (
          <p className="cm-status-listening">Hearing you...</p>
        )}
        {autoSubmitCountdown && (
          <p className="cm-status-countdown">
            Submitting in {autoSubmitCountdown}s...{' '}
            <button
              className="cm-keep-talking-btn"
              onClick={() => {
                clearSilenceTimer();
                startListening();
              }}
            >
              Keep talking
            </button>
          </p>
        )}
        {!isListening && displayText && (
          <p className="cm-status-done">Done</p>
        )}
        {!isListening && !displayText && (
          <p className="cm-status-ready">Ready to listen</p>
        )}
      </div>

      {displayText && (
        <div className="cm-transcript-box">
          <span className="cm-transcript-final">{finalText}</span>
          {liveText && (
            <span className="cm-transcript-interim">{liveText}</span>
          )}
        </div>
      )}

      <div className="cm-controls">
        {isListening ? (
          <button
            className={`cm-submit-btn ${!displayText ? 'cm-submit-btn-disabled' : ''}`}
            onClick={handleManualSubmit}
            disabled={!displayText}
          >
            Submit Answer
          </button>
        ) : displayText ? (
          <div className="cm-done-actions">
            <button className="cm-speak-again-btn" onClick={handleRestart}>
              Speak Again
            </button>
            <button className="cm-submit-btn" onClick={handleManualSubmit}>
              Submit Answer
            </button>
          </div>
        ) : (
          <button
            className={`cm-start-btn ${disabled ? 'cm-start-btn-disabled' : ''}`}
            onClick={startListening}
            disabled={disabled}
          >
            Start listening
          </button>
        )}
      </div>
    </div>
  );
}

export default ConversationalMic;
