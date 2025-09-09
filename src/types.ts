// Common shared interfaces

export interface Job {
  title: string;
  link: string;
}

export interface ScrapeRequest {
  url: string;
}

export interface ScrapeResponse {
  count: number;
  jobs: Job[];
}
