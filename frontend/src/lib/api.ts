const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, config);

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// Assignments
export const api = {
  // Assignments
  getAssignments: (params?: { page?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return request<{
      status: string;
      data: {
        assignments: Assignment[];
        pagination: Pagination;
      };
    }>(`/assignments${qs ? `?${qs}` : ''}`);
  },

  getAssignment: (id: string) =>
    request<{ status: string; data: Assignment }>(`/assignments/${id}`),

  createAssignment: (data: FormData) =>
    request<{ status: string; data: Assignment }>('/assignments', {
      method: 'POST',
      body: data,
    }),

  deleteAssignment: (id: string) =>
    request<{ status: string }>(`/assignments/${id}`, { method: 'DELETE' }),

  // Generation
  generateAssessment: (id: string) =>
    request<{ status: string; data: { jobId: string; assignmentId: string } }>(
      `/assignments/${id}/generate`,
      { method: 'POST' }
    ),

  getGenerationStatus: (id: string) =>
    request<{ status: string; data: GenerationJob }>(`/assignments/${id}/generation-status`),

  getGeneratedAssessment: (id: string) =>
    request<{ status: string; data: GeneratedAssessment }>(
      `/assignments/${id}/assessment`
    ),

  // PDF
  downloadPDF: async (id: string): Promise<Blob> => {
    const res = await fetch(`${API_BASE}/assignments/${id}/pdf`);
    if (!res.ok) throw new Error('PDF download failed');
    return res.blob();
  },
};

// Types
export interface QuestionTypeConfig {
  type: string;
  count: number;
  marks: number;
}

export interface Assignment {
  _id: string;
  title: string;
  subject: string;
  dueDate: string;
  questionTypes: QuestionTypeConfig[];
  totalQuestions: number;
  totalMarks: number;
  additionalInstructions?: string;
  uploadedFileName?: string;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  generatedAssessmentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  questionNumber: number;
  question: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
  marks: number;
  type: string;
  answer?: string;
}

export interface Section {
  title: string;
  instruction: string;
  questions: Question[];
}

export interface GeneratedAssessment {
  _id: string;
  assignmentId: string;
  title: string;
  instituteName: string;
  subject: string;
  className: string;
  duration: string;
  maxMarks: number;
  sections: Section[];
  answerKey: Array<{ questionNumber: number; answer: string }>;
  metadata: {
    model: string;
    tokensUsed: number;
    generationTimeMs: number;
  };
  createdAt: string;
}

export interface GenerationJob {
  _id: string;
  assignmentId: string;
  status: 'queued' | 'processing' | 'generating' | 'parsing' | 'saving' | 'completed' | 'failed';
  progress: number;
  statusMessage: string;
  error?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
