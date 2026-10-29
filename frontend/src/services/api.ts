
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1";

export type ApiResource =
  | "courses"
  | "modules"
  | "faqs"
  | "chat"
  | "enquiries"
  | "analytics"
  | "authentication"
  | "knowledge-indexing";

// Course data received from Django REST API
export interface Course {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  fees: string | number | null;
  eligibility: string;
  prerequisites: string[] | number;
  projects: string[] | number;
  skills: string[] | number;
  career_paths: string[] | number;
  batches: unknown[] | number;
  admission_status: string;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

// Common API request function
export async function apiRequest<T>(
  resource: ApiResource,
  path = "",
  init?: RequestInit
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}/${resource}${path}`,
    {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `API request failed: ${response.status} ${errorText}`
    );
  }

  // Handle successful responses without a body
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// Fetch courses from Django / MySQL
export async function getCourses() {
  return apiRequest<any[]>("courses", "/");
}

// Submit counselling enquiry to Django
export interface EnquiryData {
  name: string;
  email: string;
  phone?: string;
  education_level?: string;
  course?: number | null;
  preferred_batch?: string;
  question?: string;
}

export async function createEnquiry(data: EnquiryData) {
  return apiRequest("enquiries", "/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Frontend route guards are convenience only.
// Django REST Framework must enforce all authorization.
