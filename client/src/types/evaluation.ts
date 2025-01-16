export interface Employee {
  _id: string;
  name: string;
  email: string;
  departments: string[];
  position: string;
  manager?: string | {
    _id: string;
    name: string;
  };
} 