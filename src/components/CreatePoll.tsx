import { useState } from 'react';
import { PlusCircle, MinusCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { z } from 'zod';

const pollSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  endsAt: z.string().refine(val => new Date(val) > new Date(), {
    message: 'End date must be in the future',
  }),
  options: z.array(z.string().min(1)).min(2, 'At least 2 options are required'),
});

export function CreatePoll() {
  const user = useAuthStore((state) => state.user);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [endsAt, setEndsAt] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addOption = () => setOptions([...options, '']);
  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    try {
      pollSchema.parse({
        title,
        description,
        endsAt,
        options: options.filter(opt => opt.trim()),
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting || !validateForm()) return;

    setIsSubmitting(true);
    try {
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert({
          title,
          description,
          created_by: user.id,
          ends_at: new Date(endsAt).toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (pollError) throw pollError;

      const optionsToInsert = options
        .filter(opt => opt.trim())
        .map(text => ({
          poll_id: poll.id,
          text,
        }));

      const { error: optionsError } = await supabase
        .from('options')
        .insert(optionsToInsert);

      if (optionsError) throw optionsError;

      toast.success('Poll created successfully!');
      setTitle('');
      setDescription('');
      setOptions(['', '']);
      setEndsAt('');
    } catch (error) {
      toast.error('Failed to create poll');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
          className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.title ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.description ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">End Date</label>
        <input
          type="datetime-local"
          value={endsAt}
          onChange={(e) => setEndsAt(e.target.value)}
          disabled={isSubmitting}
          className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.endsAt ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.endsAt && (
          <p className="mt-1 text-sm text-red-600">{errors.endsAt}</p>
        )}
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Options</label>
        {options.map((option, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={option}
              onChange={(e) => {
                const newOptions = [...options];
                newOptions[index] = e.target.value;
                setOptions(newOptions);
              }}
              disabled={isSubmitting}
              className={`flex-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.options ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder={`Option ${index + 1}`}
            />
            {index > 1 && (
              <button
                type="button"
                onClick={() => removeOption(index)}
                disabled={isSubmitting}
                className="text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                <MinusCircle className="w-6 h-6" />
              </button>
            )}
          </div>
        ))}
        {errors.options && (
          <p className="mt-1 text-sm text-red-600">{errors.options}</p>
        )}
        <button
          type="button"
          onClick={addOption}
          disabled={isSubmitting}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
        >
          <PlusCircle className="w-5 h-5" />
          Add Option
        </button>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
        {isSubmitting ? 'Creating Poll...' : 'Create Poll'}
      </button>
    </form>
  );
}