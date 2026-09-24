/* Frontend-only base types (mongoose frontend bundle me nahi chahiye) */
export type ObjectId = string;
export interface Document {
  _id?: any;
  createdAt?: any;
  updatedAt?: any;
  // API se aane wale extra/populated fields allow
  [key: string]: any;
}
