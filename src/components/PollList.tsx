import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '../store/authStore';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import toast from 'react-hot-toast';

type Poll = Database['public']['Tables']['polls']['Row'] & {
  options: (Database['public']['Tables']['options']['Row'] & {
    votes: Database['public']['Tables']['votes']['Row'][];
  })[];
};

export function PollList() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingInProgress, setVotingInProgress] = useState<string | null>(null);
  const { user, isAdmin } = useAuthStore();

  const fetchPolls = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, fetch all polls
      const { data: pollsData, error: pollsError } = await supabase
        .from('polls')
        .select(`
          *,
          options (
            *,
            votes (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (pollsError) throw pollsError;

      setPolls(pollsData as Poll[] || []);
    } catch (err) {
      console.error('Error fetching polls:', err);
      setError('Failed to load polls. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();

    // Set up real-time subscriptions
    const pollsSubscription = supabase
      .channel('polls-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'polls' 
        }, 
        () => fetchPolls()
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'votes' 
        }, 
        () => fetchPolls()
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIPTION_ERROR') {
          console.error('Real-time subscription error');
          toast.error('Real-time updates unavailable');
        }
      });

    return () => {
      pollsSubscription.unsubscribe();
    };
  }, []);

  const handleVote = async (pollId: string, optionId: string) => {
    if (!user) {
      toast.error('Please sign in to vote');
      return;
    }

    if (votingInProgress) {
      return;
    }

    try {
      setVotingInProgress(pollId);

      // Check if user has already voted
      const { data: existingVote, error: checkError } = await supabase
        .from('votes')
        .select('id')
        .eq('poll_id', pollId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingVote) {
        toast.error('You have already voted on this poll');
        return;
      }

      // Submit the vote
      const { error: voteError } = await supabase
        .from('votes')
        .insert({
          poll_id: pollId,
          option_id: optionId,
          user_id: user.id,
        });

      if (voteError) throw voteError;

      toast.success('Vote recorded successfully!');
      await fetchPolls();
    } catch (err) {
      console.error('Error voting:', err);
      toast.error('Failed to record vote. Please try again.');
    } finally {
      setVotingInProgress(null);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading polls..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        action={{
          label: 'Try Again',
          onClick: fetchPolls,
        }}
      />
    );
  }

  if (!polls.length) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <p className="text-gray-500">No polls available yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {polls.map((poll) => {
        const data = poll.options.map((option) => ({
          name: option.text,
          votes: option.votes.length,
        }));

        const hasVoted = user && poll.options.some((option) =>
          option.votes.some((vote) => vote.user_id === user.id)
        );

        const isPollActive = new Date(poll.ends_at) > new Date() && poll.is_active;

        return (
          <div key={poll.id} className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-2">{poll.title}</h2>
            <p className="text-gray-600 mb-4">{poll.description}</p>

            {(isAdmin || hasVoted) && data.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Results</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="votes" fill="#4f46e5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {poll.options.map((option) => {
                const hasUserVotedForThis = user && option.votes.some(
                  (vote) => vote.user_id === user.id
                );

                return (
                  <button
                    key={option.id}
                    onClick={() => handleVote(poll.id, option.id)}
                    disabled={!user || hasVoted || !isPollActive || votingInProgress === poll.id}
                    className={`w-full p-3 text-left border rounded-md transition-colors ${
                      hasUserVotedForThis
                        ? 'bg-indigo-50 border-indigo-200'
                        : isPollActive && user
                        ? 'hover:bg-gray-50 border-gray-200'
                        : 'opacity-75 cursor-not-allowed border-gray-200'
                    }`}
                  >
                    <span className="font-medium">{option.text}</span>
                    {(isAdmin || hasVoted) && (
                      <span className="float-right text-gray-500">
                        {option.votes.length} vote{option.votes.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 text-sm flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                  isPollActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {isPollActive ? 'Active' : 'Ended'}
              </span>
              <span className="text-gray-500">
                Ends: {new Date(poll.ends_at).toLocaleString()}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}