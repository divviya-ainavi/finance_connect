import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type FinanceRole = Database['public']['Enums']['finance_role'];

interface TestQuestion {
  id: string;
  role: FinanceRole;
  question_text: string;
  options: string[];
  correct_answer: number;
}

const ROLES: FinanceRole[] = [
  'accounts_payable',
  'accounts_receivable',
  'bookkeeper',
  'payroll_clerk',
  'management_accountant',
  'credit_controller',
  'financial_controller',
  'finance_manager',
  'cfo_fpa',
];

export default function TestsManagement() {
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [selectedRole, setSelectedRole] = useState<FinanceRole | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<TestQuestion | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    role: '' as FinanceRole,
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: 0,
  });

  useEffect(() => {
    fetchQuestions();
  }, [selectedRole]);

  const fetchQuestions = async () => {
    let query = supabase.from('test_questions').select('*').order('created_at', { ascending: false });
    
    if (selectedRole !== 'all') {
      query = query.eq('role', selectedRole);
    }

    const { data, error } = await query;
    if (!error && data) {
      setQuestions(data.map(q => ({ ...q, options: q.options as string[] })));
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.role || !formData.question_text || formData.options.some(o => !o.trim())) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    const questionData = {
      role: formData.role,
      question_text: formData.question_text,
      options: formData.options,
      correct_answer: formData.correct_answer,
    };

    let error;
    if (editingQuestion) {
      ({ error } = await supabase
        .from('test_questions')
        .update(questionData)
        .eq('id', editingQuestion.id));
    } else {
      ({ error } = await supabase.from('test_questions').insert(questionData));
    }

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save question',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `Question ${editingQuestion ? 'updated' : 'created'} successfully`,
      });
      setDialogOpen(false);
      resetForm();
      fetchQuestions();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('test_questions').delete().eq('id', id);
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete question',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Question deleted successfully',
      });
      fetchQuestions();
    }
  };

  const resetForm = () => {
    setFormData({
      role: '' as FinanceRole,
      question_text: '',
      options: ['', '', '', ''],
      correct_answer: 0,
    });
    setEditingQuestion(null);
  };

  const openEditDialog = (question: TestQuestion) => {
    setEditingQuestion(question);
    setFormData({
      role: question.role,
      question_text: question.question_text,
      options: question.options,
      correct_answer: question.correct_answer,
    });
    setDialogOpen(true);
  };

  const formatRole = (role: string) => {
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Test Questions</h1>
            <p className="text-muted-foreground">Manage skills test questions</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add New Question'}</DialogTitle>
                <DialogDescription>
                  Create a multiple choice question for skills testing
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as FinanceRole })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {formatRole(role)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Question</Label>
                  <Textarea
                    value={formData.question_text}
                    onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                    placeholder="Enter the question..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Options</Label>
                  {formData.options.map((option, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...formData.options];
                          newOptions[idx] = e.target.value;
                          setFormData({ ...formData, options: newOptions });
                        }}
                        placeholder={`Option ${idx + 1}`}
                      />
                      <input
                        type="radio"
                        name="correct"
                        checked={formData.correct_answer === idx}
                        onChange={() => setFormData({ ...formData, correct_answer: idx })}
                        className="h-4 w-4"
                      />
                      <span className="text-xs text-muted-foreground">Correct</span>
                    </div>
                  ))}
                </div>
                <Button onClick={handleSubmit} className="w-full">
                  {editingQuestion ? 'Update Question' : 'Create Question'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as FinanceRole | 'all')}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {formatRole(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                {questions.length} questions
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Options</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((question) => (
                  <TableRow key={question.id}>
                    <TableCell>{formatRole(question.role)}</TableCell>
                    <TableCell className="max-w-md truncate">{question.question_text}</TableCell>
                    <TableCell>{question.options.length} options</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(question)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(question.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {questions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No questions found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
