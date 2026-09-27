export type Photo = { url: string; path: string; width?: number; height?: number };

export type Category = { id: string; name: string; order: number };

export type EventDoc = {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
  meta: string;
  description: string;
  date: string;
  location: string;
  cover: Photo | null;
  photos: Photo[];
  published: boolean;
  order: number;
};

export type Enquiry = {
  id: string;
  name: string;
  email: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: Date | null;
};
