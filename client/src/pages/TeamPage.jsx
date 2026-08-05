import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Layout from '../components/layout/Layout.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import { teamApi, boardApi } from '../api/index.js';

export default function TeamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState('editor');
  const [createOpen, setCreateOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [newBoard, setNewBoard] = useState(false);

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamApi.list(),
    enabled: !id,
  });

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamApi.get(id),
    enabled: !!id,
  });

  const createTeam = useMutation({
    mutationFn: (payload) => teamApi.create(payload),
    onSuccess: (data) => {
      toast.success('Team created');
      setCreateOpen(false);
      navigate(`/team/${data.team.id || data.team._id}`);
    },
    onError: (err) => toast.error(err.response?.data?.message),
  });

  const invite = useMutation({
    mutationFn: () => teamApi.invite(id, emails.split(',').map((e) => e.trim()).filter(Boolean), role),
    onSuccess: (data) => {
      toast.success(`Invited ${data.results.length} people`);
      setInviteOpen(false);
      setEmails('');
    },
    onError: (err) => toast.error(err.response?.data?.message),
  });

  const removeMember = useMutation({
    mutationFn: (memberId) => teamApi.removeMember(id, memberId),
    onSuccess: () => { toast.success('Member removed'); qc.invalidateQueries(['team', id]); },
  });

  const myRole = team?.members?.find((m) => m.user?._id === team.owner?._id)?.role;

  if (teamsLoading) return <Layout><div className="animate-pulse text-gray-400">Loading teams...</div></Layout>;

  return (
    <Layout>
      {!id ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Teams</h1>
            <Button onClick={() => setCreateOpen(true)}>+ New Team</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(teams?.teams || []).map((t) => (
              <div key={t._id} className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/team/${t._id}`)}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {t.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold">{t.name}</h3>
                    <p className="text-xs text-gray-400">{t.members?.length} members</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{t.description || 'No description'}</p>
              </div>
            ))}
            {(teams?.teams || []).length === 0 && (
              <div className="card col-span-full text-center py-16 text-gray-400">
                <div className="text-5xl mb-4">👥</div>
                No teams yet. Create one to collaborate.
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                {team?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{team?.name}</h1>
                <p className="text-sm text-gray-400">{team?.members?.length} members · {team?.boards?.length || 0} boards</p>
              </div>
            </div>
            <Button onClick={() => setInviteOpen(true)}>+ Invite</Button>
          </div>

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="font-semibold mb-3">Team Boards</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {(team?.boards || []).map((b) => (
                  <div key={b._id} className="card cursor-pointer hover:shadow-lg" onClick={() => navigate(`/board/${b._id}`)}>
                    <h3 className="font-semibold mb-1">{b.name}</h3>
                    <p className="text-xs text-gray-400">{b.type} · {new Date(b.updatedAt).toLocaleDateString()}</p>
                  </div>
                ))}
                {(team?.boards || []).length === 0 && <div className="card text-center py-10 text-gray-400 col-span-full">No boards yet</div>}
              </div>
            </div>

            <div>
              <h2 className="font-semibold mb-3">Members</h2>
              <div className="card space-y-3">
                {(team?.members || []).map((m) => (
                  <div key={String(m.user?._id || m.user)} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold">
                        {m.user?.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{m.user?.name}</p>
                        <p className="text-xs text-gray-400">{m.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create a team">
        <form onSubmit={(e) => { e.preventDefault(); createTeam.mutate({ name: teamName }); }}>
          <label className="label" htmlFor="team-name">Team name</label>
          <input id="team-name" className="input mb-4" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. Product Team" required />
          <Button type="submit" className="w-full">Create Team</Button>
        </form>
      </Modal>

      <Modal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite members">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="emails">Email addresses (comma separated)</label>
            <textarea id="emails" className="input min-h-[80px]" value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="alice@example.com, bob@example.com" />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <Button className="w-full" onClick={() => invite.mutate()} disabled={!emails.trim()}>Send Invites</Button>
        </div>
      </Modal>
    </Layout>
  );
}
