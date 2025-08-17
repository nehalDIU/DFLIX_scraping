'use client';

import { useState, useEffect, useRef } from 'react';

interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  src: string;
  format: 'srt' | 'vtt' | 'ass' | 'ssa';
  default?: boolean;
}

interface SubtitleCue {
  start: number;
  end: number;
  text: string;
  style?: {
    color?: string;
    fontSize?: string;
    fontFamily?: string;
    position?: string;
    alignment?: string;
  };
}

interface SubtitleManagerProps {
  videoElement: HTMLVideoElement | null;
  subtitleTracks: SubtitleTrack[];
  onTrackChange?: (trackId: string | null) => void;
}

export default function SubtitleManager({ videoElement, subtitleTracks, onTrackChange }: SubtitleManagerProps) {
  const [activeTrack, setActiveTrack] = useState<string | null>(null);
  const [currentCue, setCurrentCue] = useState<SubtitleCue | null>(null);
  const [subtitleData, setSubtitleData] = useState<Map<string, SubtitleCue[]>>(new Map());
  const [subtitleSettings, setSubtitleSettings] = useState({
    fontSize: '16px',
    fontFamily: 'Arial, sans-serif',
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    position: 'bottom',
    enabled: true
  });

  const subtitleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      updateCurrentCue();
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoElement, activeTrack, subtitleData]);

  useEffect(() => {
    // Load subtitle data for all tracks
    subtitleTracks.forEach(track => {
      if (!subtitleData.has(track.id)) {
        loadSubtitleTrack(track);
      }
    });
  }, [subtitleTracks]);

  const loadSubtitleTrack = async (track: SubtitleTrack) => {
    try {
      const response = await fetch(track.src);
      const text = await response.text();
      const cues = parseSubtitleFile(text, track.format);
      
      setSubtitleData(prev => new Map(prev.set(track.id, cues)));
    } catch (error) {
      console.error(`Failed to load subtitle track ${track.id}:`, error);
    }
  };

  const parseSubtitleFile = (content: string, format: SubtitleTrack['format']): SubtitleCue[] => {
    switch (format) {
      case 'srt':
        return parseSRT(content);
      case 'vtt':
        return parseVTT(content);
      case 'ass':
      case 'ssa':
        return parseASS(content);
      default:
        return [];
    }
  };

  const parseSRT = (content: string): SubtitleCue[] => {
    const cues: SubtitleCue[] = [];
    const blocks = content.trim().split(/\n\s*\n/);

    blocks.forEach(block => {
      const lines = block.trim().split('\n');
      if (lines.length >= 3) {
        const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/);
        
        if (timeMatch) {
          const start = parseTime(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4]);
          const end = parseTime(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8]);
          const text = lines.slice(2).join('\n').replace(/<[^>]*>/g, ''); // Remove HTML tags
          
          cues.push({ start, end, text });
        }
      }
    });

    return cues;
  };

  const parseVTT = (content: string): SubtitleCue[] => {
    const cues: SubtitleCue[] = [];
    const lines = content.split('\n');
    let i = 0;

    // Skip WEBVTT header
    while (i < lines.length && !lines[i].includes('-->')) {
      i++;
    }

    while (i < lines.length) {
      const line = lines[i].trim();
      
      if (line.includes('-->')) {
        const timeMatch = line.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3}) --> (\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
        
        if (timeMatch) {
          const start = parseTime(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4]);
          const end = parseTime(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8]);
          
          i++;
          const textLines = [];
          while (i < lines.length && lines[i].trim() !== '') {
            textLines.push(lines[i].trim());
            i++;
          }
          
          const text = textLines.join('\n').replace(/<[^>]*>/g, '');
          cues.push({ start, end, text });
        }
      }
      i++;
    }

    return cues;
  };

  const parseASS = (content: string): SubtitleCue[] => {
    const cues: SubtitleCue[] = [];
    const lines = content.split('\n');
    
    let eventsStarted = false;
    let formatLine = '';

    for (const line of lines) {
      if (line.startsWith('[Events]')) {
        eventsStarted = true;
        continue;
      }
      
      if (eventsStarted) {
        if (line.startsWith('Format:')) {
          formatLine = line;
          continue;
        }
        
        if (line.startsWith('Dialogue:')) {
          const cue = parseASSDialogue(line, formatLine);
          if (cue) {
            cues.push(cue);
          }
        }
      }
    }

    return cues;
  };

  const parseASSDialogue = (dialogue: string, format: string): SubtitleCue | null => {
    try {
      const formatFields = format.replace('Format: ', '').split(',').map(f => f.trim());
      const dialogueFields = dialogue.replace('Dialogue: ', '').split(',');
      
      const startIndex = formatFields.indexOf('Start');
      const endIndex = formatFields.indexOf('End');
      const textIndex = formatFields.indexOf('Text');
      
      if (startIndex === -1 || endIndex === -1 || textIndex === -1) {
        return null;
      }
      
      const start = parseASSTime(dialogueFields[startIndex]);
      const end = parseASSTime(dialogueFields[endIndex]);
      const text = dialogueFields.slice(textIndex).join(',').replace(/\\N/g, '\n').replace(/{[^}]*}/g, '');
      
      return { start, end, text };
    } catch (error) {
      return null;
    }
  };

  const parseTime = (hours: string, minutes: string, seconds: string, milliseconds: string): number => {
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds) + parseInt(milliseconds) / 1000;
  };

  const parseASSTime = (timeStr: string): number => {
    const match = timeStr.match(/(\d+):(\d{2}):(\d{2})\.(\d{2})/);
    if (!match) return 0;
    
    return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]) + parseInt(match[4]) / 100;
  };

  const updateCurrentCue = () => {
    if (!videoElement || !activeTrack || !subtitleSettings.enabled) {
      setCurrentCue(null);
      return;
    }

    const currentTime = videoElement.currentTime;
    const cues = subtitleData.get(activeTrack);
    
    if (!cues) {
      setCurrentCue(null);
      return;
    }

    const activeCue = cues.find(cue => currentTime >= cue.start && currentTime <= cue.end);
    setCurrentCue(activeCue || null);
  };

  const handleTrackChange = (trackId: string | null) => {
    setActiveTrack(trackId);
    onTrackChange?.(trackId);
  };

  const handleSettingChange = (setting: string, value: any) => {
    setSubtitleSettings(prev => ({ ...prev, [setting]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Subtitle Controls */}
      <div className="bg-gray-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-white font-medium text-sm">Subtitles</h4>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={subtitleSettings.enabled}
              onChange={(e) => handleSettingChange('enabled', e.target.checked)}
              className="rounded"
            />
            <span className="text-gray-300 text-sm">Enable</span>
          </label>
        </div>

        {/* Track Selection */}
        <div>
          <label className="block text-gray-300 text-sm mb-2">Track:</label>
          <select
            value={activeTrack || ''}
            onChange={(e) => handleTrackChange(e.target.value || null)}
            className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
            disabled={!subtitleSettings.enabled}
          >
            <option value="">None</option>
            {subtitleTracks.map(track => (
              <option key={track.id} value={track.id}>
                {track.label} ({track.language})
              </option>
            ))}
          </select>
        </div>

        {/* Subtitle Settings */}
        {subtitleSettings.enabled && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 text-xs mb-1">Font Size:</label>
              <select
                value={subtitleSettings.fontSize}
                onChange={(e) => handleSettingChange('fontSize', e.target.value)}
                className="w-full bg-gray-700 text-white rounded px-2 py-1 text-xs"
              >
                <option value="12px">Small</option>
                <option value="16px">Medium</option>
                <option value="20px">Large</option>
                <option value="24px">Extra Large</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-xs mb-1">Position:</label>
              <select
                value={subtitleSettings.position}
                onChange={(e) => handleSettingChange('position', e.target.value)}
                className="w-full bg-gray-700 text-white rounded px-2 py-1 text-xs"
              >
                <option value="bottom">Bottom</option>
                <option value="top">Top</option>
                <option value="center">Center</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-xs mb-1">Text Color:</label>
              <input
                type="color"
                value={subtitleSettings.color}
                onChange={(e) => handleSettingChange('color', e.target.value)}
                className="w-full h-8 bg-gray-700 rounded"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-xs mb-1">Background:</label>
              <select
                value={subtitleSettings.backgroundColor}
                onChange={(e) => handleSettingChange('backgroundColor', e.target.value)}
                className="w-full bg-gray-700 text-white rounded px-2 py-1 text-xs"
              >
                <option value="rgba(0, 0, 0, 0.8)">Dark</option>
                <option value="rgba(0, 0, 0, 0.5)">Semi-transparent</option>
                <option value="transparent">None</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Subtitle Display */}
      {currentCue && subtitleSettings.enabled && (
        <div
          ref={subtitleRef}
          className={`absolute left-1/2 transform -translate-x-1/2 max-w-4xl px-4 py-2 rounded text-center pointer-events-none z-10 ${
            subtitleSettings.position === 'bottom' ? 'bottom-4' :
            subtitleSettings.position === 'top' ? 'top-4' : 'top-1/2 -translate-y-1/2'
          }`}
          style={{
            fontSize: subtitleSettings.fontSize,
            fontFamily: subtitleSettings.fontFamily,
            color: subtitleSettings.color,
            backgroundColor: subtitleSettings.backgroundColor,
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
          }}
        >
          {currentCue.text.split('\n').map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}
