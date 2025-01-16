import { MultiSelect } from "../../components/ui/multi-select";

interface AddUserFormData {
  name: string;
  email: string;
  departments: string[];
  position: string;
  isAdmin: boolean;
}

export default function AddUserDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState<AddUserFormData>({
    name: '',
    email: '',
    departments: [],
    position: '',
    isAdmin: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/users', {
        name: formData.name,
        email: formData.email,
        departments: formData.departments,
        position: formData.position,
        isAdmin: formData.isAdmin
      });
      onClose();
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account. They will receive an email with login instructions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email address"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Departments</label>
              <MultiSelect
                value={formData.departments}
                onValueChange={(value: string[]) => setFormData({ ...formData, departments: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Front Counter">Front Counter</SelectItem>
                  <SelectItem value="Drive Thru">Drive Thru</SelectItem>
                  <SelectItem value="Kitchen">Kitchen</SelectItem>
                  <SelectItem value="Everything">Everything</SelectItem>
                </SelectContent>
              </MultiSelect>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Position</label>
              <Select
                value={formData.position}
                onValueChange={(value: string) => {
                  setFormData({ 
                    ...formData, 
                    position: value,
                    isAdmin: ['Store Director', 'Kitchen Director', 'Service Director', 'Store Leader'].includes(value)
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Store Director">Store Director</SelectItem>
                  <SelectItem value="Kitchen Director">Kitchen Director</SelectItem>
                  <SelectItem value="Service Director">Service Director</SelectItem>
                  <SelectItem value="Store Leader">Store Leader</SelectItem>
                  <SelectItem value="Training Leader">Training Leader</SelectItem>
                  <SelectItem value="Shift Leader">Shift Leader</SelectItem>
                  <SelectItem value="Team Leader">Team Leader</SelectItem>
                  <SelectItem value="Trainer">Trainer</SelectItem>
                  <SelectItem value="Team Member">Team Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add User</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 