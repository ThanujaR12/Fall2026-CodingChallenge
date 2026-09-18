// "Search with a photo": take one with the camera or upload one, watch it scan, then see photos like
// it. Recognition runs on the device (see lib/visualSearch.ts); the photo is never uploaded.
import { useEffect, useRef, useState, type DragEvent } from 'react';
import { useNavigate } from 'react-router';
import { Camera, CircleNotch, ImageSquare, LockSimple, UploadSimple } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { analyzePhoto, loadImage, loadModel } from '@/lib/visualSearch';
import { cn } from '@/lib/utils';

type Step = 'choose' | 'camera' | 'scanning';

const MAX_SIDE = 800;

// Shrinks big photos (phone cameras are 12 MP+) so analysis and memory stay light.
async function toDataUrl(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function VisualSearchDialog() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('choose');
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLInputElement>(null);
  const canUseCamera =
    typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      // Start fetching the model while the person picks a photo.
      void loadModel().catch(() => {});
    } else {
      stopCamera();
      setStep('choose');
      setPreview(null);
      setError(null);
    }
  }

  useEffect(() => () => stopCamera(), []);

  async function analyze(dataUrl: string) {
    stopCamera();
    setPreview(dataUrl);
    setStep('scanning');
    setError(null);
    try {
      const img = await loadImage(dataUrl);
      const analysis = await analyzePhoto(img);
      handleOpenChange(false);
      navigate('/visual-search', { state: { image: dataUrl, ...analysis } });
    } catch {
      setStep('choose');
      setError("We couldn't read that photo. Check your connection and try another one.");
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file (JPG, PNG, WebP, or HEIC).');
      return;
    }
    try {
      await analyze(await toDataUrl(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "That file couldn't be opened.");
    }
  }

  async function startCamera() {
    setError(null);
    // Phones without camera access in the browser fall back to the camera app.
    if (!canUseCamera) {
      captureRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setStep('camera');
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setError('Camera access is blocked or no camera was found. You can upload a photo instead.');
    }
  }

  function snap() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const scale = Math.min(1, MAX_SIDE / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    void analyze(canvas.toDataURL('image/jpeg', 0.9));
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void onFile(event.dataTransfer.files?.[0]);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Search with a photo"
          title="Search with a photo"
          className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-surface hover:text-ink"
        >
          <Camera size={19} aria-hidden="true" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Search with a photo</DialogTitle>
          <DialogDescription>
            Snap or upload anything: a mug, a sunset, your dog. We'll find photos like it.
          </DialogDescription>
        </DialogHeader>

        {step === 'choose' && (
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Button size="lg" onClick={() => void startCamera()} className="min-h-14 rounded-xl">
                <Camera size={20} aria-hidden="true" />
                Take a photo
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => fileRef.current?.click()}
                className="min-h-14 rounded-xl"
              >
                <UploadSimple size={20} aria-hidden="true" />
                Upload a photo
              </Button>
            </div>
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                'flex min-h-28 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-center text-[14px] transition-colors',
                dragging ? 'border-accent bg-accent-tint' : 'border-divider text-ink/70',
              )}
            >
              <ImageSquare size={24} aria-hidden="true" />
              Or drop a photo here
            </div>
            {error && (
              <p role="alert" className="text-[14px] text-accent2-deep">
                {error}
              </p>
            )}
            <p className="flex items-center gap-1.5 text-[12px] text-ink/70">
              <LockSimple size={14} aria-hidden="true" />
              Your photo stays on this device. Only the words we recognise are searched.
            </p>
          </div>
        )}

        {step === 'camera' && (
          <div className="grid gap-3">
            <video
              ref={videoRef}
              playsInline
              muted
              aria-label="Camera preview"
              className="aspect-[4/3] w-full rounded-xl bg-ink object-cover"
            />
            <div className="flex gap-2.5">
              <Button size="lg" onClick={snap} className="flex-1">
                <Camera size={20} aria-hidden="true" />
                Take photo
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => {
                  stopCamera();
                  setStep('choose');
                }}
              >
                Back
              </Button>
            </div>
          </div>
        )}

        {step === 'scanning' && preview && (
          <div className="grid gap-3" role="status" aria-live="polite">
            <div className="relative overflow-hidden rounded-xl">
              <img
                src={preview}
                alt="Your photo"
                className="block max-h-[360px] w-full object-cover"
              />
              {/* A light sweeps over the photo while it is being recognised. */}
              <div
                aria-hidden="true"
                className="pixboard-scan pointer-events-none absolute inset-x-0 h-24 motion-reduce:hidden"
              />
            </div>
            <p className="flex items-center gap-2 text-[14px] text-ink/80">
              <CircleNotch size={16} className="animate-spin" aria-hidden="true" />
              Looking closely at your photo…
            </p>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
        <input
          ref={captureRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
      </DialogContent>
    </Dialog>
  );
}
