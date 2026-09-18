// Copies text to the clipboard and confirms with a toast (or explains why it couldn't).
import { toast } from 'sonner';

export async function copyText(text: string, done: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(done);
  } catch {
    toast.error("Couldn't copy. Select the code and copy it yourself.");
  }
}
