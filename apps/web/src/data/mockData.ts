export interface HistoryDoc {
  id: string
  title: string
  pages: number
  date: string
  size: string
}

export interface BBox {
  id: string
  x: number      // percentage
  y: number      // percentage
  width: number  // percentage
  height: number // percentage
  paragraphIdx: number
}

export interface Paragraph {
  id: string
  text: string
  bboxId: string
}

export interface Citation {
  id: string
  label: string
  /** 'pdf' — scrolls PDF viewer to bboxId; 'web' — opens url in new tab */
  type: 'pdf' | 'web'
  page: number
  bboxId: string
  url?: string        // only for web citations
}

export interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  text: string
  citations?: Citation[]
  words?: string[]    // for word-by-word sync
  streamed?: boolean  // true when this message should animate in
}

/* ─── History sidebar ─── */
export const historyDocs: HistoryDoc[] = [
  { id: 'doc-1', title: 'Quantum Neural Architectures.pdf',   pages: 28, date: 'Nov 4, 2026', size: '4.1 MB' },
  { id: 'doc-2', title: 'Autonomous RAG Systems 2026.pdf',    pages: 21, date: 'Nov 2, 2026', size: '2.8 MB' },
  { id: 'doc-3', title: 'Deep Space Propulsion Spec.pdf',     pages: 34, date: 'Oct 30, 2026', size: '5.3 MB' },
]

/* ─── 5 rich paragraphs ─── */
export const mockParagraphs: Paragraph[] = [
  {
    id: 'p-1',
    bboxId: 'bbox-1',
    text: 'Quantum neural architectures leverage superposition and entanglement to encode exponentially large feature spaces within a single quantum register, enabling parallel gradient descent across all basis states simultaneously.',
  },
  {
    id: 'p-2',
    bboxId: 'bbox-2',
    text: 'Variational quantum circuits act as parameterised unitary transforms; their classical-quantum hybrid training loop alternates between quantum expectation measurements and classical gradient updates via the parameter-shift rule.',
  },
  {
    id: 'p-3',
    bboxId: 'bbox-3',
    text: 'Quantum advantage in RAG systems emerges when the retrieval corpus exceeds 10^9 embeddings: Grover-based nearest-neighbour search achieves O(√N) query complexity versus classical O(N), yielding sub-millisecond retrieval at planetary scale.',
  },
  {
    id: 'p-4',
    bboxId: 'bbox-4',
    text: 'Noise-resilient quantum attention uses surface-code error correction with a threshold of ~1%, allowing coherent multi-head self-attention across 128 logical qubits on near-term hardware without catastrophic decoherence.',
  },
  {
    id: 'p-5',
    bboxId: 'bbox-5',
    text: 'The holographic principle constrains quantum memory density to one qubit per Planck-area on the boundary surface, suggesting that future quantum LLMs will be physically bound by the black-hole information paradox at extreme scales.',
  },
]

/* ─── BBoxes (one-to-one with paragraphs) ─── */
export const mockBBoxes: BBox[] = [
  { id: 'bbox-1', x: 5, y: 7,  width: 90, height: 8,  paragraphIdx: 0 },
  { id: 'bbox-2', x: 5, y: 18, width: 90, height: 8,  paragraphIdx: 1 },
  { id: 'bbox-3', x: 5, y: 29, width: 90, height: 8,  paragraphIdx: 2 },
  { id: 'bbox-4', x: 5, y: 40, width: 90, height: 8,  paragraphIdx: 3 },
  { id: 'bbox-5', x: 5, y: 51, width: 90, height: 8,  paragraphIdx: 4 },
]

/* ─── Pre-loaded Q&A with both PDF and web citations ─── */
export const mockChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    type: 'user',
    text: 'How does quantum advantage accelerate RAG retrieval at scale?',
  },
  {
    id: 'msg-2',
    type: 'ai',
    text: "Quantum RAG exploits Grover's algorithm to reduce nearest-neighbour search complexity from O(N) to O(√N). At a corpus of one billion embeddings this translates to roughly 31,623× fewer comparisons per query, compressing retrieval latency from seconds to sub-milliseconds—enabling real-time, planetary-scale document intelligence.",
    words: "Quantum RAG exploits Grover's algorithm to reduce nearest-neighbour search complexity from O(N) to O(√N). At a corpus of one billion embeddings this translates to roughly 31,623× fewer comparisons per query, compressing retrieval latency from seconds to sub-milliseconds—enabling real-time, planetary-scale document intelligence.".split(' '),
    citations: [
      { id: 'cit-1', label: 'Para 3 · p.1',      type: 'pdf', page: 1, bboxId: 'bbox-3' },
      { id: 'cit-2', label: 'Web · arxiv.org',    type: 'web', page: 0, bboxId: '', url: 'https://arxiv.org/abs/2310.06825' },
    ],
  },
  {
    id: 'msg-3',
    type: 'user',
    text: 'What limits quantum LLMs at extreme scales?',
  },
  {
    id: 'msg-4',
    type: 'ai',
    text: 'The holographic principle imposes a hard physical upper bound: quantum memory density cannot exceed one qubit per Planck-area on the bounding surface. Beyond that limit, adding qubits collapses the system into a black hole, making the information paradox a literal architectural constraint for future quantum LLMs.',
    words: 'The holographic principle imposes a hard physical upper bound: quantum memory density cannot exceed one qubit per Planck-area on the bounding surface. Beyond that limit, adding qubits collapses the system into a black hole, making the information paradox a literal architectural constraint for future quantum LLMs.'.split(' '),
    citations: [
      { id: 'cit-3', label: 'Para 5 · p.1',       type: 'pdf', page: 1, bboxId: 'bbox-5' },
      { id: 'cit-4', label: 'Web · nature.com',    type: 'web', page: 0, bboxId: '', url: 'https://www.nature.com/articles/s41586-023-06598-4' },
      { id: 'cit-5', label: 'Para 1 · p.1',        type: 'pdf', page: 1, bboxId: 'bbox-1' },
    ],
  },
]
