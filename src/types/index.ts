export interface HiddenFile {
  id: number;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  category: string;
}

export interface HiddenFileWithData extends HiddenFile {
  data: Blob;
}
