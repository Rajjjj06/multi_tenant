// Mock data for the application

export const mockProjects = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Complete redesign of company website',
    status: 'active',
    createdAt: '2024-01-15',
    tasksCount: 12,
  },
  {
    id: '2',
    name: 'Mobile App Development',
    description: 'Build iOS and Android mobile application',
    status: 'active',
    createdAt: '2024-01-20',
    tasksCount: 8,
  },
  {
    id: '3',
    name: 'Marketing Campaign',
    description: 'Q1 marketing campaign planning',
    status: 'completed',
    createdAt: '2024-01-10',
    tasksCount: 5,
  },
];

export const mockTasks = [
  {
    id: '1',
    title: 'Design homepage mockup',
    description: 'Create initial design mockup for homepage',
    status: 'todo',
    priority: 'high',
    projectId: '1',
    assigneeId: '1',
    dueDate: '2024-02-01',
  },
  {
    id: '2',
    title: 'Implement user authentication',
    description: 'Set up login and registration flow',
    status: 'in-progress',
    priority: 'high',
    projectId: '2',
    assigneeId: '2',
    dueDate: '2024-02-05',
  },
  {
    id: '3',
    title: 'Write blog post about launch',
    description: 'Create blog post announcing the new product',
    status: 'done',
    priority: 'medium',
    projectId: '3',
    assigneeId: '1',
    dueDate: '2024-01-25',
  },
  {
    id: '4',
    title: 'Review competitor analysis',
    description: 'Analyze competitor features and pricing',
    status: 'todo',
    priority: 'low',
    projectId: '1',
    assigneeId: '3',
    dueDate: '2024-02-10',
  },
  {
    id: '5',
    title: 'Setup CI/CD pipeline',
    description: 'Configure continuous integration and deployment',
    status: 'in-progress',
    priority: 'high',
    projectId: '2',
    assigneeId: '2',
    dueDate: '2024-02-08',
  },
];

export const mockMembers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=0ea5e9&color=fff',
    joinedAt: '2024-01-01',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'member',
    avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=10b981&color=fff',
    joinedAt: '2024-01-05',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'member',
    avatar: 'https://ui-avatars.com/api/?name=Bob+Johnson&background=f59e0b&color=fff',
    joinedAt: '2024-01-10',
  },
];

