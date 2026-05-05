import { DeepgramClient } from "@deepgram/sdk";

/**
 * Real-time transcription using Deepgram's streaming API (v4 SDK).
 *
 * Receives audio chunks (Float32Array @ 16kHz) from the Meet bot
 * and returns transcript segments with speaker labels.
 */

export interface TranscriptSegment {
  text: string;
  speaker: number;
  start: number;
  end: number;
  isFinal: boolean;
}

export interface TranscriberConfig {
  onSegment: (segment: TranscriptSegment) => void;
  onError?: (error: Error) => void;
}

export class NuruTranscriber {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private connection: any = null;
  private config: TranscriberConfig;
  private fullTranscript: TranscriptSegment[] = [];

  constructor(config: TranscriberConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      throw new Error("DEEPGRAM_API_KEY env var is not set");
    }

    const deepgram = new DeepgramClient({ apiKey });

    this.connection = await deepgram.listen.v1.connect({
      model: "nova-2",
      language: "en",
      smart_format: "true",
      punctuate: "true",
      diarize: "true",
      encoding: "linear16",
      sample_rate: "16000",
      channels: "1",
      interim_results: "true",
      utterance_end_ms: "1500",
      Authorization: `Token ${apiKey}`,
    });

    this.connection.on("open", () => {
      console.log("[transcriber] Deepgram connection opened");
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.connection.on("transcript", (data: any) => {
      const alt = data.channel?.alternatives?.[0];
      if (!alt?.transcript) return;

      const segment: TranscriptSegment = {
        text: alt.transcript,
        speaker: alt.words?.[0]?.speaker ?? 0,
        start: data.start ?? 0,
        end: (data.start ?? 0) + (data.duration ?? 0),
        isFinal: data.is_final ?? false,
      };

      if (segment.isFinal && segment.text.trim()) {
        this.fullTranscript.push(segment);
      }

      this.config.onSegment(segment);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.connection.on("error", (err: any) => {
      console.error("[transcriber] Deepgram error:", err);
      this.config.onError?.(err instanceof Error ? err : new Error(String(err)));
    });

    this.connection.on("close", () => {
      console.log("[transcriber] Deepgram connection closed");
    });
  }

  /**
   * Feed audio data from the Meet bot into Deepgram.
   * Converts Float32Array to Int16 PCM before sending.
   */
  sendAudio(chunk: Float32Array): void {
    if (!this.connection?.socket) return;

    // Convert Float32 (-1.0 to 1.0) to Int16 PCM
    const pcm = new Int16Array(chunk.length);
    for (let i = 0; i < chunk.length; i++) {
      const sample = Math.max(-1, Math.min(1, chunk[i]));
      pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }

    this.connection.socket.send(Buffer.from(pcm.buffer));
  }

  async stop(): Promise<string> {
    if (this.connection) {
      try {
        this.connection.socket?.close();
      } catch {
        // Connection may already be closed
      }
      this.connection = null;
    }

    return this.getFormattedTranscript();
  }

  /**
   * Returns the full transcript formatted with speaker labels.
   */
  getFormattedTranscript(): string {
    if (this.fullTranscript.length === 0) return "";

    let result = "";
    let currentSpeaker = -1;

    for (const seg of this.fullTranscript) {
      if (seg.speaker !== currentSpeaker) {
        currentSpeaker = seg.speaker;
        const mins = Math.floor(seg.start / 60);
        const secs = Math.floor(seg.start % 60);
        const timestamp = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        result += `\n[${timestamp}] Speaker ${currentSpeaker + 1}:\n`;
      }
      result += seg.text + " ";
    }

    return result.trim();
  }

  getSegments(): TranscriptSegment[] {
    return [...this.fullTranscript];
  }
}
