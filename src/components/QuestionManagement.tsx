import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

interface Question {
  _id: string;
  question_text: string;
  question_type?: 'multiple_choice' | 'essay';
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: 'A' | 'B' | 'C' | 'D' | string;
  level: number;
  game_mode: 'truth' | 'dare';
  explanation: string;
  question_order: number;
  points?: number;
  created_at: string;
}

interface DareInstruction {
  _id: string;
  instruction_text: string;
  options?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer?: 'A' | 'B' | 'C' | 'D';
  level: number;
  game_mode: 'dare';
  created_at: string;
  is_active: boolean;
}

interface QuestionForm {
  question_text: string;
  instruction_text: string;
  question_type: 'multiple_choice' | 'essay';
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D' | string;
  level: number;
  game_mode: 'truth' | 'dare';
  explanation: string;
  dare_type: 'simple' | 'multiple_choice';
}

const GAME_MODES = ['truth', 'dare'] as const;
const LEVELS = [1, 2, 3, 4, 5];

const QuestionManagement: React.FC = () => {
  const { logout } = useAuth();
  const [questions, setQuestions] = useState<(Question | DareInstruction)[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | DareInstruction | null>(null);
  const [formData, setFormData] = useState<QuestionForm>({
    question_text: '',
    instruction_text: '',
    question_type: 'multiple_choice',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    level: 1,
    game_mode: 'truth',
    explanation: '',
    dare_type: 'simple'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    level: '',
    game_mode: '',
    search: ''
  });

  useEffect(() => {
    fetchQuestions();
  }, [currentPage, filters]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(filters.level && { level: filters.level }),
        ...(filters.search && { search: filters.search })
      });

      let allItems: (Question | DareInstruction)[] = [];
      let totalItems = 0;

      // Fetch based on game mode filter
      if (!filters.game_mode || filters.game_mode === 'truth') {
        const questionsResponse = await fetch(`${API_BASE_URL}/admin/questions?${queryParams}&game_mode=truth`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (questionsResponse.status === 401) {
          logout();
          return;
        }
        
        const questionsData = await questionsResponse.json();
        if (questionsData.success) {
          allItems = [...allItems, ...questionsData.data.questions];
          totalItems += questionsData.data.pagination.total_items;
        }
      }

      if (!filters.game_mode || filters.game_mode === 'dare') {
        const dareResponse = await fetch(`${API_BASE_URL}/admin/dare-instructions?${queryParams}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (dareResponse.status === 401) {
          logout();
          return;
        }
        
        const dareData = await dareResponse.json();
        if (dareData.success) {
          // Transform dare instructions to match Question interface
          const transformedDares = dareData.data.instructions.map((dare: any) => ({
            ...dare,
            game_mode: 'dare' as const,
            question_text: dare.instruction_text, // For backward compatibility
            options: dare.options || { A: '', B: '', C: '', D: '' }, // Preserve original options or use empty
            correct_answer: dare.correct_answer || 'A' as const, // Preserve original correct answer
            explanation: '', // Empty explanation
            question_order: 1, // Default order
            points: 10 // Default points
          }));
          allItems = [...allItems, ...transformedDares];
          totalItems += dareData.data.pagination.total_items;
        }
      }

      // Sort by creation date (newest first)
      allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Apply search filter if present
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        allItems = allItems.filter(item => {
          if (item.game_mode === 'dare') {
            return (item as any).instruction_text?.toLowerCase().includes(searchTerm);
          } else {
            return item.question_text?.toLowerCase().includes(searchTerm);
          }
        });
      }

      setQuestions(allItems);
       setTotalPages(Math.ceil(totalItems / 10));
     } catch (err) {
       setError('Failed to fetch questions and dare instructions');
     } finally {
       setLoading(false);
     }
   };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation based on game mode
    if (formData.game_mode === 'truth') {
      if (!formData.question_text.trim()) {
        setError('Question text is required');
        return;
      }
      
      // Only validate options for multiple choice questions
      if (formData.question_type === 'multiple_choice') {
        if (!formData.option_a.trim() || !formData.option_b.trim() || !formData.option_c.trim() || !formData.option_d.trim()) {
          setError('All options must be filled');
          return;
        }
      }
      
      if (!formData.explanation.trim()) {
        setError('Explanation is required');
        return;
      }
    } else {
      if (!formData.instruction_text.trim()) {
        setError('Dare instruction is required');
        return;
      }
      
      if (formData.dare_type === 'multiple_choice') {
        if (!formData.option_a.trim() || !formData.option_b.trim() || !formData.option_c.trim() || !formData.option_d.trim()) {
          setError('All options must be filled for multiple choice dares');
          return;
        }
      }
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url, method, body;
      
      if (formData.game_mode === 'truth') {
        url = editingQuestion 
          ? `${API_BASE_URL}/admin/questions/${editingQuestion._id}`
          : `${API_BASE_URL}/admin/questions`;
        method = editingQuestion ? 'PUT' : 'POST';
        const questionData: any = {
          question_text: formData.question_text,
          correct_answer: formData.correct_answer,
          level: formData.level,
          game_mode: formData.game_mode,
          explanation: formData.explanation,
          question_type: formData.question_type,
          question_order: Date.now() % 1000000, // Use timestamp to avoid duplicates
          points: 10
        };
        
        if (formData.question_type === 'multiple_choice') {
          questionData.options = [
            formData.option_a,
            formData.option_b,
            formData.option_c,
            formData.option_d
          ];
        }
        
        console.log('Sending question data:', questionData);
        body = JSON.stringify(questionData);
      } else {
        url = editingQuestion 
          ? `${API_BASE_URL}/admin/dare-instructions/${editingQuestion._id}`
          : `${API_BASE_URL}/admin/dare-instructions`;
        method = editingQuestion ? 'PUT' : 'POST';
        
        const dareData: any = {
          instruction_text: formData.instruction_text,
          level: formData.level
        };
        
        if (formData.dare_type === 'multiple_choice') {
          dareData.options = {
            A: formData.option_a,
            B: formData.option_b,
            C: formData.option_c,
            D: formData.option_d
          };
          dareData.correct_answer = formData.correct_answer;
        }
        
        body = JSON.stringify(dareData);
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body
      });
      
      console.log('Response status:', response.status);
      
      if (response.status === 401) {
        // Token is invalid, logout user
        logout();
        return;
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        const successMessage = formData.game_mode === 'truth' 
          ? (editingQuestion ? 'Question updated successfully' : 'Question created successfully')
          : (editingQuestion ? 'Dare instruction updated successfully' : 'Dare instruction created successfully');
        setSuccess(successMessage);
        setShowForm(false);
        setEditingQuestion(null);
        resetForm();
        fetchQuestions();
      } else {
        setError(data.message);
      }
    } catch (err) {
      const errorMessage = formData.game_mode === 'truth' 
        ? 'Failed to save question'
        : 'Failed to save dare instruction';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, gameMode: 'truth' | 'dare') => {
    const itemType = gameMode === 'dare' ? 'dare instruction' : 'question';
    if (!confirm(`Are you sure you want to delete this ${itemType}?`)) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const endpoint = gameMode === 'dare' ? 'dare-instructions' : 'questions';
      const response = await fetch(`${API_BASE_URL}/admin/${endpoint}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 401) {
        // Token is invalid, logout user
        logout();
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} deleted successfully`);
        fetchQuestions();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(`Failed to delete ${itemType}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: Question | DareInstruction) => {
    setEditingQuestion(item);
    
    if (item.game_mode === 'dare') {
      const dareItem = item as DareInstruction;
      setFormData({
        question_text: '',
        instruction_text: dareItem.instruction_text,
        question_type: 'multiple_choice',
        option_a: dareItem.options?.A || '',
        option_b: dareItem.options?.B || '',
        option_c: dareItem.options?.C || '',
        option_d: dareItem.options?.D || '',
        correct_answer: dareItem.correct_answer || 'A',
        level: dareItem.level,
        game_mode: 'dare',
        explanation: '',
        dare_type: dareItem.options ? 'multiple_choice' : 'simple'
      });
    } else {
      const questionItem = item as Question;
      // Detect question type based on question_type field or empty options
      const isEssay = questionItem.question_type === 'essay' || 
                     (!questionItem.options.A && !questionItem.options.B && !questionItem.options.C && !questionItem.options.D);
      
      setFormData({
        question_text: questionItem.question_text,
        instruction_text: '',
        question_type: isEssay ? 'essay' : 'multiple_choice',
        option_a: questionItem.options.A || '',
        option_b: questionItem.options.B || '',
        option_c: questionItem.options.C || '',
        option_d: questionItem.options.D || '',
        correct_answer: questionItem.correct_answer,
        level: questionItem.level,
        game_mode: questionItem.game_mode,
        explanation: questionItem.explanation,
        dare_type: 'simple'
      });
    }
    
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      question_text: '',
      instruction_text: '',
      question_type: 'multiple_choice',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      level: 1,
      game_mode: 'truth',
      explanation: '',
      dare_type: 'simple'
    });
    setEditingQuestion(null);
  };



  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Question Management</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search questions..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
            <select
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Levels</option>
              {LEVELS.map(level => (
                <option key={level} value={level}>Level {level}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Game Mode</label>
            <select
              value={filters.game_mode}
              onChange={(e) => handleFilterChange('game_mode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Modes</option>
              {GAME_MODES.map(mode => (
                <option key={mode} value={mode}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({ level: '', game_mode: '', search: '' });
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Question Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingQuestion(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formData.game_mode === 'truth' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                    <textarea
                      value={formData.question_text}
                      onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your question here..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                    <select
                      value={formData.question_type}
                      onChange={(e) => setFormData({ ...formData, question_type: e.target.value as 'multiple_choice' | 'essay', correct_answer: e.target.value === 'essay' ? '' : 'A' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="essay">Essay</option>
                    </select>
                  </div>

                  {formData.question_type === 'multiple_choice' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correct_answer"
                      value="A"
                      checked={formData.correct_answer === 'A'}
                      onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value as 'A' | 'B' | 'C' | 'D' })}
                      className="text-blue-600"
                    />
                    <label className="text-sm font-medium text-gray-700 w-6">A:</label>
                    <input
                      type="text"
                      value={formData.option_a}
                      onChange={(e) => setFormData({ ...formData, option_a: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Option A"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correct_answer"
                      value="B"
                      checked={formData.correct_answer === 'B'}
                      onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value as 'A' | 'B' | 'C' | 'D' })}
                      className="text-blue-600"
                    />
                    <label className="text-sm font-medium text-gray-700 w-6">B:</label>
                    <input
                      type="text"
                      value={formData.option_b}
                      onChange={(e) => setFormData({ ...formData, option_b: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Option B"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correct_answer"
                      value="C"
                      checked={formData.correct_answer === 'C'}
                      onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value as 'A' | 'B' | 'C' | 'D' })}
                      className="text-blue-600"
                    />
                    <label className="text-sm font-medium text-gray-700 w-6">C:</label>
                    <input
                      type="text"
                      value={formData.option_c}
                      onChange={(e) => setFormData({ ...formData, option_c: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Option C"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correct_answer"
                      value="D"
                      checked={formData.correct_answer === 'D'}
                      onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value as 'A' | 'B' | 'C' | 'D' })}
                      className="text-blue-600"
                    />
                    <label className="text-sm font-medium text-gray-700 w-6">D:</label>
                    <input
                      type="text"
                      value={formData.option_d}
                      onChange={(e) => setFormData({ ...formData, option_d: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Option D"
                      required
                    />
                  </div>
                    </div>
                  </div>
                  ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
                    <textarea
                      value={formData.correct_answer}
                      onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter the expected answer for this essay question..."
                      required
                    />
                  </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
                    <textarea
                      value={formData.explanation}
                      onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Explain why this is the correct answer..."
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dare Type</label>
                    <select
                      value={formData.dare_type}
                      onChange={(e) => setFormData({ ...formData, dare_type: e.target.value as 'simple' | 'multiple_choice' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="simple">Simple Dare</option>
                      <option value="multiple_choice">Multiple Choice Dare</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dare Instruction</label>
                    <textarea
                      value={formData.instruction_text}
                      onChange={(e) => setFormData({ ...formData, instruction_text: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-pre-wrap"
                      placeholder="Enter the dare instruction here (e.g., 'Do 10 push-ups', 'Sing a song for 30 seconds')...\nYou can use line breaks to separate instructions."
                      required
                      style={{ whiteSpace: 'pre-wrap' }}
                    />
                  </div>

                  {formData.dare_type === 'multiple_choice' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="dare_correct_answer"
                            value="A"
                            checked={formData.correct_answer === 'A'}
                            onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value as 'A' | 'B' | 'C' | 'D' })}
                            className="text-blue-600"
                          />
                          <label className="text-sm font-medium text-gray-700 w-6">A:</label>
                          <input
                            type="text"
                            value={formData.option_a}
                            onChange={(e) => setFormData({ ...formData, option_a: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Option A"
                            required
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="dare_correct_answer"
                            value="B"
                            checked={formData.correct_answer === 'B'}
                            onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value as 'A' | 'B' | 'C' | 'D' })}
                            className="text-blue-600"
                          />
                          <label className="text-sm font-medium text-gray-700 w-6">B:</label>
                          <input
                            type="text"
                            value={formData.option_b}
                            onChange={(e) => setFormData({ ...formData, option_b: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Option B"
                            required
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="dare_correct_answer"
                            value="C"
                            checked={formData.correct_answer === 'C'}
                            onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value as 'A' | 'B' | 'C' | 'D' })}
                            className="text-blue-600"
                          />
                          <label className="text-sm font-medium text-gray-700 w-6">C:</label>
                          <input
                            type="text"
                            value={formData.option_c}
                            onChange={(e) => setFormData({ ...formData, option_c: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Option C"
                            required
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="dare_correct_answer"
                            value="D"
                            checked={formData.correct_answer === 'D'}
                            onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value as 'A' | 'B' | 'C' | 'D' })}
                            className="text-blue-600"
                          />
                          <label className="text-sm font-medium text-gray-700 w-6">D:</label>
                          <input
                            type="text"
                            value={formData.option_d}
                            onChange={(e) => setFormData({ ...formData, option_d: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Option D"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {LEVELS.map(level => (
                      <option key={level} value={level}>Level {level}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Game Mode</label>
                  <select
                    value={formData.game_mode}
                    onChange={(e) => setFormData({ ...formData, game_mode: e.target.value as 'truth' | 'dare' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {GAME_MODES.map(mode => (
                      <option key={mode} value={mode}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingQuestion(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : (editingQuestion ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Questions Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {questions.map((question) => (
                <tr key={question._id}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs">
                      {question.game_mode === 'dare' ? (
                        <div className="whitespace-pre-wrap">
                          {(question as any).instruction_text || (question as Question).question_text}
                        </div>
                      ) : (
                        <div className="truncate">
                          {(question as Question).question_text}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Level {question.level}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      question.game_mode === 'truth' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {question.game_mode}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {question.game_mode === 'truth' ? (
                      <div className="max-w-xs space-y-1">
                         <div className={`${(question as Question).correct_answer === 'A' ? 'font-bold text-green-600' : ''}`}>
                            A: {(question as Question).options.A}
                          </div>
                          <div className={`${(question as Question).correct_answer === 'B' ? 'font-bold text-green-600' : ''}`}>
                            B: {(question as Question).options.B}
                          </div>
                          <div className={`${(question as Question).correct_answer === 'C' ? 'font-bold text-green-600' : ''}`}>
                            C: {(question as Question).options.C}
                          </div>
                          <div className={`${(question as Question).correct_answer === 'D' ? 'font-bold text-green-600' : ''}`}>
                            D: {(question as Question).options.D}
                          </div>
                          <div className="mt-2 text-xs text-gray-600">
                            Correct: Option {(question as Question).correct_answer}
                          </div>
                       </div>
                    ) : (
                      <div>
                        {(question as DareInstruction).options ? (
                          <div className="max-w-xs space-y-1">
                            <div className="text-xs text-purple-600 font-semibold mb-1">Multiple Choice Dare</div>
                            <div className={`${(question as DareInstruction).correct_answer === 'A' ? 'font-bold text-green-600' : ''}`}>
                              A: {(question as DareInstruction).options!.A}
                            </div>
                            <div className={`${(question as DareInstruction).correct_answer === 'B' ? 'font-bold text-green-600' : ''}`}>
                              B: {(question as DareInstruction).options!.B}
                            </div>
                            <div className={`${(question as DareInstruction).correct_answer === 'C' ? 'font-bold text-green-600' : ''}`}>
                              C: {(question as DareInstruction).options!.C}
                            </div>
                            <div className={`${(question as DareInstruction).correct_answer === 'D' ? 'font-bold text-green-600' : ''}`}>
                              D: {(question as DareInstruction).options!.D}
                            </div>
                            <div className="mt-2 text-xs text-gray-600">
                              Correct: Option {(question as DareInstruction).correct_answer}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-purple-600 font-semibold">
                            Simple Dare
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(question.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(question)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(question._id, question.game_mode)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default QuestionManagement;