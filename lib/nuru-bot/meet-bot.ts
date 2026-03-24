import puppeteer, { Browser, Page } from "puppeteer-core";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Nuru Meet Bot
 *
 * Joins a Google Meet call via headless Chrome, captures audio,
 * and provides a stream for transcription.
 *
 * Requirements:
 * - Chrome/Chromium installed on the server
 * - CHROME_EXECUTABLE_PATH env var pointing to the Chrome binary
 *
 * Architecture:
 * 1. Launch headless Chrome with audio capture flags
 * 2. Navigate to Google Meet link
 * 3. Join the meeting (dismiss prompts, click join)
 * 4. Capture audio via Web Audio API in the page context
 * 5. Stream audio chunks back to Node via page.exposeFunction
 * 6. On meeting end or manual stop, leave and clean up
 */

export interface MeetBotConfig {
  meetLink: string;
  meetingId: string;
  botName?: string;
  onAudioChunk: (chunk: Float32Array) => void;
  onTranscript?: (text: string, speaker: string, timestamp: number) => void;
  onMeetingEnd?: () => void;
  onError?: (error: Error) => void;
}

export class NuruMeetBot {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: MeetBotConfig;
  private isRunning = false;

  constructor(config: MeetBotConfig) {
    this.config = config;
  }

  async join(): Promise<void> {
    const chromePath =
      process.env.CHROME_EXECUTABLE_PATH ||
      "/usr/bin/google-chrome-stable";

    this.browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        // Audio capture flags
        "--autoplay-policy=no-user-gesture-required",
        "--use-fake-ui-for-media-stream", // auto-grant mic/camera permissions
        "--use-fake-device-for-media-stream", // fake devices so no real hardware needed
        "--disable-audio-output", // don't play audio on server speakers
        // Window size for Meet UI
        "--window-size=1280,720",
      ],
    });

    this.page = await this.browser.newPage();
    this.isRunning = true;

    // Expose the audio callback to the browser context
    await this.page.exposeFunction("__nuruAudioChunk", (data: number[]) => {
      if (!this.isRunning) return;
      const float32 = new Float32Array(data);
      this.config.onAudioChunk(float32);
    });

    await this.page.exposeFunction("__nuruMeetingEnded", () => {
      this.config.onMeetingEnd?.();
      this.leave().catch(console.error);
    });

    try {
      // Navigate to Meet
      await this.page.goto(this.config.meetLink, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Wait for the page to load
      await delay(3000);

      // Dismiss "Join now" / "Ask to join" flow
      await this.dismissPreJoinPrompts();

      // Set display name if possible
      await this.setDisplayName(this.config.botName ?? "Nuru (Meeting Assistant)");

      // Turn off camera and mic before joining
      await this.toggleMediaOff();

      // Click the join button
      await this.clickJoin();

      // Wait for meeting room to load
      await delay(5000);

      // Start capturing audio from the meeting
      await this.startAudioCapture();

      // Monitor for meeting end
      this.monitorMeetingEnd();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.config.onError?.(error);
      await this.leave();
    }
  }

  private async dismissPreJoinPrompts(): Promise<void> {
    if (!this.page) return;

    try {
      // Dismiss "Got it" or cookie consent buttons
      const gotItBtn = await this.page.$('button[data-mdc-dialog-action="ok"]');
      if (gotItBtn) await gotItBtn.click();

      // Dismiss other consent dialogs
      const consentBtn = await this.page.$('button[aria-label="Dismiss"]');
      if (consentBtn) await consentBtn.click();
    } catch {
      // Non-critical, continue
    }
  }

  private async setDisplayName(name: string): Promise<void> {
    if (!this.page) return;

    try {
      // Look for the name input field (appears when not signed in)
      const nameInput = await this.page.$('input[aria-label="Your name"]');
      if (nameInput) {
        await nameInput.click({ clickCount: 3 }); // select all
        await nameInput.type(name);
      }
    } catch {
      // May not have name input if signed in
    }
  }

  private async toggleMediaOff(): Promise<void> {
    if (!this.page) return;

    try {
      // Turn off camera
      const cameraBtn = await this.page.$(
        'button[aria-label*="camera"], button[data-is-muted="false"][aria-label*="camera"]'
      );
      if (cameraBtn) await cameraBtn.click();

      // Turn off mic
      const micBtn = await this.page.$(
        'button[aria-label*="microphone"], button[data-is-muted="false"][aria-label*="microphone"]'
      );
      if (micBtn) await micBtn.click();
    } catch {
      // Non-critical
    }
  }

  private async clickJoin(): Promise<void> {
    if (!this.page) return;

    // Try multiple selectors as Google Meet UI varies
    const joinSelectors = [
      'button[data-idom-class*="join"]',
      'button[jsname="Qx7uuf"]', // "Join now" button
      'button:has-text("Join now")',
      'button:has-text("Ask to join")',
      '[role="button"]:has-text("Join")',
    ];

    for (const selector of joinSelectors) {
      try {
        const btn = await this.page.$(selector);
        if (btn) {
          await btn.click();
          return;
        }
      } catch {
        continue;
      }
    }

    // Fallback: evaluate and click by text content
    await this.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button, [role='button']"));
      const joinBtn = buttons.find(
        (b) => b.textContent?.includes("Join now") || b.textContent?.includes("Ask to join")
      );
      if (joinBtn) (joinBtn as HTMLElement).click();
    });
  }

  private async startAudioCapture(): Promise<void> {
    if (!this.page) return;

    // Inject Web Audio API capture script into the page
    await this.page.evaluate(() => {
      const audioContext = new AudioContext({ sampleRate: 16000 });

      // Capture all audio output from the page
      const destination = audioContext.createMediaStreamDestination();

      // Get all audio/video elements and connect them
      function captureMediaElements() {
        const mediaElements = document.querySelectorAll("audio, video");
        mediaElements.forEach((el) => {
          try {
            const source = audioContext.createMediaElementSource(el as HTMLMediaElement);
            source.connect(destination);
            source.connect(audioContext.destination); // keep audio playing
          } catch {
            // Already captured or CORS issue
          }
        });
      }

      // Initial capture
      captureMediaElements();

      // Watch for new media elements (participants joining)
      const observer = new MutationObserver(() => captureMediaElements());
      observer.observe(document.body, { childList: true, subtree: true });

      // Also try to capture via getUserMedia output (remote streams)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const origAddTrack = RTCPeerConnection.prototype.addTrack;
      RTCPeerConnection.prototype.addTrack = function (...args) {
        const result = origAddTrack.apply(this, args);
        // Listen for remote tracks
        this.ontrack = (event) => {
          if (event.track.kind === "audio") {
            const stream = new MediaStream([event.track]);
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(destination);
          }
        };
        return result;
      };

      // Process audio in chunks
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      destination.stream
        .getAudioTracks()
        .forEach((track) => {
          const source = audioContext.createMediaStreamSource(
            new MediaStream([track])
          );
          source.connect(processor);
        });

      processor.connect(audioContext.destination);
      processor.onaudioprocess = (event) => {
        const data = event.inputBuffer.getChannelData(0);
        const arr = Array.from(data);
        // Send to Node.js
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__nuruAudioChunk(arr);
      };
    });
  }

  private monitorMeetingEnd(): void {
    if (!this.page) return;

    // Poll for meeting end indicators
    const interval = setInterval(async () => {
      if (!this.isRunning || !this.page) {
        clearInterval(interval);
        return;
      }

      try {
        const ended = await this.page.evaluate(() => {
          // Check for "You've left the meeting" or "Meeting ended" text
          const body = document.body.innerText;
          return (
            body.includes("You've left the meeting") ||
            body.includes("The meeting has ended") ||
            body.includes("Return to home screen") ||
            body.includes("Rejoin")
          );
        });

        if (ended) {
          clearInterval(interval);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await this.page.evaluate(() => (window as any).__nuruMeetingEnded());
        }
      } catch {
        // Page may have been closed
        clearInterval(interval);
      }
    }, 5000);
  }

  async leave(): Promise<void> {
    this.isRunning = false;

    if (this.page) {
      try {
        // Click the leave/end call button
        await this.page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll("button, [role='button']"));
          const leaveBtn = buttons.find(
            (b) =>
              b.getAttribute("aria-label")?.includes("Leave call") ||
              b.getAttribute("aria-label")?.includes("End call")
          );
          if (leaveBtn) (leaveBtn as HTMLElement).click();
        });
        await delay(1000);
      } catch {
        // Page may already be closed
      }
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  get running(): boolean {
    return this.isRunning;
  }
}
