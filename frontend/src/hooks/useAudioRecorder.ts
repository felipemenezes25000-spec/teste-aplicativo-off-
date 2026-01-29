/**
 * 🎤 Audio Recorder Hook
 * Gravar e enviar áudio no chat (como WhatsApp)
 */

import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';

interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // em segundos
  uri: string | null;
  error: string | null;
}

export function useAudioRecorder() {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    uri: null,
    error: null,
  });

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Pedir permissão de microfone
  const requestPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setState(s => ({ ...s, error: 'Permissão de microfone negada' }));
        return false;
      }
      return true;
    } catch (error) {
      setState(s => ({ ...s, error: 'Erro ao pedir permissão' }));
      return false;
    }
  };

  // Iniciar gravação
  const startRecording = useCallback(async () => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) return false;

      // Configurar modo de áudio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Criar e iniciar gravação
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      await recording.startAsync();
      recordingRef.current = recording;

      // Timer para duração
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setState(s => ({ ...s, duration: seconds }));
      }, 1000);

      setState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        uri: null,
        error: null,
      });

      return true;
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      setState(s => ({ ...s, error: 'Erro ao iniciar gravação' }));
      return false;
    }
  }, []);

  // Pausar gravação
  const pauseRecording = useCallback(async () => {
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.pauseAsync();
      setState(s => ({ ...s, isPaused: true }));
    } catch (error) {
      console.error('Erro ao pausar:', error);
    }
  }, []);

  // Resumir gravação
  const resumeRecording = useCallback(async () => {
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.startAsync();
      setState(s => ({ ...s, isPaused: false }));
    } catch (error) {
      console.error('Erro ao resumir:', error);
    }
  }, []);

  // Parar gravação
  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!recordingRef.current) return null;

    try {
      // Parar timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Parar gravação
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      // Restaurar modo de áudio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      setState(s => ({
        ...s,
        isRecording: false,
        isPaused: false,
        uri,
      }));

      return uri;
    } catch (error) {
      console.error('Erro ao parar gravação:', error);
      setState(s => ({ ...s, error: 'Erro ao parar gravação', isRecording: false }));
      return null;
    }
  }, []);

  // Cancelar gravação
  const cancelRecording = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {}
      recordingRef.current = null;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      uri: null,
      error: null,
    });
  }, []);

  // Formatar duração
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    ...state,
    formattedDuration: formatDuration(state.duration),
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
  };
}

// ============== AUDIO PLAYER HOOK ==============

interface AudioPlayerState {
  isPlaying: boolean;
  duration: number;
  position: number;
  isLoaded: boolean;
}

export function useAudioPlayer() {
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    duration: 0,
    position: 0,
    isLoaded: false,
  });

  const soundRef = useRef<Audio.Sound | null>(null);

  // Carregar áudio
  const loadAudio = useCallback(async (uri: string) => {
    try {
      // Descarregar anterior
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        (status) => {
          if (status.isLoaded) {
            setState(s => ({
              ...s,
              isLoaded: true,
              duration: status.durationMillis ? status.durationMillis / 1000 : 0,
              position: status.positionMillis ? status.positionMillis / 1000 : 0,
              isPlaying: status.isPlaying,
            }));
          }
        }
      );

      soundRef.current = sound;
      return true;
    } catch (error) {
      console.error('Erro ao carregar áudio:', error);
      return false;
    }
  }, []);

  // Play
  const play = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.playAsync();
    } catch (error) {
      console.error('Erro ao tocar:', error);
    }
  }, []);

  // Pause
  const pause = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.pauseAsync();
    } catch (error) {
      console.error('Erro ao pausar:', error);
    }
  }, []);

  // Seek
  const seek = useCallback(async (positionSeconds: number) => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.setPositionAsync(positionSeconds * 1000);
    } catch (error) {
      console.error('Erro ao buscar posição:', error);
    }
  }, []);

  // Unload
  const unload = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setState({
      isPlaying: false,
      duration: 0,
      position: 0,
      isLoaded: false,
    });
  }, []);

  return {
    ...state,
    loadAudio,
    play,
    pause,
    seek,
    unload,
    togglePlay: state.isPlaying ? pause : play,
  };
}
