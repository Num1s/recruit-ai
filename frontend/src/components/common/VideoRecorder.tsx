import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button, Progress, message } from 'antd';
import { PlayCircleOutlined, StopOutlined, PauseCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import Webcam from 'react-webcam';

interface VideoRecorderProps {
  onRecordingStart?: () => void;
  onRecordingStop?: (blob: Blob) => void;
  onRecordingPause?: () => void;
  onRecordingResume?: () => void;
  isRecording?: boolean;
  isPaused?: boolean;
  width?: number | string;
  height?: number | string;
  className?: string;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  blob?: Blob;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({
  onRecordingStart,
  onRecordingStop,
  onRecordingPause,
  onRecordingResume,
  isRecording = false,
  isPaused = false,
  width = '100%',
  height = '100%',
  className = ''
}) => {
  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const recordingStartTime = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0
  });

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  // Проверяем разрешения и получаем поток
  useEffect(() => {
    const getMediaStream = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setStream(mediaStream);
        setHasPermission(true);
      } catch (error) {
        console.error('Ошибка доступа к медиа:', error);
        message.error('Не удалось получить доступ к камере и микрофону');
        setHasPermission(false);
      }
    };

    getMediaStream();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Таймер для отслеживания длительности записи
  useEffect(() => {
    if (recordingState.isRecording && !recordingState.isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingState(prev => ({
          ...prev,
          duration: Date.now() - recordingStartTime.current
        }));
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [recordingState.isRecording, recordingState.isPaused]);

  const startRecording = useCallback(() => {
    if (!stream) {
      message.error('Нет доступа к медиа потоку');
      return;
    }

    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorderRef.current = mediaRecorder;
      recordedChunks.current = [];
      recordingStartTime.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
        setRecordingState(prev => ({ ...prev, blob }));
        onRecordingStop?.(blob);
      };

      mediaRecorder.start(1000); // Записываем по 1 секунде

      setRecordingState({
        isRecording: true,
        isPaused: false,
        duration: 0
      });

      onRecordingStart?.();
      message.success('Запись началась');
    } catch (error) {
      console.error('Ошибка начала записи:', error);
      message.error('Не удалось начать запись');
    }
  }, [stream, onRecordingStart, onRecordingStop]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    setRecordingState(prev => ({
      ...prev,
      isRecording: false,
      isPaused: false
    }));

    message.success('Запись остановлена');
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState(prev => ({ ...prev, isPaused: true }));
      onRecordingPause?.();
      message.info('Запись приостановлена');
    }
  }, [onRecordingPause]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState(prev => ({ ...prev, isPaused: false }));
      onRecordingResume?.();
      message.success('Запись возобновлена');
    }
  }, [onRecordingResume]);

  const resetRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.stop();
      }
    }

    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      blob: undefined
    });

    recordedChunks.current = [];
    message.info('Запись сброшена');
  }, []);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!hasPermission) {
    return (
      <div className={`video-recorder-error ${className}`}>
        <p>Нет доступа к камере и микрофону</p>
        <Button type="primary" onClick={() => window.location.reload()}>
          Обновить страницу
        </Button>
      </div>
    );
  }

  return (
    <div className={`video-recorder ${className}`}>
      <div className="video-recorder-preview">
        <Webcam
          ref={webcamRef}
          audio={false} // Аудио обрабатывается через MediaRecorder
          width={width}
          height={height}
          style={{ objectFit: 'cover', borderRadius: '8px' }}
        />
        
        {recordingState.isRecording && (
          <div className="video-recorder-overlay">
            <div className="recording-indicator">
              <div className="recording-dot"></div>
              <span>Запись</span>
            </div>
            <div className="recording-duration">
              {formatDuration(recordingState.duration)}
            </div>
          </div>
        )}
      </div>

      <div className="video-recorder-controls">
        <div className="recording-status">
          {recordingState.isRecording ? (
            <div className="recording-info">
              <Progress
                percent={(recordingState.duration / 60000) * 100} // Прогресс за 1 минуту
                size="small"
                strokeColor="#ff4d4f"
                showInfo={false}
              />
              <span className="recording-time">
                {formatDuration(recordingState.duration)}
              </span>
            </div>
          ) : (
            <span>Готов к записи</span>
          )}
        </div>

        <div className="recording-buttons">
          {!recordingState.isRecording ? (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={startRecording}
              size="large"
            >
              Начать запись
            </Button>
          ) : (
            <div className="recording-controls">
              {recordingState.isPaused ? (
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={resumeRecording}
                  size="small"
                >
                  Продолжить
                </Button>
              ) : (
                <Button
                  icon={<PauseCircleOutlined />}
                  onClick={pauseRecording}
                  size="small"
                >
                  Пауза
                </Button>
              )}
              
              <Button
                danger
                icon={<StopOutlined />}
                onClick={stopRecording}
                size="small"
              >
                Стоп
              </Button>
              
              <Button
                icon={<ReloadOutlined />}
                onClick={resetRecording}
                size="small"
              >
                Сброс
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoRecorder;
