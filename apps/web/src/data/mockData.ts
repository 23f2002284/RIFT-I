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

/* ─── 1-2 line concise script sections ─── */
export const mockParagraphs: Paragraph[] = [
  {
    id: 'p-1',
    bboxId: 'bbox-1',
    text: 'Quantum neural architectures leverage superposition to encode exponentially large feature spaces.',
  },
  {
    id: 'p-2',
    bboxId: 'bbox-2',
    text: 'A single quantum register enables parallel gradient descent across all basis states simultaneously.',
  },
  {
    id: 'p-3',
    bboxId: 'bbox-3',
    text: 'Variational quantum circuits act as parameterised unitary transforms within Hilbert space.',
  },
  {
    id: 'p-4',
    bboxId: 'bbox-4',
    text: 'Their classical-quantum hybrid training loop alternates expectation measurements with gradient updates.',
  },
  {
    id: 'p-5',
    bboxId: 'bbox-5',
    text: 'Quantum advantage in RAG systems emerges when retrieval corpora exceed one billion embeddings.',
  },
  {
    id: 'p-6',
    bboxId: 'bbox-6',
    text: 'Grover-based search achieves O(√N) query complexity versus classical exhaustive O(N) scanning.',
  },
  {
    id: 'p-7',
    bboxId: 'bbox-7',
    text: 'This algorithmic speedup yields sub-millisecond retrieval latency for planetary-scale intelligence.',
  },
  {
    id: 'p-8',
    bboxId: 'bbox-8',
    text: 'Noise-resilient quantum attention employs surface-code error correction near a 1% threshold.',
  },
  {
    id: 'p-9',
    bboxId: 'bbox-9',
    text: 'This enables coherent multi-head self-attention across 128 logical qubits without decoherence.',
  },
  {
    id: 'p-10',
    bboxId: 'bbox-10',
    text: 'The holographic principle constrains quantum memory density to one qubit per Planck-area.',
  },
]

/* ─── BBoxes (one-to-one with 1-2 line script sections) ─── */
export const mockBBoxes: BBox[] = [
  { id: 'bbox-1',  x: 5, y: 7,  width: 90, height: 5, paragraphIdx: 0 },
  { id: 'bbox-2',  x: 5, y: 13, width: 90, height: 5, paragraphIdx: 1 },
  { id: 'bbox-3',  x: 5, y: 19, width: 90, height: 5, paragraphIdx: 2 },
  { id: 'bbox-4',  x: 5, y: 25, width: 90, height: 5, paragraphIdx: 3 },
  { id: 'bbox-5',  x: 5, y: 31, width: 90, height: 5, paragraphIdx: 4 },
  { id: 'bbox-6',  x: 5, y: 37, width: 90, height: 5, paragraphIdx: 5 },
  { id: 'bbox-7',  x: 5, y: 43, width: 90, height: 5, paragraphIdx: 6 },
  { id: 'bbox-8',  x: 5, y: 49, width: 90, height: 5, paragraphIdx: 7 },
  { id: 'bbox-9',  x: 5, y: 55, width: 90, height: 5, paragraphIdx: 8 },
  { id: 'bbox-10', x: 5, y: 61, width: 90, height: 5, paragraphIdx: 9 },
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
