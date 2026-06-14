import React, { useState } from 'react';
import { Project } from '../types';

interface ProjectsViewProps {
  onAskAssistant: (prompt: string) => void;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({ onAskAssistant }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjTag, setNewProjTag] = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchProjects = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const storedUser = localStorage.getItem('veltrioUser');
      const user = storedUser ? JSON.parse(storedUser) : null;
      if (user) {
        const res = await fetch(`/api/projects?userId=${user.id}`);
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Failed to load project workspaces:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    try {
      const storedUser = localStorage.getItem('veltrioUser');
      const user = storedUser ? JSON.parse(storedUser) : null;
      if (user) {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            name: newProjName,
            description: newProjDesc,
            tags: newProjTag ? newProjTag.split(',').map((t) => t.trim()) : [],
          }),
        });

        if (res.ok) {
          setNewProjName('');
          setNewProjDesc('');
          setNewProjTag('');
          setShowModal(false);
          fetchProjects();
        }
      }
    } catch (err) {
      console.error('Failed to create workspace project:', err);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const storedUser = localStorage.getItem('veltrioUser');
      const user = storedUser ? JSON.parse(storedUser) : null;
      if (user) {
        const res = await fetch(`/api/projects?userId=${user.id}&id=${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          fetchProjects();
        }
      }
    } catch (err) {
      console.error('Failed to archive workspace project:', err);
    }
  };

  return (
    <div className="w-full max-w-5xl px-4 py-8 space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/50 dark:border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-[#234556] dark:text-[#effbfc]">
            Project Folders
          </h1>
          <p className="text-xs text-zinc-500 dark:text-[#b4e4ed]">
            Organize translation tasks, conversational links, and team workspaces
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-accent hover:bg-primary text-white rounded-xl text-xs font-bold transition-all hover-scale cursor-pointer"
        >
          + Create Workspace
        </button>
      </div>

      {/* Grid view of projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="glass-panel p-6 flex flex-col justify-between space-y-6 hover:border-accent/30 hover:shadow-lg transition-all duration-300"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <h2 className="text-base font-extrabold text-[#234556] dark:text-white">{proj.name}</h2>
                <button
                  onClick={() => handleDeleteProject(proj.id)}
                  className="text-xs text-zinc-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                  title="Archive workspace"
                >
                  🗑️
                </button>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed min-h-[40px]">
                {proj.description}
              </p>
            </div>

            <div className="space-y-4">
              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {proj.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-[9px] font-bold text-primary dark:text-accent uppercase"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* Footer info */}
              <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono border-t border-zinc-200/40 dark:border-white/5 pt-3">
                <span>{proj.sessionsCount} sessions</span>
                <span>{new Date(proj.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onAskAssistant(`Help me plan translation tasks for the "${proj.name}" project.`)}
                  className="flex-grow text-center py-2 bg-zinc-800/5 dark:bg-white/5 hover:bg-zinc-800/10 dark:hover:bg-white/10 text-xs font-bold text-zinc-700 dark:text-zinc-300 rounded-lg border border-zinc-200/50 dark:border-white/10 transition-colors cursor-pointer"
                >
                  Copilot Advice
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 space-y-6 animate-scale-in">
            <div className="flex justify-between items-center border-b border-zinc-200/50 dark:border-white/5 pb-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-[#234556] dark:text-white">
                New Workspace
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Workspace Name</label>
                <input
                  type="text"
                  required
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="e.g. French Localization"
                  className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs text-zinc-850 dark:text-zinc-100 bg-zinc-800/5 dark:bg-white/5 border border-zinc-200 dark:border-white/10"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Description</label>
                <textarea
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  placeholder="Workspace scope, goals, or specifications..."
                  className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs text-zinc-850 dark:text-zinc-100 bg-zinc-800/5 dark:bg-white/5 border border-zinc-200 dark:border-white/10 resize-none h-20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newProjTag}
                  onChange={(e) => setNewProjTag(e.target.value)}
                  placeholder="e.g. Sales, Marketing"
                  className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs text-zinc-850 dark:text-zinc-100 bg-zinc-800/5 dark:bg-white/5 border border-zinc-200 dark:border-white/10"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-200/50 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-transparent text-xs font-bold text-zinc-450 hover:text-zinc-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-accent hover:bg-primary text-white rounded-xl text-xs font-bold transition-all hover-scale cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsView;
