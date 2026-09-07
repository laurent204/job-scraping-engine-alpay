/**
 * Build-time stand-in for '@mintplex-labs/piper-tts-web', used by the
 * single-file artifact build where the neural voice can't fetch its
 * model anyway (strict CSP). Keeps the app on the graceful fallback
 * path (device speechSynthesis + phonetics) without shipping 70 MB of
 * inlined onnxruntime WASM.
 */

export async function stored(): Promise<string[]> {
  return []
}

export async function download(): Promise<void> {
  throw new Error('neural voice is not available in this build')
}

export async function remove(): Promise<void> {}

export async function flush(): Promise<void> {}

export class TtsSession {
  static async create(): Promise<TtsSession> {
    throw new Error('neural voice is not available in this build')
  }
  predict(): Promise<Blob> {
    return Promise.reject(new Error('neural voice is not available in this build'))
  }
}
