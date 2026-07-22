/** Build-time flag: false in the single-file demo build, where the neural voice can't fetch its model. */
declare const __NEURAL_VOICE__: boolean

/** Minimal surface of the claude.ai artifact runtime (present only when published as an artifact). */
interface Window {
  claude?: {
    downloads?: {
      save(request: { filename: string; data: string | Blob | ArrayBuffer | ArrayBufferView }): Promise<{ status: 'saved' }>
    }
  }
}
